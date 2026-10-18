import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);

  const handleResend = () => {
    setResending(true);
    setTimeout(() => setResending(false), 1500);
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30">
        <Mail size={24} />
      </div>

      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-white">Verify Security Email</h1>
        <p className="text-xs text-slate-400">
          We sent a 6-digit confirmation code and activation link to your inbox.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400">
        Awaiting cryptographic verification token...
      </div>

      <div className="space-y-3">
        <button
          onClick={() => navigate('/onboarding/org')}
          className="btn btn-primary w-full text-xs font-bold py-3 flex items-center justify-center gap-2"
        >
          <span>Confirm & Continue to Org Setup</span>
          <ArrowRight size={14} />
        </button>

        <button
          onClick={handleResend}
          disabled={resending}
          className="btn btn-secondary w-full text-xs flex items-center justify-center gap-2"
        >
          <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
          <span>{resending ? 'Dispatched...' : 'Resend Verification Email'}</span>
        </button>
      </div>
    </div>
  );
}
