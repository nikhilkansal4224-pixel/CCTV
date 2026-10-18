import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Check } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <span className="badge badge-cyan text-xs">Route #17 • Enterprise Inquiry</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Contact Security Solutions Engineering
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Request an on-site hardware trial or speak directly with our perimeter vision architects.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6 text-xs">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Direct Engineering Desk</h2>
            <p className="text-slate-400">Available 24/7/365 for high-priority facility inquiries.</p>
          </div>

          <div className="space-y-4 font-mono">
            <div className="flex items-center gap-3 text-slate-300">
              <Mail size={16} className="text-cyan-400" />
              <span>defense@aegis-surveillance.io</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Phone size={16} className="text-cyan-400" />
              <span>+1 (800) 555-AEGIS-SEC</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <MapPin size={16} className="text-cyan-400" />
              <span>London SOC Headquarters / Terminal Way</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs font-mono">
          <div>
            <label className="form-label font-sans">Full Name</label>
            <input type="text" placeholder="Johnathan Doe" className="form-input text-xs" required />
          </div>

          <div>
            <label className="form-label font-sans">Corporate Work Email</label>
            <input type="email" placeholder="j.doe@logistics.com" className="form-input text-xs" required />
          </div>

          <div>
            <label className="form-label font-sans">Facility Ingress Scope</label>
            <textarea placeholder="Describe physical perimeter, camera count, and primary risks..." className="form-textarea h-24 text-xs font-sans" required />
          </div>

          <button type="submit" className="btn btn-primary w-full text-xs font-bold py-2.5">
            {submitted ? '✓ Request Dispatched to Engineering' : 'Submit Deployment Inquiry'}
          </button>
        </form>
      </div>
    </div>
  );
}
