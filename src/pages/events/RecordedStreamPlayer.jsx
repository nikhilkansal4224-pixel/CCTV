import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Play, Pause, RotateCcw, FastForward, Clock, 
  Calendar, Scissors, Download, Shield, ArrowLeft 
} from 'lucide-react';
import CctvCanvasSimulator from '../../components/CctvCanvasSimulator';
import { MOCK_CAMERAS } from '../../data/mockData';

export default function RecordedStreamPlayer() {
  const { camera_id = 'cam-01' } = useParams();
  const camera = MOCK_CAMERAS.find(c => c.id === camera_id) || MOCK_CAMERAS[0];

  const [scrubberTime, setScrubberTime] = useState(45); // percent of day
  const [playbackSpeed, setPlaybackSpeed] = useState('1x');

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Continuous 24/7 NVR Timeline Playback
              <span className="badge badge-cyan text-xs">H.265 Transcode</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {camera.name} • 30 Days Retained on Local RAID
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/playback/clip-editor" className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5">
            <Scissors size={14} className="text-cyan-400" />
            <span>Clip Editor</span>
          </Link>
          <Link to="/exports" className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5">
            <Download size={14} />
            <span>Exports</span>
          </Link>
        </div>
      </div>

      {/* Video Viewport */}
      <div className="rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
        <CctvCanvasSimulator
          cameraId={camera.id}
          cameraName={`${camera.name} [RECORDED PLAYBACK]`}
          mode="view"
          aspectRatio="16/9"
        />
      </div>

      {/* 24-Hour Continuous Timeline Scrubber */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-cyan-400" />
            <span className="text-slate-200 font-bold">2026-10-18 (Today)</span>
            <span className="text-slate-500">•</span>
            <Clock size={14} />
            <span className="text-cyan-400 font-bold">11:27:14 AM</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 mr-1">Speed:</span>
            {['1x', '2x', '4x', '8x', '16x'].map(spd => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-0.5 rounded text-[11px] ${playbackSpeed === spd ? 'bg-cyan-500 text-black font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                {spd}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Bar with Event Tick Marks */}
        <div className="space-y-1">
          <div className="relative w-full h-8 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden cursor-pointer">
            {/* Continuous recorded footage bar */}
            <div className="absolute inset-y-0 left-0 right-10 bg-emerald-950/40 border-r border-emerald-500/50"></div>
            
            {/* Event Markers (Color-coded incidents) */}
            <div className="absolute inset-y-0 left-[22%] w-2 bg-amber-500/80" title="Loitering Event (05:14 AM)"></div>
            <div className="absolute inset-y-0 left-[45%] w-3 bg-red-500 animate-pulse" title="Perimeter Breach (11:27 AM)"></div>
            <div className="absolute inset-y-0 left-[68%] w-1.5 bg-cyan-400" title="Vehicle Ingress (04:12 PM)"></div>

            {/* Current Scrub Head */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg shadow-cyan-400 pointer-events-none"
              style={{ left: `${scrubberTime}%` }}
            >
              <div className="w-3 h-3 -ml-1 rounded-full bg-cyan-400 shadow-md"></div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={scrubberTime}
              onChange={e => setScrubberTime(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            />
          </div>

          {/* Time markers */}
          <div className="flex justify-between text-[10px] text-slate-500 pt-1">
            <span>00:00</span>
            <span>04:00</span>
            <span>08:00</span>
            <span className="text-cyan-400 font-bold">12:00 PM</span>
            <span>16:00</span>
            <span>20:00</span>
            <span>23:59</span>
          </div>
        </div>
      </div>
    </div>
  );
}
