# 🔄 Reactive Network: Automated Leverage Looping

![License](https://img.shields.io/badge/license-MIT-blue)
![Network](https://img.shields.io/badge/network-Sepolia%20%7C%20Reactive%20Lasna-blueviolet)
![Status](https://img.shields.io/badge/status-MVP%20Complete-green)

This project demonstrates a decentralized, automated **leverage looping strategy** orchestrated by **Reactive Network**. Instead of manually performing multiple `Borrow -> Swap -> Supply` transactions, a user performs a single deposit. The Reactive Smart Contract (RSC) detects this event and autonomously executes loops on the destination chain until a target Loan-To-Value (LTV) is reached.

## 🏗 Architecture

The system operates across two chains:

1.  **Origin Chain (Sepolia Testnet):**
    *   Holds the user's funds (`LeverageAccount`).
    *   Contains Mock DeFi protocols (`MockLendingPool`, `MockRouter`, `MockToken`) to simulate Aave/Uniswap behavior.
2.  **Reactive Network (Lasna Testnet):**
    *   Hosts the `LoopingRSC`.
    *   Listens for `Deposited` events on Sepolia.
    *   Calculates leverage logic and emits callbacks to execute the loop steps on Sepolia.

---

## 🛠 Prerequisites & Setup

### 1. Configuration
Create a `.env` file in the root directory based on `.env.example`:

```env
# Network RPCs
SEPOLIA_RPC_URL=https://rpc.sepolia.org
REACTIVE_RPC_URL=https://client.reactive.network/

# Private Keys (Must have funds on respective testnets)
PRIVATE_KEY_SEPOLIA=your_sepolia_private_key
PRIVATE_KEY_REACTIVE=your_reactive_private_key

# Optional
ETHERSCAN_API_KEY=your_etherscan_key
```

### 2. Installation
Install dependencies and compile contracts:

```bash
npm install
npx hardhat compile
```

---

## 🚀 Deployment Log & Contract Verification

Below is the verified deployment sequence. This system consists of Mock DeFi infrastructure on Sepolia and the Logic Controller on Reactive Network.

### Phase 1: Origin Chain (Sepolia) Infrastructure

| Step | Component | Contract Source | Transaction Hash (Sepolia Etherscan) | Description |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **WETH Token** | [`MockToken.sol`](./contracts/mock/MockToken.sol) | [0x33a3...12b7b6b](https://sepolia.etherscan.io/tx/0x33a34739e231efbf5a93fc8c95f44512ab6e12b7b6b6490b7c7b7b9859f06739) | Deployed WETH Mock ERC20 |
| **2** | **USDT Token** | [`MockToken.sol`](./contracts/mock/MockToken.sol) | [0x2ec8...45b31](https://sepolia.etherscan.io/tx/0x2ec829886dd77abaf25f1ed72e3d4e12340a7e94987aee1af730769aafa45b31) | Deployed USDT Mock ERC20 |
| **3** | **Mock Router** | [`MockRouter.sol`](./contracts/mock/MockRouter.sol) | [0x6d17...ea86c3](https://sepolia.etherscan.io/tx/0x6d17c36ecfa732479f8ff11de3859f97409be353bf28b633e1c2992d36ea86c3) | Simulates Uniswap Swap/Liquidity |
| **4** | **Lending Pool** | [`MockLendingPool.sol`](./contracts/mock/MockLendingPool.sol) | [0xb8ad...9c2f35](https://sepolia.etherscan.io/tx/0xb8ad8d9e03aca8bad9f734b4b6971311d7b5a74329dc01d31a2ed6a8aa9c2f35) | Simulates Aave Supply/Borrow |
| **5** | **Oracle Setup** | N/A (Script) | [0x3de9...82536](https://sepolia.etherscan.io/tx/0x3de94f06a4cdb71c6e4c3c4cdbe759bfbaef18b745e65aaec7af119dfee82536) | Set Oracle Prices: WETH=$3000, USDT=$1 |
| **6** | **Minting** | N/A (Script) | [0x9f8f...4a83a7](https://sepolia.etherscan.io/tx/0x9f8f676fb82906ffc1cd6d6e7ca1a14baeb737c47bec5f3aab95c321864a83a7) | Minted initial liquidity for test account |
| **7** | **Pool Config** | N/A (Script) | [0xc4bf...22c7c39](https://sepolia.etherscan.io/tx/0xc4bfcf11ce05a8de5ba8d181960ca86ee540359f17379a01cfc798fc122c7c39) | Registered WETH/USDT in Lending Pool |
| **8** | **User Vault** | [`LeverageAccount.sol`](./contracts/reactive-lib/LeverageAccount.sol) | [0xe6d5...156e2d](https://sepolia.etherscan.io/tx/0xe6d57a784b1fed482fbd640ff089ee2f90617d5a247f8ad1016bf93bf7156e2d) | Deployed Smart Account for Strategy |

### Phase 2: Reactive Network (Lasna) Controller

| Step | Component | Contract Source | Transaction Hash (Reactscan) | Description |
| :--- | :--- | :--- | :--- | :--- |
| **9** | **Looping RSC** | [`LoopingRSC.sol`](./contracts/reactive-lib/LoopingRSC.sol) | [0xc492...68f6f600](https://lasna.reactscan.net/tx/0xc49211b3c8858915f5372d0269ebba76130f86952ad661890229cad668f6f600) | Deployed logic controller on Reactive Network |

---

## 🧪 Live Execution Trace

The system was tested using the `npm run test:loop` script. Below is the trace of the Reactive Network detecting the event and driving the leverage loop on Sepolia.

| Event Type | Network | Explorer Link / Proof | Status |
| :--- | :--- | :--- | :--- |
| **Initial Deposit** | Sepolia | [Contract Events](https://sepolia.etherscan.io/address/0x62a539b6a13c0abc8a7f62218e56b68db8a4b570#events) | ✅ Detected |
| **RSC Reaction** | Reactive | [Tx #342 (Deposit Callback)](https://lasna.reactscan.net/address/0x537b27d03a24157c5fe2b0915b00df73c80c5643/342) | ✅ Callback Sent |
| **Loop Step 1** | Reactive | [Tx #343 (Iteration 1)](https://lasna.reactscan.net/address/0x537b27d03a24157c5fe2b0915b00df73c80c5643/343) | ✅ Callback Sent |
| **Loop Step 2** | Reactive | [Tx #344 (Iteration 2)](https://lasna.reactscan.net/address/0x537b27d03a24157c5fe2b0915b00df73c80c5643/344) | ✅ Callback Sent |
| **Target Reached**| Reactive | [Tx #345 (Stop Signal)](https://lasna.reactscan.net/address/0x537b27d03a24157c5fe2b0915b00df73c80c5643/345) | 🛑 Loop Ended |

---

## 💻 Frontend (Work in Progress)

🚧 **The UI is currently under active development.**

The frontend will provide a "Cyberpunk/Terminal" style dashboard (see [`frontend`](./frontend) directory) to visualize:
*   Real-time LTV monitoring via Reactive events.
*   Timeline of the looping process.
*   One-click "Zap" deposits.