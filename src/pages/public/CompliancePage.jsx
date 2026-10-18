import React from 'react';
import { ShieldCheck, Check } from 'lucide-react';

export default function CompliancePage() {
  const certs = [
    { title: 'EU General Data Protection Regulation (GDPR)', desc: 'Full compliance with Article 32 data security and Article 35 Data Protection Impact Assessments (DPIAs) for video surveillance.' },
    { title: 'SOC 2 Type II Certified', desc: 'Independently audited operational security controls, role-based access enforcement, and encrypted audit trails.' },
    { title: 'NDAA Section 889 Compliant', desc: 'Hardware architecture free of telecommunications components and video silicon banned by U.S. National Defense Authorization.' },
    { title: 'CJIS Security Policy Compliance', desc: 'Cryptographically secured chain-of-custody exports suitable for municipal police evidence submission.' }
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12 font-sans">
      <div className="space-y-4">
        <span className="badge badge-emerald text-xs">Route #20 • Regulatory Standards</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          GDPR, SOC2 & Regulatory Compliance
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Built from the ground up to satisfy the strictest enterprise privacy and physical security standards.
        </p>
      </div>

      <div className="space-y-4">
        {certs.map((c, i) => (
          <div key={i} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-emerald-400 shrink-0" size={18} />
              <h2 className="text-base font-bold text-white">{c.title}</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pl-6">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
