// scripts/resubscribe.ts
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Helper function to read deployment result from JSON
function readDeploymentResult(filePath: string): any {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileContent = fs.readFileSync(fullPath, "utf-8");
  return JSON.parse(fileContent);
}

async function main() {
    console.log("📖 Reading RSC deployment result...\n");

    let rscData: any;
    try {
        rscData = readDeploymentResult("deploy_reactive_result.json");
    } catch (error: any) {
        console.error("❌ ERROR: Missing deployment file!");
        console.error("   Please run deployment script first:");
        console.error("   npx hardhat run scripts/deploy_reactive.ts --network reactive\n");
        process.exit(1);
    }

    const RSC_ADDRESS = rscData.address;

    if (!RSC_ADDRESS) {
        console.error("❌ ERROR: No RSC address found in deployment result!");
        process.exit(1);
    }

    // Minimal ABI for resume functionality (from AbstractPausableReactive)
    // Note: owner and paused are internal variables - no public getters exist
    const RSC_ABI = [
        "function resume() external"
    ];

    const [signer] = await ethers.getSigners();
    const rsc = new ethers.Contract(RSC_ADDRESS, RSC_ABI, signer);

    console.log("▶️  Resuming RSC (resubscribing to events)...\n");
    console.log(`RSC Address: ${RSC_ADDRESS}`);
    console.log(`Signer Address: ${signer.address}\n`);

    try {
        // Call resume() directly - it will revert with "Unauthorized" if not owner
        // or "Not paused" if already resumed/active
        console.log("⏳ Calling resume() to resubscribe to events...");
        const tx = await rsc.resume();
        console.log(`   Transaction hash: ${tx.hash}`);

        console.log("⏳ Waiting for confirmation...");
        await tx.wait();

        console.log("\n====================================================");
        console.log("✅ RSC resumed successfully!");
        console.log("   All event subscriptions have been restored.");
        console.log("   The contract is now actively monitoring events.");
        console.log("====================================================");
    } catch (error: any) {
        console.log("\n❌ Failed to resume RSC:");
        if (error.reason) {
            console.log(`   Reason: ${error.reason}`);
        } else if (error.message?.includes("Unauthorized")) {
            console.log("   You are not the owner of this contract.");
        } else if (error.message?.includes("Not paused")) {
            console.log("   The contract is already active (not paused).");
        } else if (error.message) {
            console.log(`   ${error.message}`);
        } else {
            console.error(error);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});