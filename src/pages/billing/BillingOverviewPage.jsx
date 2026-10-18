import React from 'react';
import { CreditCard, Shield, CheckCircle2, ArrowRight, Zap, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BillingOverviewPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="text-cyan-400" size={22} />
            Subscription Plan & Stream License Overview
            <span className="badge badge-cyan text-xs">Route #80</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Current enterprise tier, active camera stream licenses, compute quotas, and renewal cycle
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/billing/plans" className="btn btn-primary btn-sm text-xs font-bold">
            Upgrade / Scale Streams
          </Link>
          <Link to="/billing/invoices" className="btn btn-secondary btn-sm text-xs">
            Invoices Archive
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Plan Card */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/30 space-y-4">
          <span className="badge badge-cyan text-[10px]">Active Production Plan</span>
          <h2 className="text-xl font-extrabold text-white">Enterprise Fortress Tier</h2>
          <div className="text-2xl font-bold text-cyan-400 font-mono">$1,850 <span className="text-xs text-slate-400 font-normal">/ month</span></div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Unlimited edge inference, 32 camera stream licenses, 90-day retention, dedicated TAM support.
          </p>
          <div className="pt-2 text-xs font-mono text-slate-400 border-t border-slate-800">
            Next renewal: <strong className="text-slate-200">Nov 1, 2026</strong>
          </div>
        </div>

        {/* Quota Card */}
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 font-mono text-xs">
          <div className="text-slate-400 font-sans font-bold uppercase text-[11px]">Stream Quota Utilization</div>
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Active Streams</span>
              <span className="text-cyan-400 font-bold">8 / 32 Cameras (25%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full" style={{ width: '25%' }}></div>
            </div>
          </div>
          <div className="space-y-1.5 text-slate-400 pt-2 border-t border-slate-800">
            <div className="flex justify-between">
              <span>Remaining Stream Headroom:</span>
              <span className="text-emerald-400 font-bold">+24 Streams</span>
            </div>
            <div className="flex justify-between">
              <span>Edge AI Ingestion Units:</span>
              <span className="text-white">3 Nodes</span>
            </div>
          </div>
        </div>

        {/* Payment Method Card */}
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 font-mono text-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="text-slate-400 font-sans font-bold uppercase text-[11px]">Primary Payment Card</div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-cyan-400" />
                <span className="font-bold text-white">•••• 4242 (Visa Corporate)</span>
              </div>
              <span className="text-slate-500">Exp 08/29</span>
            </div>
          </div>
          <Link to="/billing/payment-methods" className="btn btn-secondary btn-sm w-full text-center">
            Manage Payment Methods
          </Link>
        </div>
      </div>
    </div>
  );
}
