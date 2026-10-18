import React, { useState } from 'react';
import { Play, Shield, Video, Layers, Sliders, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import CctvCanvasSimulator from '../../components/CctvCanvasSimulator';

export default function LiveDemoPage() {
  const [demoMode, setDemoMode] = useState('view'); // 'view', 'zones', 'ptz'

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="badge badge-emerald text-xs">Route #8 • Public Self-Guided Sandbox</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Interactive Live Detection Sandbox
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Test real-time bounding box tracking, dynamic night vision LUTs, and interactive polygon zone calibration right in your browser.
        </p>

        {/* Mode Selector */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setDemoMode('view')}
            className={`btn btn-sm ${demoMode === 'view' ? 'btn-primary font-bold' : 'btn-secondary text-slate-400'}`}
          >
            Live YOLO Tracking Feed
          </button>
          <button
            onClick={() => setDemoMode('zones')}
            className={`btn btn-sm ${demoMode === 'zones' ? 'btn-primary font-bold' : 'btn-secondary text-slate-400'}`}
          >
            Draw Detection Polygon
          </button>
          <button
            onClick={() => setDemoMode('ptz')}
            className={`btn btn-sm ${demoMode === 'ptz' ? 'btn-primary font-bold' : 'btn-secondary text-slate-400'}`}
          >
            Interactive PTZ Controls
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        <div className="rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl">
          <CctvCanvasSimulator
            cameraId="demo-sandbox"
            cameraName="AEGIS Live Interactive Sandbox Feed"
            mode={demoMode}
            isAlert={false}
            aspectRatio="16/9"
          />
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Click the controls below the video to toggle between RGB, Infrared Night, and FLIR Thermal shaders!</span>
          <Link to="/dashboard" className="text-cyan-400 font-bold hover:underline flex items-center gap-1">
            Launch Full SOC Command Center <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
