import React, { useState } from 'react';
import { Camera, Check, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HardwareCompatibilityPage() {
  const [query, setQuery] = useState('');

  const cameras = [
    { brand: 'Hikvision', models: 'DS-2CD2xx6G2, ColorVu, DeepinView Series', protocol: 'ONVIF Profile S/G/T + RTSP H.265', status: '100% Certified' },
    { brand: 'Axis Communications', models: 'Q35, M30, P32, ARTPEC-7/8/9 Series', protocol: 'ONVIF Profile M/S + WebRTC', status: '100% Certified' },
    { brand: 'Dahua Technology', models: 'WizMind, TiOC, Ultra-AI IP Series', protocol: 'ONVIF Profile S + RTSP H.264/H.265', status: '100% Certified' },
    { brand: 'Hanwha Techwin', models: 'Wisenet X, P-Series AI, Wisenet 7', protocol: 'ONVIF Profile S/G + RTSP', status: '100% Certified' },
    { brand: 'Bosch Security', models: 'FLEXIDOME, DINION IP Starlight, MIC IP', protocol: 'ONVIF Profile M/S/T', status: '100% Certified' },
    { brand: 'Uniview (UNV)', models: 'Prime-I, Easy, Pro Series IP Cameras', protocol: 'ONVIF Profile S + RTSP', status: '100% Certified' },
    { brand: 'Mobotix', models: 'M73 AllroundDual, 7-Series Decentralized', protocol: 'ONVIF Profile S + HTTP Ingest', status: '100% Certified' },
    { brand: 'Generic RTSP / NVR', models: 'Any IP camera supporting H.264 / H.265 RTSP', protocol: 'Standard RTSP RFC 2326', status: '100% Certified' },
  ];

  const filtered = cameras.filter(c => 
    !query || 
    c.brand.toLowerCase().includes(query.toLowerCase()) || 
    c.models.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="badge badge-cyan text-xs">Route #6 • Hardware Compatibility</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Supported Cameras & Ingestion Protocols
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          AEGIS is 100% vendor-agnostic. No need to replace existing IP cameras or rewire coaxial cabling.
        </p>
      </div>

      <div className="max-w-md mx-auto relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input 
          type="text" 
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by brand (e.g. Axis, Hikvision, Dahua)..."
          className="form-input pl-10 text-xs"
        />
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
            <tr>
              <th className="p-3.5">Camera Manufacturer</th>
              <th className="p-3.5">Supported Series & Hardware</th>
              <th className="p-3.5">Protocols & Codecs</th>
              <th className="p-3.5 text-right">Certification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((cam, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition">
                <td className="p-3.5 font-bold text-white font-sans text-sm">{cam.brand}</td>
                <td className="p-3.5 text-slate-300 font-sans">{cam.models}</td>
                <td className="p-3.5 text-cyan-400">{cam.protocol}</td>
                <td className="p-3.5 text-right">
                  <span className="badge badge-emerald text-[10px] inline-flex items-center gap-1">
                    <Check size={11} /> {cam.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
