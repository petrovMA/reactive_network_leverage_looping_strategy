// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./reactive-lib/abstract-base/AbstractPausableReactive.sol";

/// @title LoopingRSC - Reactive Smart Contract for automated leverage looping
/// @notice Listens to Deposited/LoopStepExecuted events and triggers leverage steps
contract LoopingRSC is AbstractPausableReactive {
    // Chain & gas config
    uint256 private constant SEPOLIA_CHAIN_ID = 11155111;
    uint64 private constant CALLBACK_GAS_LIMIT = 2000000;

    // Strategy parameters
    uint256 private constant TARGET_LTV = 6000;        // 60.00%
    uint256 private constant PROTOCOL_MAX_LTV = 8200;  // 82.00%
    uint256 private constant MAX_ITERATIONS = 5;
    uint256 private constant PRICE_ETH = 3000;         // Mock price
    uint256 private constant MIN_STEP_BORROW = 10e18;       // 10 USDT minimum
    uint256 private constant MAX_STEP_BORROW = 5000e18;     // 5000 USDT cap per iteration

    // Event topic hashes
    uint256 private constant TOPIC_DEPOSITED = 0x73a19dd210f1a7f902193214c0ee91dd35ee5b4d920cba8d519eca65a7b488ca;
    uint256 private constant TOPIC_LOOP_STEP = 0xa22794f04ab08d2af3a57cde1bed9045bed2202d0f0bd891ee2ec1f7f7a10d18;

    // Sepolia contract addresses
    address public leverageAccount;
    address public weth;
    address public usdt;

    constructor(address _leverageAccount, address _weth, address _usdt) payable {
        owner = msg.sender;
        leverageAccount = _leverageAccount;
        weth = _weth;
        usdt = _usdt;

        if (!vm) {
            service.subscribe(SEPOLIA_CHAIN_ID, leverageAccount, TOPIC_DEPOSITED, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
            service.subscribe(SEPOLIA_CHAIN_ID, leverageAccount, TOPIC_LOOP_STEP, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        }
    }

    /// @notice Main entry point - called by Reactive Network when subscribed events fire
    function react(LogRecord calldata log) external vmOnly {
        if (log.chain_id != SEPOLIA_CHAIN_ID || log._contract != leverageAccount) return;

        if (log.topic_0 == TOPIC_DEPOSITED) {
            _handleDeposited(log.data);
        } else if (log.topic_0 == TOPIC_LOOP_STEP) {
            _handleLoopStep(log.data);
        }
    }

    /// @dev Handle initial deposit - start looping if LTV below target
    function _handleDeposited(bytes calldata data) internal {
        (uint256 amount, uint256 currentLTV) = abi.decode(data, (uint256, uint256));
        if (currentLTV >= TARGET_LTV) return;

        // First borrow: 80% of collateral value
        uint256 borrowAmount = _clampBorrow((amount * PRICE_ETH * 80) / 100);
        if (borrowAmount > 0) {
            _sendCallback(borrowAmount, 1);
        }
    }

    /// @dev Handle loop step completion - continue if not at target
    function _handleLoopStep(bytes calldata data) internal {
        (uint256 totalCollateral, uint256 totalDebt, uint256 currentLTV, uint256 iterationId) =
                            abi.decode(data, (uint256, uint256, uint256, uint256));

        if (iterationId >= MAX_ITERATIONS || currentLTV >= TARGET_LTV) return;

        uint256 maxPossibleDebt = (totalCollateral * PROTOCOL_MAX_LTV) / 10000;

        if (maxPossibleDebt > totalDebt) {
            uint256 borrowPower = maxPossibleDebt - totalDebt;
            uint256 amountToBorrow = _clampBorrow((borrowPower * 98) / 100);
            if (amountToBorrow > 0) {
                _sendCallback(amountToBorrow, iterationId + 1);
            }
        }
    }

    /// @dev Clamp borrow amount between MIN and MAX, return 0 if below MIN
    function _clampBorrow(uint256 amount) internal pure returns (uint256) {
        if (amount < MIN_STEP_BORROW) return 0;
        return amount > MAX_STEP_BORROW ? MAX_STEP_BORROW : amount;
    }

    /// @dev Emit callback to execute leverage step on Sepolia
    function _sendCallback(uint256 borrowAmount, uint256 iteration) internal {
        bytes memory payload = abi.encodeWithSignature(
            "executeLeverageStep(address,address,address,uint256,uint256,uint256)",
            address(0),  // Replaced with ReactVM ID by Reactive Network
            usdt,
            weth,
            borrowAmount,
            0,           // amountOutMin (no slippage check for mock)
            iteration
        );
        emit Callback(SEPOLIA_CHAIN_ID, leverageAccount, CALLBACK_GAS_LIMIT, payload);
    }

    /// @notice Required by AbstractPausableReactive
    function getPausableSubscriptions() internal view override returns (Subscription[] memory) {
        Subscription[] memory subs = new Subscription[](2);
        subs[0] = Subscription(SEPOLIA_CHAIN_ID, leverageAccount, TOPIC_DEPOSITED, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        subs[1] = Subscription(SEPOLIA_CHAIN_ID, leverageAccount, TOPIC_LOOP_STEP, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        return subs;
    }

    /// @notice Withdraw native token balance
    function withdrawNative() external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "No balance");
        (bool ok,) = payable(msg.sender).call{value: bal}("");
        require(ok, "Transfer failed");
    }
}
