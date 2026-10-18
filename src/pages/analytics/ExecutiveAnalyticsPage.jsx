import React from 'react';
import { BarChart3, TrendingDown, Clock, ShieldCheck, Download, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ExecutiveAnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-cyan-400" size={22} />
            Executive Security Intelligence Dashboard
            <span className="badge badge-cyan text-xs">Route #65</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            C-Level operational security metrics, incident frequency trends, response SLA times, and compliance scores
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/analytics/reports" className="btn btn-secondary btn-sm text-xs">
            Scheduled Digests
          </Link>
          <Link to="/analytics/reports/archive" className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5">
            <Download size={14} /> Export Executive PDF
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-mono">TOTAL INCIDENTS (30D)</div>
          <div className="text-2xl font-bold text-white flex items-baseline gap-2">
            18
            <span className="text-xs font-normal text-emerald-400 font-mono flex items-center gap-0.5">
              <TrendingDown size={12} /> -42%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-sans">Reduced breach attempts</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-mono">AVG GUARD RESPONSE SLA</div>
          <div className="text-2xl font-bold text-cyan-400 flex items-baseline gap-2">
            42 Sec
            <span className="text-xs font-normal text-emerald-400 font-mono">-68s vs 2025</span>
          </div>
          <p className="text-[11px] text-slate-500 font-sans">Detection to arrival on site</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-mono">FALSE ALARM RATE</div>
          <div className="text-2xl font-bold text-emerald-400 flex items-baseline gap-2">
            0.4%
            <span className="text-xs font-normal text-slate-400 font-mono">99.6% Accuracy</span>
          </div>
          <p className="text-[11px] text-slate-500 font-sans">Suppressed animal/wind triggers</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-mono">COMPLIANCE RISK SCORE</div>
          <div className="text-2xl font-bold text-purple-400 flex items-baseline gap-2">
            99.8 / 100
            <span className="text-xs font-normal text-emerald-400 font-mono">Audit Grade</span>
          </div>
          <p className="text-[11px] text-slate-500 font-sans">Zero unmasked privacy leaks</p>
        </div>
      </div>

      {/* Visual Analytics Chart Simulation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Incident Frequency by Facility Sector (30 Days)
          </h2>
          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>North Perimeter Fence</span>
                <span className="text-cyan-400 font-bold">8 Incidents (44%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: '44%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Loading Bay Logistics Dock 3</span>
                <span className="text-amber-400 font-bold">5 Incidents (28%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Zone B Active Construction Site</span>
                <span className="text-purple-400 font-bold">3 Incidents (17%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-purple-400 rounded-full" style={{ width: '17%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Main Gate Vehicle Barrier</span>
                <span className="text-emerald-400 font-bold">2 Incidents (11%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: '11%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Operator Verification Velocity
          </h2>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Alerts Evaluated:</span>
              <span className="text-white font-bold">1,492</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">True Positives Dispatched:</span>
              <span className="text-red-400 font-bold">18 (1.2%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Suppressed by Edge AI:</span>
              <span className="text-emerald-400 font-bold">1,468 (98.4%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Human Operator Triage Time:</span>
              <span className="text-cyan-400 font-bold">3.2 Seconds avg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
