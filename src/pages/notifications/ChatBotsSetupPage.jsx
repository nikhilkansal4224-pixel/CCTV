import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ChatBotsSetupPage() {
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/T00/B00/XXXX');
  const [telegramToken, setTelegramToken] = useState('719283749:AAHk-example-bot-token');
  const [telegramChatId, setTelegramChatId] = useState('-1001892837492');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <Link to="/integrations" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="text-cyan-400" size={22} />
            Slack & Telegram Bot Automated Dispatch
            <span className="badge badge-cyan text-xs">Route #63</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deliver rich message cards with instant video snapshots and quick verification triage buttons
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Slack Card */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs font-mono">
          <h2 className="text-sm font-bold text-white font-sans flex items-center gap-2">
            <span>Slack Incoming Webhook</span>
            <span className="badge badge-emerald text-[10px]">Connected</span>
          </h2>
          <div>
            <label className="form-label font-sans">Webhook URL</label>
            <input 
              type="text" 
              value={slackWebhook} 
              onChange={e => setSlackWebhook(e.target.value)}
              className="form-input text-xs"
            />
          </div>
          <button className="btn btn-secondary btn-sm flex items-center gap-1.5">
            <Send size={12} /> Test Slack Card
          </button>
        </div>

        {/* Telegram Card */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs font-mono">
          <h2 className="text-sm font-bold text-white font-sans flex items-center gap-2">
            <span>Telegram Bot API</span>
            <span className="badge badge-emerald text-[10px]">Connected</span>
          </h2>
          <div>
            <label className="form-label font-sans">Bot Token</label>
            <input 
              type="text" 
              value={telegramToken} 
              onChange={e => setTelegramToken(e.target.value)}
              className="form-input text-xs"
            />
          </div>
          <div>
            <label className="form-label font-sans">Target Chat ID</label>
            <input 
              type="text" 
              value={telegramChatId} 
              onChange={e => setTelegramChatId(e.target.value)}
              className="form-input text-xs"
            />
          </div>
          <button className="btn btn-secondary btn-sm flex items-center gap-1.5">
            <Send size={12} /> Test Telegram Ping
          </button>
        </div>
      </div>
    </div>
  );
}
