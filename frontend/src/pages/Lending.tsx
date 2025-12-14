import { LendingInterface } from "@/components/LendingInterface";
import { Navigation } from "@/components/Navigation";
import { Landmark, Shield, TrendingUp } from "lucide-react";

const Lending = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-secondary/10 via-background to-primary/10">
      <Navigation />
      {/* Hero Section */}
      <div className="relative w-full overflow-hidden">
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-5xl md:text-6xl font-heading font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
              Lending Pool
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Supply collateral and borrow assets with competitive rates and flexible terms
            </p>
          </div>

          {/* Lending Interface */}
          <div className="mb-16">
            <LendingInterface />
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg border-2 border-secondary/20 text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 bg-secondary/10 rounded-full">
                  <Landmark className="h-8 w-8 text-secondary" />
                </div>
              </div>
              <h3 className="text-xl font-heading font-semibold">Flexible Collateral</h3>
              <p className="text-muted-foreground">
                Supply multiple assets as collateral to maximize your borrowing power
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg border-2 border-primary/20 text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-full">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-heading font-semibold">Competitive Rates</h3>
              <p className="text-muted-foreground">
                Enjoy competitive borrowing rates with transparent pricing and no hidden fees
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-lg border-2 border-secondary/20 text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 bg-secondary/10 rounded-full">
                  <Shield className="h-8 w-8 text-secondary" />
                </div>
              </div>
              <h3 className="text-xl font-heading font-semibold">Safe & Secure</h3>
              <p className="text-muted-foreground">
                Your assets are protected with smart contract security and LTV monitoring
              </p>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 max-w-3xl mx-auto bg-card/50 backdrop-blur-sm p-6 rounded-lg border-2 border-primary/20">
            <h3 className="text-xl font-heading font-semibold mb-4">How It Works</h3>
            <div className="space-y-3 text-muted-foreground">
              <div className="flex gap-3">
                <span className="font-bold text-primary">1.</span>
                <p>
                  <strong>Supply Collateral:</strong> Deposit your assets to the lending pool as collateral
                </p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-primary">2.</span>
                <p>
                  <strong>Borrow Assets:</strong> Borrow up to 80% of your collateral value (LTV)
                </p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-primary">3.</span>
                <p>
                  <strong>Monitor Health:</strong> Keep your LTV below 80% to maintain a healthy position
                </p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-primary">4.</span>
                <p>
                  <strong>Manage Position:</strong> Supply more collateral or repay debt to adjust your LTV
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t bg-card/30 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Token Swap DEX. Powered by MockLendingPool Smart Contract.
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

export default Lending;
