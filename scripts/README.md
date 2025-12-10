# Deployment Scripts

This directory contains deployment and testing scripts for the Reactive Network Leverage Protocol.

## 📋 Deployment Sequence

### Sepolia Network Deployment (Steps 1-8)

```bash
# 1. Deploy WETH Token
npm run step:1

# 2. Deploy USDT Token
npm run step:2

# 3. Deploy Mock Router
npm run step:3

# 4. Deploy Mock Lending Pool
npm run step:4

# 5. Set Token Prices in Router
npm run step:6

# 6. Mint Initial Token Supplies
npm run step:7

# 7. Register Assets in Lending Pool
npm run step:5

# 8. Deploy Leverage Account
npm run step:8
```

### Reactive Network Deployment (Step 9)

⚠️ **IMPORTANT:** You must use the **SAME wallet** that deployed the Leverage Account!

```bash
# 9. Deploy Reactive Smart Contract (RSC)
npm run step:9
```

## 🧪 Testing Scripts

After deployment, you can test the system:

```bash
# Test leverage loop functionality
npm run test:loop

# Check current position status
npm run check:position

# Test partial debt repayment
npm run test:repay

# Test full position closure
npm run test:close
```

## 📁 Result Files

All deployment scripts generate result JSON files:

- `step_1_deploy_weth_result.json`
- `step_2_deploy_usdt_result.json`
- `step_3_deploy_router_result.json`
- `step_4_deploy_lending_pool_result.json`
- `step_5_init_register_assets_result.json`
- `step_6_init_set_prices_result.json`
- `step_7_init_mint_tokens_result.json`
- `step_8_deploy_leverage_account_result.json`
- `step_9_deploy_reactive_result.json`

## ⚙️ Configuration

Key parameters can be adjusted in the scripts:

- **ETH_FUNDING_AMOUNT** in `step_8_deploy_leverage_account.ts` (default: 0.01 ETH)
- **REACT_FUNDING_AMOUNT** in `step_9_deploy_reactive.ts` (default: 0.05 REACT)

## 🔄 Complete Deployment Flow

```bash
# One-liner for complete Sepolia deployment (steps 1-8)
npm run step:1 && npm run step:2 && npm run step:3 && npm run step:4 && npm run step:6 && npm run step:7 && npm run step:5 && npm run step:8

# Then deploy on Reactive Network
npm run step:9

# Test the system
npm run test:loop
```

## 🚨 Important Notes

1. **RSC Deployer Verification**: Step 9 automatically verifies that you're using the correct wallet (must match step 8)
2. **No Step 10**: The `configure_leverage_account` step was removed because the RSC Caller is now set in the constructor
3. **Sequence Matters**: Steps 5, 6, 7 must be run in the order: 6 → 7 → 5 (due to dependencies)

## 🛠️ Troubleshooting

If you encounter errors:

1. Check that all previous steps completed successfully
2. Verify the result JSON files exist
3. Ensure you're using the correct network (`--network sepolia` or `--network reactive`)
4. For step 9, verify you're using the same wallet as step 8
