import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Flame, ArrowLeft, Volume2, ShieldAlert, PhoneCall, Radio, Send, CheckCircle2 } from 'lucide-react';
import { MOCK_ALERTS } from '../../data/mockData';

export default function IncidentEscalationPage() {
  const { alert_id = 'alt-101' } = useParams();
  const alert = MOCK_ALERTS.find(a => a.id === alert_id) || MOCK_ALERTS[0];

  const [sirenActive, setSirenActive] = useState(false);
  const [guardsDispatched, setGuardsDispatched] = useState(true);
  const [emergencyCalled, setEmergencyCalled] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <Link to={`/alerts/${alert.id}`} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="text-red-500" size={22} />
            Emergency Incident Escalation Console
            <span className="badge badge-crimson text-xs">Priority 1 Dispatch</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Execute tactical deterrents, trigger physical sirens, and dispatch emergency response units
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Physical Siren Deterrent */}
        <div className={`p-6 rounded-xl border flex flex-col justify-between ${sirenActive ? 'bg-red-950/40 border-red-500 shadow-xl shadow-red-950/40' : 'bg-slate-900/60 border-slate-800'}`}>
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <Volume2 size={24} />
            </div>
            <h2 className="text-lg font-bold text-white">Relay #1: 120dB Strobe Siren</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Triggers physical high-intensity strobe light and 120dB acoustic siren at {alert.location}.
            </p>
          </div>
          <button
            onClick={() => setSirenActive(!sirenActive)}
            className={`mt-6 w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
              sirenActive ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {sirenActive ? '⚠ Siren Active (Sounding)' : 'Activate Acoustic Siren'}
          </button>
        </div>

        {/* On-Duty Guard Dispatch */}
        <div className="p-6 rounded-xl border bg-slate-900/60 border-slate-800 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Radio size={24} />
            </div>
            <h2 className="text-lg font-bold text-white">Radio Patrol Dispatch</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sends encrypted tactical push notification and GPS vector coordinates to mobile guard patrol unit #3.
            </p>
            <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 pt-2">
              <CheckCircle2 size={14} /> Patrol Alpha ETA: 45 seconds
            </div>
          </div>
          <button
            onClick={() => setGuardsDispatched(true)}
            className="mt-6 w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Dispatch Tactical Guards
          </button>
        </div>

        {/* Emergency Services */}
        <div className="p-6 rounded-xl border bg-slate-900/60 border-slate-800 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <PhoneCall size={24} />
            </div>
            <h2 className="text-lg font-bold text-white">Emergency Services / 911</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Direct API integration with Central Monitoring Station to dispatch municipal police authorities.
            </p>
          </div>
          <button
            onClick={() => setEmergencyCalled(true)}
            className={`mt-6 w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
              emergencyCalled ? 'bg-purple-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {emergencyCalled ? '✓ Authorities Notified' : 'Dispatch Emergency (911)'}
          </button>
        </div>
      </div>
    </div>
  );
}
