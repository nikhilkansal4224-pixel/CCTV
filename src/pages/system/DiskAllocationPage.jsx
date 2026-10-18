import React from 'react';
import { HardDrive, Cloud, Database, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function DiskAllocationPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <HardDrive className="text-cyan-400" size={22} />
          Storage Capacity & Disk Quota Allocation
          <span className="badge badge-cyan text-xs">Route #78</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Local NVMe RAID array vs AWS S3 Cloud Glacier storage pools with automated FIFO purging triggers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Local NVMe Storage */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 font-mono text-xs">
          <div className="flex justify-between items-center">
            <span className="font-bold text-white text-base font-sans flex items-center gap-2">
              <Database className="text-cyan-400" size={18} />
              Local Synology NVMe RAID 6 Array
            </span>
            <span className="badge badge-emerald text-[10px]">Healthy</span>
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Disk Utilization</span>
              <span className="text-cyan-400 font-bold">14.2 TB / 24.0 TB (59%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full" style={{ width: '59%' }}></div>
            </div>
          </div>

          <div className="space-y-1.5 text-slate-400 pt-2 border-t border-slate-800">
            <div className="flex justify-between">
              <span>Retained Days Available:</span>
              <span className="text-white">~42 Days</span>
            </div>
            <div className="flex justify-between">
              <span>FIFO Auto-Purge Trigger:</span>
              <span className="text-amber-400">At 90% Capacity</span>
            </div>
            <div className="flex justify-between">
              <span>Write IOPS Throughput:</span>
              <span className="text-emerald-400">1,240 MB/s</span>
            </div>
          </div>
        </div>

        {/* Cloud Cold Vault */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 font-mono text-xs">
          <div className="flex justify-between items-center">
            <span className="font-bold text-white text-base font-sans flex items-center gap-2">
              <Cloud className="text-purple-400" size={18} />
              AWS S3 Glacier Deep Archive Vault
            </span>
            <span className="badge badge-purple text-[10px]">Encrypted KMS</span>
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Archived Incident Packages</span>
              <span className="text-purple-400 font-bold">4.8 TB (280 Clips)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-purple-400 rounded-full" style={{ width: '35%' }}></div>
            </div>
          </div>

          <div className="space-y-1.5 text-slate-400 pt-2 border-t border-slate-800">
            <div className="flex justify-between">
              <span>Encryption Standard:</span>
              <span className="text-white">AES-256 GCM</span>
            </div>
            <div className="flex justify-between">
              <span>Compliance Legal Hold:</span>
              <span className="text-emerald-400">Active (Immutable)</span>
            </div>
            <div className="flex justify-between">
              <span>Archive Region:</span>
              <span className="text-slate-200">eu-west-1 (Ireland)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
