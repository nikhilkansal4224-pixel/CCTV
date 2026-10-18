import React from 'react';
import { ArrowLeft, Download, FileText, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InvoicesArchivePage() {
  const invoices = [
    { id: 'INV-2026-10', date: 'Oct 01, 2026', amount: '$1,850.00', status: 'Paid', method: 'Visa •••• 4242' },
    { id: 'INV-2026-09', date: 'Sep 01, 2026', amount: '$1,850.00', status: 'Paid', method: 'Visa •••• 4242' },
    { id: 'INV-2026-08', date: 'Aug 01, 2026', amount: '$1,850.00', status: 'Paid', method: 'Visa •••• 4242' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <Link to="/billing" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="text-cyan-400" size={22} />
            Invoices & Receipts Archive
            <span className="badge badge-cyan text-xs">Route #83</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Downloadable itemized PDF statements and sales receipts for corporate expense reconciliation
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
            <tr>
              <th className="p-3.5">Invoice ID</th>
              <th className="p-3.5">Billing Date</th>
              <th className="p-3.5">Amount Charged</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Payment Method</th>
              <th className="p-3.5 text-right">PDF Download</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {invoices.map(inv => (
              <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                <td className="p-3.5 font-bold text-cyan-400">{inv.id}</td>
                <td className="p-3.5 text-slate-300">{inv.date}</td>
                <td className="p-3.5 font-bold text-white">{inv.amount}</td>
                <td className="p-3.5">
                  <span className="badge badge-emerald text-[10px] flex items-center gap-1 w-fit">
                    <CheckCircle2 size={11} /> {inv.status}
                  </span>
                </td>
                <td className="p-3.5 text-slate-400">{inv.method}</td>
                <td className="p-3.5 text-right">
                  <button className="btn btn-secondary btn-sm text-[11px] flex items-center gap-1 ml-auto">
                    <Download size={12} /> Receipt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
