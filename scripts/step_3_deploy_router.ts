import { ethers } from "hardhat";
import { writeResult, getDeployerInfo, logHeader, log } from "./utils";

async function main() {
  console.log("Deploying MockRouter...\n");

  const { address, balanceEth, network, chainId } = await getDeployerInfo();
  console.log(`Network: ${network} (Chain ID: ${chainId})`);
  console.log(`Deployer: ${address}`);
  console.log(`Balance: ${balanceEth} ETH\n`);

  const MockRouter = await ethers.getContractFactory("MockRouter");
  const router = await MockRouter.deploy();
  await router.waitForDeployment();

  const routerAddress = await router.getAddress();
  const txHash = router.deploymentTransaction()?.hash || "";

  writeResult("step_3_deploy_router_result.json", {
    address: routerAddress,
    network,
    txHash,
    deployedAt: new Date().toISOString()
  });

  logHeader("DEPLOYMENT COMPLETE");
  console.log(`MockRouter: ${routerAddress}`);
  console.log(`Tx: ${txHash}`);
  console.log(`Etherscan: https://sepolia.etherscan.io/address/${routerAddress}`);
  console.log("====================================================\n");
  log.success("✓ MockRouter deployment complete!");
  console.log("Next: npm run step:4");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
