import React from 'react';
import { Cpu, Zap, Shield, Server, Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TechnologyPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="badge badge-cyan text-xs">Route #3 • Deep Tech Specification</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Edge vs. Cloud Computer Vision Architecture
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Why transmitting 4K video feeds to the cloud creates 15-second latency gaps — and how local edge neural compilation solves it.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Cpu size={22} />
          </div>
          <h2 className="text-xl font-bold text-white">NVIDIA Jetson & TensorRT Compilation</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Our models are quantized to INT8 precision using NVIDIA TensorRT, enabling dense matrix multiplication directly on local Deep Learning Accelerators (DLAs). This produces a sustained <strong>240 FPS throughput</strong> across 8 concurrent 4K camera streams using under 50 Watts of power.
          </p>
          <div className="pt-2 text-xs font-mono text-cyan-400">
            Latency Benchmark: 18.4ms frame-to-bounding-box
          </div>
        </div>

        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Shield size={22} />
          </div>
          <h2 className="text-xl font-bold text-white">Low-Light & Radiometric Infrared Calibration</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Standard computer vision degrades drastically below 1 lux. AEGIS utilizes dual-band contrast enhancement that dynamically remaps infrared monochrome and FLIR thermal palettes into high-contrast edge tensors, maintaining 96%+ human detection accuracy in total darkness.
          </p>
          <div className="pt-2 text-xs font-mono text-purple-400">
            Night Vision Profile: Active at 0.001 Lux
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link to="/hardware" className="btn btn-secondary text-xs font-medium py-3 px-6">
          View Hardware Compatibility Database →
        </Link>
      </div>
    </div>
  );
}
