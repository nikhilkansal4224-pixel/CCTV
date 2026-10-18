import React, { useState } from 'react';
import { ArrowLeft, UserPlus, Mail, Shield, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function InviteUserPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('operator');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => navigate('/settings/users'), 1500);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <Link to="/settings/users" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="text-cyan-400" size={22} />
            Invite Operator / Security Officer
            <span className="badge badge-cyan text-xs">Route #73</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch cryptographically signed invitation link with pre-assigned camera zone scopes and RBAC permissions
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs font-mono">
        <div>
          <label className="form-label font-sans">Corporate Work Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="officer.name@security.internal"
            className="form-input text-xs"
            required
          />
        </div>

        <div>
          <label className="form-label font-sans">Role Level & Clearance</label>
          <select 
            value={role} 
            onChange={e => setRole(e.target.value)}
            className="form-select text-xs font-mono"
          >
            <option value="admin">Super Administrator / SOC Chief</option>
            <option value="operator">Surveillance SOC Operator (Live Triage & PTZ)</option>
            <option value="guard">Field Patrol Security Guard (Mobile Alerts Only)</option>
            <option value="auditor">Read-Only Compliance Auditor (No PTZ / No Sirens)</option>
          </select>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 text-slate-300 font-sans cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-cyan-400" />
            <span>Enforce mandatory Hardware 2FA (TOTP / YubiKey) on first login</span>
          </label>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <button type="submit" className="btn btn-primary text-xs font-bold py-2.5 px-6">
            {sent ? '✓ Invitation Dispatched' : 'Send Cryptographic Invite'}
          </button>
        </div>
      </form>
    </div>
  );
}
