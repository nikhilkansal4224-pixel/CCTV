import React, { useState } from 'react';
import { ShieldCheck, Search, Filter, Download } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs] = useState([
    { id: 'LOG-9912', timestamp: 'Oct 18, 2026 11:28:30', user: 'Marcus Brody (Operator)', action: 'Actuator Engaged', details: 'Triggered 120dB Strobe Siren on Cam 01 North Fence', ip: '10.0.10.42' },
    { id: 'LOG-9911', timestamp: 'Oct 18, 2026 11:27:55', user: 'Major Sarah Vance (Admin)', action: 'Triage Decision', details: 'Marked Incident #alt-101 as True Positive Threat', ip: '10.0.10.15' },
    { id: 'LOG-9910', timestamp: 'Oct 18, 2026 11:20:10', user: 'System Kernel', action: 'Rule Triggered', details: 'Nighttime Perimeter Breach Alert Workflow Executed', ip: 'localhost' },
    { id: 'LOG-9909', timestamp: 'Oct 18, 2026 10:45:12', user: 'David Chen (Auditor)', action: 'Clip Export', details: 'Exported MP4 Package #EXP-8891 (SHA256 Signed)', ip: '192.168.4.11' },
    { id: 'LOG-9908', timestamp: 'Oct 18, 2026 09:12:00', user: 'Major Sarah Vance (Admin)', action: 'Auth Login', details: 'Successful 2FA Hardware Key Authentication', ip: '10.0.10.15' },
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-cyan-400" size={22} />
            Cryptographic System Audit Trail & Operator Logs
            <span className="badge badge-cyan text-xs">Route #76</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable, append-only log of every operator authentication, PTZ movement, siren actuation, and video clip view
          </p>
        </div>

        <button className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5">
          <Download size={14} />
          <span>Export Audit Log (JSON)</span>
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
            <tr>
              <th className="p-3.5">Log ID & Time</th>
              <th className="p-3.5">User Identity</th>
              <th className="p-3.5">Action Category</th>
              <th className="p-3.5">Action Narrative / Details</th>
              <th className="p-3.5">Origin IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-800/40 transition">
                <td className="p-3.5">
                  <div className="font-bold text-cyan-400">{log.id}</div>
                  <div className="text-[11px] text-slate-500">{log.timestamp}</div>
                </td>
                <td className="p-3.5 font-bold text-white font-sans">{log.user}</td>
                <td className="p-3.5">
                  <span className="badge badge-slate text-[10px]">{log.action}</span>
                </td>
                <td className="p-3.5 font-sans text-slate-300">{log.details}</td>
                <td className="p-3.5 text-slate-400">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
