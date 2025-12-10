import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Test parameters
const WITHDRAW_AMOUNT = ethers.parseEther("0.01"); // 0.01 WETH

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

// ============================================================
// MAIN FUNCTION
// ============================================================

async function main() {
    console.log("🚀 Starting Withdraw Test...\n");

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

    let wethData: any;
    let leverageAccountData: any;

    try {
        wethData = readDeploymentResult("step_1_deploy_weth_result.json");
        leverageAccountData = readDeploymentResult("step_8_deploy_leverage_account_result.json");
    } catch (error: any) {
        console.error("❌ ERROR: Missing deployment files!");
        console.error("   Please run deployment scripts first:");
        console.error("   - npm run step:1");
        console.error("   - npm run step:8\n");
        process.exit(1);
    }

    const WETH_TOKEN_ADDRESS = wethData.address;
    const LEVERAGE_ACCOUNT_ADDRESS = leverageAccountData.address;

    // Validate addresses
    if (!validateAddress(WETH_TOKEN_ADDRESS) || !validateAddress(LEVERAGE_ACCOUNT_ADDRESS)) {
        console.error("❌ ERROR: One or more addresses are invalid!");
        process.exit(1);
    }

    // ============================================================
    // PHASE 1: CONTRACT CONNECTION
    // ============================================================

    console.log("----------------------------------------------------");
    console.log("📋 CONFIGURATION");
    console.log("----------------------------------------------------");
    console.log(`WETH Token:       ${WETH_TOKEN_ADDRESS}`);
    console.log(`LeverageAccount:  ${LEVERAGE_ACCOUNT_ADDRESS}`);
    console.log(`Withdraw Amount:  ${formatAmount(WITHDRAW_AMOUNT, 18, "WETH")}`);
    console.log("----------------------------------------------------\n");

    const MockTokenFactory = await ethers.getContractFactory("MockToken");
    const wethToken = MockTokenFactory.attach(WETH_TOKEN_ADDRESS);

    const LeverageAccountFactory = await ethers.getContractFactory("LeverageAccount");
    const leverageAccount = LeverageAccountFactory.attach(LEVERAGE_ACCOUNT_ADDRESS);

    // ============================================================
    // PHASE 2: CHECK BALANCES
    // ============================================================

    console.log("📊 Checking Balances...\n");

    const contractWethBalance = await wethToken.balanceOf(LEVERAGE_ACCOUNT_ADDRESS);
    const userWethBalanceBefore = await wethToken.balanceOf(testerAddress);

    console.log("Current Balances:");
    console.log(`   LeverageAccount WETH: ${formatAmount(contractWethBalance, 18, "WETH")}`);
    console.log(`   User WETH:            ${formatAmount(userWethBalanceBefore, 18, "WETH")}\n`);

    if (contractWethBalance === 0n) {
        console.log("⚠️  LeverageAccount has no WETH balance to withdraw.");
        console.log("ℹ️  Note: This function only withdraws 'free' tokens sitting in the contract,");
        console.log("    not tokens that are supplied to the lending pool as collateral.\n");

        const result = {
            network: network.name,
            timestamp: new Date().toISOString(),
            status: "no_balance",
            message: "LeverageAccount has no free WETH balance to withdraw",
            contractBalance: contractWethBalance.toString()
        };

        writeResult("test_withdraw_result.json", result);
        console.log("💾 Result saved to: test_withdraw_result.json\n");
        return;
    }

    let actualWithdrawAmount = WITHDRAW_AMOUNT;

    if (contractWethBalance < WITHDRAW_AMOUNT) {
        console.log(`⚠️  Warning: Contract only has ${formatAmount(contractWethBalance, 18, "WETH")}`);
        console.log(`    Adjusting withdrawal amount to match available balance.\n`);
        actualWithdrawAmount = contractWethBalance;
    }

    // ============================================================
    // PHASE 3: EXECUTE WITHDRAWAL
    // ============================================================

    console.log("----------------------------------------------------");
    console.log("🔄 EXECUTING WITHDRAWAL");
    console.log("----------------------------------------------------");

    console.log(`⏳ Withdrawing ${formatAmount(actualWithdrawAmount, 18, "WETH")}...`);
    const withdrawTx = await leverageAccount.withdraw(WETH_TOKEN_ADDRESS, actualWithdrawAmount);

    console.log(`   Transaction submitted: ${withdrawTx.hash}`);
    await withdrawTx.wait();

    console.log("✅ Withdrawal successful!");
    console.log(`📍 Transaction: ${withdrawTx.hash}`);
    console.log(`🔍 View on Etherscan: https://sepolia.etherscan.io/tx/${withdrawTx.hash}\n`);

    // ============================================================
    // PHASE 4: VERIFY FINAL STATE
    // ============================================================

    console.log("----------------------------------------------------");
    console.log("✅ FINAL STATE");
    console.log("----------------------------------------------------");

    const contractWethBalanceAfter = await wethToken.balanceOf(LEVERAGE_ACCOUNT_ADDRESS);
    const userWethBalanceAfter = await wethToken.balanceOf(testerAddress);

    console.log("Final Balances:");
    console.log(`   LeverageAccount WETH: ${formatAmount(contractWethBalance, 18)} → ${formatAmount(contractWethBalanceAfter, 18)}`);
    console.log(`   Change: -${formatAmount(contractWethBalance - contractWethBalanceAfter, 18, "WETH")}\n`);

    console.log(`   User WETH:            ${formatAmount(userWethBalanceBefore, 18)} → ${formatAmount(userWethBalanceAfter, 18)}`);
    console.log(`   Change: +${formatAmount(userWethBalanceAfter - userWethBalanceBefore, 18, "WETH")}\n`);

    // ============================================================
    // SAVE RESULT
    // ============================================================

    const result = {
        network: network.name,
        timestamp: new Date().toISOString(),
        status: "success",
        txHash: withdrawTx.hash,
        explorerUrl: `https://sepolia.etherscan.io/tx/${withdrawTx.hash}`,
        requestedAmount: WITHDRAW_AMOUNT.toString(),
        actualAmount: actualWithdrawAmount.toString(),
        balances: {
            contract: {
                before: contractWethBalance.toString(),
                after: contractWethBalanceAfter.toString(),
                change: (contractWethBalance - contractWethBalanceAfter).toString()
            },
            user: {
                before: userWethBalanceBefore.toString(),
                after: userWethBalanceAfter.toString(),
                change: (userWethBalanceAfter - userWethBalanceBefore).toString()
            }
        }
    };

    writeResult("test_withdraw_result.json", result);

    console.log("====================================================");
    console.log("🎉 Test Complete!");
    console.log("====================================================");
    console.log("\n💾 Test result saved to: test_withdraw_result.json\n");
}

main().catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    process.exitCode = 1;
});