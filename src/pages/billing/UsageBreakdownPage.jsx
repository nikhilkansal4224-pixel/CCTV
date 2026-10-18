import React from 'react';
import { ArrowLeft, Cpu, HardDrive, Webhook, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UsageBreakdownPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <Link to="/billing" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="text-cyan-400" size={22} />
            Compute & Transcoding Usage Breakdown
            <span className="badge badge-cyan text-xs">Route #84</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Telemetry metrics on edge GPU inference hours, cloud transcoding bandwidth, and webhook dispatches
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 font-mono text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Cpu size={18} />
            <span>AI Inference Hours</span>
          </div>
          <div className="text-2xl font-bold text-white font-sans">5,760 Hrs</div>
          <p className="text-slate-400">8 Streams x 720 Hours (Full Month 100% Edge Utilized)</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 font-mono text-xs">
          <div className="flex items-center gap-2 text-purple-400 font-bold">
            <HardDrive size={18} />
            <span>Cloud S3 Archival Storage</span>
          </div>
          <div className="text-2xl font-bold text-white font-sans">4.8 TB</div>
          <p className="text-slate-400">280 Encrypted High-Res Evidence Clips Retained</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 font-mono text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Webhook size={18} />
            <span>Webhook Dispatches</span>
          </div>
          <div className="text-2xl font-bold text-white font-sans">18,420 Events</div>
          <p className="text-slate-400">99.98% HTTP 200 Delivery Success Rate</p>
        </div>
      </div>
    </div>
  );
}
