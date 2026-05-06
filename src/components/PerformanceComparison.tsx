import React from 'react';
import { Zap, Clock, Cpu, TrendingDown } from 'lucide-react';

export const PerformanceComparison: React.FC = () => {
  return (
    <div className="mt-16 bg-[#0a1428]/40 border border-blue-900/50 rounded-3xl p-6 md:p-10 backdrop-blur-sm relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="text-center mb-10 relative z-10">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
          <Zap className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" />
          Why Convert? The Performance Impact
        </h2>
        <p className="text-sky-300/70 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          Converting complex files and images into clean text formats like Markdown dramatically reduces LLM processing overhead. Here is a real-world comparison of processing the same document as a raw PNG versus an optimized Markdown file using GROK.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 relative z-10">
        {/* PNG Stats */}
        <div className="bg-[#030b1c]/50 rounded-2xl p-6 border border-blue-900/50 shadow-inner">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
              <Clock className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-sky-100">Raw Image (PNG)</h3>
              <p className="text-xs text-sky-400/60">Heavy vision-encoding required</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <StatRow label="Time to first chunk" value="715ms" />
            <StatRow label="Time to first token" value="30.739s" />
            <StatRow label="Time to first summary token" value="53.777s" />
            <StatRow label="Total response time" value="69.821s" isTotal />
          </div>
        </div>

        {/* MD Stats */}
        <div className="bg-cyan-950/20 rounded-2xl p-6 border border-cyan-500/30 relative overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.15)]">
          <div className="absolute -bottom-6 -right-6 p-4 opacity-10 transform rotate-12">
            <Cpu className="w-32 h-32 text-cyan-500" />
          </div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-400">Optimized (Markdown)</h3>
                <p className="text-xs text-cyan-200/70">Native text processing</p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              ~5x FASTER
            </span>
          </div>
          
          <div className="space-y-4 relative z-10">
            <StatRow label="Time to first chunk" value="367ms" highlight />
            <StatRow label="Time to first token" value="3.155s" highlight />
            <StatRow label="Time to first summary token" value="4.123s" highlight />
            <StatRow label="Total response time" value="13.773s" isTotal highlight />
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-5 bg-cyan-950/30 rounded-2xl border border-cyan-500/20 flex items-start gap-4 relative z-10">
        <div className="p-2 bg-cyan-500/20 rounded-lg shrink-0">
          <TrendingDown className="w-5 h-5 text-cyan-400" />
        </div>
        <p className="text-sm md:text-base text-cyan-100/80 leading-relaxed">
          <strong className="text-cyan-300 font-semibold">The Takeaway:</strong> By converting visual documents to structured text before feeding them to an LLM, you bypass the expensive vision-encoding step. This results in a <strong className="text-white font-semibold">9.7x faster time-to-first-token</strong> and reduces the overall response time by 80%, saving both compute resources and API costs.
        </p>
      </div>
    </div>
  );
};

const StatRow = ({ label, value, isTotal = false, highlight = false }: { label: string, value: string, isTotal?: boolean, highlight?: boolean }) => (
  <div className={`flex justify-between items-center pb-3 border-b ${isTotal ? 'border-transparent pb-0 pt-2' : 'border-blue-900/50'}`}>
    <span className={`text-sm ${isTotal ? 'font-medium text-sky-200' : 'text-sky-300/70'}`}>{label}</span>
    <span className={`font-mono ${isTotal ? 'text-xl font-bold' : 'text-base font-medium'} ${highlight ? 'text-emerald-400' : 'text-sky-100'}`}>
      {value}
    </span>
  </div>
);
