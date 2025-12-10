import { ethers } from "hardhat";
import { readResult, writeResult, getDeployerInfo, isValidAddress, logHeader } from "./utils";

async function main() {
  console.log("Setting token prices in MockRouter...\n");

  // Read addresses
  let wethData: any, usdtData: any, routerData: any;
  try {
    wethData = readResult("step_1_deploy_weth_result.json");
    usdtData = readResult("step_2_deploy_usdt_result.json");
    routerData = readResult("step_3_deploy_router_result.json");
  } catch {
    console.error("ERROR: Missing deployment files!");
    console.error("Please run steps 1-3 first.\n");
    process.exit(1);
  }

  const WETH = wethData.address;
  const USDT = usdtData.address;
  const ROUTER = routerData.address;

  if (!isValidAddress(WETH) || !isValidAddress(USDT) || !isValidAddress(ROUTER)) {
    console.error("ERROR: One or more addresses are invalid!");
    process.exit(1);
  }

  const { address, balanceEth, network, chainId } = await getDeployerInfo();
  console.log(`Network: ${network} (Chain ID: ${chainId})`);
  console.log(`Deployer: ${address}`);
  console.log(`Balance: ${balanceEth} ETH\n`);

  const router = await ethers.getContractAt("MockRouter", ROUTER);

  // Set prices: WETH = $3000, USDT = $1
  const wethPrice = ethers.parseEther("3000");
  const usdtPrice = ethers.parseEther("1");

  console.log("Setting prices...");
  const tx1 = await router.setPrice(WETH, wethPrice);
  await tx1.wait();
  console.log(`WETH price set to $3000 (tx: ${tx1.hash})`);

  const tx2 = await router.setPrice(USDT, usdtPrice);
  await tx2.wait();
  console.log(`USDT price set to $1 (tx: ${tx2.hash})\n`);

  writeResult("step_5_init_set_prices_result.json", {
    completed: true,
    wethPrice: "3000",
    usdtPrice: "1",
    timestamp: new Date().toISOString(),
    txHashes: [tx1.hash, tx2.hash]
  });

  logHeader("PRICES SET");
  console.log("WETH: $3000");
  console.log("USDT: $1");
  console.log("====================================================\n");
  console.log("Next: npm run step:6");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
