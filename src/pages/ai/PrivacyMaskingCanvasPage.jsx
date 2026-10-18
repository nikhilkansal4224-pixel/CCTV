import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, ArrowLeft, EyeOff, Save, Trash2 } from 'lucide-react';
import CctvCanvasSimulator from '../../components/CctvCanvasSimulator';
import { MOCK_CAMERAS } from '../../data/mockData';

export default function PrivacyMaskingCanvasPage() {
  const { camera_id = 'cam-01' } = useParams();
  const camera = MOCK_CAMERAS.find(c => c.id === camera_id) || MOCK_CAMERAS[0];

  const [blurLevel, setBlurLevel] = useState('full-black');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
              <EyeOff className="text-cyan-400" size={22} />
              Privacy Masking & In-Encoder Redaction
              <span className="badge badge-cyan text-xs">Route #49</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {camera.name} • GDPR & Legal Compliance: Mask sensitive windows, restrooms, or neighboring properties
            </p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5"
        >
          <Save size={14} />
          <span>{saved ? '✓ Hardware Mask Saved' : 'Commit Mask to Camera ASIC'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
            <CctvCanvasSimulator
              cameraId={camera.id}
              cameraName={camera.name}
              mode="mask"
              isAlert={false}
              aspectRatio="16/9"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400">
            Privacy regions are permanently redacted at the hardware video sensor before encoding and storage.
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs font-mono">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
            Redaction Method
          </h2>

          <div className="space-y-2 font-sans">
            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
              <input 
                type="radio" 
                name="blur" 
                checked={blurLevel === 'full-black'} 
                onChange={() => setBlurLevel('full-black')} 
                className="accent-cyan-400"
              />
              <div>
                <div className="font-bold text-white">Solid Opaque Black Block</div>
                <div className="text-[11px] text-slate-400">Zero photons recorded (GDPR Safe)</div>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
              <input 
                type="radio" 
                name="blur" 
                checked={blurLevel === 'pixelate'} 
                onChange={() => setBlurLevel('pixelate')} 
                className="accent-cyan-400"
              />
              <div>
                <div className="font-bold text-white">Mosaic Pixelate Blur</div>
                <div className="text-[11px] text-slate-400">Preserves ambient light levels</div>
              </div>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <div className="text-slate-400 mb-2 font-sans">Active Masks:</div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span>Mask #1: East Window Block</span>
              <Trash2 size={13} className="text-red-400 hover:text-red-300 cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
