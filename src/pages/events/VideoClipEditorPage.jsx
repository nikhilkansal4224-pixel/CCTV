import React, { useState } from 'react';
import { Scissors, Download, Share2, Play, Check, Shield, Film } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_CAMERAS } from '../../data/mockData';

export default function VideoClipEditorPage() {
  const [selectedCam, setSelectedCam] = useState('cam-01');
  const [startTime, setStartTime] = useState('11:25:00');
  const [endTime, setEndTime] = useState('11:29:30');
  const [watermark, setWatermark] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = (e) => {
    e.preventDefault();
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 1500);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Scissors className="text-cyan-400" size={22} />
          Forensic Video Clipping & Multi-Angle Compiler
          <span className="badge badge-cyan text-xs">Route #43</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Trim, crop, redact, and package evidentiary video clips with cryptographic SHA-256 timestamps
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Mock Clip Previewer */}
          <div className="h-80 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-6 text-center cyber-grid-bg relative overflow-hidden">
            <Film size={48} className="text-cyan-400 mb-3 opacity-60" />
            <h3 className="text-base font-bold text-white">Clip Trimming Workspace</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Selected interval: {startTime} to {endTime} (Duration: 04m 30s)
            </p>
            {watermark && (
              <div className="absolute top-4 right-4 text-[10px] font-mono text-cyan-400 bg-black/60 px-2 py-1 rounded border border-cyan-500/30">
                SHA256 • AEGIS-LEGAL-WATERMARK-ON
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Export Format: <strong className="text-slate-200">MP4 (H.265 / AAC 48kHz)</strong></span>
            <span className="text-slate-400">Estimated Size: <strong className="text-cyan-400">142.8 MB</strong></span>
          </div>
        </div>

        {/* Trim Settings */}
        <form onSubmit={handleExport} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs font-mono">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Clip Boundaries</h2>

          <div>
            <label className="form-label font-sans">Source Camera</label>
            <select 
              value={selectedCam} 
              onChange={e => setSelectedCam(e.target.value)}
              className="form-select text-xs"
            >
              {MOCK_CAMERAS.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="form-label font-sans">Start Timestamp</label>
              <input 
                type="text" 
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="form-label font-sans">End Timestamp</label>
              <input 
                type="text" 
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-sans">
              <input 
                type="checkbox" 
                checked={watermark}
                onChange={e => setWatermark(e.target.checked)}
                className="accent-cyan-400"
              />
              <span>Burn cryptographic SHA-256 timecode watermark</span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isExporting}
            className="btn btn-primary w-full text-xs font-bold py-2.5 flex items-center justify-center gap-2"
          >
            {isExporting ? 'Generating Forensic Package...' : 'Export & Render Evidence Clip'}
          </button>

          <Link to="/exports" className="btn btn-secondary w-full text-xs text-center block">
            Go to Export Library
          </Link>
        </form>
      </div>
    </div>
  );
}
