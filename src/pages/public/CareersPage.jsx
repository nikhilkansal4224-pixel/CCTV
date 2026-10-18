import React from 'react';
import { Briefcase, ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CareersPage() {
  const jobs = [
    { title: 'Senior Edge Computer Vision Engineer (TensorRT / C++)', location: 'London, UK / Remote', team: 'Inference Kernel', type: 'Full-time' },
    { title: 'Embedded Linux Systems Engineer (NVIDIA Jetson / Yocto)', location: 'San Francisco, CA / Remote', team: 'Hardware Platform', type: 'Full-time' },
    { title: 'Distributed WebRTC & Media Pipeline Architect', location: 'Remote Global', team: 'Streaming Infrastructure', type: 'Full-time' },
    { title: 'Staff Cybersecurity & Compliance Specialist (SOC2 / CJIS)', location: 'Washington, D.C.', team: 'Security & Governance', type: 'Full-time' },
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="badge badge-cyan text-xs">Route #10 • Open Positions</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Join the Frontier of Autonomous Vision
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          We are building the cyber-physical sensory layer for the physical world. Competitive equity, cutting-edge hardware lab, and zero corporate bureaucracy.
        </p>
      </div>

      <div className="space-y-4">
        {jobs.map((j, i) => (
          <div key={i} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-cyan-500/40 transition">
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base">{j.title}</h3>
              <div className="text-xs font-mono text-slate-400 flex items-center gap-3">
                <span className="text-cyan-400">{j.team}</span>
                <span>•</span>
                <span>{j.location}</span>
                <span>•</span>
                <span>{j.type}</span>
              </div>
            </div>
            <Link to="/contact" className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 self-start md:self-auto">
              <span>Apply Now</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
