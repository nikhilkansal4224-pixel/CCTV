import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Shield, AlertTriangle, ArrowRight, Check, X } from 'lucide-react';
import CctvCanvasSimulator from '../../components/CctvCanvasSimulator';
import { MOCK_ALERTS, MOCK_CAMERAS } from '../../data/mockData';

export default function IncidentReviewQueue() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentAlert = alerts[currentIndex] || alerts[0];
  const camera = MOCK_CAMERAS.find(c => c.id === currentAlert?.cameraId) || MOCK_CAMERAS[0];

  const handleMark = (status) => {
    const updated = alerts.map((a, idx) => idx === currentIndex ? { ...a, status } : a);
    setAlerts(updated);
    if (currentIndex < alerts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="text-emerald-400" size={22} />
            Human-in-the-Loop Triage Review Queue
            <span className="badge badge-emerald text-xs">Route #37</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Rapid verification workspace to classify AI detections as True Positive or False Alarm to retrain edge models
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Reviewing <strong className="text-cyan-400">{currentIndex + 1}</strong> of <strong className="text-slate-200">{alerts.length}</strong> Pending Incidents
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
            <CctvCanvasSimulator
              cameraId={camera.id}
              cameraName={camera.name}
              mode="view"
              isAlert={true}
              aspectRatio="16/9"
            />
          </div>

          {/* Quick Decision Action Bar */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
            <button
              onClick={() => handleMark('False Alarm')}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-slate-700"
            >
              <X size={16} className="text-slate-400" />
              <span>[Key 1] Mark as False Alarm</span>
            </button>

            <button
              onClick={() => handleMark('True Positive')}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-950/40"
            >
              <Check size={16} />
              <span>[Key 2] Confirm True Threat</span>
            </button>
          </div>
        </div>

        {/* Incident Details Card */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Incident ID</span>
              <span className="text-cyan-400 font-bold">{currentAlert.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Classification</span>
              <span className="text-white font-bold">{currentAlert.type}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Confidence Score</span>
              <span className="text-emerald-400 font-bold">{currentAlert.confidence}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Camera Source</span>
              <span className="text-slate-300">{currentAlert.cameraName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Current Decision</span>
              <span className={`badge ${currentAlert.status === 'True Positive' ? 'badge-emerald' : (currentAlert.status === 'False Alarm' ? 'badge-slate' : 'badge-amber')}`}>
                {currentAlert.status}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <div className="text-slate-400 mb-1">Observation Note:</div>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                {currentAlert.snapshotNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
