// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./reactive-lib/abstract-base/AbstractPausableReactive.sol";

contract LoopingRSC is AbstractPausableReactive {
    // --- Configuration ---
    uint256 private constant SEPOLIA_CHAIN_ID = 11155111;
    uint64 private constant CALLBACK_GAS_LIMIT = 2000000;

    // Addresses on Sepolia (Mocks)
    address public leverageAccount;
    address public weth;
    address public usdt;

    // Strategy parameters
    uint256 private constant TARGET_LTV = 7500; // 75.00%
    uint256 private constant MAX_ITERATIONS = 3;

    // Mock Prices for calculation
    uint256 private constant PRICE_ETH = 3000;

    // FIXED: Correct keccak256 hashes for event signatures
    // keccak256("Deposited(address,uint256,uint256)")
    uint256 private constant TOPIC_DEPOSITED = 0x73a19dd210f1a7f902193214c0ee91dd35ee5b4d920cba8d519eca65a7b488ca;
    // keccak256("LoopStepExecuted(uint256,uint256,uint256,uint256)")
    uint256 private constant TOPIC_LOOP_STEP = 0xa22794f04ab08d2af3a57cde1bed9045bed2202d0f0bd891ee2ec1f7f7a10d18;

    constructor(address _leverageAccount, address _weth, address _usdt) payable {
        owner = msg.sender;
        leverageAccount = _leverageAccount;
        weth = _weth;
        usdt = _usdt;

        if (!vm) {
            service.subscribe(
                SEPOLIA_CHAIN_ID,
                leverageAccount,
                TOPIC_DEPOSITED,
                REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE
            );
            service.subscribe(
                SEPOLIA_CHAIN_ID,
                leverageAccount,
                TOPIC_LOOP_STEP,
                REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE
            );
        }
    }

    function react(LogRecord calldata log) external vmOnly {
        // 1. Проверки безопасности
        if (log.chain_id != SEPOLIA_CHAIN_ID || log._contract != leverageAccount) {
            return;
        }

        // 2. Маршрутизация по событиям
        if (log.topic_0 == TOPIC_DEPOSITED) {
            _handleDeposited(log.topic_1, log.data);
        } else if (log.topic_0 == TOPIC_LOOP_STEP) {
            _handleLoopStep(log.data);
        }
    }

    // Logic for initial deposit
    function _handleDeposited(uint256 /* topic_1_user */, bytes calldata data) internal {
        (uint256 amount, uint256 currentLTV) = abi.decode(data, (uint256, uint256));

        // Check exit conditions
        if (currentLTV >= TARGET_LTV) return;

        // Calculate first borrow - aim for 40% LTV on first step
        uint256 borrowAmount = (amount * PRICE_ETH * 40) / 100;

        // Minimum borrow check - don't borrow tiny amounts (less than 10 USDT)
        uint256 minBorrow = 10 * 10**18;
        if (borrowAmount < minBorrow) {
            // If borrow amount is too small, skip looping
            return;
        }

        // Cap at 500 USDT per iteration to be safe
        uint256 maxBorrow = 500 * 10**18;
        if (borrowAmount > maxBorrow) {
            borrowAmount = maxBorrow;
        }

        _sendCallback(borrowAmount, 1);
    }

    // Logic when step completes
    // Event: LoopStepExecuted(uint256 borrowed, uint256 newCollateral, uint256 currentLTV, uint256 iterationId)
    function _handleLoopStep(bytes calldata data) internal {
        // FIXED: Properly decode all four values from the event
        (
            uint256 borrowed,           // Amount borrowed in this step (USDT)
            uint256 receivedCollateral, // New WETH received from swap
            uint256 currentLTV,         // Current LTV in basis points
            uint256 iterationId         // Iteration counter
        ) = abi.decode(data, (uint256, uint256, uint256, uint256));

        // Check exit conditions
        if (iterationId >= MAX_ITERATIONS) return;
        if (currentLTV >= TARGET_LTV) return;

        // Calculate smart borrow amount based on the new collateral received
        // receivedCollateral is in WETH (18 decimals)
        // Convert to USD value
        uint256 newCollateralValueUSD = receivedCollateral * PRICE_ETH;

        // Borrow 60% of new collateral value to stay safe
        uint256 nextBorrow = (newCollateralValueUSD * 60) / 100;

        // Minimum borrow check - don't borrow tiny amounts (less than 10 USDT)
        uint256 minBorrow = 10 * 10**18;
        if (nextBorrow < minBorrow) {
            // If borrow amount is too small, we're done looping
            return;
        }

        // Cap at 500 USDT per iteration to be safe
        uint256 maxBorrow = 500 * 10**18;
        if (nextBorrow > maxBorrow) {
            nextBorrow = maxBorrow;
        }

        _sendCallback(nextBorrow, iterationId + 1);
    }

    function _sendCallback(uint256 borrowAmount, uint256 nextIter) internal {
        // Form the executeLeverageStep call on Sepolia
        // IMPORTANT: First parameter is address(0) which gets replaced with ReactVM ID

        bytes memory payload = abi.encodeWithSignature(
            "executeLeverageStep(address,address,address,uint256,uint256,uint256)",
            address(0),  // Will be replaced with ReactVM ID by Reactive Network
            usdt,        // borrowAsset
            weth,        // collateralAsset
            borrowAmount,
            0,           // amountOutMin (slippage ignore for mock)
            nextIter
        );

        emit Callback(SEPOLIA_CHAIN_ID, leverageAccount, CALLBACK_GAS_LIMIT, payload);
    }

    function getPausableSubscriptions() internal view override returns (Subscription[] memory) {
        Subscription[] memory result = new Subscription[](2);
        result[0] = Subscription(
            SEPOLIA_CHAIN_ID,
            leverageAccount,
            TOPIC_DEPOSITED,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE
        );
        result[1] = Subscription(
            SEPOLIA_CHAIN_ID,
            leverageAccount,
            TOPIC_LOOP_STEP,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE
        );
        return result;
    }

    // Withdraw native token balance to owner
    function withdrawNative() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Transfer failed");
    }
}
