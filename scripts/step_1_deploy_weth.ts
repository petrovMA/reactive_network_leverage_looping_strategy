import { ethers } from "hardhat";
import { writeResult, getDeployerInfo, logHeader } from "./utils";

async function main() {
  console.log("Deploying WETH Token...\n");

  const { address, balanceEth, network, chainId } = await getDeployerInfo();
  console.log(`Network: ${network} (Chain ID: ${chainId})`);
  console.log(`Deployer: ${address}`);
  console.log(`Balance: ${balanceEth} ETH\n`);

  const MockToken = await ethers.getContractFactory("MockToken");
  const weth = await MockToken.deploy("Wrapped Ether", "WETH");
  await weth.waitForDeployment();

  const wethAddress = await weth.getAddress();
  const txHash = weth.deploymentTransaction()?.hash || "";

  writeResult("step_1_deploy_weth_result.json", {
    address: wethAddress,
    network,
    txHash,
    deployedAt: new Date().toISOString()
  });

  logHeader("DEPLOYMENT COMPLETE");
  console.log(`WETH: ${wethAddress}`);
  console.log(`Tx: ${txHash}`);
  console.log(`Etherscan: https://sepolia.etherscan.io/address/${wethAddress}`);
  console.log("====================================================\n");
  console.log("Next: npm run step:2");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
