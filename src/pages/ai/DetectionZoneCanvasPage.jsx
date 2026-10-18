import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layers, ArrowLeft, Save, RotateCcw, AlertTriangle, Shield } from 'lucide-react';
import CctvCanvasSimulator from '../../components/CctvCanvasSimulator';
import { MOCK_CAMERAS } from '../../data/mockData';

export default function DetectionZoneCanvasPage() {
  const { camera_id = 'cam-01' } = useParams();
  const camera = MOCK_CAMERAS.find(c => c.id === camera_id) || MOCK_CAMERAS[0];

  const [zoneType, setZoneType] = useState('inclusion'); // 'inclusion', 'exclusion', 'tripwire'
  const [zoneName, setZoneName] = useState('Perimeter Fence Outer Boundary');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link to={`/live/${camera.id}`} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="text-cyan-400" size={22} />
              Interactive Detection Polygon Canvas
              <span className="badge badge-cyan text-xs">Route #47</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {camera.name} • Click directly on video feed to plot boundary points
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleSave}
            className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>{savedSuccess ? 'Zone Calibrated!' : 'Save Calibration to Edge'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Interactive Canvas Viewport */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl overflow-hidden border border-cyan-500/40 shadow-2xl">
            <CctvCanvasSimulator
              cameraId={camera.id}
              cameraName={camera.name}
              mode="zones"
              isAlert={false}
              aspectRatio="16/9"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono flex items-center justify-between text-slate-400">
            <span>Instructions: Click anywhere on video to place polygon vertices. Drag or reset to clear.</span>
            <span className="text-cyan-400">Status: Calibration Mode Active</span>
          </div>
        </div>

        {/* Zone Configuration Parameters */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs font-mono">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
            Zone Properties
          </h2>

          <div>
            <label className="form-label font-sans">Zone Identifier</label>
            <input
              type="text"
              value={zoneName}
              onChange={e => setZoneName(e.target.value)}
              className="form-input text-xs"
            />
          </div>

          <div>
            <label className="form-label font-sans">Trigger Type</label>
            <div className="space-y-2 font-sans">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                <input 
                  type="radio" 
                  name="zoneType" 
                  checked={zoneType === 'inclusion'} 
                  onChange={() => setZoneType('inclusion')}
                  className="accent-cyan-400"
                />
                <div>
                  <div className="font-bold text-white">Inclusion Polygon</div>
                  <div className="text-[11px] text-slate-400">Alert immediately when human enters</div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                <input 
                  type="radio" 
                  name="zoneType" 
                  checked={zoneType === 'exclusion'} 
                  onChange={() => setZoneType('exclusion')}
                  className="accent-cyan-400"
                />
                <div>
                  <div className="font-bold text-white">Exclusion Mask</div>
                  <div className="text-[11px] text-slate-400">Ignore movement (e.g. public sidewalk)</div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                <input 
                  type="radio" 
                  name="zoneType" 
                  checked={zoneType === 'tripwire'} 
                  onChange={() => setZoneType('tripwire')}
                  className="accent-cyan-400"
                />
                <div>
                  <div className="font-bold text-white">Virtual Directional Tripwire</div>
                  <div className="text-[11px] text-slate-400">Cross-line vector crossing alert</div>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <Link to={`/cameras/${camera.id}/sensitivity`} className="btn btn-secondary btn-sm w-full text-center">
              Configure Detection Sensitivity →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
