import React, { useState } from 'react';
import { Users, UserPlus, Shield, ShieldCheck, Mail, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_USERS } from '../../data/mockData';

export default function UserDirectoryPage() {
  const [users, setUsers] = useState(MOCK_USERS);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="text-cyan-400" size={22} />
            User Management Directory
            <span className="badge badge-cyan text-xs">Route #72</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Security operators, SOC watch commanders, field patrol officers, and auditors with RBAC access
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/settings/users/invite" className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5">
            <UserPlus size={14} />
            <span>Invite Team Member</span>
          </Link>
          <Link to="/settings/roles" className="btn btn-secondary btn-sm text-xs">
            RBAC Roles
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
            <tr>
              <th className="p-3.5">Operator Name</th>
              <th className="p-3.5">Assigned Role</th>
              <th className="p-3.5">2FA Status</th>
              <th className="p-3.5">Last Active</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-800/40 transition">
                <td className="p-3.5">
                  <div className="font-sans font-bold text-white text-sm">{u.name}</div>
                  <div className="text-[11px] text-slate-400">{u.email}</div>
                </td>
                <td className="p-3.5">
                  <span className="badge badge-cyan text-[10px]">{u.role}</span>
                </td>
                <td className="p-3.5">
                  <span className={`badge ${u.mfaEnabled ? 'badge-emerald' : 'badge-amber'} text-[10px]`}>
                    {u.mfaEnabled ? 'Hardware MFA Active' : 'Pending MFA'}
                  </span>
                </td>
                <td className="p-3.5 text-slate-400">{u.lastActive}</td>
                <td className="p-3.5 text-right space-x-2">
                  <button className="btn btn-secondary btn-sm text-[11px]">
                    Edit Role
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
