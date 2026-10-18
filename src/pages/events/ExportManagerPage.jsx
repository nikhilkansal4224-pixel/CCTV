import React, { useState } from 'react';
import { Download, Share2, Check, Shield, FileVideo, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ExportManagerPage() {
  const [exportsList] = useState([
    {
      id: 'EXP-8891',
      title: 'Incident #alt-101 North Fence Breach (3 Angles)',
      camera: 'Cam 01 + Cam 06',
      size: '142.8 MB',
      created: 'Oct 18, 2026 11:32 AM',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      expiresIn: '6 days'
    },
    {
      id: 'EXP-8842',
      title: 'Loading Dock 3 Loitering Vehicle Follow-through',
      camera: 'Cam 03',
      size: '64.2 MB',
      created: 'Oct 17, 2026 04:15 PM',
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      expiresIn: '5 days'
    }
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Download className="text-cyan-400" size={22} />
            Cryptographic Export & Evidence Packages
            <span className="badge badge-cyan text-xs">Route #44</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generated MP4 video packages with embedded hash signatures and police cloud share links
          </p>
        </div>

        <Link to="/playback/clip-editor" className="btn btn-primary btn-sm text-xs font-bold">
          + New Export Clip
        </Link>
      </div>

      <div className="space-y-4">
        {exportsList.map(exp => (
          <div key={exp.id} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                <FileVideo size={24} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-cyan-400 font-bold">{exp.id}</span>
                  <h3 className="font-bold text-white text-sm">{exp.title}</h3>
                </div>
                <div className="text-xs text-slate-400 font-mono flex items-center gap-3">
                  <span>Size: {exp.size}</span>
                  <span>•</span>
                  <span>Generated: {exp.created}</span>
                  <span>•</span>
                  <span className="text-amber-400">Expires in {exp.expiresIn}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 truncate max-w-lg pt-1">
                  SHA-256: <span className="text-slate-400">{exp.sha256}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link to="/share/ev-99824" className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5">
                <Share2 size={13} /> Secure Share Portal
              </Link>
              <button className="btn btn-primary btn-sm text-xs flex items-center gap-1.5 font-bold">
                <Download size={13} /> Download MP4
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
