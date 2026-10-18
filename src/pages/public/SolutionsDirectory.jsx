import React from 'react';
import { Building, HardHat, Shield, Truck, Home, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SolutionsDirectory() {
  const verticals = [
    { id: 'construction', name: 'Construction Sites & Heavy Industry', desc: 'Real-time PPE hardhat detection, crane drop zone perimeter tripwires, and after-hours material theft deterrence.', icon: HardHat },
    { id: 'warehouse', name: 'Logistics Hubs & Warehouses', desc: 'Loading dock loitering detection, trailer dwell metrics, and unauthorized trailer ingress alerts.', icon: Truck },
    { id: 'retail', name: 'Commercial & Retail Centers', desc: 'After-hours burglary detection, high-density traffic heatmaps, and false alarm elimination.', icon: Building },
    { id: 'residential', name: 'High-Sec Residential & Estates', desc: 'Boundary fence intrusion triggers, pool safety zones, and smart vehicle gate whitelist ANPR.', icon: Home },
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="badge badge-cyan text-xs">Route #4 • Vertical Solutions</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Industry Solutions Directory
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Autonomous perimeter security models pre-calibrated for specific operational environments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {verticals.map(v => {
          const Icon = v.icon;
          return (
            <Link 
              key={v.id} 
              to={`/solutions/${v.id}`}
              className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition group space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition">
                <Icon size={24} />
              </div>
              <h2 className="text-xl font-bold text-white group-hover:text-cyan-300 transition">{v.name}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">{v.desc}</p>
              <div className="pt-2 flex items-center gap-1.5 text-xs text-cyan-400 font-bold font-mono">
                <span>View Vertical Blueprint</span>
                <ArrowRight size={14} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
