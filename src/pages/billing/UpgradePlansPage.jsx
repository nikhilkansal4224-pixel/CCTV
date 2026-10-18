import React from 'react';
import { ArrowLeft, Check, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UpgradePlansPage() {
  const tiers = [
    { name: 'Starter Sentinel', price: '$490', period: '/month', streams: '8 Cameras', retention: '14 Days Storage', current: false, features: ['Sub-second edge human detection', 'Basic email & webhook alerts', '1x Jetson Orin Nano gateway', 'Email support (24h SLA)'] },
    { name: 'Enterprise Fortress', price: '$1,850', period: '/month', streams: '32 Cameras', retention: '90 Days Storage', current: true, features: ['Unlimited edge inference YOLOv9', 'IoT siren & hardware relay controls', 'Multi-facility floorplan mapping', 'Slack / Telegram automated bots', 'Dedicated Security Engineer SLA'] },
    { name: 'Defense Defense Grid', price: 'Custom', period: '/quote', streams: 'Unlimited Cameras', retention: '365 Days Vault', current: false, features: ['Air-gapped on-prem edge clusters', 'Custom thermal neural weights', 'Full CJIS / SOC2 Type II cert', '24/7 dedicated SOC phone line'] },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <Link to="/billing" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="text-cyan-400" size={22} />
            Change / Upgrade Surveillance Plan Tiers
            <span className="badge badge-cyan text-xs">Route #81</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Scale active camera stream quotas and compute licenses to match physical facility expansions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((t, idx) => (
          <div 
            key={idx} 
            className={`p-6 rounded-xl border flex flex-col justify-between ${
              t.current 
                ? 'bg-slate-900 border-cyan-500 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-500/40' 
                : 'bg-slate-900/50 border-slate-800'
            }`}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-base">{t.name}</span>
                {t.current && <span className="badge badge-cyan text-[10px]">Active</span>}
              </div>
              <div className="text-2xl font-bold text-white font-mono">{t.price} <span className="text-xs text-slate-400 font-normal">{t.period}</span></div>
              <div className="text-xs font-mono text-cyan-400 font-bold">{t.streams} • {t.retention}</div>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                {t.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-300">
                    <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              disabled={t.current}
              className={`mt-6 btn w-full text-xs font-bold py-2.5 ${t.current ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary'}`}
            >
              {t.current ? 'Currently Active Tier' : 'Upgrade to Tier'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
