import React, { useState } from 'react';
import { HelpCircle, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TroubleshootWizardPage() {
  const [step, setStep] = useState(1);
  const [selectedIssue, setSelectedIssue] = useState('offline');

  return (
    <div className="p-6 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <HelpCircle className="text-cyan-400" size={22} />
          Interactive Stream & Camera Troubleshooting Wizard
          <span className="badge badge-cyan text-xs">Route #87</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Automated diagnostic engine to resolve dropped RTSP streams, ONVIF credential mismatches, and GPU bottlenecks
        </p>
      </div>

      <div className="max-w-2xl p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <span>Step {step} of 3: {step === 1 ? 'Identify Symptom' : (step === 2 ? 'Run Automated Diagnostics' : 'Resolution')}</span>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white">What behavior are you observing?</h2>
            <div className="space-y-2 text-xs">
              {[
                { id: 'offline', title: 'Camera Stream Black / Marked Offline', desc: 'RTSP handshake timed out or network drop' },
                { id: 'jitter', title: 'Frame Rate Stutter / High Latency (>100ms)', desc: 'Network congestion or GPU throttling' },
                { id: 'false', title: 'Excessive False Alarms from Shadows/Headlights', desc: 'Threshold needs sensitivity recalibration' },
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setSelectedIssue(opt.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    selectedIssue === opt.id 
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300' 
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-white">{opt.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
                </div>
              ))}
            </div>

            <button onClick={() => setStep(2)} className="btn btn-primary text-xs font-bold py-2.5 px-6 flex items-center gap-2">
              <span>Execute Diagnostic Health Probe</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-xs font-mono">
            <h2 className="text-sm font-bold text-white font-sans">Automated Diagnostic Probe in Progress</h2>
            
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-emerald-400">
                <span>1. Edge Gateway Network Ping (10.0.10.15)</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={13} /> 0.4ms RTT</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-emerald-400">
                <span>2. ONVIF WS-Discovery Probe Port 554</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={13} /> Port Open</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-amber-400">
                <span>3. RTSP Digest Authentication Session</span>
                <span className="flex items-center gap-1"><AlertTriangle size={13} /> Token Expired</span>
              </div>
            </div>

            <button onClick={() => setStep(3)} className="btn btn-primary text-xs font-bold py-2.5 px-6 flex items-center gap-2">
              <span>View Recommended Fix</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 space-y-1">
              <div className="font-bold text-sm">Automated Solution Identified:</div>
              <p>The IP camera changed its RTSP authentication nonce. Clicking below will refresh the session token without restarting the edge gateway.</p>
            </div>

            <button onClick={() => setStep(1)} className="btn btn-primary text-xs font-bold py-2.5 px-6">
              Apply Token Refresh & Reconnect Feed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
