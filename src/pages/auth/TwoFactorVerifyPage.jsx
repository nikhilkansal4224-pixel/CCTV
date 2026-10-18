import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';

export default function TwoFactorVerifyPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30">
        <ShieldCheck size={24} />
      </div>

      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-white">Two-Factor Authentication</h1>
        <p className="text-xs text-slate-400">
          Enter the 6-digit Time-Based One-Time Password (TOTP) from your authenticator app
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="000 000"
          className="form-input text-center text-2xl tracking-[0.5em] font-mono py-3 font-bold text-cyan-400"
          maxLength={6}
          autoFocus
          required
        />

        <button type="submit" className="btn btn-primary w-full text-xs font-bold py-3 flex items-center justify-center gap-2">
          <span>Authorize Operator Session</span>
          <ArrowRight size={14} />
        </button>
      </form>

      <div className="text-center text-xs text-slate-500">
        Lost access to authenticator? Use your emergency offline backup codes.
      </div>
    </div>
  );
}
