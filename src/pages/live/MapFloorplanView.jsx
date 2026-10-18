import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Shield, AlertTriangle, Video, Eye, Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import CctvCanvasSimulator from '../../components/CctvCanvasSimulator';
import { MOCK_CAMERAS } from '../../data/mockData';

export default function MapFloorplanView() {
  const [selectedCamera, setSelectedCamera] = useState(MOCK_CAMERAS[0]);
  const [activeFloor, setActiveFloor] = useState('ground'); // 'ground', 'roof', 'warehouse'

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            Perimeter Floorplan & Tactical Map
            <span className="badge badge-cyan text-xs">8 Camera Pins Synchronized</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Spatial visualizer showing camera fields-of-view and real-time perimeter alert vectors
          </p>
        </div>

        {/* Floor Switcher */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
          <button
            onClick={() => setActiveFloor('ground')}
            className={`px-3 py-1 rounded transition cursor-pointer ${activeFloor === 'ground' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Level 1: Ground & Perimeter
          </button>
          <button
            onClick={() => setActiveFloor('warehouse')}
            className={`px-3 py-1 rounded transition cursor-pointer ${activeFloor === 'warehouse' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Level 2: Logistics & Vault
          </button>
          <button
            onClick={() => setActiveFloor('roof')}
            className={`px-3 py-1 rounded transition cursor-pointer ${activeFloor === 'roof' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Level 3: Helipad Roof
          </button>
        </div>
      </div>

      {/* Main Floorplan Canvas and Selected Camera Popout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Tactical Map Visualizer */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#090d18] p-6 relative overflow-hidden min-h-[520px] flex flex-col justify-between cyber-grid-bg">
          {/* Floorplan blueprint geometry */}
          <div className="relative w-full h-[450px] border border-cyan-500/20 rounded-xl bg-slate-950/60 p-4">
            {/* Facility building contours */}
            <div className="absolute top-[20%] left-[25%] w-[50%] h-[55%] border-2 border-slate-700 bg-slate-900/40 rounded-lg flex items-center justify-center">
              <span className="font-mono text-xs text-slate-500 font-bold tracking-widest uppercase">
                MAIN CORPORATE & DATACENTER VAULT
              </span>
            </div>

            {/* Loading Dock sector */}
            <div className="absolute top-[40%] right-[6%] w-[20%] h-[30%] border border-dashed border-amber-500/40 bg-amber-950/10 rounded flex items-center justify-center text-center p-2">
              <span className="font-mono text-[10px] text-amber-400">LOGISTICS DOCK 3</span>
            </div>

            {/* Perimeter boundary lines */}
            <div className="absolute inset-4 border border-cyan-500/30 rounded-xl pointer-events-none"></div>

            {/* Camera Interactive Pins */}
            {MOCK_CAMERAS.map((cam) => {
              const isSelected = selectedCamera.id === cam.id;
              const isAlert = cam.status === 'alert';
              const coords = cam.floorplanCoordinates || { x: 50, y: 50 };

              return (
                <div
                  key={cam.id}
                  onClick={() => setSelectedCamera(cam)}
                  style={{ top: `${coords.y}%`, left: `${coords.x}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                >
                  {/* Field of View Cone */}
                  <div 
                    className={`absolute -top-12 -left-12 w-24 h-24 rounded-full pointer-events-none opacity-20 transition-all ${
                      isAlert ? 'bg-red-500 animate-pulse' : (isSelected ? 'bg-cyan-400' : 'bg-slate-400')
                    }`}
                    style={{ clipPath: 'polygon(50% 50%, 20% 0%, 80% 0%)' }}
                  ></div>

                  {/* Pulsing ring if breach */}
                  {isAlert && (
                    <div className="absolute -inset-2 rounded-full border border-red-500 animate-ping pointer-events-none"></div>
                  )}

                  {/* Pin Node */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                      isSelected 
                        ? 'bg-cyan-400 text-slate-950 scale-125 ring-4 ring-cyan-500/30' 
                        : (isAlert ? 'bg-red-500 text-white animate-bounce' : 'bg-slate-800 text-slate-300 border border-slate-700 hover:scale-110')
                    }`}
                  >
                    <Video size={13} />
                  </div>

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-200 pointer-events-none opacity-0 group-hover:opacity-100 transition shadow-xl z-30">
                    {cam.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Map Legend */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400 flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Normal Stream
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Active Breach Zone
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Logistics Staging
              </span>
            </div>
            <span>Click any camera pin to inspect live feed</span>
          </div>
        </div>

        {/* Selected Camera Feed Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="text-xs font-mono text-cyan-400">SELECTED PIN</div>
              <h3 className="font-bold text-white text-sm">{selectedCamera.name}</h3>
            </div>
            <Link to={`/live/${selectedCamera.id}`} className="btn btn-secondary btn-sm text-xs">
              Expanded PTZ
            </Link>
          </div>

          {/* Video Simulator */}
          <CctvCanvasSimulator
            cameraId={selectedCamera.id}
            cameraName={selectedCamera.name}
            mode="view"
            isAlert={selectedCamera.status === 'alert'}
            aspectRatio="16/9"
          />

          {/* Telemetry specs */}
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-400">
              <span>Location:</span>
              <span className="text-slate-200">{selectedCamera.location}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-400">
              <span>IP & RTSP:</span>
              <span className="text-cyan-400">{selectedCamera.ip}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-400">
              <span>Detection Model:</span>
              <span className="text-purple-400">{selectedCamera.aiModel}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-400">
              <span>Threat Status:</span>
              <span className={selectedCamera.status === 'alert' ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                {selectedCamera.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
