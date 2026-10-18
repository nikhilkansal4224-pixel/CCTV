import React, { useState } from 'react';
import { Building, Server, Globe, ArrowRight, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OrgSetupWizard() {
  const navigate = useNavigate();
  const [topology, setTopology] = useState('hybrid'); // 'edge', 'cloud', 'hybrid'

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/onboarding/add-first-camera');
  };

  return (
    <div className="w-full max-w-lg p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
      <div className="text-center space-y-1">
        <span className="badge badge-cyan text-[10px]">Onboarding Step 1 of 2</span>
        <h1 className="text-xl font-extrabold text-white">Configure SOC Organization</h1>
        <p className="text-xs text-slate-400">
          Select deployment infrastructure topology for your physical surveillance perimeter
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
        <div>
          <label className="form-label font-sans">Primary SOC Workspace Name</label>
          <input
            type="text"
            defaultValue="Perimeter Command Alpha"
            className="form-input text-xs"
            required
          />
        </div>

        <div>
          <label className="form-label font-sans">Deployment Architecture</label>
          <div className="space-y-2 font-sans">
            <div 
              onClick={() => setTopology('hybrid')}
              className={`p-3 rounded-xl border cursor-pointer transition ${topology === 'hybrid' ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
            >
              <div className="font-bold text-white text-xs">Hybrid Edge-Cloud (Recommended)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Real-time YOLOv9 inference on local Jetson, forensic clips mirrored to cloud S3</div>
            </div>

            <div 
              onClick={() => setTopology('edge')}
              className={`p-3 rounded-xl border cursor-pointer transition ${topology === 'edge' ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
            >
              <div className="font-bold text-white text-xs">Air-Gapped On-Premises Edge Only</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Zero WAN egress. Defense and high-security military specification</div>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full text-xs font-bold py-3 flex items-center justify-center gap-2">
          <span>Save Workspace & Connect First Camera</span>
          <ArrowRight size={14} />
        </button>
      </form>
    </div>
  );
}
