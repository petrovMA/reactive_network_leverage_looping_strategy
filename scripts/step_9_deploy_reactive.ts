import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// Configuration
const REACT_FUNDING_AMOUNT = "0.05"; // REACT to fund the RSC contract for subscriptions

// Helper function to read deployment result from JSON
function readDeploymentResult(filePath: string): any {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileContent = fs.readFileSync(fullPath, "utf-8");
  return JSON.parse(fileContent);
}

// Helper function to write deployment result to JSON
function writeDeploymentResult(filePath: string, data: any): void {
  const fullPath = path.join(__dirname, filePath);
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), "utf-8");
}

// Helper function to validate address
function validateAddress(address: string): boolean {
  if (!address) return false;
  if (address === "0x0000000000000000000000000000000000000000") return false;
  return true;
}

// Helper function to get user confirmation
async function getUserConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  console.log("🚀 Deploying LoopingRSC on Reactive Network...\n");

  // Read deployment results from Sepolia
  console.log("📖 Reading deployment results from Sepolia...\n");

  let leverageAccountData: any;
  let wethData: any;
  let usdtData: any;

  try {
    leverageAccountData = readDeploymentResult("step_8_deploy_leverage_account_result.json");
    wethData = readDeploymentResult("step_1_deploy_weth_result.json");
    usdtData = readDeploymentResult("step_2_deploy_usdt_result.json");
  } catch (error: any) {
    console.error("❌ ERROR: Missing deployment files!");
    console.error("   Please run deployment scripts on Sepolia first:");
    console.error("   - npm run step:8 (deploy leverage account)");
    console.error("   - npm run step:1 (deploy WETH)");
    console.error("   - npm run step:2 (deploy USDT)\n");
    process.exit(1);
  }

  const LEVERAGE_ACCOUNT = leverageAccountData.address;
  const WETH_ADDR = wethData.address;
  const USDT_ADDR = usdtData.address;
  const EXPECTED_RSC_DEPLOYER = leverageAccountData.rscDeployer;

  // Validate addresses
  if (!validateAddress(LEVERAGE_ACCOUNT) || !validateAddress(WETH_ADDR) || !validateAddress(USDT_ADDR)) {
    console.error("❌ ERROR: One or more addresses are invalid!");
    process.exit(1);
  }

  if (!validateAddress(EXPECTED_RSC_DEPLOYER)) {
    console.error("❌ ERROR: RSC Deployer address not found in step_8_deploy_leverage_account_result.json!");
    console.error("   Please redeploy LeverageAccount using: npm run step:8\n");
    process.exit(1);
  }

  console.log(`✅ LeverageAccount (Sepolia): ${LEVERAGE_ACCOUNT}`);
  console.log(`✅ WETH (Sepolia):            ${WETH_ADDR}`);
  console.log(`✅ USDT (Sepolia):            ${USDT_ADDR}`);
  console.log(`✅ Expected RSC Deployer:     ${EXPECTED_RSC_DEPLOYER}\n`);

  // Get deployer account on Reactive Network
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log("====================================================");
  console.log("⚠️  RSC DEPLOYER VERIFICATION");
  console.log("====================================================");
  console.log(`📡 Network: ${network.name}`);
  console.log(`👤 Current Deployer:  ${deployerAddress}`);
  console.log(`✅ Expected Deployer: ${EXPECTED_RSC_DEPLOYER}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  // Verify RSC Deployer matches
  if (deployerAddress.toLowerCase() !== EXPECTED_RSC_DEPLOYER.toLowerCase()) {
    console.log("====================================================");
    console.log("❌ ERROR: DEPLOYER MISMATCH!");
    console.log("====================================================");
    console.log(`Current deployer:  ${deployerAddress}`);
    console.log(`Expected deployer: ${EXPECTED_RSC_DEPLOYER}\n`);
    console.log("The deployer address MUST match the RSC Deployer used");
    console.log("when deploying LeverageAccount on Sepolia!\n");
    console.log("💡 Solution:");
    console.log("   Switch to the correct wallet in hardhat.config.ts");
    console.log("   or redeploy LeverageAccount with the current wallet.\n");
    process.exit(1);
  }

  console.log("✅ Deployer verification successful!");
  console.log("   This address will authorize RSC calls to LeverageAccount.\n");
  console.log("====================================================\n");

  // Ask for confirmation
  const confirmed = await getUserConfirmation("Continue with deployment? (y/n): ");

  if (!confirmed) {
    console.log("\n❌ Deployment cancelled by user.\n");
    process.exit(0);
  }

  console.log("\n✅ Proceeding with deployment...\n");

  // Deploy LoopingRSC
  console.log("----------------------------------------------------");
  console.log(`⏳ Deploying LoopingRSC with ${REACT_FUNDING_AMOUNT} REACT funding...`);
  const LoopingRSC = await ethers.getContractFactory("LoopingRSC");
  const rsc = await LoopingRSC.deploy(LEVERAGE_ACCOUNT, WETH_ADDR, USDT_ADDR, {
    value: ethers.parseEther(REACT_FUNDING_AMOUNT)
  });
  await rsc.waitForDeployment();
  const rscAddress = await rsc.getAddress();
  const deployTx = rsc.deploymentTransaction();
  console.log(`✅ LoopingRSC deployed to: ${rscAddress} with ${REACT_FUNDING_AMOUNT} REACT funding`);
  console.log("----------------------------------------------------\n");

  // Save deployment result to JSON
  const deploymentResult = {
    address: rscAddress,
    network: network.name,
    txHash: deployTx?.hash || "",
    deployedAt: new Date().toISOString(),
    rscDeployer: deployerAddress,
    ethBalance: REACT_FUNDING_AMOUNT,
    leverageAccount: LEVERAGE_ACCOUNT,
    weth: WETH_ADDR,
    usdt: USDT_ADDR
  };

  const resultFile = "step_9_deploy_reactive_result.json";
  writeDeploymentResult(resultFile, deploymentResult);
  console.log(`💾 Deployment result saved to: ${resultFile}\n`);

  console.log("====================================================");
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("====================================================");
  console.log(`LoopingRSC:      ${rscAddress}`);
  console.log(`RSC Deployer:    ${deployerAddress} ⚠️  (Use this as RSC_ADDRESS)`);
  console.log(`Network:         ${network.name}`);
  console.log(`REACT Balance:   ${REACT_FUNDING_AMOUNT} REACT`);
  console.log(`Tx Hash:         ${deployTx?.hash}`);
  console.log("");
  console.log("Sepolia Contracts:");
  console.log(`LeverageAccount: ${LEVERAGE_ACCOUNT}`);
  console.log(`WETH:            ${WETH_ADDR}`);
  console.log(`USDT:            ${USDT_ADDR}`);
  console.log("====================================================\n");

  console.log("✅ LoopingRSC deployment complete!");
  console.log("\n⚠️  IMPORTANT NOTE:");
  console.log("The RSC is now ready to listen for events!");
  console.log("LeverageAccount was already configured with this RSC Deployer in the constructor.\n");

  console.log("📋 NEXT STEPS:");
  console.log("1. Test the leverage loop");
  console.log("   Run: npm run test:loop");
  console.log("\n2. Check position status");
  console.log("   Run: npm run check:position");
  console.log("\n3. Test partial repayment");
  console.log("   Run: npm run test:repay");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
