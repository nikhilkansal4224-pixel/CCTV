import React, { useState } from 'react';
import { ArrowLeft, Send, Paperclip, HelpCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('high');
  const [description, setDescription] = useState('');
  const [attachLogs, setAttachLogs] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/support/tickets');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <Link to="/support/tickets" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="text-cyan-400" size={22} />
            Submit Technical Support Ticket
            <span className="badge badge-cyan text-xs">Route #86</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch diagnostic trace bundles directly to Level 3 Vision Engineers
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs font-mono">
        <div>
          <label className="form-label font-sans">Issue Subject</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. RTSP Frame Drop on Cam 04 during Night Mode"
            className="form-input text-xs"
            required
          />
        </div>

        <div>
          <label className="form-label font-sans">Severity Urgency</label>
          <select 
            value={priority} 
            onChange={e => setPriority(e.target.value)}
            className="form-select text-xs font-mono"
          >
            <option value="critical">Critical: Perimeter Blind / Active Ingress Blocked (1h SLA)</option>
            <option value="high">High: Single Camera Stream Dropped (4h SLA)</option>
            <option value="medium">Medium: Calibration Optimization Request (24h SLA)</option>
          </select>
        </div>

        <div>
          <label className="form-label font-sans">Problem Description & Symptoms</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Detail observed behavior, camera IP, and symptoms..."
            className="form-textarea h-28 text-xs font-sans"
            required
          />
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 text-slate-300 font-sans cursor-pointer">
            <input 
              type="checkbox" 
              checked={attachLogs} 
              onChange={e => setAttachLogs(e.target.checked)}
              className="accent-cyan-400"
            />
            <span>Auto-attach edge node diagnostic crash dumps and system journal</span>
          </label>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <button type="submit" className="btn btn-primary text-xs font-bold py-2.5 px-6">
            Submit Support Request
          </button>
        </div>
      </form>
    </div>
  );
}
