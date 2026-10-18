import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Grid, LayoutGrid, Maximize2, Shield, AlertTriangle, 
  Video, Eye, Volume2, Settings, Filter, RefreshCw, Layers 
} from 'lucide-react';
import CctvCanvasSimulator from '../../components/CctvCanvasSimulator';
import { MOCK_CAMERAS, MOCK_ALERTS } from '../../data/mockData';

export default function CommandDashboard() {
  const [gridSize, setGridSize] = useState('2x2'); // '1x1', '2x2', '3x3', '4x4'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'alerts', 'perimeter'

  const filteredCameras = MOCK_CAMERAS.filter(cam => {
    if (activeFilter === 'alerts') return cam.status === 'alert';
    if (activeFilter === 'perimeter') return cam.location.toLowerCase().includes('perimeter') || cam.location.toLowerCase().includes('gate');
    return true;
  });

  const displayCount = gridSize === '1x1' ? 1 : (gridSize === '2x2' ? 4 : (gridSize === '3x3' ? 6 : 8));
  const camerasToDisplay = filteredCameras.slice(0, displayCount);

  return (
    <div className="p-6 space-y-6">
      {/* Dashboard Top Control Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              SOC Multi-Grid Command Center
              <span className="badge badge-cyan text-xs">8 Streams Ingesting</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time neural bounding-box telemetry with zero edge latency
          </p>
        </div>

        {/* Grid & Filter Selectors */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Quick Filter */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded transition cursor-pointer ${activeFilter === 'all' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              All Feeds (8)
            </button>
            <button
              onClick={() => setActiveFilter('alerts')}
              className={`px-3 py-1 rounded transition cursor-pointer flex items-center gap-1 ${activeFilter === 'alerts' ? 'bg-red-500/20 text-red-400 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              <span className="live-dot live-dot-red"></span>
              Alerts (3)
            </button>
            <button
              onClick={() => setActiveFilter('perimeter')}
              className={`px-3 py-1 rounded transition cursor-pointer ${activeFilter === 'perimeter' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Perimeter Only
            </button>
          </div>

          {/* Grid Layout Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs font-mono">
            {['1x1', '2x2', '3x3', '4x4'].map((grid) => (
              <button
                key={grid}
                onClick={() => setGridSize(grid)}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  gridSize === grid 
                    ? 'bg-slate-800 text-cyan-400 font-bold border border-cyan-500/40' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {grid}
              </button>
            ))}
          </div>

          <Link to="/live/kiosk" className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5">
            <Maximize2 size={13} />
            <span>Kiosk Mode</span>
          </Link>

          <Link to="/cameras/new" className="btn btn-primary btn-sm text-xs flex items-center gap-1.5 font-bold">
            <span>+ Add Stream</span>
          </Link>
        </div>
      </div>

      {/* Main Dynamic Video Matrix */}
      <div 
        className={`grid gap-4 ${
          gridSize === '1x1' 
            ? 'grid-cols-1' 
            : (gridSize === '2x2' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3')
        }`}
      >
        {camerasToDisplay.map((cam) => {
          const hasAlert = cam.status === 'alert';
          return (
            <div 
              key={cam.id} 
              className={`rounded-xl overflow-hidden border transition-all ${
                hasAlert 
                  ? 'border-red-500/60 shadow-lg shadow-red-950/40 ring-1 ring-red-500/40' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Camera Header Banner */}
              <div className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 truncate">
                  <span className={`live-dot ${hasAlert ? 'live-dot-red' : 'live-dot-green'}`}></span>
                  <span className="font-bold text-white truncate">{cam.name}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="hidden sm:inline">{cam.resolution}</span>
                  <Link 
                    to={`/live/${cam.id}`}
                    className="p-1 rounded hover:bg-slate-800 text-cyan-400 hover:text-cyan-300"
                    title="Expand Single Stream"
                  >
                    <Eye size={14} />
                  </Link>
                  <Link 
                    to={`/cameras/${cam.id}/zones`}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                    title="Calibrate Detection Zones"
                  >
                    <Layers size={14} />
                  </Link>
                </div>
              </div>

              {/* Real-time Interactive Video Simulator */}
              <CctvCanvasSimulator
                cameraId={cam.id}
                cameraName={cam.name}
                mode="view"
                isAlert={hasAlert}
                aspectRatio="16/9"
              />

              {/* Feed Status Footer */}
              <div className="px-3 py-1.5 bg-slate-950 text-[11px] font-mono border-t border-slate-900 flex items-center justify-between text-slate-400">
                <span>Model: <strong className="text-slate-300">{cam.aiModel}</strong></span>
                <span className="flex items-center gap-2">
                  <span>Threshold: <strong className="text-cyan-400">{cam.confidenceThreshold}%</strong></span>
                  <span>Latency: <strong className="text-emerald-400">{cam.latency}</strong></span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Summary Telemetry Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono">STREAMS ONLINE</div>
          <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-2">
            8 / 8
            <span className="text-xs font-normal text-emerald-400 font-mono">100% Uptime</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono">AVG EDGE LATENCY</div>
          <div className="text-xl font-bold text-cyan-400 mt-1 flex items-baseline gap-2">
            38 ms
            <span className="text-xs font-normal text-slate-400 font-mono">Jetson Orin</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono">ACTIVE BREACHES</div>
          <div className="text-xl font-bold text-red-400 mt-1 flex items-baseline gap-2">
            2 Alerts
            <span className="text-xs font-normal text-red-500 font-mono animate-pulse">Dispatched</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono">TOTAL DETECTIONS TODAY</div>
          <div className="text-xl font-bold text-purple-400 mt-1 flex items-baseline gap-2">
            1,492
            <span className="text-xs font-normal text-slate-400 font-mono">99.4% Precision</span>
          </div>
        </div>
      </div>
    </div>
  );
}
