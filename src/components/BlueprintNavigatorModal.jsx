import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Search, Compass, ExternalLink, CheckCircle, 
  Layers, Shield, Video, AlertTriangle, Cpu, Camera, 
  BellRing, BarChart3, Sliders, Server, CreditCard, HelpCircle 
} from 'lucide-react';
import { SITEMAP_MODULES, SITEMAP_PAGES } from '../data/sitemapData';

const MODULE_ICONS = {
  public: Compass,
  auth: Shield,
  live: Video,
  alerts: AlertTriangle,
  events: Layers,
  ai: Cpu,
  cameras: Camera,
  notifications: BellRing,
  analytics: BarChart3,
  settings: Sliders,
  system: Server,
  billing: CreditCard,
  support: HelpCircle
};

export default function BlueprintNavigatorModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');

  const filteredPages = useMemo(() => {
    return SITEMAP_PAGES.filter(page => {
      const matchesModule = selectedModule === 'all' || page.moduleId === selectedModule;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesModule;
      const matchesText = 
        page.title.toLowerCase().includes(query) ||
        page.path.toLowerCase().includes(query) ||
        page.description.toLowerCase().includes(query) ||
        page.badge.toLowerCase().includes(query) ||
        String(page.id) === query;
      return matchesModule && matchesText;
    });
  }, [selectedModule, searchQuery]);

  if (!isOpen) return null;

  const handleSelectPage = (page) => {
    onClose();
    navigate(page.navPath || page.path);
  };

  return (
    <div className="blueprint-modal-overlay" onClick={onClose}>
      <div 
        className="blueprint-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Compass size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                AEGIS System Blueprint & Navigator
                <span className="badge badge-cyan text-xs">87 Single-Purpose Pages</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete architectural map across 13 security sub-systems
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Module Pills */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800/80 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all 87 routes by name, path (/alerts/live), or feature description..."
              className="form-input pl-10 pr-4 py-2.5 bg-slate-900 border-slate-800 text-sm focus:border-cyan-400"
              autoFocus
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Module Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedModule('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer font-medium ${
                selectedModule === 'all' 
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20' 
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              All Modules (87)
            </button>
            {SITEMAP_MODULES.map(m => {
              const Icon = MODULE_ICONS[m.id] || Compass;
              const isSelected = selectedModule === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedModule(m.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' 
                      : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Icon size={13} />
                  <span>{m.name.split('. ')[1]}</span>
                  <span className="text-[10px] opacity-75 font-mono">({m.count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pages Grid list */}
        <div className="p-4 overflow-y-auto max-h-[55vh] space-y-2">
          {filteredPages.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Compass size={36} className="mx-auto mb-2 opacity-40 text-slate-600" />
              <p className="text-sm font-medium">No pages matched your search</p>
              <p className="text-xs text-slate-600 mt-1">Try another keyword or select "All Modules"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredPages.map(page => {
                const ModuleIcon = MODULE_ICONS[page.moduleId] || Compass;
                return (
                  <div
                    key={page.id}
                    onClick={() => handleSelectPage(page)}
                    className="p-3.5 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.5 rounded">
                            #{page.id}
                          </span>
                          <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition flex items-center gap-1">
                            {page.title}
                          </span>
                        </div>
                        <span className="badge badge-slate text-[10px]">
                          {page.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {page.description}
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span className="text-slate-400 group-hover:text-cyan-400 transition">
                        {page.path}
                      </span>
                      <span className="text-cyan-400 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">
                        Launch <ExternalLink size={11} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>Showing <strong className="text-slate-200">{filteredPages.length}</strong> of 87 pages</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">ESC</kbd> to exit</span>
          </div>
          <button 
            onClick={onClose}
            className="btn btn-secondary btn-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
