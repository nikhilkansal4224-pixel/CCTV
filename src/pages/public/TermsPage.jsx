import React from 'react';

export default function TermsPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="space-y-4">
        <span className="badge badge-cyan text-xs">Route #19 • Legal Agreements</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Terms of Service & Operational SLA
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-mono">
          Last Updated: October 2026 • Enterprise Master Services Agreement
        </p>
      </div>

      <div className="prose prose-invert text-slate-300 space-y-6 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-white">1. Service Level Agreement (99.9% Uptime)</h2>
        <p>
          AEGIS guarantees a 99.9% uptime availability for cloud synchronization, webhook dispatch services, and edge container runtime updates. Edge processing continues uninterrupted locally regardless of WAN connection state.
        </p>

        <h2 className="text-lg font-bold text-white">2. Acceptable Use & Defense Boundaries</h2>
        <p>
          The system must be deployed in accordance with municipal physical security laws. Users are solely responsible for installing visible physical CCTV warning signage where required by law.
        </p>
      </div>
    </div>
  );
}
