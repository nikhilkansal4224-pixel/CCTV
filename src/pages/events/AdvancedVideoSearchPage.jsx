import React, { useState } from 'react';
import { Search, Sparkles, Filter, Calendar, Clock, Sliders, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_ALERTS } from '../../data/mockData';

export default function AdvancedVideoSearchPage() {
  const [clothingQuery, setClothingQuery] = useState('dark hooded jacket');
  const [minConfidence, setMinConfidence] = useState(85);
  const [direction, setDirection] = useState('any');

  return (
    <div className="p-6 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="text-cyan-400" size={22} />
          AI Forensic Attribute Video Search
          <span className="badge badge-cyan text-xs">Neural Query</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Perform multi-camera semantic search by human attributes (clothing color, bag, trajectory direction, dwell time)
        </p>
      </div>

      {/* Query Parameters Box */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Subject Attire / Keywords</label>
            <input 
              type="text" 
              value={clothingQuery}
              onChange={e => setClothingQuery(e.target.value)}
              placeholder="e.g. Red hoodie, backpack, safety vest..."
              className="form-input text-xs"
            />
          </div>

          <div>
            <label className="form-label">Movement Direction</label>
            <select 
              value={direction} 
              onChange={e => setDirection(e.target.value)}
              className="form-select text-xs"
            >
              <option value="any">Any Direction</option>
              <option value="inbound">Inbound / Toward Facility</option>
              <option value="outbound">Outbound / Leaving Perimeter</option>
              <option value="loitering">Static / Loitering</option>
            </select>
          </div>

          <div>
            <label className="form-label">Min Detection Confidence: {minConfidence}%</label>
            <input 
              type="range" 
              min="50" 
              max="99" 
              value={minConfidence}
              onChange={e => setMinConfidence(Number(e.target.value))}
              className="w-full accent-cyan-400 mt-2"
            />
          </div>
        </div>

        <button className="btn btn-primary text-xs font-bold py-2.5 px-6 flex items-center gap-2">
          <Search size={14} /> Execute Semantic Search Across 8 Cameras
        </button>
      </div>

      {/* Results */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300 font-mono uppercase tracking-wider">
          Query Matches (2 Verified Instances)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_ALERTS.slice(0, 2).map(alt => (
            <div key={alt.id} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition space-y-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="font-bold text-cyan-400">Match #{alt.id}</span>
                <span className="text-emerald-400">{alt.confidence}% Similarity</span>
              </div>
              <p className="text-xs text-slate-300 font-sans">
                {alt.snapshotNote}
              </p>
              <div className="p-2.5 rounded-lg bg-slate-950 text-[11px] font-mono space-y-1 text-slate-400">
                <div>Attributes: <strong className="text-slate-200">{alt.attributes.clothing}</strong></div>
                <div>Vector: <strong className="text-slate-200">{alt.attributes.direction}</strong></div>
                <div>Source: <strong className="text-slate-200">{alt.cameraName}</strong></div>
              </div>
              <div className="pt-2 flex justify-between items-center text-xs">
                <Link to={`/playback/${alt.cameraId}`} className="text-cyan-400 hover:underline flex items-center gap-1 font-mono">
                  Jump to Playback <ArrowRight size={12} />
                </Link>
                <Link to={`/alerts/${alt.id}`} className="btn btn-secondary btn-sm">
                  View Dossier
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
