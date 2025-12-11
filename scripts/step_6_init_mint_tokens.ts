import { ethers } from "hardhat";
import { readResult, writeResult, getDeployerInfo, isValidAddress, logHeader, log } from "./utils";

async function main() {
  console.log("Minting initial token supplies...\n");

  // Read addresses
  let wethData: any, usdtData: any, pricesData: any;
  try {
    wethData = readResult("step_1_deploy_weth_result.json");
    usdtData = readResult("step_2_deploy_usdt_result.json");
    pricesData = readResult("step_5_init_set_prices_result.json");
  } catch {
    log.error("✗ ERROR: Missing required files!");
    console.error("Please run steps 1, 2, and 5 first.\n");
    process.exit(1);
  }

  if (!pricesData.completed) {
    log.error("✗ ERROR: Price setting not completed!");
    process.exit(1);
  }

  const WETH = wethData.address;
  const USDT = usdtData.address;

  if (!isValidAddress(WETH) || !isValidAddress(USDT)) {
    log.error("✗ ERROR: Token addresses are invalid!");
    process.exit(1);
  }

  const { address, balanceEth, network, chainId } = await getDeployerInfo();
  console.log(`Network: ${network} (Chain ID: ${chainId})`);
  console.log(`Deployer: ${address}`);
  console.log(`Balance: ${balanceEth} ETH\n`);

  const weth = await ethers.getContractAt("MockToken", WETH);
  const usdt = await ethers.getContractAt("MockToken", USDT);

  // Mint: 1000 WETH, 100000 USDT
  const wethAmount = ethers.parseEther("1000");
  const usdtAmount = ethers.parseEther("100000");

  console.log("Minting tokens...");
  const tx1 = await weth.mint(address, wethAmount);
  await tx1.wait();
  log.success("✓ Minted 1000 WETH");
  console.log(`   Tx: ${tx1.hash}`);

  const tx2 = await usdt.mint(address, usdtAmount);
  await tx2.wait();
  log.success("✓ Minted 100,000 USDT");
  console.log(`   Tx: ${tx2.hash}\n`);

  writeResult("step_6_init_mint_tokens_result.json", {
    completed: true,
    wethMinted: "1000",
    usdtMinted: "100000",
    recipient: address,
    timestamp: new Date().toISOString(),
    txHashes: [tx1.hash, tx2.hash]
  });

  logHeader("TOKENS MINTED");
  console.log(`Recipient: ${address}`);
  console.log("WETH: 1000");
  console.log("USDT: 100,000");
  console.log("====================================================\n");
  log.success("✓ Token minting complete!");
  console.log("Next: npm run step:7");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
