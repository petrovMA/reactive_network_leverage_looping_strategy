import {ethers, run} from "hardhat";
import {log, readResult} from "./utils";

async function main() {
    const [deployer, rscDeployer] = await ethers.getSigners();

    console.log("📖 Reading deployment results...\n");

    let leverageAccountData: any;

    try {
        leverageAccountData = readResult("step_8_deploy_leverage_account_result.json");
    } catch (error: any) {
        console.error("❌ ERROR: Missing deployment files!");
        console.error("   Please run deployment scripts first:");
        console.error("   - npm run step:1");
        console.error("   - npm run step:8\n");
        process.exit(1);
    }

    // Read addresses
    let poolData: any;
    let routerData: any;
    try {
        poolData = readResult("step_4_deploy_lending_pool_result.json");
        routerData = readResult("step_3_deploy_router_result.json");
    } catch {
        log.error("✗ ERROR: Missing deployment files!");
        console.error("Please run steps 3 and 4 first.\n");
        process.exit(1);
    }

    const POOL = poolData.address;
    const ROUTER = routerData.address;
    // Sepolia Callback Proxy (from Reactive Network docs)
    const CALLBACK_PROXY = "0xc9f36411C9897e7F959D99ffca2a0Ba7ee0D7bDA";
    const rscDeployerAddress = await rscDeployer.getAddress();

    console.log("Verifying contract...");

    try {
        await run("verify:verify", {
            address: leverageAccountData.address,
            constructorArguments: [
                POOL,
                ROUTER,
                CALLBACK_PROXY,
                rscDeployerAddress,
            ],
        });
    } catch (e: any) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!");
        } else {
            console.error(e);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });