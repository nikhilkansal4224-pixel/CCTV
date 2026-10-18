import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, Building, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [org, setOrg] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/auth/verify-email');
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500 flex items-center justify-center text-slate-950 font-bold mx-auto">
          <Shield size={24} />
        </div>
        <h1 className="text-xl font-extrabold text-white">Create Security Operations Account</h1>
        <p className="text-xs text-slate-400">
          Provision a dedicated cloud or on-premise AI surveillance tenant
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
        <div>
          <label className="form-label font-sans">Organization / Enterprise Name</label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
            <input
              type="text"
              value={org}
              onChange={e => setOrg(e.target.value)}
              placeholder="e.g. Apex Industrial Logistics"
              className="form-input pl-9 text-xs"
              required
            />
          </div>
        </div>

        <div>
          <label className="form-label font-sans">Authorized Corporate Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="cso@company.com"
              className="form-input pl-9 text-xs"
              required
            />
          </div>
        </div>

        <div>
          <label className="form-label font-sans">Master Access Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 12 characters"
              className="form-input pl-9 text-xs"
              required
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full text-xs font-bold py-3 flex items-center justify-center gap-2">
          <span>Register Workspace</span>
          <ArrowRight size={14} />
        </button>
      </form>

      <div className="text-center text-xs text-slate-400">
        Already registered? <Link to="/auth/login" className="text-cyan-400 font-bold hover:underline">Sign In</Link>
      </div>
    </div>
  );
}
