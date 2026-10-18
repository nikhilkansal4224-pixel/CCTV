import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Camera, ArrowLeft, Activity, Radio, Cpu, HardDrive, Shield } from 'lucide-react';
import { MOCK_CAMERAS } from '../../data/mockData';

export default function CameraDetailsPage() {
  const { camera_id = 'cam-01' } = useParams();
  const camera = MOCK_CAMERAS.find(c => c.id === camera_id) || MOCK_CAMERAS[0];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link to="/cameras" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Camera Diagnostics & Sensor Telemetry
              <span className="badge badge-cyan text-xs">Route #54</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {camera.name} • Hardware Health & Network Performance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/live/${camera.id}`} className="btn btn-primary btn-sm text-xs font-bold">
            Live Stream Feed
          </Link>
          <Link to={`/cameras/${camera.id}/storage`} className="btn btn-secondary btn-sm text-xs">
            Storage Retention
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Stream Health */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <Activity size={16} className="text-cyan-400" />
            Stream Throughput
          </h2>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Current Ingestion Bitrate</span>
              <span className="text-cyan-400 font-bold">{camera.bitrate}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Ingested Frame Rate</span>
              <span className="text-emerald-400 font-bold">{camera.fps} FPS</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Packet Jitter & Loss</span>
              <span className="text-slate-200">0.00% (Lossless)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Round-Trip Latency</span>
              <span className="text-cyan-400 font-bold">{camera.latency}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Hardware Specs */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <Radio size={16} className="text-emerald-400" />
            Device Hardware
          </h2>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Manufacturer & Model</span>
              <span className="text-slate-200 font-bold">{camera.model}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Sensor Optical Native</span>
              <span className="text-cyan-400">{camera.resolution}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Night IR Profile</span>
              <span className="text-slate-200">{camera.nightMode}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">PTZ Mechanical Motor</span>
              <span className={camera.ptzSupported ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {camera.ptzSupported ? 'Supported (Pan/Tilt/Zoom)' : 'Fixed Lens'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Assigned Edge Node */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <Cpu size={16} className="text-purple-400" />
            Inference Pipeline
          </h2>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Allocated Edge Gateway</span>
              <span className="text-purple-400 font-bold">Node Alpha (Jetson)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Active Model</span>
              <span className="text-slate-200">{camera.aiModel}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Dwell Delay</span>
              <span className="text-amber-400">{camera.dwellTimeSec}s</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Retention Storage</span>
              <span className="text-emerald-400">{camera.storageRetentionDays} Days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
