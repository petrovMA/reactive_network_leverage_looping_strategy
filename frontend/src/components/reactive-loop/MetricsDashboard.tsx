import { cn } from '@/lib/utils';

interface MetricsDashboardProps {
    currentLTV: number;
    totalDebt: number; // USDT
    totalCollateral: number; // ETH
    leverage: number;
}

export const MetricsDashboard = ({ currentLTV, totalDebt, totalCollateral, leverage }: MetricsDashboardProps) => {
    const isDanger = currentLTV > 75;

    // Calculate gauge rotation (-90deg to +90deg for 0-100%)
    const rotation = -90 + (currentLTV / 100) * 180;

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-[#FF003C]">&gt;</span> METRICS SUITE
                </h2>
                <div className="text-xs font-mono text-gray-500 border border-[#333] px-2 py-1 rounded-sm">
                    REFRESH_RATE: REALTIME
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">

                {/* LTV Gauge Section */}
                {/* LTV Gauge Section */}
                <div className="flex flex-col items-center justify-center relative min-h-[160px]">
                    <div className="relative w-48 h-24">
                        {/* SVG Gauge */}
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 200 100">
                            {/* Background Arc */}
                            <path
                                d="M 20 100 A 80 80 0 0 1 180 100"
                                fill="none"
                                stroke="#333"
                                strokeWidth="24" // Thicker background
                                strokeLinecap="butt"
                            />
                            {/* Active Arc */}
                            <path
                                d="M 20 100 A 80 80 0 0 1 180 100"
                                fill="none"
                                stroke={isDanger ? "#FF003C" : "#00F0FF"}
                                strokeWidth="24"
                                strokeLinecap="butt"
                                strokeDasharray={`${(currentLTV / 100) * (Math.PI * 80)} ${(Math.PI * 80)}`}
                                strokeDashoffset="0"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>

                        {/* Needle/Value Overlay */}
                        <div className="absolute inset-0 top-6 flex flex-col items-center justify-end z-10 pb-0">
                            <div className={cn(
                                "text-4xl font-black font-mono tracking-tighter transition-colors duration-300",
                                isDanger ? "text-[#FF003C] animate-pulse" : "text-white"
                            )}>
                                {currentLTV.toFixed(2)}<span className="text-lg text-gray-500">%</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-gray-500 uppercase tracking-widest mt-4 font-mono">
                        Loan To Value
                    </div>

                    {/* Danger Threshold Marker (75%) */}
                    {/* 75% of 180 degrees = 135 degrees. Starts at -180 (left). So -45 deg? */}
                    {/* Using simple absolute positioning relative to the container might be hard. */}
                    {/* Let's render it in SVG for precision */}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-4 font-mono">
                    {/* Net APY (Placeholder) */}
                    <MetricCard
                        label="NET LEVERAGE"
                        value={`${leverage.toFixed(1)}x`}
                        subValue="Target: 2.5x"
                        color="text-[#00F0FF]"
                    />
                    <MetricCard
                        label="TOTAL COLLATERAL"
                        value={`${totalCollateral.toFixed(4)} ETH`}
                        subValue="$2,450.21"
                    />
                    <MetricCard
                        label="TOTAL DEBT"
                        value={`${totalDebt.toFixed(2)} USDT`}
                        subValue="Warning Limit: 80%"
                        valueColor="text-[#FF003C]"
                    />
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, subValue, color = "text-white", valueColor }: any) => (
    <div className="bg-[#050505] border border-[#333] p-3 rounded-sm flex justify-between items-center group hover:border-[#555] transition-colors">
        <div>
            <div className="text-[10px] uppercase tracking-widest text-gray-600 mb-1 group-hover:text-gray-400">{label}</div>
            <div className={cn("text-xl font-bold tracking-tight", valueColor || "text-white")}>{value}</div>
        </div>
        <div className="text-right">
            <div className={cn("text-xs font-bold", color)}>{subValue}</div>
        </div>
    </div>
);
