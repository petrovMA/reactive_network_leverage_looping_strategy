import { ethers } from "hardhat";
import { readResult, writeResult, getDeployerInfo, isValidAddress, logHeader } from "./utils";

async function main() {
  console.log("Registering assets in MockLendingPool...\n");

  // Read addresses
  let wethData: any, usdtData: any, poolData: any, mintData: any;
  try {
    wethData = readResult("step_1_deploy_weth_result.json");
    usdtData = readResult("step_2_deploy_usdt_result.json");
    poolData = readResult("step_4_deploy_lending_pool_result.json");
    mintData = readResult("step_6_init_mint_tokens_result.json");
  } catch {
    console.error("ERROR: Missing required files!");
    console.error("Please run steps 1, 2, 4, and 6 first.\n");
    process.exit(1);
  }

  if (!mintData.completed) {
    console.error("ERROR: Token minting not completed!");
    process.exit(1);
  }

  const WETH = wethData.address;
  const USDT = usdtData.address;
  const POOL = poolData.address;

  if (!isValidAddress(WETH) || !isValidAddress(USDT) || !isValidAddress(POOL)) {
    console.error("ERROR: One or more addresses are invalid!");
    process.exit(1);
  }

  const { address, balanceEth, network, chainId } = await getDeployerInfo();
  console.log(`Network: ${network} (Chain ID: ${chainId})`);
  console.log(`Deployer: ${address}`);
  console.log(`Balance: ${balanceEth} ETH\n`);

  const pool = await ethers.getContractAt("MockLendingPool", POOL);

  console.log("Registering assets...");
  const tx1 = await pool.addAsset(WETH);
  await tx1.wait();
  console.log(`WETH registered (tx: ${tx1.hash})`);

  const tx2 = await pool.addAsset(USDT);
  await tx2.wait();
  console.log(`USDT registered (tx: ${tx2.hash})\n`);

  writeResult("step_7_init_register_assets_result.json", {
    completed: true,
    assetsRegistered: ["WETH", "USDT"],
    timestamp: new Date().toISOString(),
    txHashes: [tx1.hash, tx2.hash]
  });

  logHeader("ASSETS REGISTERED");
  console.log("WETH: registered");
  console.log("USDT: registered");
  console.log("====================================================\n");
  console.log("Next: npm run step:8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
