import React, { useState } from 'react';
import { Clock, Calendar, Plus, Shield, CheckCircle2 } from 'lucide-react';

export default function ShiftSchedulePage() {
  const [shifts] = useState([
    { name: 'Night Perimeter Armed Shift', days: 'Mon – Sun', hours: '22:00 – 06:00', guardLead: 'Major S. Vance', status: 'Active Scheduled' },
    { name: 'Daytime Logistics Receiving', days: 'Mon – Fri', hours: '08:00 – 17:00', guardLead: 'Marcus Brody', status: 'Active Scheduled' },
    { name: 'Weekend Full Lockdown', days: 'Sat – Sun', hours: '24 Hours Armed', guardLead: 'Elena Rostova', status: 'Active Scheduled' },
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="text-cyan-400" size={22} />
            Security Shift & Armed Schedule Management
            <span className="badge badge-cyan text-xs">Route #60</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Define active surveillance armed windows based on operational hours and security guard duty rosters
          </p>
        </div>

        <button className="btn btn-primary btn-sm text-xs font-bold">
          + Add New Shift Window
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {shifts.map((s, idx) => (
          <div key={idx} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="badge badge-emerald text-[10px]">{s.status}</span>
              <Calendar size={14} className="text-cyan-400" />
            </div>
            <h3 className="text-base font-bold text-white">{s.name}</h3>
            <div className="text-xs font-mono text-slate-400 space-y-1">
              <div>Schedule: <strong className="text-slate-200">{s.days}</strong></div>
              <div>Hours: <strong className="text-cyan-400">{s.hours}</strong></div>
              <div>Watch Commander: <strong className="text-slate-300">{s.guardLead}</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
