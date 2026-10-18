import React, { useState } from 'react';
import { Cpu, Check, Layers, ShieldCheck, Zap, HardHat, Car, UserX } from 'lucide-react';

export default function AiModelSelectorPage() {
  const [models, setModels] = useState([
    {
      id: 'mdl-1',
      name: 'YOLOv9 General Human & Vehicle Engine',
      description: 'Standard 80-class real-time detector optimized with TensorRT INT8 quantization for sub-20ms inference.',
      category: 'General Perimeter',
      accuracy: '99.4%',
      fps: '30 FPS/cam',
      activeOnStreams: 8,
      enabled: true
    },
    {
      id: 'mdl-2',
      name: 'Spatial Loitering & Unattended Object Vector',
      description: 'Tracks target dwell duration vectors inside user-defined polygons. Detects static backpacks, trailers, or lingering subjects.',
      category: 'Behavioral Analysis',
      accuracy: '97.8%',
      fps: '25 FPS/cam',
      activeOnStreams: 4,
      enabled: true
    },
    {
      id: 'mdl-3',
      name: 'OSHA Construction PPE (Hardhat / Vest) Classifier',
      description: 'Detects absence of mandatory protective helmets and high-visibility safety clothing within active industrial work zones.',
      category: 'Safety Compliance',
      accuracy: '96.2%',
      fps: '20 FPS/cam',
      activeOnStreams: 1,
      enabled: true
    },
    {
      id: 'mdl-4',
      name: 'Concealed Weapon & Firearm Detection Model',
      description: 'High-security secondary neural net trained on handgun and rifle geometry with ultra-low false alarm threshold.',
      category: 'High Threat Level',
      accuracy: '98.9%',
      fps: '15 FPS/cam',
      activeOnStreams: 2,
      enabled: false
    }
  ]);

  const toggleModel = (id) => {
    setModels(models.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Cpu className="text-cyan-400" size={22} />
          AI Neural Model Selector & Weights Manager
          <span className="badge badge-cyan text-xs">Route #51</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Deploy specialized neural architectures to edge nodes: Human Presence, Loitering, Perimeter Intrusion, and PPE Hardhats
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {models.map(m => (
          <div 
            key={m.id} 
            className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
              m.enabled 
                ? 'bg-slate-900/70 border-cyan-500/40 shadow-lg shadow-cyan-950/20' 
                : 'bg-slate-950/40 border-slate-800/80 opacity-75'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="badge badge-slate text-[10px]">{m.category}</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">{m.accuracy} mAP</span>
              </div>
              <h2 className="text-base font-bold text-white">{m.name}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {m.description}
              </p>
              <div className="pt-2 flex items-center gap-4 text-xs font-mono text-slate-400">
                <span>Inference: <strong className="text-slate-200">{m.fps}</strong></span>
                <span>Active On: <strong className="text-cyan-400">{m.activeOnStreams} Streams</strong></span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className={`text-xs font-mono font-bold ${m.enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                {m.enabled ? '● Running on Edge ASIC' : '○ Disabled'}
              </span>
              <button
                onClick={() => toggleModel(m.id)}
                className={`btn btn-sm ${m.enabled ? 'btn-secondary text-red-400 hover:text-red-300' : 'btn-primary font-bold'}`}
              >
                {m.enabled ? 'Deactivate Model' : 'Deploy to Node'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
