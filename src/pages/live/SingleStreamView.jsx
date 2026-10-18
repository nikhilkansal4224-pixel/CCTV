import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Volume2, VolumeX, Maximize2, Shield, AlertTriangle, 
  Layers, Sliders, Radio, Camera, Clock, Compass, Activity, Download 
} from 'lucide-react';
import CctvCanvasSimulator from '../../components/CctvCanvasSimulator';
import { MOCK_CAMERAS } from '../../data/mockData';

export default function SingleStreamView() {
  const { camera_id = 'cam-01' } = useParams();
  const camera = MOCK_CAMERAS.find(c => c.id === camera_id) || MOCK_CAMERAS[0];

  const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry', 'ptz', 'events'

  return (
    <div className="p-6 space-y-6">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{camera.name}</h1>
              <span className={`badge ${camera.status === 'alert' ? 'badge-crimson' : 'badge-emerald'}`}>
                {camera.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {camera.location} • IP: {camera.ip} • RTSP / WebRTC 4K H.265
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/cameras/${camera.id}/zones`} className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5">
            <Layers size={14} className="text-cyan-400" />
            <span>Detection Zones</span>
          </Link>
          <Link to={`/cameras/${camera.id}/sensitivity`} className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5">
            <Sliders size={14} className="text-cyan-400" />
            <span>Sensitivity</span>
          </Link>
          <Link to={`/playback/${camera.id}`} className="btn btn-primary btn-sm text-xs flex items-center gap-1.5">
            <Clock size={14} />
            <span>24/7 Playback</span>
          </Link>
        </div>
      </div>

      {/* Main Stream Viewport & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Expanded 4K Video Canvas */}
        <div className="lg:col-span-3 space-y-4">
          <CctvCanvasSimulator
            cameraId={camera.id}
            cameraName={camera.name}
            mode="ptz"
            isAlert={camera.status === 'alert'}
            aspectRatio="16/9"
          />

          {/* Quick Snapshot / Record Action Bar */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Stream Codec: <strong className="text-slate-200">HEVC (H.265)</strong></span>
              <span className="text-slate-400">Bitrate: <strong className="text-cyan-400">{camera.bitrate}</strong></span>
              <span className="text-slate-400">Frame Rate: <strong className="text-emerald-400">{camera.fps} FPS</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5">
                <Camera size={13} /> Take Instant Snapshot
              </button>
              <button className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5">
                <Download size={13} /> Export 60s Clip
              </button>
            </div>
          </div>
        </div>

        {/* Right Inspection Drawer */}
        <div className="space-y-4">
          {/* Sub tabs */}
          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex-1 py-1.5 rounded transition font-medium ${activeTab === 'telemetry' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Telemetry
            </button>
            <button
              onClick={() => setActiveTab('ptz')}
              className={`flex-1 py-1.5 rounded transition font-medium ${activeTab === 'ptz' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              PTZ Guard
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 py-1.5 rounded transition font-medium ${activeTab === 'events' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Detections
            </button>
          </div>

          {activeTab === 'telemetry' && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Activity size={15} className="text-cyan-400" />
                Live Sensor Diagnostics
              </h3>

              <div className="space-y-2.5 font-mono">
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Hardware Model</span>
                  <span className="text-slate-200 font-bold">{camera.model}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Resolution</span>
                  <span className="text-cyan-400">{camera.resolution}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">AI Model Active</span>
                  <span className="text-purple-400">{camera.aiModel}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Confidence Cutoff</span>
                  <span className="text-emerald-400">{camera.confidenceThreshold}%</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Night Vision Profile</span>
                  <span className="text-slate-300">{camera.nightMode}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Retention Rule</span>
                  <span className="text-slate-300">{camera.storageRetentionDays} Days Local+S3</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ptz' && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Compass size={15} className="text-cyan-400" />
                PTZ Preset Patrol
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Automated guard tour cycles between 4 calibrated pan-tilt positions every 45 seconds.
              </p>
              <div className="space-y-2">
                {['Preset 1: North Outer Gate', 'Preset 2: Fence Corner East', 'Preset 3: Loading Trailer Bay', 'Preset 4: Generator Compound'].map((preset, idx) => (
                  <button
                    key={preset}
                    className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>{preset}</span>
                    <span className="text-[10px] font-mono text-cyan-400">Goto</span>
                  </button>
                ))}
              </div>
              <Link to={`/cameras/${camera.id}/ptz`} className="btn btn-outline-cyan btn-sm w-full text-center">
                Configure PTZ Coordinates
              </Link>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-400" />
                Recent Stream Detections
              </h3>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/50">
                  <div className="flex justify-between text-[11px] font-mono font-bold text-red-400">
                    <span>PERIMETER BREACH</span>
                    <span>2 mins ago</span>
                  </div>
                  <p className="text-slate-300 text-[11px] mt-1">Human target scaled outer perimeter chainlink.</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700">
                  <div className="flex justify-between text-[11px] font-mono text-cyan-400">
                    <span>HUMAN DETECTED</span>
                    <span>42 mins ago</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1">Security guard patrol cycle verified.</p>
                </div>
              </div>
              <Link to="/events" className="btn btn-secondary btn-sm w-full text-center">
                View Full Event Archive
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
