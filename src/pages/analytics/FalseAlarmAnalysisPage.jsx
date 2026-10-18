import React from 'react';
import { ShieldCheck, AlertCircle, Sparkles, Filter, RefreshCw } from 'lucide-react';

export default function FalseAlarmAnalysisPage() {
  const breakdown = [
    { cause: 'Tree Foliage & Wind Gusts', count: 12, percent: '52%', solution: 'Harmonic motion suppression filter applied' },
    { cause: 'Car Headlight Reflection', count: 6, percent: '26%', solution: 'Lux glare polarize algorithm active' },
    { cause: 'Small Animals / Wildlife', count: 3, percent: '13%', solution: 'Quadruped body aspect ratio threshold calibrated' },
    { cause: 'Camera Spiderweb / Insect', count: 2, percent: '9%', solution: 'Focal blur detector suppression' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="text-emerald-400" size={22} />
          False Alarm Analysis & Model Precision Optimization
          <span className="badge badge-emerald text-xs">Route #68</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Forensic diagnosis of non-threat triggers to iteratively tune edge neural confidence thresholds and filter masks
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-mono">GLOBAL AI ACCURACY</div>
          <div className="text-2xl font-bold text-emerald-400">99.6% Precision</div>
          <p className="text-[11px] text-slate-500 font-sans">Only 23 false alerts out of 5,820 frames</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-mono">AUTO-DISCARD RATE</div>
          <div className="text-2xl font-bold text-cyan-400">97.8% Filtered</div>
          <p className="text-[11px] text-slate-500 font-sans">Never disturbed security operator</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-mono">GUARD TIME SAVED (30D)</div>
          <div className="text-2xl font-bold text-purple-400">142 Hours</div>
          <p className="text-[11px] text-slate-500 font-sans">Zero false midnight alarm dispatches</p>
        </div>
      </div>

      {/* Root Causes Table */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
          Top Environmental False Trigger Vectors (30 Days)
        </h2>

        <div className="space-y-3 font-mono text-xs">
          {breakdown.map((b, idx) => (
            <div key={idx} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <div className="font-bold text-white text-sm font-sans">{b.cause}</div>
                <div className="text-slate-400 text-[11px] mt-0.5">Automated Fix: {b.solution}</div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-slate-400">{b.count} Events</span>
                <span className="badge badge-amber text-[10px]">{b.percent} of Total</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
