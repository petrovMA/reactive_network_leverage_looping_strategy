import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Helper function to write deployment result to JSON
function writeDeploymentResult(filePath: string, data: any): void {
  const fullPath = path.join(__dirname, filePath);
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), "utf-8");
}

async function main() {
  console.log("🚀 Deploying USDT Token to Sepolia...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log(`📡 Network: ${network.name} (Chain ID: ${network.config.chainId})`);
  console.log(`👤 Deployer: ${deployerAddress}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  // Deploy MockToken (USDT)
  console.log("----------------------------------------------------");
  console.log("⏳ Deploying MockToken (USDT)...");
  const MockTokenFactory = await ethers.getContractFactory("MockToken");
  const usdtToken = await MockTokenFactory.deploy("Tether USD", "USDT");
  await usdtToken.waitForDeployment();
  const usdtAddress = await usdtToken.getAddress();
  const deployTx = usdtToken.deploymentTransaction();
  console.log("✅ USDT Token deployed!");
  console.log(`📍 Address: ${usdtAddress}`);
  console.log(`📝 Constructor: "Tether USD", "USDT"`);
  console.log("----------------------------------------------------\n");

  // Save deployment result to JSON
  const deploymentResult = {
    address: usdtAddress,
    network: network.name,
    txHash: deployTx?.hash || "",
    deployedAt: new Date().toISOString()
  };

  const resultFile = "step_2_deploy_usdt_result.json";
  writeDeploymentResult(resultFile, deploymentResult);
  console.log(`💾 Deployment result saved to: ${resultFile}\n`);

  console.log("====================================================");
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("====================================================");
  console.log(`USDT Token: ${usdtAddress}`);
  console.log(`Network:    ${network.name}`);
  console.log(`Tx Hash:    ${deployTx?.hash}`);
  console.log("");
  console.log("🔍 View on Etherscan:");
  console.log(`https://sepolia.etherscan.io/address/${usdtAddress}`);
  console.log("====================================================\n");

  console.log("✅ USDT deployment complete!");
  console.log("\n💡 Next step: npm run step:3");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
