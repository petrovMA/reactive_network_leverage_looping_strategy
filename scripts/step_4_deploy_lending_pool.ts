import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

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
  console.log("🚀 Deploying MockLendingPool to Sepolia...\n");

  // Read router deployment result
  console.log("📖 Reading router deployment result...");
  let routerData: any;

  try {
    routerData = readDeploymentResult("step_3_deploy_router_result.json");
  } catch (error: any) {
    console.error("❌ ERROR: step_3_deploy_router_result.json not found!");
    console.error("   Please run: npm run step:3\n");
    process.exit(1);
  }

  const ROUTER_ADDRESS = routerData.address;

  // Validate router address
  if (!validateAddress(ROUTER_ADDRESS)) {
    console.error("❌ ERROR: Router address is invalid or zero!");
    console.error("   Please redeploy the router.\n");
    process.exit(1);
  }

  console.log(`✅ Router address loaded: ${ROUTER_ADDRESS}\n`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log(`📡 Network: ${network.name} (Chain ID: ${network.config.chainId})`);
  console.log(`👤 Deployer: ${deployerAddress}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
  console.log(`🔗 Router: ${ROUTER_ADDRESS}\n`);

  // Deploy MockLendingPool
  console.log("----------------------------------------------------");
  console.log("⏳ Deploying MockLendingPool...");
  const MockLendingPoolFactory = await ethers.getContractFactory("MockLendingPool");
  const lendingPool = await MockLendingPoolFactory.deploy(ROUTER_ADDRESS);
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  const deployTx = lendingPool.deploymentTransaction();
  console.log("✅ MockLendingPool deployed!");
  console.log(`📍 Address: ${lendingPoolAddress}`);
  console.log(`📝 Constructor: router = ${ROUTER_ADDRESS}`);
  console.log("----------------------------------------------------\n");

  // Save deployment result to JSON
  const deploymentResult = {
    address: lendingPoolAddress,
    network: network.name,
    txHash: deployTx?.hash || "",
    deployedAt: new Date().toISOString()
  };

  const resultFile = "step_4_deploy_lending_pool_result.json";
  writeDeploymentResult(resultFile, deploymentResult);
  console.log(`💾 Deployment result saved to: ${resultFile}\n`);

  console.log("====================================================");
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("====================================================");
  console.log(`MockLendingPool: ${lendingPoolAddress}`);
  console.log(`Router:          ${ROUTER_ADDRESS}`);
  console.log(`Network:         ${network.name}`);
  console.log(`Tx Hash:         ${deployTx?.hash}`);
  console.log("");
  console.log("🔍 View on Etherscan:");
  console.log(`https://sepolia.etherscan.io/address/${lendingPoolAddress}`);
  console.log("====================================================\n");

  console.log("✅ MockLendingPool deployment complete!");
  console.log("\n💡 Next step: npm run step:6 (set prices)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
