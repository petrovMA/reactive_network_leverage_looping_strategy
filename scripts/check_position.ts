import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const log = {
  error: (msg: string) => console.log(chalk.red(msg)),
  success: (msg: string) => console.log(chalk.green(msg)),
  warn: (msg: string) => console.log(chalk.yellow(msg)),
  info: (msg: string) => console.log(msg),
};

function readDeploymentResult(filePath: string): any {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const fileContent = fs.readFileSync(fullPath, "utf-8");
  return JSON.parse(fileContent);
}

function formatAmount(amount: bigint, decimals: number = 18, symbol: string = ""): string {
    const formatted = ethers.formatUnits(amount, decimals);
    return symbol ? `${formatted} ${symbol}` : formatted;
}

function formatLTV(ltv: bigint): string {
    const ltvNumber = Number(ltv);
    const percentage = ltvNumber / 100;
    return `${percentage.toFixed(2)}%`;
}

// ============================================================
// MAIN FUNCTION
// ============================================================

async function main() {
    console.log("🔍 Checking Leverage Position Status...\n");

    const [user] = await ethers.getSigners();
    const userAddress = await user.getAddress();
    const networkData = await ethers.provider.getNetwork();

    console.log(`📡 Network: ${network.name} (Chain ID: ${networkData.chainId})`);
    console.log(`👤 User: ${userAddress}\n`);

    // ============================================================
    // READ DEPLOYMENT RESULTS
    // ============================================================

    console.log("📖 Reading deployment results...\n");

    let wethData: any;
    let usdtData: any;
    let leverageAccountData: any;

    try {
        wethData = readDeploymentResult("step_1_deploy_weth_result.json");
        usdtData = readDeploymentResult("step_2_deploy_usdt_result.json");
        leverageAccountData = readDeploymentResult("step_8_deploy_leverage_account_result.json");
    } catch (error: any) {
        log.error("✗ ERROR: Missing deployment files!");
        process.exit(1);
    }

    const WETH_TOKEN_ADDRESS = wethData.address;
    const USDT_TOKEN_ADDRESS = usdtData.address;
    const LEVERAGE_ACCOUNT_ADDRESS = leverageAccountData.address;

    console.log("📋 Addresses:");
    console.log(`   WETH Token:       ${WETH_TOKEN_ADDRESS}`);
    console.log(`   USDT Token:       ${USDT_TOKEN_ADDRESS}`);
    console.log(`   LeverageAccount:  ${LEVERAGE_ACCOUNT_ADDRESS}\n`);

    // ============================================================
    // GET CONTRACTS
    // ============================================================

    const MockTokenFactory = await ethers.getContractFactory("MockToken");
    const wethToken = MockTokenFactory.attach(WETH_TOKEN_ADDRESS);
    const usdtToken = MockTokenFactory.attach(USDT_TOKEN_ADDRESS);

    const LeverageAccountFactory = await ethers.getContractFactory("LeverageAccount");
    const leverageAccount = LeverageAccountFactory.attach(LEVERAGE_ACCOUNT_ADDRESS);

    // ============================================================
    // CHECK LEVERAGE POSITION
    // ============================================================

    console.log("====================================================");
    console.log("💼 LEVERAGE POSITION (In Lending Pool)");
    console.log("====================================================");

    const [collateral, debt, ltv] = await leverageAccount.getStatus();

    console.log(`   Total Collateral Value: ${formatAmount(collateral, 18, "USD")}`);
    console.log(`   Total Debt Value:       ${formatAmount(debt, 18, "USD")}`);
    console.log(`   Current LTV:            ${formatLTV(ltv)}`);

    if (collateral === 0n && debt === 0n) {
        log.warn("\n   ⚠ No active position\n");
    } else {
        log.success("\n   ✓ Active position found\n");
    }

    // ============================================================
    // CHECK FREE BALANCES
    // ============================================================

    console.log("====================================================");
    console.log("💰 FREE TOKEN BALANCES (Not in Lending Pool)");
    console.log("====================================================");

    const contractWethBalance = await wethToken.balanceOf(LEVERAGE_ACCOUNT_ADDRESS);
    const contractUsdtBalance = await usdtToken.balanceOf(LEVERAGE_ACCOUNT_ADDRESS);
    const contractEthBalance = await ethers.provider.getBalance(LEVERAGE_ACCOUNT_ADDRESS);

    console.log("LeverageAccount Free Balances:");
    console.log(`   WETH: ${formatAmount(contractWethBalance, 18, "WETH")}`);
    console.log(`   USDT: ${formatAmount(contractUsdtBalance, 18, "USDT")}`);
    console.log(`   ETH:  ${formatAmount(contractEthBalance, 18, "ETH")}\n`);

    const userWethBalance = await wethToken.balanceOf(userAddress);
    const userUsdtBalance = await usdtToken.balanceOf(userAddress);

    console.log("Your Wallet Balances:");
    console.log(`   WETH: ${formatAmount(userWethBalance, 18, "WETH")}`);
    console.log(`   USDT: ${formatAmount(userUsdtBalance, 18, "USDT")}\n`);

    // ============================================================
    // RECOMMENDATIONS
    // ============================================================

    console.log("====================================================");
    console.log("💡 WHAT YOU CAN DO");
    console.log("====================================================\n");

    if (collateral > 0n || debt > 0n) {
        log.success("✓ You have an active leverage position:");
        console.log("   → Use test_full_close_position.ts to close and get your collateral back\n");
    }

    if (contractWethBalance > 0n || contractUsdtBalance > 0n) {
        log.success("✓ You have free tokens in the contract:");
        console.log("   → Use test_withdraw.ts to withdraw them\n");
    }

    if (contractWethBalance === 0n && contractUsdtBalance === 0n && collateral === 0n) {
        log.warn("⚠ No tokens found:");
        console.log("   → The contract has no free balance");
        console.log("   → The contract has no collateral in the lending pool");
        console.log("   → Nothing to withdraw\n");
    }

    if (contractEthBalance > 0n) {
        log.success("✓ You have ETH in the contract:");
        console.log(`   → ${formatAmount(contractEthBalance, 18, "ETH")} can be withdrawn using withdrawETH()\n`);
    }

    console.log("====================================================");
}

main().catch((error) => {
    log.error("\n✗ ERROR: " + error.message);
    process.exitCode = 1;
});