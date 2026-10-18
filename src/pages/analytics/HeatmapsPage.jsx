import React, { useState } from 'react';
import { Flame, Calendar, Clock, Filter, Eye } from 'lucide-react';
import { MOCK_CAMERAS } from '../../data/mockData';

export default function HeatmapsPage() {
  const [selectedCam, setSelectedCam] = useState('cam-01');
  const [timeRange, setTimeRange] = useState('7d'); // '24h', '7d', '30d'

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="text-amber-400" size={22} />
            Foot Traffic Spatial Density Heatmaps
            <span className="badge badge-amber text-xs">Route #66</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual activity accumulation maps showing pedestrian congestion bottlenecks and loitering hotspots over time
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select 
            value={selectedCam} 
            onChange={e => setSelectedCam(e.target.value)}
            className="form-select text-xs w-56 font-mono"
          >
            {MOCK_CAMERAS.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs font-mono">
            {['24h', '7d', '30d'].map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1 rounded transition ${timeRange === t ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap Visual Canvas */}
      <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 relative overflow-hidden min-h-[460px] flex flex-col justify-between cyber-grid-bg">
        {/* Heatmap Blobs Simulation Overlay */}
        <div className="relative w-full h-[360px] rounded-lg bg-slate-900/60 border border-slate-800 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 opacity-80"></div>

          {/* High density hotspot */}
          <div 
            className="absolute top-[35%] left-[45%] w-64 h-64 rounded-full pointer-events-none opacity-60"
            style={{
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.9) 0%, rgba(245, 158, 11, 0.7) 35%, rgba(0, 240, 255, 0.3) 70%, transparent 100%)',
              filter: 'blur(30px)'
            }}
          ></div>

          {/* Secondary hotspot */}
          <div 
            className="absolute top-[60%] left-[25%] w-44 h-44 rounded-full pointer-events-none opacity-50"
            style={{
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.8) 0%, rgba(0, 240, 255, 0.4) 60%, transparent 100%)',
              filter: 'blur(25px)'
            }}
          ></div>

          <div className="relative z-10 text-center space-y-2">
            <span className="badge badge-amber text-xs">Accumulated Heatmap: {timeRange.toUpperCase()}</span>
            <h3 className="text-lg font-bold text-white">North Perimeter Fence • Sector 3 Ingress</h3>
            <p className="text-xs text-slate-400 font-mono">
              Peak Traffic Density: 11:00 AM - 02:00 PM • Total Pedestrian Crossings: 418
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="pt-4 border-t border-slate-900 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-4">
            <span>Low Presence (0-5/hr)</span>
            <div className="w-36 h-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-amber-400 to-red-500"></div>
            <span>High Density (80+/hr)</span>
          </div>
          <span>Sensor Data Refreshed: Real-time</span>
        </div>
      </div>
    </div>
  );
}
