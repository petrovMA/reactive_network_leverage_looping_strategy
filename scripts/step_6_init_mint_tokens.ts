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

async function main() {
  console.log("🔧 Phase 2: Minting Initial Token Supplies...\n");

  // Read deployment results
  console.log("📖 Reading deployment results...\n");

  let wethData: any;
  let usdtData: any;
  let pricesData: any;

  try {
    wethData = readDeploymentResult("step_1_deploy_weth_result.json");
    usdtData = readDeploymentResult("step_2_deploy_usdt_result.json");
    pricesData = readDeploymentResult("step_6_init_set_prices_result.json");
  } catch (error: any) {
    console.error("❌ ERROR: Missing required files!");
    console.error("   Please run previous scripts first:");
    console.error("   1. npm run step:1 (deploy WETH)");
    console.error("   2. npm run step:2 (deploy USDT)");
    console.error("   3. npm run step:6 (set prices)\n");
    process.exit(1);
  }

  // Validate previous step was completed
  if (!pricesData.completed) {
    console.error("❌ ERROR: Price setting not completed!");
    console.error("   Please run: npm run step:6\n");
    process.exit(1);
  }

  const WETH_ADDRESS = wethData.address;
  const USDT_ADDRESS = usdtData.address;

  // Validate addresses
  if (!validateAddress(WETH_ADDRESS) || !validateAddress(USDT_ADDRESS)) {
    console.error("❌ ERROR: One or more addresses are invalid!");
    process.exit(1);
  }

  console.log(`✅ WETH: ${WETH_ADDRESS}`);
  console.log(`✅ USDT: ${USDT_ADDRESS}`);
  console.log(`✅ Prices were set (previous step completed)\n`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log(`📡 Network: ${network.name} (Chain ID: ${network.config.chainId})`);
  console.log(`👤 Deployer: ${deployerAddress}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  // Get contract instances
  const wethToken = await ethers.getContractAt("MockToken", WETH_ADDRESS);
  const usdtToken = await ethers.getContractAt("MockToken", USDT_ADDRESS);

  // Mint tokens
  console.log("----------------------------------------------------");
  console.log("⏳ Minting initial token supplies...");

  const wethMintAmount = ethers.parseEther("1000");      // 1000 WETH
  const usdtMintAmount = ethers.parseEther("100000");    // 100,000 USDT

  const mintWethTx = await wethToken.mint(deployerAddress, wethMintAmount);
  await mintWethTx.wait();
  console.log(`✅ Minted 1000 WETH to deployer`);
  console.log(`   Tx Hash: ${mintWethTx.hash}`);

  const mintUsdtTx = await usdtToken.mint(deployerAddress, usdtMintAmount);
  await mintUsdtTx.wait();
  console.log(`✅ Minted 100,000 USDT to deployer`);
  console.log(`   Tx Hash: ${mintUsdtTx.hash}`);
  console.log("----------------------------------------------------\n");

  // Save result to JSON
  const result = {
    completed: true,
    wethMinted: "1000",
    usdtMinted: "100000",
    recipient: deployerAddress,
    timestamp: new Date().toISOString(),
    txHashes: [mintWethTx.hash, mintUsdtTx.hash]
  };

  const resultFile = "step_7_init_mint_tokens_result.json";
  writeResult(resultFile, result);
  console.log(`💾 Result saved to: ${resultFile}\n`);

  console.log("====================================================");
  console.log("📋 SUMMARY");
  console.log("====================================================");
  console.log("✅ Tokens Minted:");
  console.log(`   - Deployer WETH Balance: 1000`);
  console.log(`   - Deployer USDT Balance: 100000`);
  console.log("====================================================\n");

  console.log("✅ Token minting complete!");
  console.log("\n💡 Next step: npm run step:7 (register assets)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});