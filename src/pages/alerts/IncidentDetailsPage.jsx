import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, AlertTriangle, ShieldCheck, Flame, 
  MessageSquare, Clock, Download, Share2, Eye, Shield 
} from 'lucide-react';
import CctvCanvasSimulator from '../../components/CctvCanvasSimulator';
import { MOCK_ALERTS, MOCK_CAMERAS } from '../../data/mockData';

export default function IncidentDetailsPage() {
  const { alert_id = 'alt-101' } = useParams();
  const alert = MOCK_ALERTS.find(a => a.id === alert_id) || MOCK_ALERTS[0];
  const camera = MOCK_CAMERAS.find(c => c.id === alert.cameraId) || MOCK_CAMERAS[0];

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link to="/alerts/live" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Incident #{alert.id}: {alert.type}
              </h1>
              <span className="badge badge-crimson">{alert.severity.toUpperCase()}</span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Detected at {alert.timestamp} on {alert.cameraName} ({alert.location})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/alerts/${alert.id}/escalate`} className="btn btn-danger btn-sm text-xs flex items-center gap-1.5 font-bold">
            <Flame size={14} /> Dispatch & Siren
          </Link>
          <Link to={`/alerts/${alert.id}/history`} className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5">
            <MessageSquare size={14} /> Operator Log
          </Link>
          <Link to="/share/ev-99824" className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5">
            <Share2 size={14} /> Evidence Share
          </Link>
        </div>
      </div>

      {/* Grid: High-res Video Buffer and AI Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Snapshot with YOLO Detection Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl overflow-hidden border border-red-500/50 shadow-2xl">
            <CctvCanvasSimulator
              cameraId={camera.id}
              cameraName={camera.name}
              mode="view"
              isAlert={true}
              aspectRatio="16/9"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono space-y-2">
            <div className="text-cyan-400 font-bold uppercase tracking-wider">Automated Event Summary</div>
            <p className="text-slate-300 leading-relaxed font-sans text-sm">
              {alert.snapshotNote}
            </p>
          </div>
        </div>

        {/* AI Forensic Metadata breakdown */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs font-mono">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={16} className="text-cyan-400" />
              Neural Vector Breakdown
            </h3>

            <div className="space-y-2.5">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">YOLO Confidence</span>
                <span className="text-emerald-400 font-bold">{alert.confidence}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Target Clothing</span>
                <span className="text-slate-200">{alert.attributes.clothing}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Vector Direction</span>
                <span className="text-slate-200">{alert.attributes.direction}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Movement Velocity</span>
                <span className="text-cyan-400">{alert.attributes.speed}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Zone Dwell Time</span>
                <span className="text-amber-400">{alert.attributes.dwellTime}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Current Status</span>
                <span className="text-red-400 font-bold">{alert.status}</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="text-slate-400 mb-2">Triage Verification:</div>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn btn-secondary btn-sm text-emerald-400 hover:bg-emerald-950/40 border-emerald-800">
                  ✓ True Threat
                </button>
                <button className="btn btn-secondary btn-sm text-slate-400 hover:bg-slate-800">
                  ✕ False Alarm
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
