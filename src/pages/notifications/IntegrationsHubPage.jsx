import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Puzzle, Webhook, MessageSquare, Volume2, 
  ExternalLink, CheckCircle2, ShieldCheck, Zap 
} from 'lucide-react';

export default function IntegrationsHubPage() {
  const [integrations] = useState([
    {
      id: 'webhooks',
      name: 'Custom HTTP Webhooks',
      description: 'Send signed HMAC-SHA256 JSON payloads on threat detections to your backend servers.',
      link: '/integrations/webhooks',
      connected: true,
      category: 'Developer API'
    },
    {
      id: 'chat',
      name: 'Slack & Telegram Incident Bots',
      description: 'Stream instant bounding-box snapshots and triage buttons into security team chat channels.',
      link: '/integrations/chat',
      connected: true,
      category: 'Messaging'
    },
    {
      id: 'relays',
      name: 'Physical Alarm Relays & IoT Sirens',
      description: 'Control GPIO pins, dry contact relays, Advantech ADAM modules, and IP strobe megaphones.',
      link: '/integrations/relays',
      connected: true,
      category: 'Hardware Control'
    },
    {
      id: 'pagerduty',
      name: 'PagerDuty & OpsGenie',
      description: 'Trigger on-call security engineer paging escalations when Critical Perimeter breaches occur.',
      link: '#',
      connected: false,
      category: 'Incident Response'
    }
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Puzzle className="text-cyan-400" size={22} />
          Third-Party Integrations & Connectors Hub
          <span className="badge badge-cyan text-xs">Route #61</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Connect external messaging, physical IoT sirens, SIEM logging pipelines, and automated webhooks
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map(item => (
          <div key={item.id} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="badge badge-slate text-[10px]">{item.category}</span>
                {item.connected ? (
                  <span className="badge badge-emerald text-[10px] flex items-center gap-1">
                    <CheckCircle2 size={11} /> Connected
                  </span>
                ) : (
                  <span className="badge badge-slate text-[10px]">Not Configured</span>
                )}
              </div>
              <h2 className="text-base font-bold text-white">{item.name}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-800 flex justify-end">
              <Link to={item.link} className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5 font-medium">
                <span>Configure Integration</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
