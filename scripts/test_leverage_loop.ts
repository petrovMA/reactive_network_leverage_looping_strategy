import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Test parameters
const DEPOSIT_AMOUNT = ethers.parseEther("0.04"); // 0.01 WETH

// Constants
const TARGET_LTV = 7500; // 75.00%
const MAX_ITERATIONS = 3;
const MONITORING_TIMEOUT = 5 * 60 * 1000; // 5 minutes

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

function formatLTV(ltv: bigint): string {
    const ltvNumber = Number(ltv);
    const percentage = ltvNumber / 100;
    return `${percentage.toFixed(2)}%`;
}

function getExplorerLink(txHash: string): string {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
}

function displayProgress(current: number, target: number): string {
    const percentage = (current / target) * 100;
    const filledBlocks = Math.floor(percentage / 10);
    const emptyBlocks = 10 - filledBlocks;
    const bar = "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);
    return `[${bar}] ${percentage.toFixed(0)}%`;
}

// ============================================================
// MAIN FUNCTION
// ============================================================

async function main() {
    console.log("🚀 Starting Leverage Loop Test...\n");

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
    console.log(`Deposit Amount:   ${ethers.formatEther(DEPOSIT_AMOUNT)} WETH`);
    console.log("----------------------------------------------------\n");

    const MockTokenFactory = await ethers.getContractFactory("MockToken");
    const wethToken = MockTokenFactory.attach(WETH_TOKEN_ADDRESS);

    const LeverageAccountFactory = await ethers.getContractFactory("LeverageAccount");
    const leverageAccount = LeverageAccountFactory.attach(LEVERAGE_ACCOUNT_ADDRESS);

    // Check WETH balance
    const wethBalance = await wethToken.balanceOf(testerAddress);
    if (wethBalance < DEPOSIT_AMOUNT) {
        console.error(`\n❌ ERROR: Insufficient WETH balance!`);
        console.error(`   Current: ${ethers.formatEther(wethBalance)} WETH`);
        console.error(`   Needed:  ${ethers.formatEther(DEPOSIT_AMOUNT)} WETH`);
        console.error(`\n💡 TIP: Run init_mint_tokens.ts to mint WETH tokens\n`);
        return;
    }

    console.log(`✅ WETH Balance: ${ethers.formatEther(wethBalance)} WETH\n`);

    // ============================================================
    // PHASE 2: SIGNING PERMIT (OFF-CHAIN)
    // ============================================================

    console.log("\n✍️  Step 1: Signing Permit (Gasless Approval)...");
    console.log("   Generating EIP-712 Signature for 'depositWithPermit'...");

    // 1. Get Token Details
    const tokenName = await wethToken.name();
    const nonce = await wethToken.nonces(testerAddress);
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    // 2. Define EIP-712 Domain
    const domain = {
        name: tokenName,
        version: "1",
        chainId: networkData.chainId,
        verifyingContract: WETH_TOKEN_ADDRESS,
    };

    // 3. Define Types
    const types = {
        Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ],
    };

    // 4. Define Values
    const values = {
        owner: testerAddress,
        spender: LEVERAGE_ACCOUNT_ADDRESS,
        value: DEPOSIT_AMOUNT,
        nonce: nonce,
        deadline: deadline,
    };

    // 5. Sign Data
    const signature = await tester.signTypedData(domain, types, values);
    const sig = ethers.Signature.from(signature);

    console.log("✅ Permit Signed successfully!");
    console.log(`   v: ${sig.v}`);
    console.log(`   r: ${sig.r}`);
    console.log(`   s: ${sig.s}\n`);

    // ============================================================
    // PHASE 3: DEPOSIT WITH PERMIT (ON-CHAIN)
    // ============================================================

    console.log("⏳ Step 2: Executing 'depositWithPermit'...");
    console.log("   (This creates 1 transaction instead of 2: Permit + Transfer + Supply)");

    const depositTx = await leverageAccount.depositWithPermit(
        WETH_TOKEN_ADDRESS,
        DEPOSIT_AMOUNT,
        deadline,
        sig.v,
        sig.r,
        sig.s
    );

    console.log(`   Transaction submitted: ${depositTx.hash}`);
    const depositReceipt = await depositTx.wait();

    console.log("✅ Deposit successful!");
    console.log(`📍 Transaction: ${depositTx.hash}`);
    console.log(`🔍 View on Etherscan: ${getExplorerLink(depositTx.hash)}\n`);

    // Parse Deposited event
    const depositedEvent = depositReceipt?.logs
        .map((log) => {
            try { return leverageAccount.interface.parseLog(log); }
            catch { return null; }
        })
        .find((event) => event?.name === "Deposited");

    let initialLTV = 0;
    if (depositedEvent) {
        initialLTV = Number(depositedEvent.args.currentLTV);
        console.log("📊 Initial Position Created:");
        console.log(`   Current LTV: ${formatLTV(depositedEvent.args.currentLTV)}\n`);
    }

    // ============================================================
    // PHASE 4: EVENT MONITORING
    // ============================================================

    console.log("----------------------------------------------------");
    console.log("🔄 MONITORING REACTIVE LOOP");
    console.log("----------------------------------------------------");
    console.log("⏳ Waiting for Reactive Network to trigger leverage steps...\n");

    let iterationCount = 0;
    let monitoringActive = true;
    let finalLTV = initialLTV;
    let completionReason = "";
    const iterations: any[] = [];

    const monitoringPromise = new Promise<void>((resolve) => {
        leverageAccount.on("LoopStepExecuted", async (borrowed, newCollateral, currentLTV, iterationId, event) => {
            if (!monitoringActive) return;
            iterationCount++;

            const iteration = {
                iterationId: Number(iterationId),
                borrowed: borrowed.toString(),
                newCollateral: newCollateral.toString(),
                currentLTV: Number(currentLTV),
                txHash: event.log.transactionHash
            };
            iterations.push(iteration);

            console.log(`📈 ITERATION #${iterationId} EXECUTED`);
            console.log(`   Tx: ${getExplorerLink(event.log.transactionHash)}`);

            const ltvNumber = Number(currentLTV);
            console.log(`   New LTV: ${formatLTV(currentLTV)} ${displayProgress(ltvNumber, TARGET_LTV)}\n`);

            finalLTV = ltvNumber;

            if (ltvNumber >= TARGET_LTV) {
                completionReason = "target_reached";
                monitoringActive = false;
                resolve();
            } else if (Number(iterationId) >= MAX_ITERATIONS) {
                completionReason = "max_iterations";
                monitoringActive = false;
                resolve();
            }
        });

        setTimeout(() => {
            if (monitoringActive) {
                completionReason = "timeout";
                monitoringActive = false;
                resolve();
            }
        }, MONITORING_TIMEOUT);
    });

    await monitoringPromise;

    // Cleanup listeners
    leverageAccount.removeAllListeners();

    console.log("====================================================");
    console.log("✅ STRATEGY EXECUTION COMPLETE");
    console.log(`   Reason: ${completionReason}`);
    console.log(`   Initial LTV: ${formatLTV(BigInt(initialLTV))}`);
    console.log(`   Final LTV: ${formatLTV(BigInt(finalLTV))}`);
    console.log(`   Iterations: ${iterationCount}`);
    console.log("====================================================\n");

    // Save test result to JSON
    const testResult = {
        completed: true,
        depositTxHash: depositTx.hash,
        initialLTV: initialLTV,
        finalLTV: finalLTV,
        iterationCount: iterationCount,
        completionReason: completionReason,
        iterations: iterations,
        timestamp: new Date().toISOString()
    };

    const resultFile = "test_leverage_loop_result.json";
    writeResult(resultFile, testResult);
    console.log(`💾 Test result saved to: ${resultFile}\n`);

    console.log("🎉 Test Complete!");
}

main().catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    process.exitCode = 1;
});
