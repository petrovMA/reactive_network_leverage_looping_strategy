import { ethers } from "hardhat";
import { readResult, writeResult, getDeployerInfo, isValidAddress, getUserConfirmation, logHeader } from "./utils";

const REACT_FUNDING = "0.05"; // REACT for RSC subscriptions

async function main() {
  console.log("Deploying LoopingRSC on Reactive Network...\n");

  // Read Sepolia deployment data
  let accountData: any, wethData: any, usdtData: any;
  try {
    accountData = readResult("step_8_deploy_leverage_account_result.json");
    wethData = readResult("step_1_deploy_weth_result.json");
    usdtData = readResult("step_2_deploy_usdt_result.json");
  } catch {
    console.error("ERROR: Missing deployment files!");
    console.error("Please run step:8 first.\n");
    process.exit(1);
  }

  const LEVERAGE_ACCOUNT = accountData.address;
  const WETH = wethData.address;
  const USDT = usdtData.address;
  const EXPECTED_DEPLOYER = accountData.rscDeployer;

  if (!isValidAddress(LEVERAGE_ACCOUNT) || !isValidAddress(WETH) || !isValidAddress(USDT)) {
    console.error("ERROR: One or more addresses are invalid!");
    process.exit(1);
  }

  if (!isValidAddress(EXPECTED_DEPLOYER)) {
    console.error("ERROR: RSC Deployer not found in step_8 result!");
    process.exit(1);
  }

  const { address, balanceEth, network, chainId } = await getDeployerInfo();

  console.log(`Network: ${network} (Chain ID: ${chainId})`);
  console.log(`Deployer: ${address}`);
  console.log(`Expected: ${EXPECTED_DEPLOYER}`);
  console.log(`Balance: ${balanceEth} ETH\n`);

  // Verify deployer matches
  if (address.toLowerCase() !== EXPECTED_DEPLOYER.toLowerCase()) {
    logHeader("ERROR: DEPLOYER MISMATCH");
    console.log(`Current:  ${address}`);
    console.log(`Expected: ${EXPECTED_DEPLOYER}`);
    console.log("====================================================\n");
    console.log("Switch wallet or redeploy LeverageAccount.");
    process.exit(1);
  }

  console.log("Deployer verification: OK\n");

  const confirmed = await getUserConfirmation("Continue with deployment? (y/n): ");
  if (!confirmed) {
    console.log("\nDeployment cancelled.\n");
    process.exit(0);
  }

  console.log("\nDeploying...");

  const LoopingRSC = await ethers.getContractFactory("LoopingRSC");
  const rsc = await LoopingRSC.deploy(LEVERAGE_ACCOUNT, WETH, USDT, {
    value: ethers.parseEther(REACT_FUNDING)
  });
  await rsc.waitForDeployment();

  const rscAddress = await rsc.getAddress();
  const txHash = rsc.deploymentTransaction()?.hash || "";

  writeResult("step_9_deploy_reactive_result.json", {
    address: rscAddress,
    network,
    txHash,
    deployedAt: new Date().toISOString(),
    rscDeployer: address,
    ethBalance: REACT_FUNDING,
    leverageAccount: LEVERAGE_ACCOUNT,
    weth: WETH,
    usdt: USDT
  });

  logHeader("DEPLOYMENT COMPLETE");
  console.log(`LoopingRSC: ${rscAddress}`);
  console.log(`RSC Deployer: ${address}`);
  console.log(`REACT Funded: ${REACT_FUNDING}`);
  console.log(`Tx: ${txHash}`);
  console.log("");
  console.log("Sepolia contracts:");
  console.log(`  LeverageAccount: ${LEVERAGE_ACCOUNT}`);
  console.log(`  WETH: ${WETH}`);
  console.log(`  USDT: ${USDT}`);
  console.log("====================================================\n");

  console.log("RSC is ready to listen for events!");
  console.log("\nNext steps:");
  console.log("  1. npm run test:loop");
  console.log("  2. npm run check:position");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
