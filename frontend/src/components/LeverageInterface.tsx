import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, Zap, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { connectWallet, getWalletState, disconnectWallet, type WalletState } from "@/utils/web3";

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

export const LeverageInterface = () => {
  const [collateralToken, setCollateralToken] = useState<string>(TOKENS[0].symbol);
  const [debtToken, setDebtToken] = useState<string>(TOKENS[1].symbol);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [targetLTV, setTargetLTV] = useState<string>("70");
  const [wallet, setWallet] = useState<WalletState>({ address: null, chainId: null, isConnected: false });
  const { toast } = useToast();

  // Mock position data
  const [positionData, setPositionData] = useState({
    collateral: 0,
    debt: 0,
    ltv: 0,
    isActive: false,
    iterationCount: 0,
  });

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

  const handleDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid deposit amount.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Deposit Initiated",
      description: `Depositing ${depositAmount} ${collateralToken}. Reactive Network will begin leverage loop.`,
    });

    // Mock: simulate position creation
    const prices: { [key: string]: number } = { WETH: 3000, USDT: 1, USDC: 1 };
    const collateralValue = parseFloat(depositAmount) * prices[collateralToken];

    setPositionData({
      collateral: collateralValue,
      debt: 0,
      ltv: 0,
      isActive: true,
      iterationCount: 0,
    });

    setDepositAmount("");
  };

  const handleExecuteLeverageLoop = () => {
    if (!positionData.isActive) {
      toast({
        title: "No Active Position",
        description: "Please deposit collateral first.",
        variant: "destructive",
      });
      return;
    }

    const target = parseFloat(targetLTV);
    if (positionData.ltv >= target) {
      toast({
        title: "Target LTV Reached",
        description: `Current LTV (${positionData.ltv.toFixed(2)}%) has reached target (${target}%)`,
      });
      return;
    }

    toast({
      title: "Leverage Loop Executing",
      description: "Reactive Network is processing the leverage step...",
    });

    // Mock: simulate one iteration
    const borrowAmount = positionData.collateral * 0.15; // Borrow 15% of collateral value
    const newCollateral = borrowAmount * 0.98; // Assume 2% slippage/fees

    setPositionData((prev) => ({
      ...prev,
      collateral: prev.collateral + newCollateral,
      debt: prev.debt + borrowAmount,
      ltv: ((prev.debt + borrowAmount) / (prev.collateral + newCollateral)) * 100,
      iterationCount: prev.iterationCount + 1,
    }));
  };

  const handleClosePosition = () => {
    if (!positionData.isActive) {
      toast({
        title: "No Active Position",
        description: "There is no position to close.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Position Closed",
      description: `Repaid ${positionData.debt.toFixed(2)} ${debtToken} and withdrew ${positionData.collateral.toFixed(2)} USD worth of ${collateralToken}`,
    });

    setPositionData({
      collateral: 0,
      debt: 0,
      ltv: 0,
      isActive: false,
      iterationCount: 0,
    });
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
      {/* Position Status Card */}
      <Card className="shadow-xl border-2">
        <CardHeader>
          <CardTitle className="text-2xl font-heading font-bold">Leverage Position Status</CardTitle>
          <CardDescription>Monitor your automated leverage position via Reactive Network</CardDescription>
        </CardHeader>
        <CardContent>
          {positionData.isActive ? (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Collateral</p>
                  <p className="text-3xl font-bold text-primary">
                    ${positionData.collateral.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Debt</p>
                  <p className="text-3xl font-bold text-secondary">
                    ${positionData.debt.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Current LTV</p>
                    <Badge variant={getLtvVariant(positionData.ltv)}>
                      {positionData.ltv.toFixed(2)}%
                    </Badge>
                  </div>
                  <Progress value={positionData.ltv} className="h-3" />
                  <p className="text-xs text-muted-foreground">Target: {targetLTV}% | Max: 80%</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-semibold">Reactive Network Status</p>
                    <p className="text-sm text-muted-foreground">
                      {positionData.iterationCount} leverage iterations completed
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              </div>

              {positionData.ltv > 70 && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive">High LTV Warning</p>
                    <p className="text-sm text-muted-foreground">
                      Your LTV is approaching the maximum limit. Consider closing or reducing your position.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No active leverage position</p>
              <p className="text-sm text-muted-foreground mt-2">Deposit collateral below to start</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deposit & Control Card */}
      <Card className="shadow-xl border-2">
        <CardHeader>
          <CardTitle className="text-2xl font-heading font-bold">Leverage Account</CardTitle>
          <CardDescription>Deposit collateral and manage automated leverage loops</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Deposit Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Deposit Collateral</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Collateral Asset</label>
                <Select value={collateralToken} onValueChange={setCollateralToken}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOKENS.filter((t) => t.symbol !== debtToken).map((token) => (
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
                <label className="text-sm font-medium text-muted-foreground">Debt Asset</label>
                <Select value={debtToken} onValueChange={setDebtToken}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOKENS.filter((t) => t.symbol !== collateralToken).map((token) => (
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Deposit Amount</label>
              <Input
                type="number"
                placeholder="0.0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Target LTV (%)</label>
              <Input
                type="number"
                placeholder="70"
                value={targetLTV}
                onChange={(e) => setTargetLTV(e.target.value)}
                className="text-lg"
                max="80"
              />
              <p className="text-xs text-muted-foreground">
                Reactive Network will automatically loop until this LTV is reached (max 80%)
              </p>
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
                <Button onClick={handleDeposit} className="w-full" size="lg">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Deposit & Start Leverage
                </Button>
              </div>
            )}
          </div>

          {/* Control Section */}
          {positionData.isActive && (
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold">Position Controls</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  onClick={handleExecuteLeverageLoop}
                  variant="outline"
                  size="lg"
                  disabled={positionData.ltv >= parseFloat(targetLTV)}
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Execute Leverage Step
                </Button>

                <Button
                  onClick={handleClosePosition}
                  variant="destructive"
                  size="lg"
                  className="w-full"
                >
                  Close Position
                </Button>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> In production, Reactive Network automatically executes leverage steps
                  based on the Deposited event. Manual execution is for testing purposes.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
