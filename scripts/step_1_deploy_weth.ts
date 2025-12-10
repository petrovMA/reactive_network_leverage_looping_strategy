import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Helper function to write deployment result to JSON
function writeDeploymentResult(filePath: string, data: any): void {
  const fullPath = path.join(__dirname, filePath);
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), "utf-8");
}

async function main() {
  console.log("🚀 Deploying WETH Token to Sepolia...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log(`📡 Network: ${network.name} (Chain ID: ${network.config.chainId})`);
  console.log(`👤 Deployer: ${deployerAddress}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  // Deploy MockToken (WETH)
  console.log("----------------------------------------------------");
  console.log("⏳ Deploying MockToken (WETH)...");
  const MockTokenFactory = await ethers.getContractFactory("MockToken");
  const wethToken = await MockTokenFactory.deploy("Wrapped Ether", "WETH");
  await wethToken.waitForDeployment();
  const wethAddress = await wethToken.getAddress();
  const deployTx = wethToken.deploymentTransaction();
  console.log("✅ WETH Token deployed!");
  console.log(`📍 Address: ${wethAddress}`);
  console.log(`📝 Constructor: "Wrapped Ether", "WETH"`);
  console.log("----------------------------------------------------\n");

  // Save deployment result to JSON
  const deploymentResult = {
    address: wethAddress,
    network: network.name,
    txHash: deployTx?.hash || "",
    deployedAt: new Date().toISOString()
  };

  const resultFile = "step_1_deploy_weth_result.json";
  writeDeploymentResult(resultFile, deploymentResult);
  console.log(`💾 Deployment result saved to: ${resultFile}\n`);

  console.log("====================================================");
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("====================================================");
  console.log(`WETH Token: ${wethAddress}`);
  console.log(`Network:    ${network.name}`);
  console.log(`Tx Hash:    ${deployTx?.hash}`);
  console.log("");
  console.log("🔍 View on Etherscan:");
  console.log(`https://sepolia.etherscan.io/address/${wethAddress}`);
  console.log("====================================================\n");

  console.log("✅ WETH deployment complete!");
  console.log("\n💡 Next step: npm run step:2");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
