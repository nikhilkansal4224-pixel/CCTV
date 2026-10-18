import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Compass, Video, AlertTriangle, Layers, Cpu, Camera, BellRing, ArrowRight } from 'lucide-react';
import { SITEMAP_PAGES } from '../data/sitemapData';
import { MOCK_CAMERAS, MOCK_ALERTS } from '../data/mockData';

export default function OmniSearchPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else window.dispatchEvent(new CustomEvent('open-omni-search'));
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // Matched pages
  const matchedPages = SITEMAP_PAGES.filter(p => 
    !cleanQuery ||
    p.title.toLowerCase().includes(cleanQuery) ||
    p.path.toLowerCase().includes(cleanQuery) ||
    p.description.toLowerCase().includes(cleanQuery)
  ).slice(0, 6);

  // Matched cameras
  const matchedCameras = MOCK_CAMERAS.filter(c => 
    !cleanQuery ||
    c.name.toLowerCase().includes(cleanQuery) ||
    c.id.toLowerCase().includes(cleanQuery) ||
    c.location.toLowerCase().includes(cleanQuery)
  ).slice(0, 3);

  // Matched alerts
  const matchedAlerts = MOCK_ALERTS.filter(a =>
    !cleanQuery ||
    a.type.toLowerCase().includes(cleanQuery) ||
    a.id.toLowerCase().includes(cleanQuery) ||
    a.cameraName.toLowerCase().includes(cleanQuery)
  ).slice(0, 3);

  const handleSelect = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="blueprint-modal-overlay" onClick={onClose}>
      <div 
        className="blueprint-modal-content max-w-2xl bg-slate-900 border border-cyan-500/30"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
          <Search className="text-cyan-400" size={18} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command, route (/dashboard), camera name, or alert ID..."
            className="w-full bg-transparent border-none text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
            autoFocus
          />
          <kbd className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700 font-mono">
            ESC
          </kbd>
        </div>

        <div className="p-3 max-h-[60vh] overflow-y-auto space-y-4">
          {/* Section: SITEMAP PAGES */}
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 px-2 mb-1.5 flex items-center justify-between">
              <span>Blueprint Pages ({matchedPages.length})</span>
              <span className="text-cyan-500">Jump to route</span>
            </div>
            <div className="space-y-1">
              {matchedPages.map(page => (
                <div
                  key={page.id}
                  onClick={() => handleSelect(page.navPath || page.path)}
                  className="px-3 py-2 rounded-lg hover:bg-slate-800/80 cursor-pointer flex items-center justify-between group transition text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1 rounded">#{page.id}</span>
                    <span className="font-semibold text-slate-200 group-hover:text-cyan-300">{page.title}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                    <span>{page.path}</span>
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 text-cyan-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: CAMERAS */}
          {matchedCameras.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 px-2 mb-1.5 flex items-center justify-between">
                <span>Active Camera Streams</span>
                <span className="text-emerald-400">Live Feeds</span>
              </div>
              <div className="space-y-1">
                {matchedCameras.map(cam => (
                  <div
                    key={cam.id}
                    onClick={() => handleSelect(`/live/${cam.id}`)}
                    className="px-3 py-2 rounded-lg hover:bg-slate-800/80 cursor-pointer flex items-center justify-between group transition text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Video size={14} className="text-emerald-400" />
                      <div>
                        <div className="font-semibold text-slate-200 group-hover:text-emerald-300">{cam.name}</div>
                        <div className="text-[10px] text-slate-400">{cam.location} • {cam.resolution}</div>
                      </div>
                    </div>
                    <span className="badge badge-emerald text-[10px]">Live View</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: ALERTS */}
          {matchedAlerts.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 px-2 mb-1.5 flex items-center justify-between">
                <span>Recent Threat Incidents</span>
                <span className="text-red-400">Triage Queue</span>
              </div>
              <div className="space-y-1">
                {matchedAlerts.map(alt => (
                  <div
                    key={alt.id}
                    onClick={() => handleSelect(`/alerts/${alt.id}`)}
                    className="px-3 py-2 rounded-lg hover:bg-slate-800/80 cursor-pointer flex items-center justify-between group transition text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle size={14} className="text-red-400" />
                      <div>
                        <div className="font-semibold text-slate-200 group-hover:text-red-300">{alt.type}</div>
                        <div className="text-[10px] text-slate-400">{alt.cameraName} • {alt.timestamp}</div>
                      </div>
                    </div>
                    <span className="badge badge-crimson text-[10px]">{alt.confidence}% Conf</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Search across 87 pages, 8 RTSP streams, and live AI alerts</span>
          <span>Tip: Click any item to jump directly</span>
        </div>
      </div>
    </div>
  );
}
