import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, CheckCircle, ShieldAlert, ArrowRight, 
  Filter, Volume2, Shield, Eye, Flame, BellRing 
} from 'lucide-react';
import { MOCK_ALERTS } from '../../data/mockData';

export default function LiveAlertQueue() {
  const [filterSeverity, setFilterSeverity] = useState('all'); // 'all', 'critical', 'high', 'medium'
  const [alerts, setAlerts] = useState(MOCK_ALERTS);

  const filtered = alerts.filter(a => filterSeverity === 'all' || a.severity === filterSeverity);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-red-400" size={22} />
            Live Alert Ingestion Queue
            <span className="badge badge-crimson text-xs">Sub-Second Ticker</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time human threat detections streamed from edge neural engines with automated siren triggers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/alerts/review" className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5">
            <CheckCircle size={14} className="text-emerald-400" />
            <span>Triage Verification Queue</span>
          </Link>
        </div>
      </div>

      {/* Severity Filter Pills */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl w-fit text-xs font-mono">
        {['all', 'critical', 'high', 'medium', 'low'].map(sev => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-3 py-1 rounded-lg uppercase transition cursor-pointer font-bold ${
              filterSeverity === sev 
                ? (sev === 'critical' ? 'bg-red-500 text-white' : 'bg-cyan-500 text-black') 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Live Ticker Feed Items */}
      <div className="space-y-3">
        {filtered.map(alert => {
          const isCrit = alert.severity === 'critical';
          const isHigh = alert.severity === 'high';
          return (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isCrit 
                  ? 'bg-red-950/20 border-red-500/50 hover:border-red-400 shadow-lg shadow-red-950/20' 
                  : (isHigh ? 'bg-amber-950/15 border-amber-500/40 hover:border-amber-400' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700')
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-xl mt-0.5 ${isCrit ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-slate-400">[{alert.id}]</span>
                    <h3 className="font-bold text-white text-sm">{alert.type}</h3>
                    <span className={`badge ${isCrit ? 'badge-crimson' : 'badge-amber'}`}>
                      {alert.severity}
                    </span>
                    <span className="badge badge-cyan text-[10px]">
                      {alert.confidence}% Confidence
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {alert.snapshotNote}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-[11px] font-mono text-slate-400">
                    <span>Camera: <strong className="text-slate-200">{alert.cameraName}</strong></span>
                    <span>Location: <strong className="text-slate-200">{alert.location}</strong></span>
                    <span>Time: <strong className="text-cyan-400">{alert.timestamp}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                <Link to={`/alerts/${alert.id}`} className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5">
                  <Eye size={13} />
                  <span>Inspect</span>
                </Link>
                <Link to={`/alerts/${alert.id}/escalate`} className="btn btn-danger btn-sm text-xs flex items-center gap-1.5 font-bold">
                  <Flame size={13} />
                  <span>Escalate</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
