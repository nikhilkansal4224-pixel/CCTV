import React from 'react';
import { Zap, Shield, Eye, Flame, Layers, Lock, Cpu, Video, BellRing, Sliders } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FeaturesPage() {
  const features = [
    { title: 'Sub-Second Edge Detection (18ms)', desc: 'Processes frames locally using TensorRT-accelerated YOLO models with zero internet dependence.', icon: Zap },
    { title: 'Interactive Polygon Tripwires', desc: 'Define inclusion, exclusion, and directional perimeter crossing barriers directly on the live camera viewport.', icon: Layers },
    { title: '120dB Acoustic Siren Actuation', desc: 'Direct IoT dry-contact relay triggers sound strobe sirens and spotlights in less than 200 milliseconds.', icon: Flame },
    { title: '99.4% Verified Accuracy', desc: 'Spatial vector intelligence suppresses shadows, headlights, rain, insects, and wildlife.', icon: Shield },
    { title: 'Cryptographic SHA-256 Chain of Custody', desc: 'Export watermarked evidentiary video packages with immutable digital signatures for legal law enforcement.', icon: Lock },
    { title: 'Multi-Grid Tactical SOC Kiosk', desc: 'Switch seamlessly between 1x1, 2x2, 3x3, and 4x4 wall displays with synchronized real-time overlays.', icon: Video },
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="badge badge-cyan text-xs">Route #2 • Product Capabilities</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Comprehensive Feature Breakdown
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Autonomous computer vision built from the silicon up for zero-latency physical perimeter defense.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Icon size={20} />
              </div>
              <h2 className="text-base font-bold text-white">{f.title}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <Link to="/demo" className="btn btn-primary text-xs font-bold py-3 px-8">
          Try Interactive Feature Sandbox
        </Link>
      </div>
    </div>
  );
}
