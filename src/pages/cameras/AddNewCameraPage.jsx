import React, { useState } from 'react';
import { Camera, ArrowLeft, Search, Check, RefreshCw, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function AddNewCameraPage() {
  const navigate = useNavigate();
  const [ingestionType, setIngestionType] = useState('onvif'); // 'onvif', 'rtsp', 'rtmp'
  const [scanning, setScanning] = useState(false);
  const [ip, setIp] = useState('192.168.1.109');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('••••••••');
  const [streamName, setStreamName] = useState('East Warehouse Corridor');

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => setScanning(false), 1200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/cameras');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <Link to="/cameras" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Camera className="text-cyan-400" size={22} />
            Camera Onboarding & Connection Wizard
            <span className="badge badge-cyan text-xs">Route #53</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Connect IP cameras via ONVIF Profile S auto-discovery or direct encrypted RTSP/WebRTC endpoints
          </p>
        </div>
      </div>

      <div className="max-w-2xl p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-6">
        {/* Method Switcher */}
        <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setIngestionType('onvif')}
            className={`py-2 rounded-lg font-bold transition ${ingestionType === 'onvif' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}
          >
            ONVIF Auto-Probe
          </button>
          <button
            onClick={() => setIngestionType('rtsp')}
            className={`py-2 rounded-lg font-bold transition ${ingestionType === 'rtsp' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}
          >
            Direct RTSP Stream
          </button>
          <button
            onClick={() => setIngestionType('rtmp')}
            className={`py-2 rounded-lg font-bold transition ${ingestionType === 'rtmp' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}
          >
            Cloud RTMP Push
          </button>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="form-label font-sans">Camera Display Label</label>
            <input
              type="text"
              value={streamName}
              onChange={e => setStreamName(e.target.value)}
              className="form-input text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label font-sans">IP Address / Hostname</label>
              <input
                type="text"
                value={ip}
                onChange={e => setIp(e.target.value)}
                className="form-input text-xs"
                required
              />
            </div>
            <div>
              <label className="form-label font-sans">ONVIF / RTSP Port</label>
              <input
                type="text"
                defaultValue="554"
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label font-sans">Device Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="form-input text-xs"
                required
              />
            </div>
            <div>
              <label className="form-label font-sans">Device Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="form-input text-xs"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleScan}
              className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={scanning ? 'animate-spin text-cyan-400' : ''} />
              <span>{scanning ? 'Probing Subnet...' : 'Test RTSP Handshake'}</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <Link to="/cameras" className="text-slate-400 hover:text-white font-sans text-xs">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary text-xs font-bold py-2.5 px-6">
              Connect Camera & Launch Stream
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
