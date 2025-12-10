pragma solidity ^0.8.20;

import "./MockRouter.sol";
import "./MockToken.sol";

// ---------------------------------------------------------
// 3. Mock Lending Pool
// ---------------------------------------------------------
contract MockLendingPool {
    MockRouter public router;

    // Mapping: User -> Asset -> Amount
    mapping(address => mapping(address => uint256)) public supplies;
    mapping(address => mapping(address => uint256)) public borrowings;

    // Список поддерживаемых активов для подсчета Total Value
    address[] public assets;
    mapping(address => bool) public isAsset;

    constructor(address _router) {
        router = MockRouter(_router);
    }

    function addAsset(address token) external {
        if (!isAsset[token]) {
            assets.push(token);
            isAsset[token] = true;
        }
    }

    function supply(address asset, uint256 amount) external {
        // Забираем токены у юзера (нужен approve)
        // В реальности токены идут в пул, тут мы их просто сжигаем или держим.
        // Для простоты учета в моке: держим на контракте.
        MockToken(asset).transferFrom(msg.sender, address(this), amount);
        supplies[msg.sender][asset] += amount;
    }

    function borrow(address asset, uint256 amount) external {
        // Проверка LTV перед выдачей займа
        // Добавляем предполагаемый долг к текущему
        borrowings[msg.sender][asset] += amount;

        // Проверяем здоровье аккаунта
        (uint256 totalCollateral, uint256 totalDebt, uint256 ltv) = getUserAccountData(msg.sender);

        // Максимальный LTV скажем 80% (8000 bps)
        require(ltv <= 8000, "LTV limit exceeded");

        // Выдаем токены (минтим, чтобы не париться с ликвидностью пула)
        MockToken(asset).mint(msg.sender, amount);
    }

    function repay(address asset, uint256 amount) external {
        // Проверяем, что у юзера есть долг
        require(borrowings[msg.sender][asset] >= amount, "Repay amount exceeds debt");

        // Забираем токены у юзера для погашения долга
        MockToken(asset).transferFrom(msg.sender, address(this), amount);

        // Уменьшаем долг
        borrowings[msg.sender][asset] -= amount;

        // В реальном пуле токены бы остались в пуле для ликвидности
        // В моке мы можем их просто сжечь или держать
        // Для простоты держим на контракте
    }

    function withdraw(address asset, uint256 amount) external {
        // Проверяем, что у юзера достаточно залога
        require(supplies[msg.sender][asset] >= amount, "Insufficient collateral");

        // Временно уменьшаем залог для проверки LTV
        supplies[msg.sender][asset] -= amount;

        // Проверяем, что после вывода LTV все еще в норме
        (uint256 totalCollateral, uint256 totalDebt, uint256 ltv) = getUserAccountData(msg.sender);

        // Если есть долг, проверяем LTV (макс 80%)
        if (totalDebt > 0) {
            require(ltv <= 8000, "Withdrawal would exceed LTV limit");
        }

        // Возвращаем токены пользователю
        MockToken(asset).transfer(msg.sender, amount);
    }

    // Возвращает данные в базовой валюте (USD)
    // ltv с 2 знаками (e.g. 7500 = 75.00%)
    function getUserAccountData(address user)
    public
    view
    returns (uint256 totalCollateralUSD, uint256 totalDebtUSD, uint256 ltv)
    {
        for (uint256 i = 0; i < assets.length; i++) {
            address asset = assets[i];
            uint256 price = router.prices(asset); // Цена с 18 decimals

            if (supplies[user][asset] > 0) {
                // (Amount * Price) / 1e18
                totalCollateralUSD += (supplies[user][asset] * price) / 1e18;
            }
            if (borrowings[user][asset] > 0) {
                totalDebtUSD += (borrowings[user][asset] * price) / 1e18;
            }
        }

        if (totalCollateralUSD == 0) {
            return (0, totalDebtUSD, 0);
        }

        // LTV Calculation: (Debt / Collateral) * 10000
        ltv = (totalDebtUSD * 10000) / totalCollateralUSD;
    }
}