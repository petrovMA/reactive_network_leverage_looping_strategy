import { ethers } from "hardhat";
import { readResult, writeResult, getDeployerInfo, isValidAddress, logHeader, log } from "./utils";

async function main() {
  console.log("Deploying MockLendingPool...\n");

  // Read router address
  let routerData: any;
  try {
    routerData = readResult("step_3_deploy_router_result.json");
  } catch {
    log.error("✗ ERROR: step_3_deploy_router_result.json not found!");
    console.error("Please run: npm run step:3\n");
    process.exit(1);
  }

  const ROUTER = routerData.address;
  if (!isValidAddress(ROUTER)) {
    log.error("✗ ERROR: Router address is invalid!");
    process.exit(1);
  }

  const { address, balanceEth, network, chainId } = await getDeployerInfo();
  console.log(`Network: ${network} (Chain ID: ${chainId})`);
  console.log(`Deployer: ${address}`);
  console.log(`Balance: ${balanceEth} ETH`);
  console.log(`Router: ${ROUTER}\n`);

  const MockLendingPool = await ethers.getContractFactory("MockLendingPool");
  const pool = await MockLendingPool.deploy(ROUTER);
  await pool.waitForDeployment();

  const poolAddress = await pool.getAddress();
  const txHash = pool.deploymentTransaction()?.hash || "";

  writeResult("step_4_deploy_lending_pool_result.json", {
    address: poolAddress,
    network,
    txHash,
    deployedAt: new Date().toISOString()
  });

  logHeader("DEPLOYMENT COMPLETE");
  console.log(`MockLendingPool: ${poolAddress}`);
  console.log(`Router: ${ROUTER}`);
  console.log(`Tx: ${txHash}`);
  console.log(`Etherscan: https://sepolia.etherscan.io/address/${poolAddress}`);
  console.log("====================================================\n");
  log.success("✓ MockLendingPool deployment complete!");
  console.log("Next: npm run step:5");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
