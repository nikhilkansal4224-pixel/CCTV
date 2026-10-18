import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, Download, Lock, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import CctvCanvasSimulator from '../../components/CctvCanvasSimulator';

export default function PublicEvidenceSharePage() {
  const { token = 'ev-99824' } = useParams();
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');

  const handleUnlock = (e) => {
    e.preventDefault();
    if (passcode === '1234' || passcode.length >= 4) {
      setUnlocked(true);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-cyan-400 font-bold">
          <ShieldCheck size={18} />
          <span>AEGIS SECURE FORENSIC EVIDENCE DISPATCH</span>
        </div>
        <span className="text-slate-400">Token: #{token} • Expiring in 48 Hours</span>
      </div>

      {!unlocked ? (
        /* Password Gate */
        <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
            <Lock size={24} />
          </div>
          <h2 className="text-lg font-bold text-white">Authorized Access Required</h2>
          <p className="text-xs text-slate-400">
            This evidence portal is protected under CJIS/SOC2 compliance. Enter the 4-digit PIN provided to municipal authorities.
          </p>

          <form onSubmit={handleUnlock} className="space-y-3 pt-2">
            <input
              type="password"
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              placeholder="Enter 4-digit PIN (e.g. 1234)"
              className="form-input text-center text-lg tracking-widest font-mono"
              maxLength={6}
              autoFocus
            />
            <button type="submit" className="btn btn-primary w-full text-xs font-bold py-2.5">
              Authenticate & Decrypt Evidence
            </button>
          </form>
        </div>
      ) : (
        /* Unlocked Evidence Dossier */
        <div className="space-y-6">
          <div className="rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
            <CctvCanvasSimulator
              cameraId="cam-01"
              cameraName="Evidence Reel #alt-101 (Cam 01 North Fence)"
              mode="view"
              isAlert={true}
              aspectRatio="16/9"
            />
          </div>

          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Perimeter Breach & Escalation Reel</h3>
                <p className="text-xs text-slate-400 font-mono">Recorded Oct 18, 2026 • 11:27:14 UTC</p>
              </div>
              <button className="btn btn-primary btn-sm flex items-center gap-1.5 font-bold">
                <Download size={14} /> Download Verified MP4 Package
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400">SHA-256 Digital Checksum</div>
                <div className="text-slate-200 truncate mt-1">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400">Chain of Custody Signature</div>
                <div className="text-emerald-400 font-bold mt-1">✓ Validated by SOC Chief Major S. Vance</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
