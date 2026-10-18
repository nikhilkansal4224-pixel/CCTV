import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { HardHat, Check, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function IndustryDetailPage() {
  const { industry = 'construction' } = useParams();

  const details = {
    title: 'Construction Site Autonomous Security & Safety',
    subtitle: 'Protect active high-risk jobsites, eliminate equipment theft, and automate OSHA PPE compliance.',
    kpis: [
      { stat: '100%', label: 'Active Night Perimeter Coverage' },
      { stat: '-94%', label: 'Jobsite Copper & Equipment Theft' },
      { stat: '0.2s', label: 'Missing Hardhat Detection' },
      { stat: '120dB', label: 'Automated Intruder Warning Siren' }
    ],
    features: [
      'OSHA Compliant: Instant alerts when workers enter crane swing radiuses without required safety vests or helmets.',
      'Perimeter Fence Breach Defense: Detects fence scaling and excavation trench incursions after work shifts.',
      'Active Deterrence Megaphone: Broadcasts automated high-volume warning messages: "Warning: Restricted zone, authorities dispatched."',
      'Battery & Solar Gateway Ready: Deployable on off-grid remote jobsites using ruggedized solar Jetson edge enclosures.'
    ]
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      <div className="space-y-4 max-w-3xl">
        <span className="badge badge-cyan text-xs">Route #5 • Vertical Detail ({industry.toUpperCase()})</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {details.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          {details.subtitle}
        </p>
        <div className="pt-2">
          <Link to="/demo" className="btn btn-primary text-xs font-bold py-3 px-6">
            Preview Construction Demo Feed
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
        {details.kpis.map((k, i) => (
          <div key={i} className="space-y-1 font-mono">
            <div className="text-3xl font-extrabold text-cyan-400">{k.stat}</div>
            <div className="text-xs text-slate-400 font-sans">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Specific Capabilities */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Specialized Jobsite Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {details.features.map((f, i) => (
            <div key={i} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
              <Check className="text-emerald-400 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-slate-300 leading-relaxed">{f}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
