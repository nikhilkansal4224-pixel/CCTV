import React from 'react';
import { Cpu, Activity, Zap, CheckCircle2, Sliders, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AiOverviewPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="text-cyan-400" size={22} />
            AI Detection Engine & Neural Pipeline Status
            <span className="badge badge-cyan text-xs">Route #46</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry on active inference models, GPU TensorRT pipelines, throughput, and sub-second latencies
          </p>
        </div>

        <Link to="/ai/models" className="btn btn-primary btn-sm text-xs font-bold">
          Model Directory & Neural Weights
        </Link>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono">EDGE INFERENCE FPS</div>
          <div className="text-2xl font-bold text-white mt-1">240 FPS</div>
          <div className="text-[11px] text-emerald-400 font-mono mt-0.5">8 Simultaneous 30fps Streams</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono">AVERAGE LATENCY</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">18.4 ms</div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">TensorRT FP16 Optimized</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono">DETECTION PRECISION</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">99.4%</div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">0.6% False Positive Rate</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono">TENSOR CORES LOAD</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">64%</div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">Jetson AGX Orin Cluster</div>
        </div>
      </div>

      {/* Active Neural Models Table */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
          Running Neural Networks
        </h2>

        <div className="space-y-3">
          {[
            { name: 'YOLOv9-Surveillance-FP16', type: 'Human & Vehicle Detection', streams: '8 Streams', memory: '4.2 GB VRAM', status: 'Running (Optimal)' },
            { name: 'Aegis-Loiter-Tracker-v3', type: 'Spatial Dwell Vector Engine', streams: '8 Streams', memory: '1.8 GB VRAM', status: 'Running (Optimal)' },
            { name: 'OSHA-Hardhat-PPE-Net', type: 'Safety Compliance Classifier', streams: 'Cam 07 Zone B', memory: '980 MB VRAM', status: 'Running (Optimal)' },
            { name: 'ANPR-OCR-Plate-Net', type: 'Vehicle License Recognition', streams: 'Cam 02 Main Gate', memory: '1.2 GB VRAM', status: 'Running (Optimal)' },
          ].map((m, idx) => (
            <div key={idx} className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <div className="space-y-0.5">
                <div className="font-bold text-white text-sm font-sans">{m.name}</div>
                <div className="text-slate-400">{m.type} • {m.streams}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-slate-400">{m.memory}</span>
                <span className="badge badge-emerald text-[10px]">{m.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
