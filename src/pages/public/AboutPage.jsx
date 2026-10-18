import React from 'react';
import { Shield, Target, Users, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="badge badge-cyan text-xs">Route #9 • Company & Team</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Pioneering Autonomous Physical Defense
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Founded by computer vision researchers and defense veterans, AEGIS replaces passive video recording with real-time autonomous deterrence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Target size={20} />
          </div>
          <h3 className="text-base font-bold text-white">Our Mission</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Eliminate human guard fatigue and eliminate false alarms through sub-second edge intelligence that stops breaches before entry occurs.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Shield size={20} />
          </div>
          <h3 className="text-base font-bold text-white">Zero Cloud Reliance</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            We believe critical security infrastructure must operate even during complete WAN outages, cyber attacks, and network jamming.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Award size={20} />
          </div>
          <h3 className="text-base font-bold text-white">Defense Grade Quality</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Certified for SOC 2 Type II, CJIS, and NDAA compliant hardware architectures across North America and Europe.
          </p>
        </div>
      </div>
    </div>
  );
}
