import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HardDrive, ArrowLeft, Save, Cloud, Database } from 'lucide-react';
import { MOCK_CAMERAS } from '../../data/mockData';

export default function RetentionSchedulePage() {
  const { camera_id = 'cam-01' } = useParams();
  const camera = MOCK_CAMERAS.find(c => c.id === camera_id) || MOCK_CAMERAS[0];

  const [localDays, setLocalDays] = useState(camera.storageRetentionDays || 30);
  const [cloudBackup, setCloudBackup] = useState(true);
  const [recordMode, setRecordMode] = useState('motion-continuous'); // 'continuous', 'motion-only', 'motion-continuous'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <Link to={`/cameras/${camera.id}`} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <HardDrive className="text-cyan-400" size={22} />
            Recording Schedule & Cloud Retention Rules
            <span className="badge badge-cyan text-xs">Route #56</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {camera.name} • Manage local NVMe/RAID quotas, AWS S3 cold vault archives, and FIFO auto-purge policies
          </p>
        </div>
      </div>

      <div className="max-w-2xl p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-6 text-xs font-mono">
        {/* Retention Days */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-bold uppercase font-sans">Storage Retention Duration</span>
            <span className="text-cyan-400 font-bold text-sm">{localDays} Days</span>
          </div>
          <input
            type="range"
            min="7"
            max="180"
            step="7"
            value={localDays}
            onChange={e => setLocalDays(Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>7 Days (Min)</span>
            <span>30 Days (Standard)</span>
            <span>90 Days (SOC2)</span>
            <span>180 Days (Legal Hold)</span>
          </div>
        </div>

        {/* Recording Mode */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="form-label font-sans">Stream Ingestion Strategy</label>
          <div className="space-y-2 font-sans">
            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
              <input 
                type="radio" 
                name="recMode" 
                checked={recordMode === 'motion-continuous'} 
                onChange={() => setRecordMode('motion-continuous')}
                className="accent-cyan-400"
              />
              <div>
                <div className="font-bold text-white">Hybrid: 1080p Continuous + 4K on AI Detection</div>
                <div className="text-[11px] text-slate-400">Saves 68% disk while capturing forensic 4K detail during threats</div>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
              <input 
                type="radio" 
                name="recMode" 
                checked={recordMode === 'continuous'} 
                onChange={() => setRecordMode('continuous')}
                className="accent-cyan-400"
              />
              <div>
                <div className="font-bold text-white">Continuous Full 4K (24/7 Uncompressed)</div>
                <div className="text-[11px] text-slate-400">Requires ~48GB storage per camera per day</div>
              </div>
            </label>
          </div>
        </div>

        {/* S3 Glacier Archival */}
        <div className="pt-2 border-t border-slate-800">
          <label className="flex items-center gap-2 text-slate-300 font-sans cursor-pointer">
            <input 
              type="checkbox" 
              checked={cloudBackup} 
              onChange={e => setCloudBackup(e.target.checked)}
              className="accent-cyan-400"
            />
            <span>Mirror all verified AI incident clips to immutable AWS S3 Glacier Vault</span>
          </label>
        </div>

        <button className="btn btn-primary text-xs font-bold py-2.5 px-6">
          Save Retention Schedule
        </button>
      </div>
    </div>
  );
}
