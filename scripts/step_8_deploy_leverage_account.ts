import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Configuration
const ETH_FUNDING_AMOUNT = "0.01"; // ETH to fund the contract for callback payments

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

async function main() {
  console.log("🚀 Deploying LeverageAccount to Sepolia...\n");

  // Read deployment results
  console.log("📖 Reading deployment results...\n");

  let lendingPoolData: any;
  let routerData: any;

  try {
    lendingPoolData = readDeploymentResult("step_4_deploy_lending_pool_result.json");
  } catch (error: any) {
    console.error("❌ ERROR: step_4_deploy_lending_pool_result.json not found!");
    console.error("   Please run: npm run step:4\n");
    process.exit(1);
  }

  try {
    routerData = readDeploymentResult("step_3_deploy_router_result.json");
  } catch (error: any) {
    console.error("❌ ERROR: step_3_deploy_router_result.json not found!");
    console.error("   Please run: npm run step:3\n");
    process.exit(1);
  }

  const LENDING_POOL = lendingPoolData.address;
  const ROUTER = routerData.address;

  // Validate addresses
  if (!validateAddress(LENDING_POOL)) {
    console.error("❌ ERROR: LendingPool address is invalid or zero!");
    console.error("   Please redeploy the lending pool.\n");
    process.exit(1);
  }

  if (!validateAddress(ROUTER)) {
    console.error("❌ ERROR: Router address is invalid or zero!");
    console.error("   Please redeploy the router.\n");
    process.exit(1);
  }

  console.log(`✅ LendingPool: ${LENDING_POOL}`);
  console.log(`✅ Router:      ${ROUTER}\n`);

  // Sepolia Callback Proxy address (from Reactive Network docs)
  const CALLBACK_PROXY = "0xc9f36411C9897e7F959D99ffca2a0Ba7ee0D7bDA";

  // Get deployer account
  const [deployer, rsc_deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log(`📡 Network: ${network.name} (Chain ID: ${network.config.chainId})`);
  console.log(`👤 Deployer: ${deployerAddress}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  console.log("📋 Configuration:");
  console.log(`   LendingPool:    ${LENDING_POOL}`);
  console.log(`   Router:         ${ROUTER}`);
  console.log(`   CallbackProxy:  ${CALLBACK_PROXY}`);
  console.log(`   RSC Deployer:   ${rsc_deployer.address}\n`);

  // Deploy LeverageAccount with ETH funding
  console.log("----------------------------------------------------");
  console.log(`⏳ Deploying LeverageAccount with ${ETH_FUNDING_AMOUNT} ETH funding...`);
  const LeverageAccount = await ethers.getContractFactory("LeverageAccount");
  const leverageAccount = await LeverageAccount.deploy(
    LENDING_POOL,
    ROUTER,
    CALLBACK_PROXY,
    rsc_deployer.address,
    {
      value: ethers.parseEther(ETH_FUNDING_AMOUNT)
    }
  );
  await leverageAccount.waitForDeployment();
  const leverageAddress = await leverageAccount.getAddress();
  const deployTx = leverageAccount.deploymentTransaction();
  console.log(`✅ LeverageAccount deployed to: ${leverageAddress} with ${ETH_FUNDING_AMOUNT} ETH funding`);
  console.log("----------------------------------------------------\n");

  // Save deployment result to JSON
  const rscDeployerAddress = await rsc_deployer.getAddress();
  const deploymentResult = {
    address: leverageAddress,
    network: network.name,
    txHash: deployTx?.hash || "",
    deployedAt: new Date().toISOString(),
    ethBalance: ETH_FUNDING_AMOUNT,
    rscDeployer: rscDeployerAddress
  };

  const resultFile = "step_8_deploy_leverage_account_result.json";
  writeDeploymentResult(resultFile, deploymentResult);
  console.log(`💾 Deployment result saved to: ${resultFile}\n`);

  console.log("====================================================");
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("====================================================");
  console.log(`LeverageAccount: ${leverageAddress}`);
  console.log(`LendingPool:     ${LENDING_POOL}`);
  console.log(`Router:          ${ROUTER}`);
  console.log(`CallbackProxy:   ${CALLBACK_PROXY}`);
  console.log(`RSC Deployer:    ${rscDeployerAddress} ⚠️  (IMPORTANT!)`);
  console.log(`ETH Balance:     ${ETH_FUNDING_AMOUNT} ETH`);
  console.log(`Network:         ${network.name}`);
  console.log(`Tx Hash:         ${deployTx?.hash}`);
  console.log("====================================================\n");

  console.log("🔗 View on Etherscan:");
  console.log(`https://sepolia.etherscan.io/address/${leverageAddress}\n`);

  console.log("✅ LeverageAccount deployment complete!");
  console.log("\n⚠️  IMPORTANT NOTE:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`The RSC Deployer address: ${rscDeployerAddress}`);
  console.log("MUST be used when deploying the Reactive contract!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("📋 NEXT STEPS:");
  console.log("1. Deploy RSC on Reactive Network using the SAME wallet");
  console.log("   Run: npm run step:9");
  console.log("   ⚠️  Make sure the deployer address matches the RSC Deployer above!");
  console.log("\n2. Test the leverage loop");
  console.log("   Run: npm run test:loop");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});