import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, Sun, Moon, Flame, Sliders } from 'lucide-react';
import CctvCanvasSimulator from '../../components/CctvCanvasSimulator';
import { MOCK_CAMERAS } from '../../data/mockData';

export default function ThermalCalibrationPage() {
  const { camera_id = 'cam-01' } = useParams();
  const camera = MOCK_CAMERAS.find(c => c.id === camera_id) || MOCK_CAMERAS[0];

  const [filterMode, setFilterMode] = useState('thermal'); // 'normal', 'night', 'thermal'
  const [contrast, setContrast] = useState(65);
  const [gain, setGain] = useState(40);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link to={`/live/${camera.id}`} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Flame className="text-purple-400" size={22} />
              Night Vision & Thermal FLIR Sensor Calibration
              <span className="badge badge-purple text-xs">Route #50</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {camera.name} • Calibrate infrared gain LUTs and thermal radiometric sensitivity for zero-lux sites
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs font-mono">
          <button
            onClick={() => setFilterMode('normal')}
            className={`px-3 py-1 rounded transition ${filterMode === 'normal' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Day RGB
          </button>
          <button
            onClick={() => setFilterMode('night')}
            className={`px-3 py-1 rounded transition ${filterMode === 'night' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Smart-IR (Night)
          </button>
          <button
            onClick={() => setFilterMode('thermal')}
            className={`px-3 py-1 rounded transition ${filterMode === 'thermal' ? 'bg-purple-500/20 text-purple-400 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Thermal Ironbow
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
            <CctvCanvasSimulator
              cameraId={camera.id}
              cameraName={camera.name}
              mode="view"
              initialFilter={filterMode}
              aspectRatio="16/9"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono flex items-center justify-between text-slate-400">
            <span>Radiometric Range: -20°C to +150°C</span>
            <span className="text-purple-400">FLIR Lepton 3.5 Core Sensor</span>
          </div>
        </div>

        {/* Sliders */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-6 text-xs font-mono">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
            Sensor Image Tuning
          </h2>

          <div className="space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>Dynamic Range Contrast:</span>
              <span className="text-cyan-400">{contrast}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={contrast}
              onChange={e => setContrast(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>Infrared LED Gain Boost:</span>
              <span className="text-emerald-400">{gain} dB</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={gain}
              onChange={e => setGain(Number(e.target.value))}
              className="w-full accent-emerald-400"
            />
          </div>

          <button className="btn btn-primary w-full text-xs font-bold py-2.5">
            Save Sensor Calibration
          </button>
        </div>
      </div>
    </div>
  );
}
