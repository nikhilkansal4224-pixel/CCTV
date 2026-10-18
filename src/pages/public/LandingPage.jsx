import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Video, Cpu, Zap, ArrowRight, CheckCircle2, 
  Layers, Lock, Play, Compass, Flame, HardHat, Building 
} from 'lucide-react';
import CctvCanvasSimulator from '../../components/CctvCanvasSimulator';

export default function LandingPage() {
  return (
    <div className="space-y-24 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      {/* Hero Section */}
      <section className="text-center space-y-8 pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-400 font-mono text-xs shadow-lg shadow-cyan-950/40">
          <span className="live-dot live-dot-green"></span>
          <span>AUTONOMOUS PERIMETER INTELLIGENCE • KERNEL 3.8</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
          Turn Existing CCTV Feeds Into <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Zero-Latency Defense AI</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Edge-accelerated computer vision that detects human perimeter breaches, loitering, and safety violations in <strong>18 milliseconds</strong> with <strong>99.4% verified precision</strong>. Zero cloud lag.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link to="/demo" className="btn btn-primary btn-lg flex items-center gap-2 text-sm font-bold w-full sm:w-auto shadow-xl shadow-cyan-500/20">
            <Play size={16} />
            <span>Launch Live Interactive Demo</span>
          </Link>

          <Link to="/dashboard" className="btn btn-secondary btn-lg flex items-center gap-2 text-sm font-semibold w-full sm:w-auto">
            <Video size={16} className="text-cyan-400" />
            <span>Enter SOC Command Center</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Real-time Interactive Video Simulator Preview */}
        <div className="max-w-4xl mx-auto pt-6">
          <div className="rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl shadow-cyan-950/40 relative">
            <CctvCanvasSimulator
              cameraId="cam-demo"
              cameraName="Autonomous High-Security Perimeter Alpha • Live Neural Feed"
              mode="view"
              isAlert={true}
              aspectRatio="16/9"
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-3 px-2">
            <span>Simulated live stream feed with real-time YOLOv9 neural bounding boxes</span>
            <span className="text-cyan-400">18ms Inference • 30 FPS • H.265</span>
          </div>
        </div>
      </section>

      {/* Key Metrics Counter */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center border-y border-slate-900 py-12">
        <div className="space-y-1">
          <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">18 ms</div>
          <div className="text-xs text-cyan-400 font-mono uppercase tracking-wider">Sub-second Inference</div>
          <p className="text-xs text-slate-400 mt-1">Processed locally on edge Jetson</p>
        </div>

        <div className="space-y-1">
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">99.4%</div>
          <div className="text-xs text-emerald-400 font-mono uppercase tracking-wider">Verified Precision</div>
          <p className="text-xs text-slate-400 mt-1">97.8% false alarm suppression</p>
        </div>

        <div className="space-y-1">
          <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">120 dB</div>
          <div className="text-xs text-purple-400 font-mono uppercase tracking-wider">Instant Deterrent</div>
          <p className="text-xs text-slate-400 mt-1">Direct GPIO siren & strobe actuation</p>
        </div>

        <div className="space-y-1">
          <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">100%</div>
          <div className="text-xs text-cyan-400 font-mono uppercase tracking-wider">ONVIF Compatible</div>
          <p className="text-xs text-slate-400 mt-1">Works with any existing IP camera</p>
        </div>
      </section>

      {/* Value Pillars */}
      <section className="space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Engineered for High-Risk Physical Infrastructure
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Traditional NVRs only record crimes. AEGIS autonomously halts intruders before perimeters are breached.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Zap size={20} />
            </div>
            <h3 className="text-base font-bold text-white">Edge AI Processing (Zero Cloud Lag)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Neural weights run locally on NVIDIA Jetson or dedicated x86 gateways. Feeds never leave your firewall unless verified breaches occur.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <h3 className="text-base font-bold text-white">Dynamic Polygon Tripwires</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Draw inclusion and exclusion zones directly over camera streams. Suppress blowing trees, headlights, and small animals automatically.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Flame size={20} />
            </div>
            <h3 className="text-base font-bold text-white">Acoustic Sirens & IoT Relays</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trigger 120dB acoustic sirens, strobe floodlights, gate interlocks, and two-way audio deterrents in less than 200 milliseconds.
            </p>
          </div>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Deploy Across Any Vertical</h2>
            <p className="text-xs text-slate-400 mt-1">Specialized computer vision models tailored for each industry</p>
          </div>
          <Link to="/solutions" className="btn btn-secondary btn-sm text-xs flex items-center gap-1">
            <span>Explore All Solutions</span> <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Construction Sites', role: 'PPE & Crane Drop Zones', link: '/solutions/construction' },
            { name: 'Logistics & Warehouses', role: 'Loading Dock Loitering', link: '/solutions/warehouse' },
            { name: 'Retail Commercial', role: 'After-Hours Intrusion', link: '/solutions/retail' },
            { name: 'Residential Perimeters', role: 'Gate & Pool Safety', link: '/solutions/residential' },
          ].map((v, i) => (
            <Link key={i} to={v.link} className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition group">
              <h3 className="font-bold text-white text-sm group-hover:text-cyan-300 transition">{v.name}</h3>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">{v.role}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="text-center py-12 px-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 space-y-6">
        <h2 className="text-3xl font-extrabold text-white">Ready to Secure Your Perimeter?</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Connect your existing IP cameras in under 5 minutes with our zero-installation ONVIF auto-discovery.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/pricing" className="btn btn-primary text-xs font-bold py-3 px-8">
            View Transparent Pricing
          </Link>
          <Link to="/contact" className="btn btn-secondary text-xs font-medium py-3 px-6">
            Contact Security Engineers
          </Link>
        </div>
      </section>
    </div>
  );
}
