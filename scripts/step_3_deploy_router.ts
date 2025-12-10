import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Helper function to write deployment result to JSON
function writeDeploymentResult(filePath: string, data: any): void {
  const fullPath = path.join(__dirname, filePath);
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), "utf-8");
}

async function main() {
  console.log("🚀 Deploying MockRouter to Sepolia...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log(`📡 Network: ${network.name} (Chain ID: ${network.config.chainId})`);
  console.log(`👤 Deployer: ${deployerAddress}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  // Deploy MockRouter
  console.log("----------------------------------------------------");
  console.log("⏳ Deploying MockRouter...");
  const MockRouterFactory = await ethers.getContractFactory("MockRouter");
  const router = await MockRouterFactory.deploy();
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  const deployTx = router.deploymentTransaction();
  console.log("✅ MockRouter deployed!");
  console.log(`📍 Address: ${routerAddress}`);
  console.log(`📝 Constructor: (no parameters)`);
  console.log("----------------------------------------------------\n");

  // Save deployment result to JSON
  const deploymentResult = {
    address: routerAddress,
    network: network.name,
    txHash: deployTx?.hash || "",
    deployedAt: new Date().toISOString()
  };

  const resultFile = "step_3_deploy_router_result.json";
  writeDeploymentResult(resultFile, deploymentResult);
  console.log(`💾 Deployment result saved to: ${resultFile}\n`);

  console.log("====================================================");
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("====================================================");
  console.log(`MockRouter: ${routerAddress}`);
  console.log(`Network:    ${network.name}`);
  console.log(`Tx Hash:    ${deployTx?.hash}`);
  console.log("");
  console.log("🔍 View on Etherscan:");
  console.log(`https://sepolia.etherscan.io/address/${routerAddress}`);
  console.log("====================================================\n");

  console.log("✅ MockRouter deployment complete!");
  console.log("\n💡 Next step: npm run step:4");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
