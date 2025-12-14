import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DEFAULT_LEVERAGE_ACCOUNT, DEFAULT_LOOPING_RSC } from '@/utils/web3';
import { Loader2 } from 'lucide-react';

interface SetupPanelProps {
    onSave: (leverageAccount: string, loopingRSC: string) => Promise<void>;
    isLoading?: boolean;
    error?: string | null;
}

export const SetupPanel = ({ onSave, isLoading = false, error = null }: SetupPanelProps) => {
    const [leverageAccount, setLeverageAccount] = useState(DEFAULT_LEVERAGE_ACCOUNT);
    const [loopingRSC, setLoopingRSC] = useState(DEFAULT_LOOPING_RSC);

    const handleSave = async () => {
        if (leverageAccount && loopingRSC) {
            await onSave(leverageAccount, loopingRSC);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] p-6 text-gray-300 font-mono">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-[#00F0FF]">&gt;</span> SYSTEM SETUP
            </h2>

            <div className="space-y-6 flex-1">
                <p className="text-sm text-gray-400">
                    To proceed, please enter the addresses of your deployed contracts.
                </p>

                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
                        Leverage Account (Sepolia)
                    </label>
                    <Input
                        value={leverageAccount}
                        onChange={(e) => setLeverageAccount(e.target.value)}
                        className="bg-[#050505] border-[#333] text-white font-mono focus:border-[#00F0FF] transition-all rounded-sm"
                        placeholder="0x..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
                        Looping RSC (Reactive)
                    </label>
                    <Input
                        value={loopingRSC}
                        onChange={(e) => setLoopingRSC(e.target.value)}
                        className="bg-[#050505] border-[#333] text-white font-mono focus:border-[#00F0FF] transition-all rounded-sm"
                        placeholder="0x..."
                    />
                </div>
            </div>

            <div className="mt-8 space-y-4">
                {error && <p className="text-red-500 text-xs font-mono">{error}</p>}
                <Button
                    onClick={handleSave}
                    disabled={!leverageAccount || !loopingRSC || isLoading}
                    className="w-full h-12 text-lg font-bold tracking-widest uppercase rounded-sm transition-all border bg-transparent border-[#00F0FF] text-[#00F0FF] hover:bg-[#00F0FF] hover:text-black hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            SETTING UP...
                        </>
                    ) : (
                        'INITIALIZE SYSTEM'
                    )}
                </Button>
            </div>
        </div>
    );
};
