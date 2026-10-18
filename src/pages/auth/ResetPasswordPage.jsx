import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/auth/login');
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30">
          <Lock size={24} />
        </div>
        <h1 className="text-xl font-extrabold text-white">Create New Master Password</h1>
        <p className="text-xs text-slate-400">
          Must be at least 12 characters with numbers and symbols
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
        <div>
          <label className="form-label font-sans">New Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="form-input text-xs"
            required
          />
        </div>

        <div>
          <label className="form-label font-sans">Confirm New Password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="form-input text-xs"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-full text-xs font-bold py-3 flex items-center justify-center gap-2">
          <span>Set Master Password & Sign In</span>
          <ArrowRight size={14} />
        </button>
      </form>
    </div>
  );
}
