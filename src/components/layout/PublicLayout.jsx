import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Shield, Video, Compass, ArrowRight, ExternalLink, 
  Menu, X, CheckCircle2, ChevronDown, Terminal, Cpu 
} from 'lucide-react';
import BlueprintNavigatorModal from '../BlueprintNavigatorModal';
import OmniSearchPalette from '../OmniSearchPalette';

export default function PublicLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [blueprintOpen, setBlueprintOpen] = useState(false);
  const [omniOpen, setOmniOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Banner Alert Bar */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border-b border-cyan-500/20 px-4 py-1.5 text-xs font-mono text-center flex items-center justify-center gap-3">
        <span className="flex items-center gap-1.5 text-cyan-400">
          <span className="live-dot live-dot-green"></span>
          AEGIS 3.8 KERNEL ACTIVE
        </span>
        <span className="text-slate-400 hidden sm:inline">•</span>
        <span className="text-slate-300 hidden sm:inline">
          Autonomous Zero-Latency Computer Vision for High-Security Infrastructure
        </span>
        <button
          onClick={() => setBlueprintOpen(true)}
          className="ml-2 text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-1 cursor-pointer"
        >
          View 87-Page Blueprint <ArrowRight size={12} />
        </button>
      </div>

      {/* Main Glass Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition">
              <Shield size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                AEGIS <span className="text-cyan-400 font-mono text-xs px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">AI</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 tracking-wider">
                AUTONOMOUS SURVEILLANCE
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link to="/features" className={`hover:text-cyan-400 transition ${location.pathname === '/features' ? 'text-cyan-400' : ''}`}>
              Features
            </Link>
            <Link to="/technology" className={`hover:text-cyan-400 transition ${location.pathname === '/technology' ? 'text-cyan-400' : ''}`}>
              AI Engine
            </Link>
            <Link to="/solutions" className={`hover:text-cyan-400 transition ${location.pathname.startsWith('/solutions') ? 'text-cyan-400' : ''}`}>
              Solutions
            </Link>
            <Link to="/hardware" className={`hover:text-cyan-400 transition ${location.pathname === '/hardware' ? 'text-cyan-400' : ''}`}>
              Hardware
            </Link>
            <Link to="/pricing" className={`hover:text-cyan-400 transition ${location.pathname === '/pricing' ? 'text-cyan-400' : ''}`}>
              Pricing
            </Link>
            <Link to="/demo" className={`hover:text-cyan-400 transition flex items-center gap-1.5 ${location.pathname === '/demo' ? 'text-cyan-400' : ''}`}>
              <span className="live-dot live-dot-green"></span>
              Live Demo
            </Link>
            <Link to="/docs" className={`hover:text-cyan-400 transition ${location.pathname.startsWith('/docs') ? 'text-cyan-400' : ''}`}>
              Docs
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setOmniOpen(true)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-200 transition cursor-pointer"
            >
              <span>Search (87 Pages)</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono">⌘K</kbd>
            </button>

            <button
              onClick={() => setBlueprintOpen(true)}
              className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs cursor-pointer"
              title="Open Complete Blueprint Sitemap"
            >
              <Compass size={14} className="text-cyan-400" />
              <span className="hidden sm:inline">Sitemap (87)</span>
            </button>

            <Link to="/auth/login" className="btn btn-secondary btn-sm text-xs">
              Operator Sign In
            </Link>

            <Link to="/dashboard" className="btn btn-primary btn-sm text-xs flex items-center gap-1.5 font-bold">
              <Video size={14} />
              <span>SOC Dashboard</span>
            </Link>

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link to="/features" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded bg-slate-800 text-slate-200">Features</Link>
              <Link to="/technology" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded bg-slate-800 text-slate-200">AI Engine</Link>
              <Link to="/solutions" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded bg-slate-800 text-slate-200">Solutions</Link>
              <Link to="/hardware" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded bg-slate-800 text-slate-200">Hardware</Link>
              <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded bg-slate-800 text-slate-200">Pricing</Link>
              <Link to="/demo" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded bg-slate-800 text-cyan-400 font-bold">Live Demo</Link>
              <Link to="/case-studies" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded bg-slate-800 text-slate-200">Case Studies</Link>
              <Link to="/docs" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded bg-slate-800 text-slate-200">Docs & API</Link>
            </div>
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary flex-1 text-center text-xs">
                Launch SOC Command Center
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Public Page View Content Slot */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Col 1 */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 font-bold">
                <Shield size={16} />
              </div>
              <span className="font-extrabold text-white text-base">AEGIS AI</span>
            </div>
            <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
              Industrial-grade autonomous video surveillance intelligence. Edge-accelerated neural networks delivering instant perimeter breach detection with 99.4% precision and zero cloud transmission lag.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="badge badge-emerald">SOC 2 Type II Certified</span>
              <span className="badge badge-cyan">ONVIF Profile S/G/T</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <h4 className="font-mono uppercase text-[11px] text-white tracking-wider">Product & AI</h4>
            <ul className="space-y-1.5">
              <li><Link to="/features" className="hover:text-cyan-400 transition">Features Overview</Link></li>
              <li><Link to="/technology" className="hover:text-cyan-400 transition">Edge AI Architecture</Link></li>
              <li><Link to="/hardware" className="hover:text-cyan-400 transition">Hardware Compatibility</Link></li>
              <li><Link to="/demo" className="hover:text-cyan-400 transition">Interactive Sandbox</Link></li>
              <li><Link to="/pricing" className="hover:text-cyan-400 transition">Pricing & Calculator</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <h4 className="font-mono uppercase text-[11px] text-white tracking-wider">Industries</h4>
            <ul className="space-y-1.5">
              <li><Link to="/solutions/construction" className="hover:text-cyan-400 transition">Construction & PPE</Link></li>
              <li><Link to="/solutions/retail" className="hover:text-cyan-400 transition">Retail Loss Prevention</Link></li>
              <li><Link to="/solutions/warehouse" className="hover:text-cyan-400 transition">Logistics & Warehouses</Link></li>
              <li><Link to="/solutions/residential" className="hover:text-cyan-400 transition">Residential Perimeters</Link></li>
              <li><Link to="/case-studies" className="hover:text-cyan-400 transition">Customer Case Studies</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-2">
            <h4 className="font-mono uppercase text-[11px] text-white tracking-wider">Resources & Legal</h4>
            <ul className="space-y-1.5">
              <li><Link to="/docs" className="hover:text-cyan-400 transition">Documentation Hub</Link></li>
              <li><Link to="/docs/api" className="hover:text-cyan-400 transition">Developer API Reference</Link></li>
              <li><Link to="/status" className="hover:text-cyan-400 transition">System Status (99.99%)</Link></li>
              <li><Link to="/compliance" className="hover:text-cyan-400 transition">GDPR & Privacy Rules</Link></li>
              <li><Link to="/privacy" className="hover:text-cyan-400 transition">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-cyan-400 transition">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © 2026 AEGIS AI Inc. All rights reserved. Encrypted Autonomous Surveillance Infrastructure.
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setBlueprintOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 font-mono text-xs cursor-pointer flex items-center gap-1"
            >
              <Compass size={13} /> Open Complete 87-Page Blueprint
            </button>
            <Link to="/contact" className="hover:text-white transition">Contact Engineering</Link>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <BlueprintNavigatorModal isOpen={blueprintOpen} onClose={() => setBlueprintOpen(false)} />
      <OmniSearchPalette isOpen={omniOpen} onClose={() => setOmniOpen(false)} />
    </div>
  );
}
