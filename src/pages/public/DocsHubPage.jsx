import React from 'react';
import { Book, Terminal, Code, Cpu, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DocsHubPage() {
  const sections = [
    { title: 'Quickstart: Adding RTSP Cameras', desc: 'Step-by-step guide to discovering ONVIF devices and ingesting RTSP H.264/H.265 video streams.', link: '/docs/api' },
    { title: 'Edge Hardware Setup & Docker', desc: 'Deploying the AEGIS edge runtime container onto NVIDIA Jetson AGX Orin or Ubuntu Server.', link: '/docs/api' },
    { title: 'Polygon Zone Drawing Syntax', desc: 'How coordinates are normalized and calibrated for virtual inclusion tripwires.', link: '/docs/api' },
    { title: 'REST API & Webhooks Reference', desc: 'Real-time WebSocket telemetry, HMAC signing, and incident dispatch payload schemas.', link: '/docs/api' },
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="badge badge-cyan text-xs">Route #14 • Technical Documentation</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Developer & Operator Documentation
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Comprehensive engineering guides, RTSP ingress specs, and hardware provisioning walkthroughs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((sec, i) => (
          <Link 
            key={i} 
            to={sec.link}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition group space-y-3"
          >
            <h2 className="text-lg font-bold text-white group-hover:text-cyan-300 transition">{sec.title}</h2>
            <p className="text-xs text-slate-400 leading-relaxed">{sec.desc}</p>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-cyan-400 font-mono font-bold">
              <span>Read Documentation</span>
              <ArrowRight size={13} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
