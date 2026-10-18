import React from 'react';
import { HelpCircle, Plus, Clock, CheckCircle2, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_TICKETS } from '../../data/mockData';

export default function SupportTicketsCenterPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="text-cyan-400" size={22} />
            Support Ticket Center & Engineering SLA
            <span className="badge badge-cyan text-xs">Route #85</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Direct communication channel with dedicated edge computer vision and network infrastructure engineers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/support/troubleshoot" className="btn btn-secondary btn-sm text-xs">
            Interactive Troubleshooter
          </Link>
          <Link to="/support/tickets/new" className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5">
            <Plus size={14} />
            <span>Open New Support Ticket</span>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {MOCK_TICKETS.map(ticket => (
          <div key={ticket.id} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-cyan-400">{ticket.id}</span>
                <h3 className="font-bold text-white text-sm font-sans">{ticket.subject}</h3>
                <span className={`badge ${ticket.status === 'Resolved' ? 'badge-emerald' : 'badge-amber'} text-[10px]`}>
                  {ticket.status}
                </span>
              </div>
              <div className="text-slate-400 font-sans">
                Assigned Specialist: <strong className="text-slate-200">{ticket.assignedTo}</strong> • Opened: {ticket.createdAt}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-slate-400">SLA: <strong className="text-emerald-400">{ticket.slaTimeRemaining}</strong></span>
              <button className="btn btn-secondary btn-sm">View Ticket Thread</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
