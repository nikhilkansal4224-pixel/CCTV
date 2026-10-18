import React from 'react';
import { Download, FileText, Calendar, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReportsArchivePage() {
  const archives = [
    { title: 'Executive Security Report - Oct 2026 Week 2', date: 'Oct 14, 2026', size: '2.4 MB', type: 'PDF Document', downloads: 14 },
    { title: 'Weekly Incident Log & False Alarm Audit', date: 'Oct 07, 2026', size: '1.8 MB', type: 'PDF Document', downloads: 8 },
    { title: 'Full Q3 2026 Perimeter Defense Dossier', date: 'Oct 01, 2026', size: '12.4 MB', type: 'Signed Evidence PDF', downloads: 32 },
    { title: 'Monthly Raw Detection Telemetry Export', date: 'Oct 01, 2026', size: '48.1 MB', type: 'CSV Compressed Archive', downloads: 5 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="text-cyan-400" size={22} />
            Forensic Security Reports Library & Archive
            <span className="badge badge-cyan text-xs">Route #70</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Download historical weekly, monthly, and quarterly compiled incident reports with cryptographic verification
          </p>
        </div>

        <Link to="/analytics/reports" className="btn btn-secondary btn-sm text-xs">
          Schedule Setup
        </Link>
      </div>

      <div className="space-y-3">
        {archives.map((doc, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm font-sans">{doc.title}</h3>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Generated {doc.date} • {doc.size} • {doc.type}
                </div>
              </div>
            </div>

            <button className="btn btn-primary btn-sm text-xs flex items-center gap-1.5 font-bold">
              <Download size={13} /> Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
