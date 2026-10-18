import React, { useState } from 'react';
import { ArrowLeft, Webhook, Key, Send, CheckCircle2, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WebhookSettingsPage() {
  const [url, setUrl] = useState('https://api.aegis-defense.internal/v1/cctv/events');
  const [secret, setSecret] = useState('whsec_99a8b7c6d5e4f3a2b1c0998877665544');
  const [testSent, setTestSent] = useState(false);

  const handleTest = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <Link to="/integrations" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Webhook className="text-cyan-400" size={22} />
            Webhook Endpoints & Payload Signing
            <span className="badge badge-cyan text-xs">Route #62</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deliver cryptographic JSON threat notifications via HTTP POST with HMAC SHA-256 signature verification
          </p>
        </div>
      </div>

      <div className="max-w-2xl p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-6 text-xs font-mono">
        <div>
          <label className="form-label font-sans">Webhook Target URL</label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="form-input text-xs"
            required
          />
        </div>

        <div>
          <label className="form-label font-sans">HMAC Signing Secret</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={secret}
              readOnly
              className="form-input text-xs bg-slate-950 text-slate-400"
            />
            <button className="btn btn-secondary btn-sm flex items-center gap-1">
              <Copy size={13} /> Copy
            </button>
          </div>
          <p className="text-[11px] text-slate-500 font-sans mt-1">
            Signatures are included in the <code className="text-cyan-400">X-Aegis-Signature</code> HTTP header.
          </p>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button 
            type="button" 
            onClick={handleTest}
            className="btn btn-primary text-xs font-bold py-2.5 flex items-center gap-2"
          >
            <Send size={13} />
            <span>{testSent ? '✓ 200 OK Response Received' : 'Send Test Ping Payload'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
