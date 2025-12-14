import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownUp, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  connectWallet,
  getWalletState,
  disconnectWallet,
  ensureSepoliaNetwork,
  MOCK_ROUTER_ABI,
  MOCK_TOKEN_ABI,
  parseTokenAmount,
  type WalletState
} from "@/utils/web3";
import { MOCK_ROUTER_ADDRESS, TOKEN_WETH, TOKEN_USDT } from "../../config/contracts.config";

interface Token {
  symbol: string;
  name: string;
  address: string;
  icon: string;
}

const TOKENS: Token[] = [
  {
    symbol: TOKEN_WETH.symbol,
    name: TOKEN_WETH.name,
    address: TOKEN_WETH.address,
    icon: "⟠",
  },
  {
    symbol: TOKEN_USDT.symbol,
    name: TOKEN_USDT.name,
    address: TOKEN_USDT.address,
    icon: "₮",
  },
];

export const SwapInterface = () => {
  const [fromToken, setFromToken] = useState<string>(TOKENS[0].symbol);
  const [toToken, setToToken] = useState<string>(TOKENS[1].symbol);
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<string>("0.5");
  const [wallet, setWallet] = useState<WalletState>({ address: null, chainId: null, isConnected: false });
  const [isSwapping, setIsSwapping] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if wallet is already connected
    getWalletState().then(setWallet);

    // Listen for account changes
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          setWallet(disconnectWallet());
        } else {
          getWalletState().then(setWallet);
        }
      });

      window.ethereum.on("chainChanged", () => {
        getWalletState().then(setWallet);
      });
    }
  }, []);

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const calculateOutput = (input: string) => {
    if (!input || isNaN(parseFloat(input))) {
      setToAmount("");
      return;
    }

    const amount = parseFloat(input);
    const fromTokenData = TOKENS.find((t) => t.symbol === fromToken);
    const toTokenData = TOKENS.find((t) => t.symbol === toToken);

    // Mock price calculation (WETH = 3000, USDT/USDC = 1)
    const prices: { [key: string]: number } = {
      WETH: 3000,
      USDT: 1,
      USDC: 1,
    };

    if (fromTokenData && toTokenData) {
      const fromPrice = prices[fromToken];
      const toPrice = prices[toToken];
      const output = (amount * fromPrice) / toPrice;
      setToAmount(output.toFixed(6));
    }
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    calculateOutput(value);
  };

  const handleConnectWallet = async () => {
    try {
      const walletState = await connectWallet();
      setWallet(walletState);
      toast({
        title: "Wallet Connected",
        description: `Connected to ${walletState.address?.slice(0, 6)}...${walletState.address?.slice(-4)}`,
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDisconnectWallet = () => {
    setWallet(disconnectWallet());
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to swap.",
        variant: "destructive",
      });
      return;
    }

    if (!wallet.address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    setIsSwapping(true);

    try {
      // Ensure we're on Sepolia network
      await ensureSepoliaNetwork();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Get token addresses
      const fromTokenData = TOKENS.find((t) => t.symbol === fromToken);
      const toTokenData = TOKENS.find((t) => t.symbol === toToken);

      if (!fromTokenData || !toTokenData) {
        throw new Error("Invalid token selection");
      }

      const amountIn = parseTokenAmount(fromAmount);
      const amountOutMin = parseTokenAmount((parseFloat(toAmount) * (1 - parseFloat(slippage) / 100)).toString());

      // Step 1: Approve token
      toast({
        title: "Approval Required",
        description: `Approving ${fromToken} for swap...`,
      });

      const fromTokenContract = new ethers.Contract(fromTokenData.address, MOCK_TOKEN_ABI, signer);
      const approveTx = await fromTokenContract.approve(MOCK_ROUTER_ADDRESS, amountIn);
      await approveTx.wait();

      toast({
        title: "Approval Successful",
        description: `${fromToken} approved for swap`,
      });

      // Step 2: Execute swap
      toast({
        title: "Swapping...",
        description: `Swapping ${fromAmount} ${fromToken} for ${toToken}`,
      });

      const routerContract = new ethers.Contract(MOCK_ROUTER_ADDRESS, MOCK_ROUTER_ABI, signer);
      const path = [fromTokenData.address, toTokenData.address];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

      const swapTx = await routerContract.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        wallet.address,
        deadline
      );

      const receipt = await swapTx.wait();

      toast({
        title: "Swap Successful!",
        description: `Swapped ${fromAmount} ${fromToken} for ${toToken}`,
      });

      // Reset form
      setFromAmount("");
      setToAmount("");

    } catch (error: any) {
      console.error("Swap error:", error);
      toast({
        title: "Swap Failed",
        description: error.message || "Transaction failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-2">
      <CardHeader>
        <CardTitle className="text-2xl font-heading font-bold">Token Swap</CardTitle>
        <CardDescription>Exchange tokens instantly with our DEX</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From Token Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">From</label>
          <div className="flex gap-2">
            <Select value={fromToken} onValueChange={setFromToken}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOKENS.filter((t) => t.symbol !== toToken).map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{token.icon}</span>
                      <span>{token.symbol}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
              className="flex-1 text-lg"
            />
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSwapTokens}
            className="rounded-full bg-white/10 hover:bg-white/20"
          >
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        {/* To Token Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">To</label>
          <div className="flex gap-2">
            <Select value={toToken} onValueChange={setToToken}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOKENS.filter((t) => t.symbol !== fromToken).map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{token.icon}</span>
                      <span>{token.symbol}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="0.0"
              value={toAmount}
              readOnly
              className="flex-1 text-lg bg-muted"
            />
          </div>
        </div>

        {/* Slippage Tolerance */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Slippage Tolerance (%)</label>
          <Input
            type="number"
            placeholder="0.5"
            value={slippage}
            onChange={(e) => setSlippage(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Action Button */}
        {!wallet.isConnected ? (
          <Button onClick={handleConnectWallet} className="w-full" size="lg">
            <Wallet className="mr-2 h-5 w-5" />
            Connect Wallet
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm text-purple-900 font-medium">
                {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
              </span>
              <Button
                onClick={handleDisconnectWallet}
                variant="outline"
                size="sm"
                className="text-purple-600 hover:text-purple-700"
              >
                Disconnect
              </Button>
            </div>
            <Button onClick={handleSwap} className="w-full" size="lg" disabled={isSwapping}>
              {isSwapping ? "Swapping..." : "Swap Tokens"}
            </Button>
          </div>
        )}

        {/* Info Section */}
        {fromAmount && toAmount && (
          <div className="mt-4 p-4 bg-muted rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exchange Rate</span>
              <span className="font-medium">
                1 {fromToken} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Minimum Received</span>
              <span className="font-medium">
                {(parseFloat(toAmount) * (1 - parseFloat(slippage) / 100)).toFixed(6)} {toToken}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
