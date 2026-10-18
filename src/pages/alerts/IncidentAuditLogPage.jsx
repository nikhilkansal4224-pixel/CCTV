import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Clock, Send, Shield, User } from 'lucide-react';
import { MOCK_ALERTS } from '../../data/mockData';

export default function IncidentAuditLogPage() {
  const { alert_id = 'alt-101' } = useParams();
  const alert = MOCK_ALERTS.find(a => a.id === alert_id) || MOCK_ALERTS[0];

  const [notes, setNotes] = useState([
    { id: 1, author: 'System AI Engine', role: 'Inference Kernel', text: 'Perimeter fence breach polygon triggered with 98.4% confidence.', time: '11:27:14' },
    { id: 2, author: 'Major Sarah Vance', role: 'SOC Chief', text: 'Confirmed visual target on thermal sensor. Dispatched Patrol Alpha.', time: '11:28:02' },
    { id: 3, author: 'Marcus Brody', role: 'Operator', text: '120dB acoustic deterrent siren engaged for 15 seconds.', time: '11:28:30' },
  ]);
  const [newNote, setNewNote] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const item = {
      id: Date.now(),
      author: 'Major Sarah Vance',
      role: 'SOC Chief',
      text: newNote,
      time: new Date().toLocaleTimeString()
    };
    setNotes([...notes, item]);
    setNewNote('');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <Link to={`/alerts/${alert.id}`} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="text-cyan-400" size={22} />
            Incident Commenting & Chain-of-Custody Audit Log
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-proof operator activity timeline for Incident #{alert.id} ({alert.type})
          </p>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Audit Timeline */}
        <div className="space-y-4">
          {notes.map(note => (
            <div key={note.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{note.author}</span>
                  <span className="badge badge-slate text-[10px]">{note.role}</span>
                </div>
                <span className="text-slate-500">{note.time}</span>
              </div>
              <p className="text-slate-300 font-sans text-sm leading-relaxed">
                {note.text}
              </p>
            </div>
          ))}
        </div>

        {/* Add note form */}
        <form onSubmit={handleAdd} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <label className="form-label">Add Certified Operator Note</label>
          <textarea
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Document observed actions, police dispatch case numbers, or evidence retention notes..."
            className="form-textarea h-24 text-xs"
            required
          />
          <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1.5 font-bold">
            <Send size={13} />
            <span>Sign & Append to Audit Trail</span>
          </button>
        </form>
      </div>
    </div>
  );
}
