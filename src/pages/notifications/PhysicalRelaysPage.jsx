import React, { useState } from 'react';
import { ArrowLeft, Volume2, Shield, Zap, ToggleLeft, ToggleRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PhysicalRelaysPage() {
  const [relays, setRelays] = useState([
    { id: 1, name: 'North Perimeter 120dB Acoustic Siren', gpioPin: 'GPIO 18', state: false, location: 'North Fence Post #14' },
    { id: 2, name: 'Main Gate Hydraulic Crash Barrier Interlock', gpioPin: 'GPIO 23', state: true, location: 'Gate 1 Ingress' },
    { id: 3, name: 'Warehouse District High-Intensity Xenon Strobe', gpioPin: 'GPIO 24', state: false, location: 'Loading Bay 3' },
    { id: 4, name: 'Emergency PA System Auto-Megaphone', gpioPin: 'IP Relay (10.0.10.88)', state: false, location: 'Central Courtyard' },
  ]);

  const toggleRelay = (id) => {
    setRelays(relays.map(r => r.id === id ? { ...r, state: !r.state } : r));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <Link to="/integrations" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Volume2 className="text-red-400" size={22} />
            Physical Alarm Relays, Sirens & IoT Hardware Actuators
            <span className="badge badge-crimson text-xs">Route #64</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Control hardware GPIO dry contacts, industrial relays, floodlights, acoustic sirens, and security gates
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relays.map(relay => (
          <div key={relay.id} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-cyan-400 font-bold">{relay.gpioPin}</span>
              <span className={`badge ${relay.state ? 'badge-crimson' : 'badge-slate'}`}>
                {relay.state ? 'Energized / Active' : 'Standby / Open'}
              </span>
            </div>

            <h2 className="text-sm font-bold text-white font-sans">{relay.name}</h2>
            <div className="text-slate-400">Physical Location: {relay.location}</div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-800">
              <span className="text-slate-500">Manual Override</span>
              <button
                onClick={() => toggleRelay(relay.id)}
                className={`btn btn-sm ${relay.state ? 'btn-danger' : 'btn-secondary text-cyan-400'}`}
              >
                {relay.state ? 'De-energize Relay' : 'Trigger Actuator'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
