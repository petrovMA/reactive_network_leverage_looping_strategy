import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

// Проверка наличия ключа, чтобы не упасть с непонятной ошибкой
if (!process.env.PRIVATE_KEY) {
    console.warn("⚠️ WARNING: PRIVATE_KEY not found in .env file. Deployments will fail.");
}

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const PRIVATE_KEY_SEPOLIA = process.env.PRIVATE_KEY_SEPOLIA || "0x0000000000000000000000000000000000000000000000000000000000000000";
const PRIVATE_KEY_REACTIVE = process.env.PRIVATE_KEY_REACTIVE || "0x0000000000000000000000000000000000000000000000000000000000000000";

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.20", // Используем свежую версию Solidity
        settings: {
            optimizer: {
                enabled: true,
                runs: 200, // Оптимизация газа
            },
            viaIR: true, // Включаем Intermediate Representation (полезно для кросс-чейн сообщений)
        },
    },
    networks: {
        hardhat: {
            chainId: 31337,
        },
        // 1. ORIGIN CHAIN (Откуда берем цену)
        // Используем Sepolia, так как там есть Chainlink
        sepolia: {
            url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia.gateway.tatum.io",
            accounts: [
                PRIVATE_KEY_SEPOLIA,
                PRIVATE_KEY_REACTIVE
            ],
            chainId: 11155111,
        },
        // 2. REACTIVE NETWORK (Где живет логика слушателя)
        reactive: {
            url: process.env.REACTIVE_RPC_URL || "https://lasna-rpc.rnk.dev",
            accounts: [PRIVATE_KEY_REACTIVE],
            chainId: 5318007,
        },
        // 3. DESTINATION CHAIN (Куда доставляем цену)
        // Используем Avalanche Fuji как дешевую и быструю тестовую сеть
        destination: {
            url: process.env.DESTINATION_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
            accounts: [PRIVATE_KEY],
            chainId: 43113,
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
    etherscan: {
        // Your API key for Etherscan
        // Obtain one at https://etherscan.io/
        apiKey: process.env.ETHERSCAN_API_KEY || "your-etherscan-api-key-here",
    },
};

export default config;