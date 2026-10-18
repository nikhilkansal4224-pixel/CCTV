import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PaymentMethodsPage() {
  const [cards] = useState([
    { id: 'c-1', brand: 'Visa Corporate', last4: '4242', exp: '08/2029', isDefault: true },
    { id: 'c-2', brand: 'Mastercard Backup', last4: '8821', exp: '11/2027', isDefault: false },
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <Link to="/billing" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="text-cyan-400" size={22} />
            Payment Methods & Billing Contacts
            <span className="badge badge-cyan text-xs">Route #82</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage corporate credit cards, automated wire transfer instructions, and accounts payable contacts
          </p>
        </div>
      </div>

      <div className="max-w-2xl space-y-4">
        {cards.map(c => (
          <div key={c.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-800 text-cyan-400">
                <CreditCard size={20} />
              </div>
              <div>
                <div className="font-bold text-white text-sm font-sans flex items-center gap-2">
                  <span>{c.brand} •••• {c.last4}</span>
                  {c.isDefault && <span className="badge badge-emerald text-[10px]">Default</span>}
                </div>
                <div className="text-slate-400 mt-0.5">Expires {c.exp}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="btn btn-secondary btn-sm text-[11px]">Edit</button>
            </div>
          </div>
        ))}

        <button className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 mt-4">
          <Plus size={14} /> Add Payment Method
        </button>
      </div>
    </div>
  );
}
