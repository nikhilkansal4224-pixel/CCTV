import React, { useState } from 'react';
import { Camera, CheckCircle2, ArrowRight, Video, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AddFirstCameraWizard() {
  const navigate = useNavigate();
  const [streamUrl, setStreamUrl] = useState('rtsp://admin:••••••@192.168.1.101:554/ch0');
  const [connecting, setConnecting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setConnecting(true);
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  return (
    <div className="w-full max-w-lg p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
      <div className="text-center space-y-1">
        <span className="badge badge-cyan text-[10px]">Onboarding Step 2 of 2</span>
        <h1 className="text-xl font-extrabold text-white">Connect Your First Camera Stream</h1>
        <p className="text-xs text-slate-400">
          Enter an RTSP endpoint or let AEGIS discover local ONVIF IP streams
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
        <div>
          <label className="form-label font-sans">Camera Name / Zone</label>
          <input
            type="text"
            defaultValue="Main Entrance Perimeter Gate"
            className="form-input text-xs"
            required
          />
        </div>

        <div>
          <label className="form-label font-sans">RTSP Stream URI</label>
          <input
            type="text"
            value={streamUrl}
            onChange={e => setStreamUrl(e.target.value)}
            className="form-input text-xs font-mono"
            required
          />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 font-sans space-y-1">
          <div className="font-bold text-white flex items-center gap-1.5 text-cyan-400">
            <CheckCircle2 size={14} /> ONVIF Profile S Compatible
          </div>
          <p>YOLOv9 neural detection model will automatically attach to this video stream upon launch.</p>
        </div>

        <button type="submit" className="btn btn-primary w-full text-xs font-bold py-3 flex items-center justify-center gap-2">
          <span>{connecting ? 'Establishing Secure RTSP Ingestion...' : 'Complete Setup & Launch Command Center'}</span>
          <ArrowRight size={14} />
        </button>
      </form>
    </div>
  );
}
