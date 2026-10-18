import React, { useState } from 'react';
import { ShieldCheck, QrCode, Copy, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TwoFactorSetupPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const seed = 'JBSWY3DPEHPK3PXP';

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6 text-center">
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-white">Setup 2FA Hardware Security</h1>
        <p className="text-xs text-slate-400">
          Scan the QR code below using Google Authenticator, Authy, or 1Password
        </p>
      </div>

      {/* Mock QR Code visual */}
      <div className="w-44 h-44 rounded-2xl bg-white p-3 mx-auto flex items-center justify-center shadow-lg">
        <div className="w-full h-full border-4 border-slate-950 p-2 flex flex-col justify-between">
          <div className="flex justify-between">
            <div className="w-8 h-8 bg-black"></div>
            <div className="w-8 h-8 bg-black"></div>
          </div>
          <div className="text-center font-mono font-bold text-black text-[9px]">AEGIS-2FA-SEED</div>
          <div className="flex justify-between">
            <div className="w-8 h-8 bg-black"></div>
            <div className="w-6 h-6 bg-black"></div>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400 flex items-center justify-between">
        <span>Secret: {seed}</span>
        <button className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1">
          <Copy size={12} /> Copy
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Enter 6-digit confirmation code"
          className="form-input text-center text-sm font-mono py-2.5"
          required
        />
        <button type="submit" className="btn btn-primary w-full text-xs font-bold py-2.5 flex items-center justify-center gap-2">
          <span>Validate & Enable 2FA</span>
          <ArrowRight size={14} />
        </button>
      </form>
    </div>
  );
}
