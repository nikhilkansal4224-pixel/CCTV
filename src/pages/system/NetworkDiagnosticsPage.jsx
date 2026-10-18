import React from 'react';
import { Activity, Wifi, Radio, ShieldCheck, ArrowDown, ArrowUp } from 'lucide-react';

export default function NetworkDiagnosticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="text-cyan-400" size={22} />
          Bandwidth, WebRTC & Streaming Network Diagnostics
          <span className="badge badge-cyan text-xs">Route #79</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time packet loss diagnostics, uplink bandwidth consumption, and WebRTC streaming jitter
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 font-mono text-xs">
          <div className="text-slate-400">TOTAL INGESTION UPLINK</div>
          <div className="text-2xl font-bold text-white flex items-center gap-1.5 font-sans">
            <ArrowUp size={18} className="text-cyan-400" />
            38.4 Mbps
          </div>
          <p className="text-[11px] text-slate-500 font-sans">Across 8 H.265 4K feeds</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 font-mono text-xs">
          <div className="text-slate-400">PACKET JITTER</div>
          <div className="text-2xl font-bold text-emerald-400 font-sans">1.8 ms</div>
          <p className="text-[11px] text-slate-500 font-sans">Sub-frame stability</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 font-mono text-xs">
          <div className="text-slate-400">PACKET LOSS RATE</div>
          <div className="text-2xl font-bold text-emerald-400 font-sans">0.00%</div>
          <p className="text-[11px] text-slate-500 font-sans">10GbE Fiber Backhaul</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 font-mono text-xs">
          <div className="text-slate-400">WEBRTC P2P LATENCY</div>
          <div className="text-2xl font-bold text-cyan-400 font-sans">28 ms</div>
          <p className="text-[11px] text-slate-500 font-sans">Edge Gateway to Operator</p>
        </div>
      </div>
    </div>
  );
}
