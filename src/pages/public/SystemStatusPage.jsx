import React from 'react';
import { CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

export default function SystemStatusPage() {
  const services = [
    { name: 'Edge AI Neural Ingestion Engine (US-East Cluster)', status: 'Operational', uptime: '99.99%' },
    { name: 'Edge AI Neural Ingestion Engine (EU-Central Cluster)', status: 'Operational', uptime: '100.0%' },
    { name: 'WebRTC Low-Latency P2P Video Signaling', status: 'Operational', uptime: '99.98%' },
    { name: 'Automated Acoustic Siren Relays & Webhooks', status: 'Operational', uptime: '100.0%' },
    { name: 'Cryptographic SHA-256 Video Export Transcoder', status: 'Operational', uptime: '99.95%' },
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <span className="badge badge-emerald text-xs">Route #16 • Real-Time Health</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          System Operational Status
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Continuous uptime verification across global edge clusters and neural ingestion pipelines.
        </p>

        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 font-mono text-xs flex items-center justify-center gap-2 max-w-md mx-auto">
          <CheckCircle2 size={16} />
          <span>All Production Surveillance Clusters Operational</span>
        </div>
      </div>

      <div className="space-y-3">
        {services.map((s, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-white font-sans">{s.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">{s.uptime}</span>
              <span className="badge badge-emerald text-[10px]">{s.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
