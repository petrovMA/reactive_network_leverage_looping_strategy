import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Navigation } from '@/components/Navigation';

interface LayoutProps {
    children?: ReactNode;
    controlPanel: ReactNode;
    metricsDashboard: ReactNode;
    activityLog: ReactNode;
}

export const Layout = ({ controlPanel, metricsDashboard, activityLog }: LayoutProps) => {
    return (
        <div className="min-h-screen bg-[#050505] text-gray-300 font-mono selection:bg-[#00F0FF] selection:text-black">
            {/* Grid Background Pattern */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                    backgroundSize: '32px 32px'
                }}
            />

            <div className="relative z-10 flex flex-col min-h-screen">
                <Navigation />

                <main className="flex-1 container mx-auto px-4 py-8 flex flex-col gap-6 max-w-7xl">
                    {/* Header */}
                    <header className="mb-4 space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 bg-[#00F0FF] rounded-full animate-pulse shadow-[0_0_8px_#00F0FF]"></div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-white uppercase">
                                Reactive <span className="text-[#00F0FF]">Loop</span> Dashboard
                            </h1>
                        </div>
                        <p className="text-xs md:text-sm text-gray-500 max-w-lg">
                            SYSTEM_STATUS: ONLINE // INTERFACE: v2.0.4-CYBER
                        </p>
                    </header>

                    {/* Top Section: Split Control & Metrics */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left: Control Panel */}
                        <section className="lg:col-span-5 bg-[#0a0a0a] border border-[#333] rounded-sm p-6 shadow-xl relative overflow-hidden group">
                            {/* Hover Glow Effect */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00F0FF]/5 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none transition-opacity opacity-50 group-hover:opacity-100" />
                            {controlPanel}
                        </section>

                        {/* Right: Metrics */}
                        <section className="lg:col-span-7 bg-[#0a0a0a] border border-[#333] rounded-sm p-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-[#FF003C]/5 rounded-full blur-3xl -translate-y-16 -translate-x-16 pointer-events-none transition-opacity opacity-50 group-hover:opacity-100" />
                            {metricsDashboard}
                        </section>
                    </div>

                    {/* Bottom Section: Logs */}
                    <section className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-sm p-6 shadow-xl min-h-[400px] flex flex-col relative overflow-hidden">
                        {activityLog}
                    </section>
                </main>
            </div>
        </div>
    );
};
