import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sliders, ArrowLeft, Save, CheckCircle2 } from 'lucide-react';
import { MOCK_CAMERAS } from '../../data/mockData';

export default function SensitivityThresholdPage() {
  const { camera_id = 'cam-01' } = useParams();
  const camera = MOCK_CAMERAS.find(c => c.id === camera_id) || MOCK_CAMERAS[0];

  const [confidence, setConfidence] = useState(camera.confidenceThreshold || 88);
  const [minSize, setMinSize] = useState(camera.minTargetSize || 45);
  const [dwellTime, setDwellTime] = useState(camera.dwellTimeSec || 5);
  const [ignoreAnimals, setIgnoreAnimals] = useState(true);
  const [ignoreFoliage, setIgnoreFoliage] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <Link to={`/live/${camera.id}`} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="text-cyan-400" size={22} />
            Object Filtering & Sensitivity Calibration
            <span className="badge badge-cyan text-xs">Route #48</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {camera.name} • Fine-tune neural confidence scores, minimum human pixel volume, and loiter dwell timers
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="max-w-3xl p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-6">
        {/* Slider 1: Confidence Cutoff */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-300 font-bold uppercase">Confidence Score Threshold</span>
            <span className="text-cyan-400 font-bold text-sm">{confidence}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="98"
            value={confidence}
            onChange={e => setConfidence(Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
          <p className="text-[11px] text-slate-400">
            Detections below this cutoff will be silently dropped to avoid false alarms from shadows or headlights.
          </p>
        </div>

        {/* Slider 2: Min Target Size */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-300 font-bold uppercase">Minimum Human Pixel Volume</span>
            <span className="text-emerald-400 font-bold text-sm">{minSize}px</span>
          </div>
          <input
            type="range"
            min="20"
            max="120"
            value={minSize}
            onChange={e => setMinSize(Number(e.target.value))}
            className="w-full accent-emerald-400"
          />
          <p className="text-[11px] text-slate-400">
            Filters out distant objects or small wildlife (raccoons, birds) smaller than {minSize} pixels.
          </p>
        </div>

        {/* Slider 3: Dwell Time */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-300 font-bold uppercase">Loitering Dwell Trigger Delay</span>
            <span className="text-amber-400 font-bold text-sm">{dwellTime} Seconds</span>
          </div>
          <input
            type="range"
            min="1"
            max="60"
            value={dwellTime}
            onChange={e => setDwellTime(Number(e.target.value))}
            className="w-full accent-amber-400"
          />
          <p className="text-[11px] text-slate-400">
            Alert is only raised if subject remains stationary inside zone for longer than {dwellTime} continuous seconds.
          </p>
        </div>

        {/* Toggle checkboxes */}
        <div className="pt-4 border-t border-slate-800 space-y-3 text-xs">
          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={ignoreAnimals}
              onChange={e => setIgnoreAnimals(e.target.checked)}
              className="accent-cyan-400"
            />
            <span>Active Animal Filter (Classify 4-legged mammals as non-threat)</span>
          </label>

          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={ignoreFoliage}
              onChange={e => setIgnoreFoliage(e.target.checked)}
              className="accent-cyan-400"
            />
            <span>Wind / Tree Foliage Harmonic Motion Suppression</span>
          </label>
        </div>

        <button type="submit" className="btn btn-primary text-xs font-bold py-2.5 px-6">
          {saved ? '✓ Calibration Synced to Edge' : 'Save & Deploy Sensitivity'}
        </button>
      </form>
    </div>
  );
}
