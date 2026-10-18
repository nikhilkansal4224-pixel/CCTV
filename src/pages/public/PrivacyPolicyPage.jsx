import React from 'react';
import { Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="space-y-4">
        <span className="badge badge-cyan text-xs">Route #18 • Legal & Privacy</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Surveillance Stream Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-mono">
          Last Updated: October 2026 • Compliant with EU GDPR & California CPRA
        </p>
      </div>

      <div className="prose prose-invert text-slate-300 space-y-6 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-white">1. Edge Processing Principle</h2>
        <p>
          AEGIS processes video feeds locally on dedicated on-premise edge hardware nodes. Continuous live video streams are never transmitted, analyzed, or stored in public third-party cloud data centers unless a verified security breach trigger occurs.
        </p>

        <h2 className="text-lg font-bold text-white">2. Biometric Data & Facial Redaction</h2>
        <p>
          Our neural models are trained to detect human presence, bounding volumes, and movement vectors without extracting immutable biometric facial embeddings. For public facing cameras, hardware in-encoder privacy masks can be configured to irreversibly redact sensitive regions before video encoding.
        </p>
      </div>
    </div>
  );
}
