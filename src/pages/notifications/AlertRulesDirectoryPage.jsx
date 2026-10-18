import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, Plus, Play, Pause, Trash2, CheckCircle2, ArrowRight } from 'lucide-react';
import { MOCK_RULES } from '../../data/mockData';

export default function AlertRulesDirectoryPage() {
  const [rules, setRules] = useState(MOCK_RULES);

  const toggleRule = (id) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BellRing className="text-cyan-400" size={22} />
            Automated Alert Workflows Directory
            <span className="badge badge-cyan text-xs">Route #58</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous threat reaction pipelines, shift-aware trigger schedules, and siren dispatch routines
          </p>
        </div>

        <Link to="/notifications/rules/new" className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5">
          <Plus size={14} />
          <span>Create "IF-THIS-THEN-THAT" Rule</span>
        </Link>
      </div>

      <div className="space-y-4">
        {rules.map(rule => (
          <div key={rule.id} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-cyan-400 font-bold">{rule.id}</span>
                <h3 className="font-bold text-white text-base">{rule.name}</h3>
                <span className={`badge ${rule.enabled ? 'badge-emerald' : 'badge-slate'} text-[10px]`}>
                  {rule.enabled ? 'Active Engine' : 'Paused'}
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400 space-y-1">
                <div>IF: <strong className="text-slate-200">{rule.trigger}</strong></div>
                <div>WHEN: <strong className="text-amber-400">{rule.condition}</strong></div>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-slate-500">THEN DO:</span>
                  {rule.actions.map((act, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px] border border-slate-700">
                      {act}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
              <div className="text-right text-xs font-mono text-slate-500 hidden sm:block">
                <div>{rule.executions24h} Triggers</div>
                <div>in past 24h</div>
              </div>
              <button
                onClick={() => toggleRule(rule.id)}
                className={`btn btn-sm text-xs ${rule.enabled ? 'btn-secondary text-amber-400' : 'btn-primary font-bold'}`}
              >
                {rule.enabled ? 'Pause Rule' : 'Enable Rule'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
