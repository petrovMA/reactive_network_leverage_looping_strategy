import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const SCRIPTS_DIR = __dirname;

export function readResult(fileName: string): any {
  const fullPath = path.join(SCRIPTS_DIR, fileName);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fileName}`);
  }
  return JSON.parse(fs.readFileSync(fullPath, "utf-8"));
}

export function writeResult(fileName: string, data: any): void {
  const fullPath = path.join(SCRIPTS_DIR, fileName);
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), "utf-8");
}

export function isValidAddress(address: string): boolean {
  return !!address && address !== "0x0000000000000000000000000000000000000000";
}

export async function getDeployerInfo() {
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(address);
  return {
    deployer,
    address,
    balance,
    balanceEth: ethers.formatEther(balance),
    network: network.name,
    chainId: network.config.chainId
  };
}

export async function getUserConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

export function logHeader(title: string): void {
  console.log("====================================================");
  console.log(title);
  console.log("====================================================");
}

export function logSection(title: string): void {
  console.log("----------------------------------------------------");
  console.log(title);
  console.log("----------------------------------------------------");
}
