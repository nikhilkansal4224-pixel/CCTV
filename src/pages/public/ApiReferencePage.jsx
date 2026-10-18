import React from 'react';
import { Code, Terminal, Key, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ApiReferencePage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12 font-sans">
      <div className="space-y-4">
        <span className="badge badge-cyan text-xs">Route #15 • Developer API Reference</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          REST Endpoints & WebSocket Feeds
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Programmatic access to camera inventory, live detections, and siren triggers.
        </p>
      </div>

      <div className="space-y-6">
        {/* Endpoint 1 */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
            <span className="text-white font-bold text-sm">/v1/cameras</span>
          </div>
          <p className="text-slate-400 font-sans">Returns list of all active ingesting RTSP cameras, health status, and FPS.</p>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto">
            <pre>{`curl -X GET "https://api.aegis-defense.io/v1/cameras" \\
  -H "Authorization: Bearer aegis_live_key_998877"`}</pre>
          </div>
        </div>

        {/* Endpoint 2 */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-red-500/20 text-red-400 font-bold">POST</span>
            <span className="text-white font-bold text-sm">/v1/relays/:relay_id/trigger</span>
          </div>
          <p className="text-slate-400 font-sans">Immediately actuates a physical dry-contact relay (acoustic siren or strobe floodlight).</p>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto">
            <pre>{`curl -X POST "https://api.aegis-defense.io/v1/relays/1/trigger" \\
  -H "Authorization: Bearer aegis_live_key_998877" \\
  -H "Content-Type: application/json" \\
  -d '{"duration_sec": 15, "strobe_pattern": "tactical_flash"}'`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
