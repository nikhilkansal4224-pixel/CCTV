import React from 'react';
import { Award, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CaseStudiesPage() {
  const studies = [
    {
      client: 'Port of Antwerp Container Logistics',
      challenge: 'High false alarm volume (over 400 per night) from seagulls, harbor water reflections, and crane lights blinded the SOC guard team.',
      solution: 'Deployed 3x Jetson AGX Orin edge clusters running AEGIS harmonic water-suppression models across 38 existing Axis PTZ cameras.',
      results: ['97.8% reduction in nocturnal false alarms', 'Response time dropped from 14 minutes to 4 seconds', 'Zero container break-ins recorded in 2026']
    },
    {
      client: 'Metro Rail Transit Maintenance Depots',
      challenge: 'Persistent graffiti vandalism and copper cable theft along 4.2 miles of dark unlit track staging yards.',
      solution: 'Configured dual thermal infrared FLIR sensors with automated 120dB acoustic directional sirens triggered on perimeter chainlink fence touch.',
      results: ['18 perimeter breach attempts autonomously halted', 'Saved $420,000 in scheduled vandalism repainting', 'Guards safely dispatch with live GPS target vector']
    }
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="badge badge-cyan text-xs">Route #13 • Verified Social Proof</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Customer Case Studies & Field Proof
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          See how international ports, industrial rail corridors, and defense contractors deploy AEGIS to secure critical assets.
        </p>
      </div>

      <div className="space-y-8">
        {studies.map((s, idx) => (
          <div key={idx} className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
            <h2 className="text-2xl font-bold text-white">{s.client}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
              <div className="space-y-2">
                <div className="font-bold text-slate-400 font-mono uppercase text-[11px]">The Challenge</div>
                <p className="text-slate-300 leading-relaxed">{s.challenge}</p>
                <div className="font-bold text-slate-400 font-mono uppercase text-[11px] pt-3">The AEGIS Deployment</div>
                <p className="text-slate-300 leading-relaxed">{s.solution}</p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono">
                <div className="font-bold text-cyan-400 text-xs font-sans uppercase">Verified Operational Outcomes</div>
                <div className="space-y-2 pt-1">
                  {s.results.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-200 text-xs">
                      <Check className="text-emerald-400 shrink-0 mt-0.5" size={14} />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
