// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "./reactive-lib/abstract-base/AbstractCallback.sol";

// Обновленный интерфейс
interface IMockLendingPool {
    function supply(address asset, uint256 amount) external;
    function borrow(address asset, uint256 amount) external;
    function repay(address asset, uint256 amount) external;   // NEW
    function withdraw(address asset, uint256 amount) external; // NEW

    // Геттеры для mappings (Solidity создает их автоматически)
    function supplies(address user, address asset) external view returns (uint256);
    function borrowings(address user, address asset) external view returns (uint256);

    function getUserAccountData(address user) external view returns (uint256, uint256, uint256);
}

interface IMockRouter {
    function swapExactTokensForTokens(
        uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline
    ) external returns (uint256[] memory amounts);
}

contract LeverageAccount is AbstractCallback, Ownable {
    IMockLendingPool public lendingPool;
    IMockRouter public router;
    address public rscCaller;

    event Deposited(address indexed user, uint256 amount, uint256 currentLTV);
    event LoopStepExecuted(uint256 borrowed, uint256 newCollateral, uint256 currentLTV, uint256 iterationId);
    event PositionClosed(uint256 debtRepaid, uint256 collateralReturned); // NEW EVENT

    constructor(address _lendingPool, address _router, address _callbackProxy, address _rscCaller)
        AbstractCallback(_callbackProxy) Ownable(msg.sender) payable
    {
        lendingPool = IMockLendingPool(_lendingPool);
        router = IMockRouter(_router);
        rscCaller = _rscCaller;
    }

    function setRSCCaller(address _rscCaller) external onlyOwner {
        rscCaller = _rscCaller;
    }

    modifier onlyController(address sender) {
        require(sender == owner() || sender == rscCaller, "Not authorized controller");
        _;
    }

    /**
     * @notice Entry point. User deposits WETH.
     * @param token Collateral token address (WETH)
     * @param amount Amount to deposit
     */
    function deposit(address token, uint256 amount) external onlyOwner {
        // 1. Transfer tokens from user (requires approval)
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        // 2. Supply to lending pool
        IERC20(token).approve(address(lendingPool), amount);
        lendingPool.supply(token, amount);

        // 3. Get current LTV for event
        (,, uint256 ltv) = lendingPool.getUserAccountData(address(this));

        emit Deposited(msg.sender, amount, ltv);
    }

    /**
     * @notice Депозит в одну транзакцию без предварительного Approve
     * @dev Использует EIP-2612 Permit
     */
    function depositWithPermit(
        address token,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external onlyOwner {
        // 1. Вызываем permit на токене (газ платит msg.sender в составе транзакции, но подпись была оффчейн)
        // ВАЖНО: MockToken должен наследовать ERC20Permit
        try IERC20Permit(token).permit(msg.sender, address(this), amount, deadline, v, r, s) {
            // Permit прошел успешно
        } catch {
            // Если токен не поддерживает permit или подпись неверна - ревертим
            revert("Permit failed");
        }

        // 2. Теперь transferFrom сработает без send-транзакции approve
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        // 3. Стандартная логика Supply
        IERC20(token).approve(address(lendingPool), amount);
        lendingPool.supply(token, amount);

        (,, uint256 ltv) = lendingPool.getUserAccountData(address(this));
        emit Deposited(msg.sender, amount, ltv);
    }

    /**
     * @notice Loop step. Called by Reactive Network via Callback Proxy.
     * Algorithm: Borrow Stable -> Buy Collateral -> Supply Collateral.
     *
     * IMPORTANT: First parameter 'sender' is the ReactVM ID, automatically
     * injected by Reactive Network. This is used for authorization.
     *
     * @param sender ReactVM ID (automatically set by Reactive Network)
     * @param borrowAsset Token to borrow (USDT)
     * @param collateralAsset Token to buy and supply (WETH)
     * @param amountToBorrow Amount to borrow (calculated by RSC)
     * @param amountOutMin Minimum output from swap (slippage protection)
     * @param iterationId Iteration counter from RSC
     */
    function executeLeverageStep(
        address sender,           // ReactVM ID (for authorization)
        address borrowAsset,
        address collateralAsset,
        uint256 amountToBorrow,
        uint256 amountOutMin,
        uint256 iterationId
    ) external onlyController(sender) {
        // 1. Borrow (take USDT loan)
        lendingPool.borrow(borrowAsset, amountToBorrow);

        // 2. Swap (USDT -> WETH)
        IERC20(borrowAsset).approve(address(router), amountToBorrow);

        address[] memory path = new address[](2);
        path[0] = borrowAsset;
        path[1] = collateralAsset;

        // Swap - tokens come to this contract
        uint256[] memory amounts = router.swapExactTokensForTokens(
            amountToBorrow,
            amountOutMin,
            path,
            address(this),
            block.timestamp
        );
        uint256 receivedCollateral = amounts[1];

        // 3. Supply (deposit received WETH as collateral)
        IERC20(collateralAsset).approve(address(lendingPool), receivedCollateral);
        lendingPool.supply(collateralAsset, receivedCollateral);

        // 4. Emit event for RSC to decide whether to continue
        (,, uint256 currentLTV) = lendingPool.getUserAccountData(address(this));

        emit LoopStepExecuted(amountToBorrow, receivedCollateral, currentLTV, iterationId);
    }

    /**
 * @notice Полное погашение долга и вывод залога.
     * @dev Требует, чтобы user сделал approve на transferFrom для токена долга (debtAsset).
     * @param collateralAsset Токен залога (WETH)
     * @param debtAsset Токен долга (USDT)
     */
    function fullClosePosition(address collateralAsset, address debtAsset) external onlyOwner {
        // 1. Узнаем, сколько мы должны банку
        uint256 debtAmount = lendingPool.borrowings(address(this), debtAsset);
        uint256 collateralAmount = lendingPool.supplies(address(this), collateralAsset);

        require(collateralAmount > 0, "No collateral to withdraw");

        if (debtAmount > 0) {
            // 2. Забираем токены на погашение у пользователя
            // Пользователь должен был сделать approve для LeverageAccount на сумму debtAmount
            IERC20(debtAsset).transferFrom(msg.sender, address(this), debtAmount);

            // 3. Апрувим пулу и погашаем долг
            IERC20(debtAsset).approve(address(lendingPool), debtAmount);
            lendingPool.repay(debtAsset, debtAmount);
        }

        // 4. Теперь долг = 0, можно безопасно забрать весь залог
        lendingPool.withdraw(collateralAsset, collateralAmount);

        // 5. Возвращаем залог пользователю
        IERC20(collateralAsset).transfer(msg.sender, collateralAmount);

        emit PositionClosed(debtAmount, collateralAmount);
    }

    // Вспомогательная: если нужно просто погасить часть долга
    function repayPartial(address debtAsset, uint256 amount) external onlyOwner {
        IERC20(debtAsset).transferFrom(msg.sender, address(this), amount);
        IERC20(debtAsset).approve(address(lendingPool), amount);
        lendingPool.repay(debtAsset, amount);
    }

    /**
     * @notice Emergency exit or position closure.
     * In production, this would be more complex (Flashloan to close).
     * For mocks, simple withdrawal of free funds.
     */
    function withdraw(address token, uint256 amount) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance >= amount) {
            IERC20(token).transfer(msg.sender, amount);
        }
    }

    /**
     * @notice Withdraw ETH (for callback payment reserves or emergencies)
     */
    function withdrawETH(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient ETH balance");
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "ETH withdrawal failed");
    }

    // Helper function for frontend/tests
    function getStatus() external view returns (uint256 coll, uint256 debt, uint256 ltv) {
        return lendingPool.getUserAccountData(address(this));
    }
}