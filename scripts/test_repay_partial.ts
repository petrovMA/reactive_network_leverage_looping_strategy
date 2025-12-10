import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Test parameters
const REPAY_AMOUNT = ethers.parseEther("100"); // 100 USDT to repay

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Helper function to read deployment result from JSON
function readDeploymentResult(filePath: string): any {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileContent = fs.readFileSync(fullPath, "utf-8");
  return JSON.parse(fileContent);
}

// Helper function to write result to JSON
function writeResult(filePath: string, data: any): void {
  const fullPath = path.join(__dirname, filePath);
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), "utf-8");
}

// Helper function to validate address
function validateAddress(address: string): boolean {
  if (!address) return false;
  if (address === "0x0000000000000000000000000000000000000000") return false;
  return true;
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
    console.log("🚀 Starting Partial Debt Repayment Test...\n");

    const [tester] = await ethers.getSigners();
    const testerAddress = await tester.getAddress();
    const balance = await ethers.provider.getBalance(testerAddress);
    const networkData = await ethers.provider.getNetwork();

    console.log(`📡 Network: ${network.name} (Chain ID: ${networkData.chainId})`);
    console.log(`👤 Tester: ${testerAddress}`);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

    // ============================================================
    // READ DEPLOYMENT RESULTS
    // ============================================================

    console.log("📖 Reading deployment results...\n");

    let usdtData: any;
    let leverageAccountData: any;

    try {
        usdtData = readDeploymentResult("step_2_deploy_usdt_result.json");
        leverageAccountData = readDeploymentResult("step_8_deploy_leverage_account_result.json");
    } catch (error: any) {
        console.error("❌ ERROR: Missing deployment files!");
        console.error("   Please run deployment scripts first:");
        console.error("   - npm run step:2");
        console.error("   - npm run step:8\n");
        process.exit(1);
    }

    const USDT_TOKEN_ADDRESS = usdtData.address;
    const LEVERAGE_ACCOUNT_ADDRESS = leverageAccountData.address;

    // Validate addresses
    if (!validateAddress(USDT_TOKEN_ADDRESS) || !validateAddress(LEVERAGE_ACCOUNT_ADDRESS)) {
        console.error("❌ ERROR: One or more addresses are invalid!");
        process.exit(1);
    }

    // ============================================================
    // PHASE 1: CONTRACT CONNECTION
    // ============================================================

    console.log("----------------------------------------------------");
    console.log("📋 CONFIGURATION");
    console.log("----------------------------------------------------");
    console.log(`USDT Token:       ${USDT_TOKEN_ADDRESS}`);
    console.log(`LeverageAccount:  ${LEVERAGE_ACCOUNT_ADDRESS}`);
    console.log(`Repay Amount:     ${formatAmount(REPAY_AMOUNT, 18, "USDT")}`);
    console.log("----------------------------------------------------\n");

    const MockTokenFactory = await ethers.getContractFactory("MockToken");
    const usdtToken = MockTokenFactory.attach(USDT_TOKEN_ADDRESS);

    const LeverageAccountFactory = await ethers.getContractFactory("LeverageAccount");
    const leverageAccount = LeverageAccountFactory.attach(LEVERAGE_ACCOUNT_ADDRESS);

    // ============================================================
    // PHASE 2: CHECK CURRENT POSITION
    // ============================================================

    console.log("📊 Checking Current Position...\n");

    const [collateralBefore, debtBefore, ltvBefore] = await leverageAccount.getStatus();

    console.log("Current Status:");
    console.log(`   Collateral: ${formatAmount(collateralBefore, 18, "USD")}`);
    console.log(`   Debt:       ${formatAmount(debtBefore, 18, "USD")}`);
    console.log(`   LTV:        ${formatLTV(ltvBefore)}\n`);

    if (debtBefore === 0n) {
        console.log("⚠️  No debt to repay. Position already has zero debt.");

        const result = {
            network: network.name,
            timestamp: new Date().toISOString(),
            status: "no_debt",
            message: "No debt found to repay"
        };

        writeResult("test_repay_partial_result.json", result);
        console.log("\n💾 Result saved to: test_repay_partial_result.json\n");
        return;
    }

    // ============================================================
    // PHASE 3: PREPARE REPAYMENT
    // ============================================================

    console.log("💰 Preparing repayment...\n");

    // Check user's USDT balance
    const userUsdtBalance = await usdtToken.balanceOf(testerAddress);
    console.log(`Your USDT Balance: ${formatAmount(userUsdtBalance, 18, "USDT")}`);

    // Determine actual repay amount (can't repay more than debt)
    let actualRepayAmount = REPAY_AMOUNT;
    if (REPAY_AMOUNT > debtBefore) {
        console.log(`\n⚠️  Requested repay amount (${formatAmount(REPAY_AMOUNT, 18, "USDT")}) exceeds debt (${formatAmount(debtBefore, 18, "USD")})`);
        console.log(`   Adjusting to repay full debt amount.\n`);
        actualRepayAmount = debtBefore;
    }

    if (userUsdtBalance < actualRepayAmount) {
        console.error(`\n❌ ERROR: Insufficient USDT to repay!`);
        console.error(`   Needed: ${formatAmount(actualRepayAmount, 18, "USDT")}`);
        console.error(`   Have:   ${formatAmount(userUsdtBalance, 18, "USDT")}`);

        const result = {
            network: network.name,
            timestamp: new Date().toISOString(),
            status: "insufficient_usdt",
            requestedAmount: REPAY_AMOUNT.toString(),
            actualAmount: actualRepayAmount.toString(),
            userBalance: userUsdtBalance.toString(),
            shortage: (actualRepayAmount - userUsdtBalance).toString()
        };

        writeResult("test_repay_partial_result.json", result);
        console.log("\n💾 Result saved to: test_repay_partial_result.json\n");
        process.exit(1);
    }

    // Approve LeverageAccount to spend USDT
    console.log(`\n✍️  Step 1: Approving LeverageAccount to spend ${formatAmount(actualRepayAmount, 18, "USDT")}...`);
    const approveTx = await usdtToken.approve(LEVERAGE_ACCOUNT_ADDRESS, actualRepayAmount);
    await approveTx.wait();
    console.log("✅ Approval successful!\n");

    // ============================================================
    // PHASE 4: EXECUTE PARTIAL REPAYMENT
    // ============================================================

    console.log("----------------------------------------------------");
    console.log("🔄 EXECUTING PARTIAL REPAYMENT");
    console.log("----------------------------------------------------");

    // Get USDT balance before
    const usdtBalanceBefore = await usdtToken.balanceOf(testerAddress);

    console.log(`⏳ Repaying ${formatAmount(actualRepayAmount, 18, "USDT")}...`);
    const repayTx = await leverageAccount.repayPartial(
        USDT_TOKEN_ADDRESS,
        actualRepayAmount
    );

    console.log(`   Transaction submitted: ${repayTx.hash}`);
    const repayReceipt = await repayTx.wait();

    console.log("✅ Repayment successful!");
    console.log(`📍 Transaction: ${repayTx.hash}`);
    console.log(`🔍 View on Etherscan: https://sepolia.etherscan.io/tx/${repayTx.hash}\n`);

    // ============================================================
    // PHASE 5: VERIFY FINAL STATE
    // ============================================================

    console.log("----------------------------------------------------");
    console.log("✅ FINAL STATE");
    console.log("----------------------------------------------------");

    // Get position after
    const [collateralAfter, debtAfter, ltvAfter] = await leverageAccount.getStatus();

    // Get USDT balance after
    const usdtBalanceAfter = await usdtToken.balanceOf(testerAddress);

    console.log("Position Changes:");
    console.log(`   Collateral: ${formatAmount(collateralBefore, 18)} → ${formatAmount(collateralAfter, 18, "USD")}`);
    console.log(`   Debt:       ${formatAmount(debtBefore, 18)} → ${formatAmount(debtAfter, 18, "USD")}`);
    console.log(`   Debt Paid:  -${formatAmount(debtBefore - debtAfter, 18, "USD")}\n`);

    console.log(`   LTV:        ${formatLTV(ltvBefore)} → ${formatLTV(ltvAfter)}`);
    const ltvReduction = Number(ltvBefore) - Number(ltvAfter);
    console.log(`   LTV Change: -${(ltvReduction / 100).toFixed(2)}%\n`);

    console.log("USDT Balance:");
    console.log(`   Before: ${formatAmount(usdtBalanceBefore, 18, "USDT")}`);
    console.log(`   After:  ${formatAmount(usdtBalanceAfter, 18, "USDT")}`);
    console.log(`   Spent:  -${formatAmount(usdtBalanceBefore - usdtBalanceAfter, 18, "USDT")}\n`);

    if (debtAfter === 0n) {
        console.log("🎉 Debt fully repaid! Position now has zero debt.\n");
    } else {
        console.log(`ℹ️  Remaining debt: ${formatAmount(debtAfter, 18, "USD")}\n`);
    }

    // ============================================================
    // SAVE RESULT
    // ============================================================

    const result = {
        network: network.name,
        timestamp: new Date().toISOString(),
        status: "success",
        txHash: repayTx.hash,
        explorerUrl: `https://sepolia.etherscan.io/tx/${repayTx.hash}`,
        requestedAmount: REPAY_AMOUNT.toString(),
        actualRepayAmount: actualRepayAmount.toString(),
        before: {
            collateral: collateralBefore.toString(),
            debt: debtBefore.toString(),
            ltv: ltvBefore.toString()
        },
        after: {
            collateral: collateralAfter.toString(),
            debt: debtAfter.toString(),
            ltv: ltvAfter.toString()
        },
        changes: {
            debtReduced: (debtBefore - debtAfter).toString(),
            ltvReduced: ltvReduction.toString(),
            usdtSpent: (usdtBalanceBefore - usdtBalanceAfter).toString()
        },
        fullyRepaid: debtAfter === 0n
    };

    writeResult("test_repay_partial_result.json", result);

    console.log("====================================================");
    console.log("🎉 Test Complete!");
    console.log("====================================================");
    console.log("\n💾 Test result saved to: test_repay_partial_result.json\n");
}

main().catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    process.exitCode = 1;
});