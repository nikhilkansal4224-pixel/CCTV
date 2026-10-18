import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Plus, Video, Eye, Sliders, Layers, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { MOCK_CAMERAS } from '../../data/mockData';

export default function CameraInventoryPage() {
  const [cameras, setCameras] = useState(MOCK_CAMERAS);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Camera className="text-cyan-400" size={22} />
            Camera Master Fleet Inventory
            <span className="badge badge-cyan text-xs">8 Connected Devices</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized device registry: IP addresses, ONVIF ports, RTSP endpoints, signal health, and stream profiles
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/cameras/new" className="btn btn-primary btn-sm text-xs flex items-center gap-1.5 font-bold">
            <Plus size={14} />
            <span>Add IP Camera (ONVIF/RTSP)</span>
          </Link>
          <Link to="/hardware/updates" className="btn btn-secondary btn-sm text-xs">
            Firmware OTA
          </Link>
        </div>
      </div>

      {/* Fleet Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
            <tr>
              <th className="p-3.5">Camera Name & Hardware</th>
              <th className="p-3.5">IP Address & RTSP</th>
              <th className="p-3.5">Resolution / FPS</th>
              <th className="p-3.5">Bitrate & Latency</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Config & Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {cameras.map(cam => {
              const isAlert = cam.status === 'alert';
              return (
                <tr key={cam.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5">
                    <div className="font-sans font-bold text-white flex items-center gap-2">
                      <span className={`live-dot ${isAlert ? 'live-dot-red' : 'live-dot-green'}`}></span>
                      <span>{cam.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{cam.model} • {cam.location}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="text-cyan-400 font-bold">{cam.ip}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{cam.rtsp}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="text-slate-200">{cam.resolution}</div>
                    <div className="text-[10px] text-slate-400">{cam.fps} FPS H.265</div>
                  </td>
                  <td className="p-3.5">
                    <div className="text-slate-200">{cam.bitrate}</div>
                    <div className="text-[10px] text-emerald-400">{cam.latency}</div>
                  </td>
                  <td className="p-3.5">
                    <span className={`badge ${isAlert ? 'badge-crimson' : 'badge-emerald'} text-[10px]`}>
                      {cam.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-1.5">
                    <Link to={`/live/${cam.id}`} className="btn btn-secondary btn-sm text-[11px]">
                      <Eye size={12} /> Live
                    </Link>
                    <Link to={`/cameras/${cam.id}`} className="btn btn-secondary btn-sm text-[11px]">
                      Metrics
                    </Link>
                    <Link to={`/cameras/${cam.id}/zones`} className="btn btn-secondary btn-sm text-[11px]">
                      Zones
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
