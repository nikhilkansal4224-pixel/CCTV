import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('s.vance@aegis-security.io');
  const [password, setPassword] = useState('••••••••••••');

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/auth/2fa-verify');
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-bold mx-auto shadow-lg shadow-cyan-500/25">
          <Shield size={24} className="stroke-[2.5]" />
        </div>
        <h1 className="text-xl font-extrabold text-white">SOC Operator Sign In</h1>
        <p className="text-xs text-slate-400">
          Enter credentials to access autonomous surveillance feeds
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
        <div>
          <label className="form-label font-sans">Operator Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="form-input pl-9 text-xs"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="form-label font-sans mb-0">Master Password</label>
            <Link to="/auth/forgot-password" className="text-[11px] text-cyan-400 hover:underline font-sans">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="form-input pl-9 text-xs"
              required
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full text-xs font-bold py-3 flex items-center justify-center gap-2">
          <span>Authenticate Operator</span>
          <ArrowRight size={14} />
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono"><span className="bg-slate-900 px-2 text-slate-500">Or corporate SSO</span></div>
        </div>

        <button 
          type="button" 
          onClick={() => navigate('/auth/2fa-verify')}
          className="btn btn-secondary w-full text-xs flex items-center justify-center gap-2"
        >
          <KeyRound size={14} className="text-cyan-400" />
          <span>SAML Okta / Azure AD Single Sign-On</span>
        </button>
      </form>

      <div className="text-center text-xs text-slate-400">
        Need a new workspace? <Link to="/auth/register" className="text-cyan-400 font-bold hover:underline">Register account</Link>
      </div>
    </div>
  );
}
