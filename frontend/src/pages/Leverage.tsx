import { useState, useCallback, useEffect } from 'react';
import { Layout } from '@/components/reactive-loop/Layout';
import { ControlPanel } from '@/components/reactive-loop/ControlPanel';
import { MetricsDashboard } from '@/components/reactive-loop/MetricsDashboard';
import { ActivityLog, StepData } from '@/components/reactive-loop/ActivityLog';
import { SetupPanel } from '@/components/reactive-loop/SetupPanel';
import { Button } from '@/components/ui/button';
import {
  connectWallet,
  getWalletState,
  WalletState,
  LEVERAGE_ACCOUNT_ABI,
  MOCK_TOKEN_ABI,
  parseTokenAmount,
  formatTokenAmount,
  DEFAULT_LEVERAGE_ACCOUNT,
  DEFAULT_LOOPING_RSC,
  ensureSepoliaNetwork
} from '@/utils/web3';
import { TOKEN_WETH } from '../../config/contracts.config';
import { ethers, Contract, BrowserProvider } from 'ethers';
import { Loader2, Wallet } from 'lucide-react';

const Leverage = () => {
  // --- State ---
  const [wallet, setWallet] = useState<WalletState>({ address: null, chainId: null, isConnected: false });
  const [isConnecting, setIsConnecting] = useState(false);

  // Contracts
  const [leverageAccountAddr, setLeverageAccountAddr] = useState<string>('');
  const [loopingRSCAddr, setLoopingRSCAddr] = useState<string>('');

  // App State
  const [walletBalance, setWalletBalance] = useState("0");
  const [isLooping, setIsLooping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Metrics State
  const [currentLTV, setCurrentLTV] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [totalCollateral, setTotalCollateral] = useState(0);
  const [leverage, setLeverage] = useState(1.0);

  // Activity Log State
  const [logs, setLogs] = useState<StepData[]>([]);

  // --- Effects ---

  // 1. Connect Buffer
  useEffect(() => {
    const init = async () => {
      const state = await getWalletState();
      setWallet(state);
    };
    init();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          window.location.reload(); // Simple reload for now
        } else {
          setWallet({ address: null, chainId: null, isConnected: false });
        }
      });
    }
  }, []);

  // 2. Load Defaults / Data
  useEffect(() => {
    // For demo purposes, we can pre-fill or use defaults if user hasn't set them
    // In a real app, we'd check local storage or a registry
    // Here we start with empty to show SetupPanel, unless we want to be helpful
    // setLeverageAccountAddr(DEFAULT_LEVERAGE_ACCOUNT);
    // setLoopingRSCAddr(DEFAULT_LOOPING_RSC);
  }, []);

  // 3. Poll Data & Listen Events
  useEffect(() => {
    if (!wallet.isConnected || !wallet.address || !leverageAccountAddr) return;

    const fetchData = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const levPayload = new Contract(leverageAccountAddr, LEVERAGE_ACCOUNT_ABI, provider); // Read-only

        // Get Status
        try {
          const status = await levPayload.getStatus();
          // status: [coll, debt, ltv]
          // debt and coll are in USD (base 8 usually in Aave, but here in Mock it might be wei?)
          // MockLendingPool: getUserAccountData returns (totalCollateralUSD, totalDebtUSD, ltv)
          // Let's assume 18 decimals for simplicity in Mock or check logic.
          // Im mock: prices are usually fixed.

          // For display, we might need to convert.
          // If mock returns raw amounts and price is mock, let's treat them as units.
          const collVal = parseFloat(ethers.formatEther(status[0]));
          const debtVal = parseFloat(ethers.formatEther(status[1]));
          const ltvVal = Number(status[2]) / 100; // Basis points 10000 = 100%

          setTotalCollateral(collVal);
          setTotalDebt(debtVal);
          setCurrentLTV(ltvVal);

          // Calculate Leverage: Collateral / (Collateral - Debt)
          // Equity = Cols - Debt
          const equity = collVal - debtVal;
          if (equity > 0) {
            setLeverage(collVal / equity);
          } else {
            setLeverage(1.0);
          }

        } catch (e) {
          console.error("Error fetching status", e);
        }

        // Get Wallet Balance (WETH)
        // Actually user deposits WETH. Wallet balance usually refers to ETH for gas or WETH?
        // UI says "Asset Amount (ETH)". Code uses WETH token.
        // Let's show Native ETH balance or WETH balance?
        // Usually users pay in ETH and we wrap, or they pay in WETH.
        // LeverageAccount.deposit takes WETH address.
        // Let's fetch WETH balance.
        const weth = new Contract(TOKEN_WETH.address, MOCK_TOKEN_ABI, signer);
        const bal = await weth.balanceOf(wallet.address);
        setWalletBalance(ethers.formatEther(bal));

      } catch (e) {
        console.error(e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    // Event Listeners
    const provider = new ethers.BrowserProvider(window.ethereum);
    const levContract = new Contract(leverageAccountAddr, LEVERAGE_ACCOUNT_ABI, provider);

    const handleDeposited = (user: string, amount: bigint, ltv: bigint, event: any) => {
      if (user.toLowerCase() !== wallet.address?.toLowerCase()) return;

      // Format amount to readable ETH value
      const amountEth = parseFloat(ethers.formatEther(amount)).toFixed(4);

      setLogs(prev => [...prev, {
        id: Date.now(),
        type: 'DEPOSIT',
        status: 'success',
        timestamp: new Date().toLocaleTimeString(),
        txHash: event.log.transactionHash,
        amount: amountEth
      }]);

      // Add waiting log
      setLogs(prev => [...prev, {
        id: Date.now() + 1,
        type: 'WAITING',
        status: 'pending',
        timestamp: new Date().toLocaleTimeString()
      }]);
    };

    const handleLoop = (borrowed: bigint, newCollateral: bigint, currentLTV: bigint, iterationId: bigint, event: any) => {
      // Remove waiting
      setLogs(prev => prev.filter(l => l.type !== 'WAITING'));

      const ltvNum = Number(currentLTV);

      setLogs(prev => [...prev, {
        id: Date.now(),
        type: 'LOOP_STEP',
        status: 'success',
        timestamp: new Date().toLocaleTimeString(),
        txHash: event.log.transactionHash,
        details: {
          borrowed: `+${parseFloat(ethers.formatEther(borrowed)).toFixed(2)} USDT`,
          swapped: `Swapped for WETH`,
          supplied: `+${parseFloat(ethers.formatEther(newCollateral)).toFixed(4)} WETH`,
          newLTV: ltvNum / 100
        }
      }]);

      // Check termination conditions (from LoopingRSC)
      // TARGET_LTV = 7500 (75%), MAX_ITERATIONS = 3
      if (iterationId >= 3 || ltvNum >= 7500) {
        setIsLooping(false);
      }
    };

    const handleClosed = (debt: bigint, collateral: bigint, event: any) => {
      setLogs(prev => [...prev, {
        id: Date.now(),
        type: 'CLOSE',
        status: 'success',
        timestamp: new Date().toLocaleTimeString(),
        txHash: event.log.transactionHash,
        details: {
          borrowed: `Repaid ${parseFloat(ethers.formatEther(debt)).toFixed(2)}`,
          swapped: `Returned ${parseFloat(ethers.formatEther(collateral)).toFixed(4)}`,
          supplied: "Position Closed",
          newLTV: 0
        }
      }]);
      setIsLooping(false);
    };

    levContract.on("Deposited", handleDeposited);
    levContract.on("LoopStepExecuted", handleLoop);
    levContract.on("PositionClosed", handleClosed);

    return () => {
      clearInterval(interval);
      levContract.removeAllListeners();
    };

  }, [wallet, leverageAccountAddr]);


  // --- Actions ---
  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const state = await connectWallet();
      setWallet(state);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleInitiate = useCallback(async (amount: string) => {
    if (!wallet.isConnected || !wallet.address || !leverageAccountAddr) return;
    setError(null);
    setIsLooping(true);

    try {
      // Ensure we're on Sepolia network for all DeFi operations
      await ensureSepoliaNetwork();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const weth = new Contract(TOKEN_WETH.address, MOCK_TOKEN_ABI, provider);
      const leverageAcc = new Contract(leverageAccountAddr, LEVERAGE_ACCOUNT_ABI, signer);

      const amountWei = parseTokenAmount(amount);

      // Log: Signing Permit
      setLogs(prev => [...prev, {
        id: Date.now(),
        type: 'APPROVE',
        status: 'pending',
        timestamp: new Date().toLocaleTimeString(),
        message: "Signing Permit (Gasless Approval)..."
      } as any]);

      // Get token details for EIP-712 signature
      const tokenName = await weth.name();
      const nonce = await weth.nonces(wallet.address);
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const chainId = await provider.getNetwork().then(n => n.chainId);

      // EIP-712 Domain
      const domain = {
        name: tokenName,
        version: "1",
        chainId: Number(chainId),
        verifyingContract: TOKEN_WETH.address,
      };

      // EIP-712 Types
      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      // EIP-712 Values
      const values = {
        owner: wallet.address,
        spender: leverageAccountAddr,
        value: amountWei.toString(),
        nonce: nonce.toString(),
        deadline: deadline,
      };

      // Sign the permit (MetaMask will show signature request)
      const signature = await window.ethereum.request({
        method: "eth_signTypedData_v4",
        params: [
          wallet.address,
          JSON.stringify({
            types: {
              EIP712Domain: [
                { name: "name", type: "string" },
                { name: "version", type: "string" },
                { name: "chainId", type: "uint256" },
                { name: "verifyingContract", type: "address" },
              ],
              Permit: types.Permit,
            },
            primaryType: "Permit",
            domain: domain,
            message: values,
          }),
        ],
      });

      const sig = ethers.Signature.from(signature);

      // Update log: Permit signed
      setLogs(prev => prev.map(log =>
        log.message === "Signing Permit (Gasless Approval)..."
          ? { ...log, status: 'success' as const, message: "Permit Signed" }
          : log
      ));

      // Log: Depositing
      setLogs(prev => [...prev, {
        id: Date.now(),
        type: 'DEPOSIT',
        status: 'pending',
        timestamp: new Date().toLocaleTimeString(),
        message: "Depositing to Smart Contract..."
      } as any]);

      // Call depositWithPermit (single transaction)
      const txDeposit = await leverageAcc.depositWithPermit(
        TOKEN_WETH.address,
        amountWei,
        deadline,
        sig.v,
        sig.r,
        sig.s
      );

      await txDeposit.wait();

      // Logs handled by event listener

    } catch (e: any) {
      console.error(e);
      setError("Transaction Failed: " + (e.message || e));
      setIsLooping(false);
      setLogs(prev => [...prev, {
        id: Date.now(),
        type: 'ERROR',
        status: 'error',
        timestamp: new Date().toLocaleTimeString(),
        message: "Failed"
      } as any]);
    }
  }, [wallet, leverageAccountAddr]);

  const handleSaveSetup = async (addr1: string, addr2: string) => {
    setError(null);
    setIsLooping(true); // Using this as loading indicator

    try {
      // Ensure we're on Sepolia network for setup
      await ensureSepoliaNetwork();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const leverageAcc = new Contract(addr1, LEVERAGE_ACCOUNT_ABI, signer);

      // Check current rscCaller
      const currentRscCaller = await leverageAcc.rscCaller();

      // Only call setRSCCaller if it's not set or incorrect
      if (currentRscCaller.toLowerCase() !== addr2.toLowerCase()) {
        const tx = await leverageAcc.setRSCCaller(addr2);
        await tx.wait();
      }

      // Save addresses to state
      setLeverageAccountAddr(addr1);
      setLoopingRSCAddr(addr2);

    } catch (e: any) {
      console.error(e);
      setError("Setup Failed: " + (e.message || e));
    } finally {
      setIsLooping(false);
    }
  };

  // --- Render ---

  if (!wallet.isConnected) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-[#0a0a0a] border border-[#333] p-8 max-w-md w-full text-center space-y-6">
          <h1 className="text-3xl font-bold text-white uppercase tracking-tighter">
            Reactive <span className="text-[#00F0FF]">Loop</span>
          </h1>
          <p className="text-gray-500 font-mono text-sm">
            Connect your wallet to access the leverage interface.
          </p>
          {error && <p className="text-red-500 text-xs font-mono">{error}</p>}

          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full h-12 text-lg font-bold uppercase rounded-sm border bg-[#00F0FF] text-black hover:bg-[#00F0FF]/90 transition-all"
          >
            {isConnecting ? <Loader2 className="animate-spin" /> : "Connect Wallet"}
          </Button>
        </div>
      </div>
    );
  }

  if (!leverageAccountAddr) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-[#0a0a0a] border border-[#333] p-0 max-w-2xl w-full">
          <SetupPanel onSave={handleSaveSetup} isLoading={isLooping} error={error} />
        </div>
      </div>
    );
  }

  return (
    <Layout
      controlPanel={
        <ControlPanel
          onInitiate={handleInitiate}
          isLooping={isLooping}
          walletBalance={walletBalance}
        />
      }
      metricsDashboard={
        <MetricsDashboard
          currentLTV={currentLTV}
          totalDebt={totalDebt}
          totalCollateral={totalCollateral}
          leverage={leverage}
        />
      }
      activityLog={
        <ActivityLog steps={logs} />
      }
    />
  );
};

export default Leverage;
