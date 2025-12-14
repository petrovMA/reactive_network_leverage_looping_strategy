import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, ArrowDown, ArrowUpRight, ArrowRightLeft, Loader } from 'lucide-react';

export interface StepData {
    id: number;
    type: 'DEPOSIT' | 'WAITING' | 'LOOP_STEP';
    status: 'pending' | 'success' | 'error';
    txHash?: string;
    amount?: string; // Deposit amount in ETH
    details?: {
        borrowed?: string;
        swapped?: string;
        supplied?: string;
        newLTV?: number;
    };
    timestamp: string;
}

interface ActivityLogProps {
    steps: StepData[];
}

export const ActivityLog = ({ steps }: ActivityLogProps) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [steps]);

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 px-2">
                <span className="text-[#00FF00]">&gt;</span> SYSTEM ACTIVITY LOG
            </h2>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {steps.length === 0 && (
                    <div className="text-gray-600 font-mono text-sm text-center py-10 opacity-50">
               // WAITING FOR SIGNAL INPUT...
                    </div>
                )}

                {steps.map((step, index) => (
                    <div key={step.id} className="animate-in fade-in slide-in-from-top-4 duration-500">
                        {step.type === 'DEPOSIT' && <DepositBlock step={step} isLast={index === steps.length - 1} />}
                        {step.type === 'WAITING' && <WaitingBlock />}
                        {step.type === 'LOOP_STEP' && <LoopStepBlock step={step} />}

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div className="ml-[18px] w-[1px] h-6 bg-[#333]" />
                        )}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};

const DepositBlock = ({ step, isLast }: { step: StepData, isLast: boolean }) => (
    <div className="flex gap-4">
        <div className="flex flex-col items-center">
            <div className={cn(
                "w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 bg-[#050505]",
                step.status === 'success' ? "border-[#00FF00] text-[#00FF00]" : "border-gray-600 text-gray-500"
            )}>
                {step.status === 'success' ? <Check size={16} /> : <div className="w-2 h-2 bg-gray-500 rounded-full" />}
            </div>
        </div>
        <div className="flex-1 bg-[#0a0a0a] border border-[#333] p-4 rounded-sm">
            <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-white">USER DEPOSIT INITIATED</h3>
                <span className="text-xs font-mono text-gray-500">{step.timestamp}</span>
            </div>
            <p className="text-sm text-gray-400 font-mono">
                Sent {step.amount || '0'} ETH to Smart Vault
            </p>
            {step.txHash && (
                <a
                    href={`https://sepolia.etherscan.io/tx/${step.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#00F0FF] underline mt-2 block hover:text-white transition-colors"
                >
                    TX: {step.txHash}
                </a>
            )}
        </div>
    </div>
);

const WaitingBlock = () => (
    <div className="flex gap-4 opacity-80">
        <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#00F0FF] flex items-center justify-center z-10 bg-[#050505] animate-spin-slow">
                <Loader size={16} className="text-[#00F0FF]" />
            </div>
        </div>
        <div className="flex-1 p-4 rounded-sm border border-dashed border-[#00F0FF]/30 bg-[#00F0FF]/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00F0FF]/10 to-transparent -translate-x-full animate-shimmer" />
            <div className="relative z-10 flex items-center gap-2">
                <span className="text-[#00F0FF] font-mono tracking-widest animate-pulse">AWAITING REACTIVE SIGNAL</span>
                <span className="text-[#00F0FF] animate-blink">_</span>
            </div>
        </div>
    </div>
);

const LoopStepBlock = ({ step }: { step: StepData }) => (
    <div className="flex gap-4">
        <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-2 border-[#00F0FF] flex items-center justify-center z-10 bg-[#050505] shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                <span className="font-bold text-[#00F0FF] text-xs">RSC</span>
            </div>
        </div>
        <div className="flex-1 bg-[#050505] border border-[#00F0FF] p-4 rounded-sm shadow-[0_0_15px_rgba(0,240,255,0.1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-1 bg-[#00F0FF] text-black text-[10px] font-bold px-2">SUCCESS</div>

            <div className="mb-4">
                <h3 className="font-bold text-[#00F0FF]">REACTIVE LOOP EXECUTED</h3>
                <span className="text-xs font-mono text-gray-500">{step.timestamp}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-[#111] p-2 rounded-sm border border-[#333]">
                    <div className="flex items-center gap-1 text-[#FF003C] mb-1"><ArrowDown size={12} /> BORROW</div>
                    <div>{step.details?.borrowed}</div>
                </div>
                <div className="bg-[#111] p-2 rounded-sm border border-[#333]">
                    <div className="flex items-center gap-1 text-white mb-1"><ArrowRightLeft size={12} /> SWAP</div>
                    <div>{step.details?.swapped}</div>
                </div>
                <div className="bg-[#111] p-2 rounded-sm border border-[#333]">
                    <div className="flex items-center gap-1 text-[#00FF00] mb-1"><ArrowUpRight size={12} /> SUPPLY</div>
                    <div>{step.details?.supplied}</div>
                </div>
            </div>

            <div className="mt-2 text-right">
                <span className="text-xs text-gray-500">NEW LTV: </span>
                <span className="font-mono text-white">{step.details?.newLTV}%</span>
            </div>
        </div>
    </div>
);
