import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Search, Filter, Download, Eye, Calendar, Clock, Video } from 'lucide-react';
import { MOCK_ALERTS, MOCK_CAMERAS } from '../../data/mockData';

export default function EventsArchivePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCam, setSelectedCam] = useState('all');

  const filtered = MOCK_ALERTS.filter(alert => {
    const matchesCam = selectedCam === 'all' || alert.cameraId === selectedCam;
    const matchesSearch = !searchTerm || 
      alert.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.attributes.clothing.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCam && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="text-cyan-400" size={22} />
            Detection Events Forensic Archive
            <span className="badge badge-cyan text-xs">Route #40</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Searchable historical database of all verified human bounding box incursions, loitering, and breaches
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/events/search" className="btn btn-primary btn-sm text-xs flex items-center gap-1.5 font-bold">
            <Search size={14} /> AI Attribute Search
          </Link>
          <Link to="/exports" className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5">
            <Download size={14} /> Export CSV
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by event type, clothing keywords (e.g. hooded jacket), or zone..."
            className="form-input pl-10 text-xs w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select 
            value={selectedCam} 
            onChange={e => setSelectedCam(e.target.value)}
            className="form-select text-xs w-full md:w-56"
          >
            <option value="all">All Cameras (8)</option>
            {MOCK_CAMERAS.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table list of events */}
      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
            <tr>
              <th className="p-3.5">Event ID</th>
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">Camera & Location</th>
              <th className="p-3.5">Detection Classification</th>
              <th className="p-3.5">Confidence</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map(evt => (
              <tr key={evt.id} className="hover:bg-slate-800/40 transition">
                <td className="p-3.5 font-bold text-cyan-400">#{evt.id}</td>
                <td className="p-3.5 text-slate-400">{evt.timestamp}</td>
                <td className="p-3.5">
                  <div className="font-sans font-semibold text-slate-200">{evt.cameraName}</div>
                  <div className="text-[10px] text-slate-500">{evt.location}</div>
                </td>
                <td className="p-3.5 font-sans font-medium text-slate-300">{evt.type}</td>
                <td className="p-3.5">
                  <span className="badge badge-emerald text-[10px]">{evt.confidence}%</span>
                </td>
                <td className="p-3.5">
                  <span className={`badge ${evt.severity === 'critical' ? 'badge-crimson' : 'badge-amber'} text-[10px]`}>
                    {evt.status}
                  </span>
                </td>
                <td className="p-3.5 text-right space-x-1.5">
                  <Link to={`/alerts/${evt.id}`} className="btn btn-secondary btn-sm text-[11px]">
                    <Eye size={12} /> Inspect
                  </Link>
                  <Link to={`/playback/${evt.cameraId}`} className="btn btn-secondary btn-sm text-[11px]">
                    Play Video
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
