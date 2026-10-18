import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minimize2, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import CctvCanvasSimulator from '../../components/CctvCanvasSimulator';
import { MOCK_CAMERAS } from '../../data/mockData';

export default function KioskMatrixView() {
  const [layout, setLayout] = useState('3x3'); // '2x2', '3x3', '4x4'
  const cameras = MOCK_CAMERAS.slice(0, layout === '2x2' ? 4 : (layout === '3x3' ? 6 : 8));

  return (
    <div className="fixed inset-0 z-50 bg-black text-slate-100 flex flex-col overflow-hidden font-mono select-none">
      {/* Sleek Minimal HUD Bar */}
      <div className="h-10 px-4 bg-slate-950 border-b border-slate-900 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Shield size={14} />
            AEGIS KIOSK SOC WALL
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="live-dot live-dot-green"></span>
            8/8 NODES SYNCHRONIZED (38ms RTT)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {['2x2', '3x3', '4x4'].map(mode => (
            <button
              key={mode}
              onClick={() => setLayout(mode)}
              className={`px-2 py-0.5 rounded text-[11px] ${layout === mode ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              {mode}
            </button>
          ))}
          <Link
            to="/dashboard"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1 text-[11px] px-2 ml-2"
          >
            <Minimize2 size={12} />
            <span>Exit Kiosk</span>
          </Link>
        </div>
      </div>

      {/* Edge-to-Edge Grid Matrix */}
      <div 
        className={`flex-1 p-2 grid gap-2 overflow-hidden ${
          layout === '2x2' 
            ? 'grid-cols-2 grid-rows-2' 
            : (layout === '3x3' ? 'grid-cols-3 grid-rows-2' : 'grid-cols-4 grid-rows-2')
        }`}
      >
        {cameras.map(cam => (
          <div key={cam.id} className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex flex-col">
            <div className="flex-1 w-full h-full relative">
              <CctvCanvasSimulator
                cameraId={cam.id}
                cameraName={cam.name}
                mode="view"
                showControls={false}
                isAlert={cam.status === 'alert'}
                aspectRatio="16/9"
              />
            </div>
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] text-white flex items-center gap-1.5 border border-white/10">
              <span className={`live-dot ${cam.status === 'alert' ? 'live-dot-red' : 'live-dot-green'}`}></span>
              <span className="font-bold truncate max-w-[150px]">{cam.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
