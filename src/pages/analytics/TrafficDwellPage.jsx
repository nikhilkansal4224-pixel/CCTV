import React from 'react';
import { Clock, TrendingUp, Users, ArrowUpRight } from 'lucide-react';

export default function TrafficDwellPage() {
  const hourlyData = [
    { hour: '00:00', count: 4, avgDwell: '24s' },
    { hour: '04:00', count: 2, avgDwell: '18s' },
    { hour: '08:00', count: 45, avgDwell: '2m 14s' },
    { hour: '12:00', count: 88, avgDwell: '4m 32s' },
    { hour: '16:00', count: 62, avgDwell: '3m 10s' },
    { hour: '20:00', count: 18, avgDwell: '1m 05s' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="text-cyan-400" size={22} />
          Peak Hours & Loitering Dwell Time Analytics
          <span className="badge badge-cyan text-xs">Route #67</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Hourly presence distributions, median loitering duration, and zone ingress/egress ratios
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-mono">PEAK ACTIVITY WINDOW</div>
          <div className="text-2xl font-bold text-cyan-400">11:30 AM – 01:30 PM</div>
          <p className="text-[11px] text-slate-500 font-sans">Shift change & logistics lunch break</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-mono">MEDIAN DWELL TIME</div>
          <div className="text-2xl font-bold text-emerald-400">2m 45s</div>
          <p className="text-[11px] text-slate-500 font-sans">Across all 8 camera zones</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-mono">EXTENDED LOITER EVENTS (&gt;5M)</div>
          <div className="text-2xl font-bold text-amber-400">3 Detections</div>
          <p className="text-[11px] text-slate-500 font-sans">Prompted security operator review</p>
        </div>
      </div>

      {/* Hourly Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
            <tr>
              <th className="p-3.5">Time Interval</th>
              <th className="p-3.5">Human Detection Count</th>
              <th className="p-3.5">Median Zone Dwell</th>
              <th className="p-3.5">Traffic Relative Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {hourlyData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition">
                <td className="p-3.5 font-bold text-white">{row.hour}</td>
                <td className="p-3.5 text-cyan-400 font-bold">{row.count} Subjects</td>
                <td className="p-3.5 text-slate-300">{row.avgDwell}</td>
                <td className="p-3.5">
                  <div className="w-48 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-cyan-400 rounded-full" 
                      style={{ width: `${(row.count / 88) * 100}%` }}
                    ></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
