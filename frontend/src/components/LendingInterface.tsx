import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  connectWallet,
  getWalletState,
  disconnectWallet,
  ensureSepoliaNetwork,
  MOCK_LENDING_POOL_EXTENDED_ABI,
  MOCK_TOKEN_ABI,
  parseTokenAmount,
  type WalletState
} from "@/utils/web3";
import { MOCK_LENDING_POOL_ADDRESS, TOKEN_WETH, TOKEN_USDT } from "../../config/contracts.config";

interface Token {
  symbol: string;
  name: string;
  address: string;
  icon: string;
}

const TOKENS: Token[] = [
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0x0000000000000000000000000000000000000001",
    icon: "⟠",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0x0000000000000000000000000000000000000002",
    icon: "₮",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x0000000000000000000000000000000000000003",
    icon: "$",
  },
];

export const LendingInterface = () => {
  const [selectedToken, setSelectedToken] = useState<string>(TOKENS[0].symbol);
  const [amount, setAmount] = useState<string>("");
  const [wallet, setWallet] = useState<WalletState>({ address: null, chainId: null, isConnected: false });
  const { toast } = useToast();

  useEffect(() => {
    getWalletState().then(setWallet);

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

  // Mock user account data
  const [accountData, setAccountData] = useState({
    totalCollateralUSD: 5000,
    totalDebtUSD: 2000,
    ltv: 40, // 40%
    supplies: {
      WETH: 1.5,
      USDT: 500,
      USDC: 0,
    },
    borrowings: {
      WETH: 0,
      USDT: 2000,
      USDC: 0,
    },
  });

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

  const handleSupply = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to supply.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Ensure we're on Sepolia network
      await ensureSepoliaNetwork();

      toast({
        title: "Supply Successful",
        description: `Supplied ${amount} ${selectedToken} as collateral`,
      });

      // Update mock data
      const prices: { [key: string]: number } = { WETH: 3000, USDT: 1, USDC: 1 };
      const usdValue = parseFloat(amount) * prices[selectedToken];

      setAccountData((prev) => ({
        ...prev,
        totalCollateralUSD: prev.totalCollateralUSD + usdValue,
        supplies: {
          ...prev.supplies,
          [selectedToken]: prev.supplies[selectedToken as keyof typeof prev.supplies] + parseFloat(amount),
        },
        ltv: ((prev.totalDebtUSD / (prev.totalCollateralUSD + usdValue)) * 100),
      }));

      setAmount("");
    } catch (error: any) {
      toast({
        title: "Network Switch Required",
        description: error.message || "Please switch to Sepolia network",
        variant: "destructive",
      });
    }
  };

  const handleBorrow = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to borrow.",
        variant: "destructive",
      });
      return;
    }

    const prices: { [key: string]: number } = { WETH: 3000, USDT: 1, USDC: 1 };
    const usdValue = parseFloat(amount) * prices[selectedToken];
    const newDebt = accountData.totalDebtUSD + usdValue;
    const newLtv = (newDebt / accountData.totalCollateralUSD) * 100;

    if (newLtv > 80) {
      toast({
        title: "LTV Limit Exceeded",
        description: "This borrow would exceed the maximum LTV of 80%",
        variant: "destructive",
      });
      return;
    }

    try {
      // Ensure we're on Sepolia network
      await ensureSepoliaNetwork();

      toast({
        title: "Borrow Successful",
        description: `Borrowed ${amount} ${selectedToken}`,
      });

      setAccountData((prev) => ({
        ...prev,
        totalDebtUSD: newDebt,
        borrowings: {
          ...prev.borrowings,
          [selectedToken]: prev.borrowings[selectedToken as keyof typeof prev.borrowings] + parseFloat(amount),
        },
        ltv: newLtv,
      }));

      setAmount("");
    } catch (error: any) {
      toast({
        title: "Network Switch Required",
        description: error.message || "Please switch to Sepolia network",
        variant: "destructive",
      });
    }
  };

  const getLtvColor = (ltv: number) => {
    if (ltv < 50) return "text-green-600";
    if (ltv < 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getLtvVariant = (ltv: number): "default" | "secondary" | "destructive" => {
    if (ltv < 50) return "default";
    if (ltv < 70) return "secondary";
    return "destructive";
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Account Health Card */}
      <Card className="shadow-xl border-2">
        <CardHeader>
          <CardTitle className="text-2xl font-heading font-bold">Account Health</CardTitle>
          <CardDescription>Monitor your collateral and borrowing position</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Collateral</p>
              <p className="text-3xl font-bold text-primary">
                ${accountData.totalCollateralUSD.toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Debt</p>
              <p className="text-3xl font-bold text-secondary">
                ${accountData.totalDebtUSD.toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Loan-to-Value (LTV)</p>
                <Badge variant={getLtvVariant(accountData.ltv)}>
                  {accountData.ltv.toFixed(2)}%
                </Badge>
              </div>
              <Progress value={accountData.ltv} className="h-3" />
              <p className="text-xs text-muted-foreground">Max LTV: 80%</p>
            </div>
          </div>

          {accountData.ltv > 70 && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">High LTV Warning</p>
                <p className="text-sm text-muted-foreground">
                  Your LTV is approaching the maximum limit. Consider supplying more collateral or repaying debt.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supply & Borrow Interface */}
      <Card className="shadow-xl border-2">
        <CardHeader>
          <CardTitle className="text-2xl font-heading font-bold">Lending Pool</CardTitle>
          <CardDescription>Supply collateral or borrow assets</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="supply" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="supply">Supply</TabsTrigger>
              <TabsTrigger value="borrow">Borrow</TabsTrigger>
            </TabsList>

            <TabsContent value="supply" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Select Asset</label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOKENS.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{token.icon}</span>
                          <span>{token.symbol}</span>
                          <span className="text-muted-foreground">- {token.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Amount</label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg"
                />
              </div>

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
                  <Button onClick={handleSupply} className="w-full" size="lg">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Supply Collateral
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="borrow" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Select Asset</label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOKENS.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{token.icon}</span>
                          <span>{token.symbol}</span>
                          <span className="text-muted-foreground">- {token.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Amount</label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg"
                />
              </div>

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
                  <Button onClick={handleBorrow} className="w-full" size="lg" variant="secondary">
                    <TrendingDown className="mr-2 h-5 w-5" />
                    Borrow Assets
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Positions Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-xl border-2">
          <CardHeader>
            <CardTitle className="font-heading font-semibold">Your Supplies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {TOKENS.map((token) => {
              const supplied = accountData.supplies[token.symbol as keyof typeof accountData.supplies];
              if (supplied === 0) return null;
              return (
                <div key={token.symbol} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{token.icon}</span>
                    <div>
                      <p className="font-semibold">{token.symbol}</p>
                      <p className="text-xs text-muted-foreground">{token.name}</p>
                    </div>
                  </div>
                  <p className="font-bold text-lg">{supplied.toFixed(4)}</p>
                </div>
              );
            })}
            {Object.values(accountData.supplies).every((v) => v === 0) && (
              <p className="text-center text-muted-foreground py-4">No supplies yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xl border-2">
          <CardHeader>
            <CardTitle className="font-heading font-semibold">Your Borrowings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {TOKENS.map((token) => {
              const borrowed = accountData.borrowings[token.symbol as keyof typeof accountData.borrowings];
              if (borrowed === 0) return null;
              return (
                <div key={token.symbol} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{token.icon}</span>
                    <div>
                      <p className="font-semibold">{token.symbol}</p>
                      <p className="text-xs text-muted-foreground">{token.name}</p>
                    </div>
                  </div>
                  <p className="font-bold text-lg">{borrowed.toFixed(4)}</p>
                </div>
              );
            })}
            {Object.values(accountData.borrowings).every((v) => v === 0) && (
              <p className="text-center text-muted-foreground py-4">No borrowings yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
