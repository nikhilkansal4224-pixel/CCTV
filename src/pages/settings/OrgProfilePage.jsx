import React, { useState } from 'react';
import { Sliders, Building, Shield, Globe, Clock, Save } from 'lucide-react';

export default function OrgProfilePage() {
  const [orgName, setOrgName] = useState('AEGIS Global Defense & Logistics SOC');
  const [address, setAddress] = useState('Sector 4 Industrial Compound, Terminal Way');
  const [timezone, setTimezone] = useState('UTC+00:00 (London / UTC Primary)');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Building className="text-cyan-400" size={22} />
          Organization Profile & SOC Headquarters
          <span className="badge badge-cyan text-xs">Route #71</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage workspace organization metadata, default timezone, emergency contacts, and SOC headquarters
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs font-mono">
        <div>
          <label className="form-label font-sans">Organization Legal Name</label>
          <input
            type="text"
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            className="form-input text-xs"
            required
          />
        </div>

        <div>
          <label className="form-label font-sans">Primary SOC Facility Address</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="form-input text-xs"
            required
          />
        </div>

        <div>
          <label className="form-label font-sans">Default Operating Timezone</label>
          <select 
            value={timezone} 
            onChange={e => setTimezone(e.target.value)}
            className="form-select text-xs"
          >
            <option>UTC+00:00 (London / UTC Primary)</option>
            <option>UTC-05:00 (US Eastern Time)</option>
            <option>UTC-08:00 (US Pacific Time)</option>
            <option>UTC+01:00 (Central European Time)</option>
            <option>UTC+05:30 (India Standard Time)</option>
          </select>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <button type="submit" className="btn btn-primary text-xs font-bold py-2.5 px-6">
            {saved ? '✓ Profile Updated' : 'Save Organization Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
