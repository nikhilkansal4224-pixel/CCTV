import React, { useState } from 'react';
import { Mail, Calendar, Plus, FileText, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ScheduledReportsPage() {
  const [schedules] = useState([
    { name: 'Weekly Executive Security Summary', frequency: 'Every Monday 07:00 AM', recipients: 'cso@company.com, ops@company.com', format: 'PDF + CSV Digest', status: 'Active' },
    { name: 'Daily Shift Guard Incident Briefing', frequency: 'Daily 06:00 AM', recipients: 'patrol-chief@security.org', format: 'PDF Summary', status: 'Active' },
    { name: 'Monthly GDPR & SOC2 Compliance Audit', frequency: '1st of every month', recipients: 'auditors@compliance.io', format: 'Encrypted Forensic PDF', status: 'Active' },
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Mail className="text-cyan-400" size={22} />
            Automated Scheduled Reports Configuration
            <span className="badge badge-cyan text-xs">Route #69</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Schedule recurring cryptographic security incident digests delivered directly to stakeholders via email
          </p>
        </div>

        <Link to="/analytics/reports/archive" className="btn btn-secondary btn-sm text-xs">
          View Archive Library
        </Link>
      </div>

      <div className="space-y-4">
        {schedules.map((sch, idx) => (
          <div key={idx} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm font-sans">{sch.name}</h3>
                <span className="badge badge-emerald text-[10px]">{sch.status}</span>
              </div>
              <div className="text-slate-400">Schedule: <strong className="text-cyan-400">{sch.frequency}</strong> • Format: {sch.format}</div>
              <div className="text-slate-500">Recipients: {sch.recipients}</div>
            </div>

            <button className="btn btn-secondary btn-sm">
              Edit Schedule
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
