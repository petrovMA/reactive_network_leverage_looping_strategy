import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

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
    console.log("🚀 Starting Full Close Position Test...\n");

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
    let usdtData: any;
    let leverageAccountData: any;

    try {
        wethData = readDeploymentResult("step_1_deploy_weth_result.json");
        usdtData = readDeploymentResult("step_2_deploy_usdt_result.json");
        leverageAccountData = readDeploymentResult("step_8_deploy_leverage_account_result.json");
    } catch (error: any) {
        console.error("❌ ERROR: Missing deployment files!");
        console.error("   Please run deployment scripts first:");
        console.error("   - npm run step:1");
        console.error("   - npm run step:2");
        console.error("   - npm run step:8\n");
        process.exit(1);
    }

    const WETH_TOKEN_ADDRESS = wethData.address;
    const USDT_TOKEN_ADDRESS = usdtData.address;
    const LEVERAGE_ACCOUNT_ADDRESS = leverageAccountData.address;

    // Validate addresses
    if (!validateAddress(WETH_TOKEN_ADDRESS) ||
        !validateAddress(USDT_TOKEN_ADDRESS) ||
        !validateAddress(LEVERAGE_ACCOUNT_ADDRESS)) {
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
    console.log(`USDT Token:       ${USDT_TOKEN_ADDRESS}`);
    console.log(`LeverageAccount:  ${LEVERAGE_ACCOUNT_ADDRESS}`);
    console.log("----------------------------------------------------\n");

    const MockTokenFactory = await ethers.getContractFactory("MockToken");
    const wethToken = MockTokenFactory.attach(WETH_TOKEN_ADDRESS);
    const usdtToken = MockTokenFactory.attach(USDT_TOKEN_ADDRESS);

    const LeverageAccountFactory = await ethers.getContractFactory("LeverageAccount");
    const leverageAccount = LeverageAccountFactory.attach(LEVERAGE_ACCOUNT_ADDRESS);

    // ============================================================
    // PHASE 2: CHECK CURRENT POSITION
    // ============================================================

    console.log("📊 Checking Current Position...\n");

    const [collateral, debt, currentLTV] = await leverageAccount.getStatus();

    console.log("Current Status:");
    console.log(`   Collateral: ${formatAmount(collateral, 18, "USD")}`);
    console.log(`   Debt:       ${formatAmount(debt, 18, "USD")}`);
    console.log(`   LTV:        ${formatLTV(currentLTV)}\n`);

    if (collateral === 0n) {
        console.log("⚠️  No position to close. Please create a position first.");

        const result = {
            network: network.name,
            timestamp: new Date().toISOString(),
            status: "no_position",
            message: "No position found to close"
        };

        writeResult("test_full_close_position_result.json", result);
        console.log("\n💾 Result saved to: test_full_close_position_result.json\n");
        return;
    }

    // ============================================================
    // PHASE 3: PREPARE FOR CLOSE (IF THERE'S DEBT)
    // ============================================================

    if (debt > 0n) {
        console.log("💰 Preparing to repay debt...\n");

        // Check user's USDT balance
        const userUsdtBalance = await usdtToken.balanceOf(testerAddress);
        console.log(`Your USDT Balance: ${formatAmount(userUsdtBalance, 18, "USDT")}`);

        if (userUsdtBalance < debt) {
            console.error(`\n❌ ERROR: Insufficient USDT to repay debt!`);
            console.error(`   Needed: ${formatAmount(debt, 18, "USDT")}`);
            console.error(`   Have:   ${formatAmount(userUsdtBalance, 18, "USDT")}`);
            console.error(`   \nPlease acquire ${formatAmount(debt - userUsdtBalance, 18, "USDT")} more USDT`);

            const result = {
                network: network.name,
                timestamp: new Date().toISOString(),
                status: "insufficient_usdt",
                debtAmount: debt.toString(),
                userBalance: userUsdtBalance.toString(),
                shortage: (debt - userUsdtBalance).toString()
            };

            writeResult("test_full_close_position_result.json", result);
            console.log("\n💾 Result saved to: test_full_close_position_result.json\n");
            process.exit(1);
        }

        // Approve LeverageAccount to spend USDT for debt repayment
        console.log(`\n✍️  Step 1: Approving LeverageAccount to spend ${formatAmount(debt, 18, "USDT")}...`);
        const approveTx = await usdtToken.approve(LEVERAGE_ACCOUNT_ADDRESS, debt);
        await approveTx.wait();
        console.log("✅ Approval successful!\n");
    } else {
        console.log("ℹ️  No debt to repay. Will only withdraw collateral.\n");
    }

    // ============================================================
    // PHASE 4: EXECUTE FULL CLOSE POSITION
    // ============================================================

    console.log("----------------------------------------------------");
    console.log("🔄 CLOSING POSITION");
    console.log("----------------------------------------------------");

    // Get balances before
    const wethBalanceBefore = await wethToken.balanceOf(testerAddress);
    const usdtBalanceBefore = await usdtToken.balanceOf(testerAddress);

    console.log("⏳ Executing fullClosePosition...");
    const closeTx = await leverageAccount.fullClosePosition(
        WETH_TOKEN_ADDRESS,
        USDT_TOKEN_ADDRESS
    );

    console.log(`   Transaction submitted: ${closeTx.hash}`);
    const closeReceipt = await closeTx.wait();

    console.log("✅ Position closed successfully!");
    console.log(`📍 Transaction: ${closeTx.hash}`);
    console.log(`🔍 View on Etherscan: https://sepolia.etherscan.io/tx/${closeTx.hash}\n`);

    // Parse PositionClosed event
    const positionClosedEvent = closeReceipt?.logs
        .map((log) => {
            try { return leverageAccount.interface.parseLog(log); }
            catch { return null; }
        })
        .find((event) => event?.name === "PositionClosed");

    let debtRepaid = 0n;
    let collateralReturned = 0n;

    if (positionClosedEvent) {
        debtRepaid = positionClosedEvent.args.debtRepaid;
        collateralReturned = positionClosedEvent.args.collateralReturned;

        console.log("📋 Position Close Summary:");
        console.log(`   Debt Repaid:         ${formatAmount(debtRepaid, 18, "USDT")}`);
        console.log(`   Collateral Returned: ${formatAmount(collateralReturned, 18, "WETH")}\n`);
    }

    // ============================================================
    // PHASE 5: VERIFY FINAL STATE
    // ============================================================

    console.log("----------------------------------------------------");
    console.log("✅ FINAL STATE");
    console.log("----------------------------------------------------");

    // Get balances after
    const wethBalanceAfter = await wethToken.balanceOf(testerAddress);
    const usdtBalanceAfter = await usdtToken.balanceOf(testerAddress);

    // Get position status
    const [finalCollateral, finalDebt, finalLTV] = await leverageAccount.getStatus();

    console.log("User Token Balances:");
    console.log(`   WETH: ${formatAmount(wethBalanceBefore, 18)} → ${formatAmount(wethBalanceAfter, 18)}`);
    console.log(`   Change: +${formatAmount(wethBalanceAfter - wethBalanceBefore, 18, "WETH")}\n`);

    console.log(`   USDT: ${formatAmount(usdtBalanceBefore, 18)} → ${formatAmount(usdtBalanceAfter, 18)}`);
    if (usdtBalanceBefore >= usdtBalanceAfter) {
        console.log(`   Change: -${formatAmount(usdtBalanceBefore - usdtBalanceAfter, 18, "USDT")}\n`);
    } else {
        console.log(`   Change: +${formatAmount(usdtBalanceAfter - usdtBalanceBefore, 18, "USDT")}\n`);
    }

    console.log("Leverage Position:");
    console.log(`   Collateral: ${formatAmount(finalCollateral, 18, "USD")}`);
    console.log(`   Debt:       ${formatAmount(finalDebt, 18, "USD")}`);
    console.log(`   LTV:        ${formatLTV(finalLTV)}`);

    const fullyCloses = finalCollateral === 0n && finalDebt === 0n;

    if (fullyCloses) {
        console.log("\n✅ Position fully closed! No remaining collateral or debt.\n");
    } else {
        console.log("\n⚠️  Warning: Position not fully closed. Some collateral or debt remains.\n");
    }

    // ============================================================
    // SAVE RESULT
    // ============================================================

    const result = {
        network: network.name,
        timestamp: new Date().toISOString(),
        status: "success",
        txHash: closeTx.hash,
        explorerUrl: `https://sepolia.etherscan.io/tx/${closeTx.hash}`,
        initial: {
            collateral: collateral.toString(),
            debt: debt.toString(),
            ltv: currentLTV.toString()
        },
        repayment: {
            debtRepaid: debtRepaid.toString(),
            collateralReturned: collateralReturned.toString()
        },
        final: {
            collateral: finalCollateral.toString(),
            debt: finalDebt.toString(),
            ltv: finalLTV.toString(),
            fullyClosed: fullyCloses
        },
        balanceChanges: {
            weth: {
                before: wethBalanceBefore.toString(),
                after: wethBalanceAfter.toString(),
                change: (wethBalanceAfter - wethBalanceBefore).toString()
            },
            usdt: {
                before: usdtBalanceBefore.toString(),
                after: usdtBalanceAfter.toString(),
                change: (usdtBalanceAfter - usdtBalanceBefore).toString()
            }
        }
    };

    writeResult("test_full_close_position_result.json", result);

    console.log("====================================================");
    console.log("🎉 Test Complete!");
    console.log("====================================================");
    console.log("\n💾 Test result saved to: test_full_close_position_result.json\n");
}

main().catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    process.exitCode = 1;
});