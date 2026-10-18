import React, { useState } from 'react';
import { MapPin, Plus, Building, Shield } from 'lucide-react';

export default function LocationsManagementPage() {
  const [locations] = useState([
    { id: 'loc-1', name: 'Primary Datacenter & Vault Facility', address: 'London Heathrow Logistics Sector B', cameras: 4, status: 'Active Surveillance' },
    { id: 'loc-2', name: 'Northern Container Port Yard', address: 'Antwerp Terminal Dock 44', cameras: 3, status: 'Active Surveillance' },
    { id: 'loc-3', name: 'Corporate Rooftop Executive Helipad', address: 'Canary Wharf High-Sec Tower', cameras: 1, status: 'Active Surveillance' },
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="text-cyan-400" size={22} />
            Sites & Multi-Facility Location Management
            <span className="badge badge-cyan text-xs">Route #75</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize edge camera fleets by physical campus, logistics buildings, geographic sectors, and operational floors
          </p>
        </div>

        <button className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5">
          <Plus size={14} />
          <span>Add Physical Facility Site</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {locations.map(loc => (
          <div key={loc.id} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-cyan-400 font-bold">{loc.id}</span>
              <span className="badge badge-emerald text-[10px]">{loc.status}</span>
            </div>
            <h3 className="font-bold text-white text-base font-sans">{loc.name}</h3>
            <p className="text-slate-400 text-xs font-sans">{loc.address}</p>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-slate-400">
              <span>Streams: <strong className="text-slate-200">{loc.cameras} Cameras</strong></span>
              <button className="btn btn-secondary btn-sm text-[11px]">Edit Site</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
