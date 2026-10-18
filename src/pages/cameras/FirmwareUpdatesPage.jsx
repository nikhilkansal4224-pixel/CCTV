import React, { useState } from 'react';
import { RefreshCw, ArrowUpCircle, ShieldCheck, CheckCircle2, DownloadCloud, AlertTriangle } from 'lucide-react';

export default function FirmwareUpdatesPage() {
  const [nodes, setNodes] = useState([
    { name: 'SOC Edge Gateway Alpha (US-East)', type: 'Jetson AGX Orin', currentVersion: 'v3.8.1-lts', latestVersion: 'v3.8.4', updateAvailable: true },
    { name: 'Industrial Facility Gateway Beta', type: 'Xeon Silver + RTX 4090', currentVersion: 'v3.8.4', latestVersion: 'v3.8.4', updateAvailable: false },
    { name: 'Hikvision DS-2CD2386G2-ISU Fleet (5 Cams)', type: 'Camera Firmware', currentVersion: 'V5.7.12', latestVersion: 'V5.7.15', updateAvailable: true },
    { name: 'Axis Q3538-LVE Gate Unit', type: 'Camera Firmware', currentVersion: '11.8.58', latestVersion: '11.8.58', updateAvailable: false },
  ]);

  const [updating, setUpdating] = useState(false);

  const handleUpdateAll = () => {
    setUpdating(true);
    setTimeout(() => {
      setUpdating(false);
      setNodes(nodes.map(n => ({ ...n, currentVersion: n.latestVersion, updateAvailable: false })));
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowUpCircle className="text-cyan-400" size={22} />
            Firmware & Edge Node OTA Package Manager
            <span className="badge badge-cyan text-xs">Route #57</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Over-the-air firmware deployment for edge neural gateways and ONVIF camera fleets
          </p>
        </div>

        <button
          onClick={handleUpdateAll}
          disabled={updating}
          className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5"
        >
          <RefreshCw size={14} className={updating ? 'animate-spin' : ''} />
          <span>{updating ? 'Pushing Secure OTA Containers...' : 'Deploy Available Updates (2)'}</span>
        </button>
      </div>

      <div className="space-y-3">
        {nodes.map((item, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="space-y-0.5">
              <div className="font-bold text-white text-sm font-sans flex items-center gap-2">
                <span>{item.name}</span>
                <span className="badge badge-slate text-[10px]">{item.type}</span>
              </div>
              <div className="text-slate-400">Current: {item.currentVersion} • Channel: Production LTS</div>
            </div>

            <div className="flex items-center gap-4">
              {item.updateAvailable ? (
                <span className="badge badge-amber text-[10px]">
                  Update to {item.latestVersion} Available
                </span>
              ) : (
                <span className="badge badge-emerald text-[10px] flex items-center gap-1">
                  <CheckCircle2 size={12} /> Up to Date
                </span>
              )}

              <button
                disabled={!item.updateAvailable || updating}
                className={`btn btn-sm text-[11px] ${item.updateAvailable ? 'btn-secondary text-cyan-400 hover:text-white' : 'opacity-40 cursor-not-allowed'}`}
              >
                Apply OTA
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
