import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface ControlPanelProps {
    onInitiate: (amount: string) => void;
    isLooping: boolean;
    walletBalance: string;
}

export const ControlPanel = ({ onInitiate, isLooping, walletBalance }: ControlPanelProps) => {
    const [amount, setAmount] = useState('');

    const handleMax = () => {
        // Leave some gas
        const val = parseFloat(walletBalance) > 0.01 ? (parseFloat(walletBalance) - 0.01).toFixed(4) : '0';
        setAmount(val);
    };

    return (
        <div className="flex flex-col h-full justify-between">
            <div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-[#00F0FF]">&gt;</span> DEPOSIT CONTROL
                </h2>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
                            Asset Amount (ETH)
                        </label>
                        <div className="relative group">
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-[#050505] border-[#333] text-white h-14 pl-4 pr-20 text-xl font-mono focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] transition-all rounded-sm placeholder:text-gray-700"
                                disabled={isLooping}
                            />
                            <div className="absolute right-2 top-2 bottom-2 flex items-center">
                                <button
                                    onClick={handleMax}
                                    disabled={isLooping}
                                    className="text-xs bg-[#333] hover:bg-[#444] text-[#00F0FF] px-2 py-1 rounded-sm transition-colors uppercase font-bold"
                                >
                                    MAX
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 font-mono">
                            <span>Balance: {walletBalance} ETH</span>
                            <span>Gas Est: ~0.005 ETH</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <Button
                    onClick={() => onInitiate(amount)}
                    disabled={!amount || parseFloat(amount) <= 0 || isLooping}
                    className={cn(
                        "w-full h-16 text-lg font-bold tracking-widest uppercase rounded-sm transition-all border relative overflow-hidden",
                        isLooping
                            ? "bg-[#050505] border-[#333] text-gray-500 cursor-not-allowed"
                            : "bg-transparent border-[#00F0FF] text-[#00F0FF] hover:bg-[#00F0FF] hover:text-black hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                    )}
                >
                    {isLooping ? (
                        <>
                            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,#000_25%,#000_50%,transparent_50%,transparent_75%,#000_75%,#000_100%)] bg-[length:20px_20px] animate-progress-stripes" />
                            <span className="flex items-center gap-3 relative z-10">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                INITIALIZING_LOOP...
                            </span>
                        </>
                    ) : (
                        "INITIATE SEQUENCE"
                    )}
                </Button>
            </div>

            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00F0FF] opacity-50" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00F0FF] opacity-50" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00F0FF] opacity-50" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00F0FF] opacity-50" />
        </div>
    );
};
