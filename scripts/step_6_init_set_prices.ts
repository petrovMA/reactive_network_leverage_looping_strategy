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
  console.log("🔧 Phase 1: Setting Token Prices in MockRouter...\n");

  // Read deployment results
  console.log("📖 Reading deployment results...\n");

  let wethData: any;
  let usdtData: any;
  let routerData: any;

  try {
    wethData = readDeploymentResult("step_1_deploy_weth_result.json");
    usdtData = readDeploymentResult("step_2_deploy_usdt_result.json");
    routerData = readDeploymentResult("step_3_deploy_router_result.json");
  } catch (error: any) {
    console.error("❌ ERROR: Missing deployment files!");
    console.error("   Please run deployment scripts first:");
    console.error("   1. npm run step:1 (deploy WETH)");
    console.error("   2. npm run step:2 (deploy USDT)");
    console.error("   3. npm run step:3 (deploy router)\n");
    process.exit(1);
  }

  const WETH_ADDRESS = wethData.address;
  const USDT_ADDRESS = usdtData.address;
  const ROUTER_ADDRESS = routerData.address;

  // Validate addresses
  if (!validateAddress(WETH_ADDRESS) || !validateAddress(USDT_ADDRESS) || !validateAddress(ROUTER_ADDRESS)) {
    console.error("❌ ERROR: One or more addresses are invalid!");
    process.exit(1);
  }

  console.log(`✅ WETH:   ${WETH_ADDRESS}`);
  console.log(`✅ USDT:   ${USDT_ADDRESS}`);
  console.log(`✅ Router: ${ROUTER_ADDRESS}\n`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log(`📡 Network: ${network.name} (Chain ID: ${network.config.chainId})`);
  console.log(`👤 Deployer: ${deployerAddress}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  // Get router contract instance
  const router = await ethers.getContractAt("MockRouter", ROUTER_ADDRESS);

  // Set token prices
  console.log("----------------------------------------------------");
  console.log("⏳ Setting token prices in MockRouter...");

  const wethPrice = ethers.parseEther("3000"); // $3000 USD
  const usdtPrice = ethers.parseEther("1");    // $1 USD

  const setPriceWethTx = await router.setPrice(WETH_ADDRESS, wethPrice);
  await setPriceWethTx.wait();
  console.log(`✅ WETH price set to $3000`);
  console.log(`   Tx Hash: ${setPriceWethTx.hash}`);

  const setPriceUsdtTx = await router.setPrice(USDT_ADDRESS, usdtPrice);
  await setPriceUsdtTx.wait();
  console.log(`✅ USDT price set to $1`);
  console.log(`   Tx Hash: ${setPriceUsdtTx.hash}`);
  console.log("----------------------------------------------------\n");

  // Save result to JSON
  const result = {
    completed: true,
    wethPrice: "3000",
    usdtPrice: "1",
    timestamp: new Date().toISOString(),
    txHashes: [setPriceWethTx.hash, setPriceUsdtTx.hash]
  };

  const resultFile = "step_6_init_set_prices_result.json";
  writeResult(resultFile, result);
  console.log(`💾 Result saved to: ${resultFile}\n`);

  console.log("====================================================");
  console.log("📋 SUMMARY");
  console.log("====================================================");
  console.log("✅ Prices Set:");
  console.log("   - WETH: $3000");
  console.log("   - USDT: $1");
  console.log("====================================================\n");

  console.log("✅ Price setting complete!");
  console.log("\n💡 Next step: npm run step:7 (mint tokens)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});