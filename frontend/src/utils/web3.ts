// Import shared contract addresses from config
import {
  MOCK_ROUTER_ADDRESS,
  MOCK_LENDING_POOL_ADDRESS,
  TOKEN_WETH,
  TOKEN_USDT,
  TOKENS_LIST,
  NETWORKS
} from '../../config/contracts.config';

// Mock Router Contract ABI (only the functions we need)
export const MOCK_ROUTER_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactTokensForTokens",
    outputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "prices",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

// Mock Token Contract ABI
export const MOCK_TOKEN_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "nonces",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "permit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// Mock Lending Pool Contract ABI
export const MOCK_LENDING_POOL_ABI = [
  {
    inputs: [
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "supply",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "borrow",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserAccountData",
    outputs: [
      { internalType: "uint256", name: "totalCollateralUSD", type: "uint256" },
      { internalType: "uint256", name: "totalDebtUSD", type: "uint256" },
      { internalType: "uint256", name: "ltv", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
    ],
    name: "supplies",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
    ],
    name: "borrowings",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "addAsset",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// Re-export shared contract addresses from config for convenience
export {
  MOCK_ROUTER_ADDRESS,
  MOCK_LENDING_POOL_ADDRESS,
  TOKEN_WETH,
  TOKEN_USDT,
  TOKENS_LIST
};

// Legacy export for backward compatibility - now using real addresses from config
export const TOKEN_ADDRESSES = {
  WETH: TOKEN_WETH.address,
  USDT: TOKEN_USDT.address
};

// Default deployed addresses for testing (from scripts)
// These are user-specific contracts
export const DEFAULT_LEVERAGE_ACCOUNT = "0x23c660d225a8136bECA75629D6EB23e188069a2E";
export const DEFAULT_LOOPING_RSC = "0x05101183b0d0a96AA379663aa2d7f7bB303e6240";

// Helper function to format token amounts (18 decimals)
export const parseTokenAmount = (amount: string): bigint => {
  const [whole, decimal = ""] = amount.split(".");
  const paddedDecimal = decimal.padEnd(18, "0").slice(0, 18);
  return BigInt(whole + paddedDecimal);
};

// Helper function to format from wei to readable amount
export const formatTokenAmount = (amount: bigint, decimals: number = 18): string => {
  const amountStr = amount.toString().padStart(decimals + 1, "0");
  const whole = amountStr.slice(0, -decimals) || "0";
  const decimal = amountStr.slice(-decimals);
  return `${whole}.${decimal}`.replace(/\.?0+$/, "");
};

// Leverage Account Contract ABI
export const LEVERAGE_ACCOUNT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "depositWithPermit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "borrowAsset", type: "address" },
      { internalType: "address", name: "collateralAsset", type: "address" },
      { internalType: "uint256", name: "amountToBorrow", type: "uint256" },
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "uint256", name: "iterationId", type: "uint256" },
    ],
    name: "executeLeverageStep",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getStatus",
    outputs: [
      { internalType: "uint256", name: "coll", type: "uint256" },
      { internalType: "uint256", name: "debt", type: "uint256" },
      { internalType: "uint256", name: "ltv", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_rscCaller", type: "address" }],
    name: "setRSCCaller",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "rscCaller",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "currentLTV", type: "uint256" },
    ],
    name: "Deposited",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "borrowed", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newCollateral", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "currentLTV", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "iterationId", type: "uint256" },
    ],
    name: "LoopStepExecuted",
    type: "event",
  },
];

export const LEVERAGE_ACCOUNT_ADDRESS = "0x0000000000000000000000000000000000000000";

// Updated Mock Lending Pool ABI with repay and withdraw
export const MOCK_LENDING_POOL_EXTENDED_ABI = [
  ...MOCK_LENDING_POOL_ABI,
  {
    inputs: [
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "repay",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// Web3 Wallet Connection
export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const connectWallet = async (): Promise<WalletState> => {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed. Please install MetaMask to use this dApp.");
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const chainId = await window.ethereum.request({ method: "eth_chainId" });

    return {
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      isConnected: true,
    };
  } catch (error: any) {
    throw new Error(error.message || "Failed to connect wallet");
  }
};

export const getWalletState = async (): Promise<WalletState> => {
  if (typeof window.ethereum === "undefined") {
    return { address: null, chainId: null, isConnected: false };
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    const chainId = await window.ethereum.request({ method: "eth_chainId" });

    return {
      address: accounts[0] || null,
      chainId: parseInt(chainId, 16),
      isConnected: accounts.length > 0,
    };
  } catch (error) {
    return { address: null, chainId: null, isConnected: false };
  }
};

export const disconnectWallet = (): WalletState => {
  return { address: null, chainId: null, isConnected: false };
};

// Network switching helpers
export const switchToSepolia = async (): Promise<boolean> => {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed");
  }

  try {
    // Try to switch to Sepolia
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: NETWORKS.SEPOLIA.chainId }],
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: NETWORKS.SEPOLIA.chainId,
              chainName: NETWORKS.SEPOLIA.chainName,
              nativeCurrency: NETWORKS.SEPOLIA.nativeCurrency,
              rpcUrls: NETWORKS.SEPOLIA.rpcUrls,
              blockExplorerUrls: NETWORKS.SEPOLIA.blockExplorerUrls,
            },
          ],
        });
        return true;
      } catch (addError) {
        throw new Error("Failed to add Sepolia network");
      }
    }
    throw switchError;
  }
};

export const switchToReactiveLasna = async (): Promise<boolean> => {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed");
  }

  try {
    // Try to switch to Reactive Lasna
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: NETWORKS.REACTIVE_LASNA.chainId }],
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: NETWORKS.REACTIVE_LASNA.chainId,
              chainName: NETWORKS.REACTIVE_LASNA.chainName,
              nativeCurrency: NETWORKS.REACTIVE_LASNA.nativeCurrency,
              rpcUrls: NETWORKS.REACTIVE_LASNA.rpcUrls,
              blockExplorerUrls: NETWORKS.REACTIVE_LASNA.blockExplorerUrls,
            },
          ],
        });
        return true;
      } catch (addError) {
        throw new Error("Failed to add Reactive Lasna network");
      }
    }
    throw switchError;
  }
};

export const ensureSepoliaNetwork = async (): Promise<void> => {
  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  const currentChainId = parseInt(chainId, 16);

  if (currentChainId !== NETWORKS.SEPOLIA.chainIdDecimal) {
    await switchToSepolia();
  }
};
