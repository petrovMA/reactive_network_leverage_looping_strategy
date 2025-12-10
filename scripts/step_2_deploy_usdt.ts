import { ethers } from "hardhat";
import { writeResult, getDeployerInfo, logHeader } from "./utils";

async function main() {
  console.log("Deploying USDT Token...\n");

  const { address, balanceEth, network, chainId } = await getDeployerInfo();
  console.log(`Network: ${network} (Chain ID: ${chainId})`);
  console.log(`Deployer: ${address}`);
  console.log(`Balance: ${balanceEth} ETH\n`);

  const MockToken = await ethers.getContractFactory("MockToken");
  const usdt = await MockToken.deploy("Tether USD", "USDT");
  await usdt.waitForDeployment();

  const usdtAddress = await usdt.getAddress();
  const txHash = usdt.deploymentTransaction()?.hash || "";

  writeResult("step_2_deploy_usdt_result.json", {
    address: usdtAddress,
    network,
    txHash,
    deployedAt: new Date().toISOString()
  });

  logHeader("DEPLOYMENT COMPLETE");
  console.log(`USDT: ${usdtAddress}`);
  console.log(`Tx: ${txHash}`);
  console.log(`Etherscan: https://sepolia.etherscan.io/address/${usdtAddress}`);
  console.log("====================================================\n");
  console.log("Next: npm run step:3");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
