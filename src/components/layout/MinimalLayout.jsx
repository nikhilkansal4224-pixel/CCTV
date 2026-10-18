import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Shield, Compass, ArrowLeft } from 'lucide-react';
import BlueprintNavigatorModal from '../BlueprintNavigatorModal';

export default function MinimalLayout() {
  const [blueprintOpen, setBlueprintOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between cyber-grid-bg font-sans">
      {/* Top minimalistic bar */}
      <header className="p-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/20 group-hover:scale-105 transition">
            <Shield size={18} />
          </div>
          <span className="font-extrabold text-white tracking-tight">AEGIS AI</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setBlueprintOpen(true)}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800"
          >
            <Compass size={14} />
            <span>Blueprint (87 Pages)</span>
          </button>

          <Link
            to="/"
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <ArrowLeft size={13} />
            Back to Site
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-slate-500">
        AEGIS Autonomous Video Intelligence • End-to-End Cryptographic Surveillance System
      </footer>

      <BlueprintNavigatorModal isOpen={blueprintOpen} onClose={() => setBlueprintOpen(false)} />
    </div>
  );
}
