import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Landmark, Zap, Coins } from "lucide-react";

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="w-full border-b bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              DeFi Platform
            </h2>
          </div>
          <div className="flex gap-2">
            <Link to="/token">
              <Button
                variant={location.pathname === "/token" ? "default" : "outline"}
                size="sm"
              >
                <Coins className="mr-2 h-4 w-4" />
                Mint/Burn Test Tokens
              </Button>
            </Link>
            <Link to="/">
              <Button
                variant={location.pathname === "/" ? "default" : "outline"}
                size="sm"
              >
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Swap
              </Button>
            </Link>
            <Link to="/lending">
              <Button
                variant={location.pathname === "/lending" ? "default" : "outline"}
                size="sm"
              >
                <Landmark className="mr-2 h-4 w-4" />
                Lending
              </Button>
            </Link>
            <Link to="/leverage">
              <Button
                variant={location.pathname === "/leverage" ? "default" : "outline"}
                size="sm"
              >
                <Zap className="mr-2 h-4 w-4" />
                Leverage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
