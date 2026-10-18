import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, Shield } from 'lucide-react';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => navigate('/auth/reset-password'), 1500);
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30">
          <Mail size={24} />
        </div>
        <h1 className="text-xl font-extrabold text-white">Reset Master Password</h1>
        <p className="text-xs text-slate-400">
          Enter your registered SOC email to receive a high-security recovery token
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
        <div>
          <label className="form-label font-sans">Authorized Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="s.vance@aegis-security.io"
            className="form-input text-xs"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-full text-xs font-bold py-3 flex items-center justify-center gap-2">
          <span>{sent ? 'Recovery Link Dispatched...' : 'Send Recovery Link'}</span>
          <ArrowRight size={14} />
        </button>

        <div className="text-center pt-2">
          <Link to="/auth/login" className="text-slate-400 hover:text-white flex items-center justify-center gap-1">
            <ArrowLeft size={13} /> Return to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}
