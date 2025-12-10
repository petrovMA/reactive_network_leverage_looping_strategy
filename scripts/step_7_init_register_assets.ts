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
  console.log("🔧 Phase 3: Registering Assets in MockLendingPool...\n");

  // Read deployment results
  console.log("📖 Reading deployment results...\n");

  let wethData: any;
  let usdtData: any;
  let lendingPoolData: any;
  let mintTokensData: any;

  try {
    wethData = readDeploymentResult("step_1_deploy_weth_result.json");
    usdtData = readDeploymentResult("step_2_deploy_usdt_result.json");
    lendingPoolData = readDeploymentResult("step_4_deploy_lending_pool_result.json");
    mintTokensData = readDeploymentResult("step_6_init_mint_tokens_result.json");
  } catch (error: any) {
    console.error("❌ ERROR: Missing required files!");
    console.error("   Please run previous scripts first:");
    console.error("   1. npm run step:1 (deploy WETH)");
    console.error("   2. npm run step:2 (deploy USDT)");
    console.error("   3. npm run step:4 (deploy lending pool)");
    console.error("   4. npm run step:6 (set prices)");
    console.error("   5. npm run step:7 (mint tokens)\n");
    process.exit(1);
  }

  // Validate previous step was completed
  if (!mintTokensData.completed) {
    console.error("❌ ERROR: Token minting not completed!");
    console.error("   Please run: npm run step:7\n");
    process.exit(1);
  }

  const WETH_ADDRESS = wethData.address;
  const USDT_ADDRESS = usdtData.address;
  const LENDING_POOL_ADDRESS = lendingPoolData.address;

  // Validate addresses
  if (!validateAddress(WETH_ADDRESS) || !validateAddress(USDT_ADDRESS) || !validateAddress(LENDING_POOL_ADDRESS)) {
    console.error("❌ ERROR: One or more addresses are invalid!");
    process.exit(1);
  }

  console.log(`✅ WETH:        ${WETH_ADDRESS}`);
  console.log(`✅ USDT:        ${USDT_ADDRESS}`);
  console.log(`✅ LendingPool: ${LENDING_POOL_ADDRESS}`);
  console.log(`✅ Tokens were minted (previous step completed)\n`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log(`📡 Network: ${network.name} (Chain ID: ${network.config.chainId})`);
  console.log(`👤 Deployer: ${deployerAddress}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  // Get lending pool contract instance
  const lendingPool = await ethers.getContractAt("MockLendingPool", LENDING_POOL_ADDRESS);

  // Register assets
  console.log("----------------------------------------------------");
  console.log("⏳ Registering assets in MockLendingPool...");

  const addWethTx = await lendingPool.addAsset(WETH_ADDRESS);
  await addWethTx.wait();
  console.log(`✅ WETH registered as lending asset`);
  console.log(`   Tx Hash: ${addWethTx.hash}`);

  const addUsdtTx = await lendingPool.addAsset(USDT_ADDRESS);
  await addUsdtTx.wait();
  console.log(`✅ USDT registered as lending asset`);
  console.log(`   Tx Hash: ${addUsdtTx.hash}`);
  console.log("----------------------------------------------------\n");

  // Save result to JSON
  const result = {
    completed: true,
    assetsRegistered: ["WETH", "USDT"],
    timestamp: new Date().toISOString(),
    txHashes: [addWethTx.hash, addUsdtTx.hash]
  };

  const resultFile = "step_7_init_register_assets_result.json";
  writeResult(resultFile, result);
  console.log(`💾 Result saved to: ${resultFile}\n`);

  console.log("====================================================");
  console.log("📋 SUMMARY");
  console.log("====================================================");
  console.log("✅ Lending Pool Assets:");
  console.log("   - WETH registered");
  console.log("   - USDT registered");
  console.log("====================================================\n");

  console.log("✅ Asset registration complete!");
  console.log("\n💡 Mock system initialization finished!");
  console.log("\n💡 Next step: npm run step:8 (deploy leverage account)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});