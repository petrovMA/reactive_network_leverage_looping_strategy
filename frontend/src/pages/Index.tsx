import { SwapInterface } from "@/components/SwapInterface";
import { Navigation } from "@/components/Navigation";
import { Coins, TrendingUp, Shield } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Navigation />
      {/* Hero Section */}
      <div className="relative w-full overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('https://assets-gen.codenut.dev/images/1764854515_bbfebd01.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-5xl md:text-6xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Token Swap DEX
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience seamless token swaps with our decentralized exchange powered by smart contracts
            </p>
          </div>

          {/* Swap Interface */}
          <div className="mb-16">
            <SwapInterface />
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg border-2 border-primary/20 text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Coins className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-heading font-semibold">Instant Swaps</h3>
              <p className="text-muted-foreground">
                Exchange tokens instantly with real-time price calculations and minimal slippage
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg border-2 border-secondary/20 text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 bg-secondary/10 rounded-full">
                  <TrendingUp className="h-8 w-8 text-secondary" />
                </div>
              </div>
              <h3 className="text-xl font-heading font-semibold">Best Rates</h3>
              <p className="text-muted-foreground">
                Get competitive exchange rates powered by our integrated price oracle system
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg border-2 border-primary/20 text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-heading font-semibold">Secure & Trustless</h3>
              <p className="text-muted-foreground">
                Your funds are protected by audited smart contracts on the blockchain
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t bg-card/30 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Token Swap DEX. Powered by MockRouter Smart Contract.
            </p>
            <p className="text-xs text-muted-foreground">
              Contract Address: 0x0000...0000 | Network: Ethereum Mainnet
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
