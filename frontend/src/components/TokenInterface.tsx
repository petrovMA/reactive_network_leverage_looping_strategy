import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Coins, Flame, RefreshCw } from 'lucide-react';
import { MOCK_TOKEN_ABI, parseTokenAmount, formatTokenAmount, ensureSepoliaNetwork } from '@/utils/web3';
import { TOKENS_LIST } from '../../config/contracts.config';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const TOKENS = TOKENS_LIST;

export default function TokenInterface() {
  const { toast } = useToast();
  const [account, setAccount] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState(TOKENS[0].address);
  const [mintAmount, setMintAmount] = useState('');
  const [mintTo, setMintTo] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [burnFrom, setBurnFrom] = useState('');
  const [balance, setBalance] = useState('0');
  const [totalSupply, setTotalSupply] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkWalletConnection();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  useEffect(() => {
    if (account && selectedToken) {
      fetchTokenData();
    }
  }, [account, selectedToken]);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setAccount('');
      toast({
        title: 'Wallet Disconnected',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
    } else {
      setAccount(accounts[0]);
    }
  };

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: 'MetaMask Not Found',
        description: 'Please install MetaMask to use this app',
        variant: 'destructive',
      });
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      toast({
        title: 'Wallet Connected',
        description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchTokenData = async () => {
    if (!window.ethereum || !account) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(selectedToken, MOCK_TOKEN_ABI, provider);

      const [bal, supply] = await Promise.all([
        contract.balanceOf(account),
        contract.totalSupply(),
      ]);

      setBalance(formatTokenAmount(bal.toString()));
      setTotalSupply(formatTokenAmount(supply.toString()));
    } catch (error) {
      console.error('Error fetching token data:', error);
    }
  };

  const handleMint = async () => {
    if (!window.ethereum || !account) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount to mint',
        variant: 'destructive',
      });
      return;
    }

    const recipient = mintTo || account;

    setLoading(true);
    try {
      // Ensure we're on Sepolia network
      await ensureSepoliaNetwork();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(selectedToken, MOCK_TOKEN_ABI, signer);

      const amount = parseTokenAmount(mintAmount);
      const tx = await contract.mint(recipient, amount);

      toast({
        title: 'Minting Tokens',
        description: 'Transaction submitted...',
      });

      await tx.wait();

      toast({
        title: 'Mint Successful',
        description: `Minted ${mintAmount} tokens to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
      });

      setMintAmount('');
      setMintTo('');
      await fetchTokenData();
    } catch (error: any) {
      toast({
        title: 'Mint Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBurn = async () => {
    if (!window.ethereum || !account) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    if (!burnAmount || parseFloat(burnAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount to burn',
        variant: 'destructive',
      });
      return;
    }

    const target = burnFrom || account;

    setLoading(true);
    try {
      // Ensure we're on Sepolia network
      await ensureSepoliaNetwork();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(selectedToken, MOCK_TOKEN_ABI, signer);

      const amount = parseTokenAmount(burnAmount);
      const tx = await contract.burn(target, amount);

      toast({
        title: 'Burning Tokens',
        description: 'Transaction submitted...',
      });

      await tx.wait();

      toast({
        title: 'Burn Successful',
        description: `Burned ${burnAmount} tokens from ${target.slice(0, 6)}...${target.slice(-4)}`,
      });

      setBurnAmount('');
      setBurnFrom('');
      await fetchTokenData();
    } catch (error: any) {
      toast({
        title: 'Burn Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedTokenInfo = TOKENS.find(t => t.address === selectedToken);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Test Token Manager</h1>
          <p className="text-muted-foreground">Mint and burn ERC20 test tokens</p>
        </div>
        <Button onClick={connectWallet} variant={account ? 'outline' : 'default'}>
          <Wallet className="mr-2 h-4 w-4" />
          {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Token Selection</CardTitle>
            <CardDescription>Choose a test token to manage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Token</Label>
              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOKENS.map((token) => (
                    <SelectItem key={token.address} value={token.address}>
                      {token.symbol} - {token.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Your Balance</p>
                <p className="text-2xl font-bold">{parseFloat(balance || '0').toFixed(3)} {selectedTokenInfo?.symbol}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Supply</p>
                <p className="text-2xl font-bold">{parseFloat(totalSupply || '0').toFixed(3)} {selectedTokenInfo?.symbol}</p>
              </div>
            </div>

            <Button onClick={fetchTokenData} variant="outline" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="mint" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mint">
              <Coins className="mr-2 h-4 w-4" />
              Mint
            </TabsTrigger>
            <TabsTrigger value="burn">
              <Flame className="mr-2 h-4 w-4" />
              Burn
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mint">
            <Card>
              <CardHeader>
                <CardTitle>Mint Tokens</CardTitle>
                <CardDescription>Create new tokens for testing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mint-amount">Amount</Label>
                  <Input
                    id="mint-amount"
                    type="number"
                    placeholder="0.0"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mint-to">Recipient Address (optional)</Label>
                  <Input
                    id="mint-to"
                    placeholder={account || '0x...'}
                    value={mintTo}
                    onChange={(e) => setMintTo(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to mint to your own address
                  </p>
                </div>

                <Button 
                  onClick={handleMint} 
                  disabled={loading || !account} 
                  className="w-full"
                >
                  <Coins className="mr-2 h-4 w-4" />
                  {loading ? 'Minting...' : 'Mint Tokens'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="burn">
            <Card>
              <CardHeader>
                <CardTitle>Burn Tokens</CardTitle>
                <CardDescription>Destroy tokens from an address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="burn-amount">Amount</Label>
                  <Input
                    id="burn-amount"
                    type="number"
                    placeholder="0.0"
                    value={burnAmount}
                    onChange={(e) => setBurnAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="burn-from">Burn From Address (optional)</Label>
                  <Input
                    id="burn-from"
                    placeholder={account || '0x...'}
                    value={burnFrom}
                    onChange={(e) => setBurnFrom(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to burn from your own address
                  </p>
                </div>

                <Button 
                  onClick={handleBurn} 
                  disabled={loading || !account} 
                  className="w-full"
                  variant="destructive"
                >
                  <Flame className="mr-2 h-4 w-4" />
                  {loading ? 'Burning...' : 'Burn Tokens'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
