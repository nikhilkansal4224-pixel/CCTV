import React, { useState } from 'react';
import { Check, ArrowRight, ShieldCheck, Zap, Sliders } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PricingPage() {
  const [streamCount, setStreamCount] = useState(8);

  const calculateMonthly = () => {
    if (streamCount <= 8) return 490;
    if (streamCount <= 16) return 980;
    if (streamCount <= 32) return 1850;
    return 1850 + (streamCount - 32) * 55;
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="badge badge-cyan text-xs">Route #7 • Transparent Commercials</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Simple, Predictable Stream Pricing
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          No hidden cloud egress fees. Every tier includes local neural hardware integration and sub-second sirens.
        </p>
      </div>

      {/* Interactive Calculator */}
      <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="flex justify-between items-center font-mono">
          <span className="text-sm font-bold text-white font-sans uppercase">Calculate by Number of Cameras</span>
          <span className="text-xl font-bold text-cyan-400">{streamCount} Cameras</span>
        </div>

        <input 
          type="range"
          min="4"
          max="64"
          step="4"
          value={streamCount}
          onChange={e => setStreamCount(Number(e.target.value))}
          className="w-full accent-cyan-400"
        />

        <div className="flex justify-between items-baseline pt-4 border-t border-slate-800 font-mono">
          <div>
            <div className="text-3xl font-extrabold text-white font-sans">${calculateMonthly()}</div>
            <div className="text-xs text-slate-400">Monthly flat fee (Billed annually)</div>
          </div>
          <Link to="/auth/register" className="btn btn-primary text-xs font-bold py-3 px-6">
            Deploy {streamCount} Streams →
          </Link>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-base">Starter Sentinel</h3>
          <div className="text-2xl font-bold text-white font-mono">$490 <span className="text-xs text-slate-400 font-normal">/mo</span></div>
          <p className="text-xs text-slate-400">Up to 8 Cameras with sub-second human detection.</p>
          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300"><Check size={14} className="text-emerald-400" /> 18ms YOLO inference</div>
            <div className="flex items-center gap-2 text-slate-300"><Check size={14} className="text-emerald-400" /> Dynamic polygon zones</div>
            <div className="flex items-center gap-2 text-slate-300"><Check size={14} className="text-emerald-400" /> 14-day local retention</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-cyan-500 shadow-xl shadow-cyan-950/40 space-y-4 relative">
          <span className="absolute -top-3 right-6 badge badge-cyan text-[10px]">Most Popular</span>
          <h3 className="font-bold text-white text-base">Enterprise Fortress</h3>
          <div className="text-2xl font-bold text-cyan-400 font-mono">$1,850 <span className="text-xs text-slate-400 font-normal">/mo</span></div>
          <p className="text-xs text-slate-400">Up to 32 Cameras for industrial sites and logistics parks.</p>
          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300"><Check size={14} className="text-emerald-400" /> All Starter features</div>
            <div className="flex items-center gap-2 text-slate-300"><Check size={14} className="text-emerald-400" /> Acoustic siren relay control</div>
            <div className="flex items-center gap-2 text-slate-300"><Check size={14} className="text-emerald-400" /> 90-day retention & S3 cloud vault</div>
            <div className="flex items-center gap-2 text-slate-300"><Check size={14} className="text-emerald-400" /> Multi-site floorplan visualizer</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-base">Air-Gapped Defense</h3>
          <div className="text-2xl font-bold text-white font-mono">Custom <span className="text-xs text-slate-400 font-normal">/quote</span></div>
          <p className="text-xs text-slate-400">For military defense, ports, and critical infrastructure.</p>
          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300"><Check size={14} className="text-emerald-400" /> Unlimited streams</div>
            <div className="flex items-center gap-2 text-slate-300"><Check size={14} className="text-emerald-400" /> Zero WAN air-gapped clusters</div>
            <div className="flex items-center gap-2 text-slate-300"><Check size={14} className="text-emerald-400" /> 24/7 dedicated engineering SLA</div>
          </div>
        </div>
      </div>
    </div>
  );
}
