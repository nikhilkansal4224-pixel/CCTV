import React from 'react';
import { Shield, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RbacRolesPage() {
  const permissions = [
    { name: 'Live Multi-Grid Stream Viewing', admin: true, operator: true, guard: true, auditor: true },
    { name: 'PTZ Joystick Camera Manipulation', admin: true, operator: true, guard: false, auditor: false },
    { name: 'Acoustic Siren & Strobe Trigger', admin: true, operator: true, guard: false, auditor: false },
    { name: 'Triage True Threat / False Alarm', admin: true, operator: true, guard: true, auditor: false },
    { name: 'AI Zone & Sensitivity Calibration', admin: true, operator: false, guard: false, auditor: false },
    { name: 'Cryptographic Video Clip Export', admin: true, operator: true, guard: false, auditor: true },
    { name: 'User Management & Billing', admin: true, operator: false, guard: false, auditor: false },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="text-cyan-400" size={22} />
            Roles & Permissions Matrix (RBAC)
            <span className="badge badge-cyan text-xs">Route #74</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Fine-grained access control boundaries enforcing least-privilege security across operations
          </p>
        </div>

        <Link to="/settings/users" className="btn btn-secondary btn-sm text-xs">
          View Users
        </Link>
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
            <tr>
              <th className="p-3.5">Permission Capability</th>
              <th className="p-3.5 text-center text-cyan-400">SOC Chief</th>
              <th className="p-3.5 text-center text-slate-200">Operator</th>
              <th className="p-3.5 text-center text-amber-400">Field Patrol</th>
              <th className="p-3.5 text-center text-purple-400">Auditor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {permissions.map((p, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition">
                <td className="p-3.5 font-bold text-white font-sans">{p.name}</td>
                <td className="p-3.5 text-center">{p.admin ? <Check className="mx-auto text-emerald-400" size={16} /> : <X className="mx-auto text-slate-600" size={16} />}</td>
                <td className="p-3.5 text-center">{p.operator ? <Check className="mx-auto text-emerald-400" size={16} /> : <X className="mx-auto text-slate-600" size={16} />}</td>
                <td className="p-3.5 text-center">{p.guard ? <Check className="mx-auto text-emerald-400" size={16} /> : <X className="mx-auto text-slate-600" size={16} />}</td>
                <td className="p-3.5 text-center">{p.auditor ? <Check className="mx-auto text-emerald-400" size={16} /> : <X className="mx-auto text-slate-600" size={16} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
