import { ethers } from "hardhat";
import { readResult, writeResult, getDeployerInfo, isValidAddress, logHeader } from "./utils";

const ETH_FUNDING = "0.01"; // ETH for callback payments

async function main() {
  console.log("Deploying LeverageAccount...\n");

  // Read addresses
  let poolData: any, routerData: any;
  try {
    poolData = readResult("step_4_deploy_lending_pool_result.json");
    routerData = readResult("step_3_deploy_router_result.json");
  } catch {
    console.error("ERROR: Missing deployment files!");
    console.error("Please run steps 3 and 4 first.\n");
    process.exit(1);
  }

  const POOL = poolData.address;
  const ROUTER = routerData.address;

  if (!isValidAddress(POOL) || !isValidAddress(ROUTER)) {
    console.error("ERROR: Pool or Router address is invalid!");
    process.exit(1);
  }

  // Sepolia Callback Proxy (from Reactive Network docs)
  const CALLBACK_PROXY = "0xc9f36411C9897e7F959D99ffca2a0Ba7ee0D7bDA";

  const [deployer, rscDeployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const rscDeployerAddress = await rscDeployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`Deployer: ${deployerAddress}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  console.log(`RSC Deployer: ${rscDeployerAddress}`);
  console.log(`Pool: ${POOL}`);
  console.log(`Router: ${ROUTER}`);
  console.log(`Callback Proxy: ${CALLBACK_PROXY}\n`);

  const LeverageAccount = await ethers.getContractFactory("LeverageAccount");
  const account = await LeverageAccount.deploy(
    POOL,
    ROUTER,
    CALLBACK_PROXY,
    rscDeployerAddress,
    { value: ethers.parseEther(ETH_FUNDING) }
  );
  await account.waitForDeployment();

  const accountAddress = await account.getAddress();
  const txHash = account.deploymentTransaction()?.hash || "";

  writeResult("step_8_deploy_leverage_account_result.json", {
    address: accountAddress,
    network: (await ethers.provider.getNetwork()).name,
    txHash,
    deployedAt: new Date().toISOString(),
    ethBalance: ETH_FUNDING,
    rscDeployer: rscDeployerAddress
  });

  logHeader("DEPLOYMENT COMPLETE");
  console.log(`LeverageAccount: ${accountAddress}`);
  console.log(`Pool: ${POOL}`);
  console.log(`Router: ${ROUTER}`);
  console.log(`Callback Proxy: ${CALLBACK_PROXY}`);
  console.log(`RSC Deployer: ${rscDeployerAddress}`);
  console.log(`ETH Funded: ${ETH_FUNDING}`);
  console.log(`Tx: ${txHash}`);
  console.log(`Etherscan: https://sepolia.etherscan.io/address/${accountAddress}`);
  console.log("====================================================\n");

  console.log("IMPORTANT: RSC Deployer address must match when deploying RSC!");
  console.log(`RSC Deployer: ${rscDeployerAddress}\n`);
  console.log("Next: npm run step:9");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
