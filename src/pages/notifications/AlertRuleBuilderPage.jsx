import React, { useState } from 'react';
import { ArrowLeft, Zap, BellRing, Volume2, Send, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MOCK_CAMERAS } from '../../data/mockData';

export default function AlertRuleBuilderPage() {
  const navigate = useNavigate();
  const [ruleName, setRuleName] = useState('After-Hours Loading Bay Intrusion Trigger');
  const [camera, setCamera] = useState('cam-03');
  const [triggerEvent, setTriggerEvent] = useState('human-dwell');
  const [minConfidence, setMinConfidence] = useState(90);
  const [actions, setActions] = useState({ siren: true, slack: true, sms: false });

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/notifications/rules');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <Link to="/notifications/rules" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="text-cyan-400" size={22} />
            Visual "IF-THIS-THEN-THAT" Rule Builder
            <span className="badge badge-cyan text-xs">Route #59</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Program autonomous reactive behaviors based on spatial zones, timestamps, and confidence scores
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-6 text-xs font-mono">
        <div>
          <label className="form-label font-sans">Rule Name</label>
          <input
            type="text"
            value={ruleName}
            onChange={e => setRuleName(e.target.value)}
            className="form-input text-xs"
            required
          />
        </div>

        {/* STEP 1: TRIGGER */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-cyan-400 font-sans uppercase">Step 1: IF Condition (Detection Trigger)</div>
          
          <div className="grid grid-cols-2 gap-3 font-sans">
            <div>
              <label className="form-label">On Camera Feed</label>
              <select 
                value={camera} 
                onChange={e => setCamera(e.target.value)}
                className="form-select text-xs"
              >
                {MOCK_CAMERAS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Detection Type</label>
              <select 
                value={triggerEvent} 
                onChange={e => setTriggerEvent(e.target.value)}
                className="form-select text-xs"
              >
                <option value="human-dwell">Human Dwell / Loitering (&gt; 60s)</option>
                <option value="perimeter-breach">Virtual Tripwire Crossed</option>
                <option value="vehicle-tailgate">Unauthorized Vehicle Tailgate</option>
                <option value="ppe-violation">PPE Hardhat Violation</option>
              </select>
            </div>
          </div>
        </div>

        {/* STEP 2: TIME & THRESHOLD */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-amber-400 font-sans uppercase">Step 2: WHEN Condition (Time & Confidence)</div>
          
          <div className="grid grid-cols-2 gap-3 font-sans">
            <div>
              <label className="form-label">Armed Schedule Window</label>
              <select className="form-select text-xs">
                <option>Night Shift (10:00 PM – 06:00 AM)</option>
                <option>24/7 Continuous All Hours</option>
                <option>Weekends & Holidays Only</option>
              </select>
            </div>

            <div>
              <label className="form-label">Min Confidence: {minConfidence}%</label>
              <input
                type="range"
                min="70"
                max="99"
                value={minConfidence}
                onChange={e => setMinConfidence(Number(e.target.value))}
                className="w-full accent-amber-400 mt-2"
              />
            </div>
          </div>
        </div>

        {/* STEP 3: ACTION */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-emerald-400 font-sans uppercase">Step 3: THEN Execute (Autonomous Actions)</div>

          <div className="space-y-2 font-sans">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input 
                type="checkbox" 
                checked={actions.siren} 
                onChange={e => setActions({ ...actions, siren: e.target.checked })}
                className="accent-emerald-400"
              />
              <span>Engage 120dB Strobe Siren Relay (#1) at Camera Location</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input 
                type="checkbox" 
                checked={actions.slack} 
                onChange={e => setActions({ ...actions, slack: e.target.checked })}
                className="accent-emerald-400"
              />
              <span>Send Instant Video Snapshot to #security-alerts Slack Channel</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input 
                type="checkbox" 
                checked={actions.sms} 
                onChange={e => setActions({ ...actions, sms: e.target.checked })}
                className="accent-emerald-400"
              />
              <span>Dispatch SMS Alert with GPS Pin to Lead Security Officer</span>
            </label>
          </div>
        </div>

        <button type="submit" className="btn btn-primary text-xs font-bold py-2.5 px-6">
          Deploy Automated Workflow Rule
        </button>
      </form>
    </div>
  );
}
