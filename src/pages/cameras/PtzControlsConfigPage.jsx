import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Compass, ArrowLeft, Plus, Play, Trash2, RotateCcw } from 'lucide-react';
import CctvCanvasSimulator from '../../components/CctvCanvasSimulator';
import { MOCK_CAMERAS } from '../../data/mockData';

export default function PtzControlsConfigPage() {
  const { camera_id = 'cam-01' } = useParams();
  const camera = MOCK_CAMERAS.find(c => c.id === camera_id) || MOCK_CAMERAS[0];

  const [presets, setPresets] = useState([
    { id: 1, name: 'Home: North Perimeter Fence', pan: 0, tilt: 0, zoom: 1.0, dwell: 30 },
    { id: 2, name: 'Preset 2: Eastern Vehicle Gate', pan: 45, tilt: -10, zoom: 2.2, dwell: 15 },
    { id: 3, name: 'Preset 3: Transformer Yard', pan: -60, tilt: 15, zoom: 1.8, dwell: 20 },
  ]);

  const [tourActive, setTourActive] = useState(true);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link to={`/cameras/${camera.id}`} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Compass className="text-cyan-400" size={22} />
              PTZ Preset Coordinates & Automated Guard Tour Patrol
              <span className="badge badge-cyan text-xs">Route #55</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {camera.name} • Program robotic pan, tilt, optical zoom positions and patrol cycle timers
            </p>
          </div>
        </div>

        <button
          onClick={() => setTourActive(!tourActive)}
          className={`btn btn-sm font-bold ${tourActive ? 'btn-secondary text-emerald-400 border-emerald-800' : 'btn-primary'}`}
        >
          {tourActive ? '● Guard Tour Active' : 'Start Automated Tour'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
            <CctvCanvasSimulator
              cameraId={camera.id}
              cameraName={camera.name}
              mode="ptz"
              aspectRatio="16/9"
            />
          </div>
        </div>

        {/* Preset list */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs font-mono">
          <div className="flex justify-between items-center font-sans">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Patrol Presets</h2>
            <button className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
              <Plus size={12} /> Add Position
            </button>
          </div>

          <div className="space-y-2.5">
            {presets.map(p => (
              <div key={p.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white font-sans">{p.name}</span>
                  <span className="badge badge-cyan text-[10px]">{p.dwell}s Dwell</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Pan: {p.pan}°</span>
                  <span>Tilt: {p.tilt}°</span>
                  <span>Zoom: {p.zoom}X</span>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-primary w-full text-xs font-bold py-2.5 mt-2">
            Save PTZ Tour to Camera Eprom
          </button>
        </div>
      </div>
    </div>
  );
}
