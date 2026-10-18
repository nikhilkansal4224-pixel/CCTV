import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, Pause, Maximize2, Shield, Eye, AlertTriangle, 
  RotateCcw, Sliders, Crosshair, Sparkles, Volume2, VolumeX 
} from 'lucide-react';

export default function CctvCanvasSimulator({
  cameraId = 'cam-01',
  cameraName = 'North Perimeter Fence - Cam 01',
  mode = 'view', // 'view', 'zones', 'mask', 'ptz', 'calibration'
  initialFilter = 'normal', // 'normal', 'night', 'thermal'
  onZoneChange = null,
  showControls = true,
  aspectRatio = '16/9',
  isAlert = false
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [audioMuted, setAudioMuted] = useState(true);
  const [ptzPan, setPtzPan] = useState(0);
  const [ptzTilt, setPtzTilt] = useState(0);
  const [ptzZoom, setPtzZoom] = useState(1);

  // Zone drawing state
  const [zonePoints, setZonePoints] = useState([
    { x: 0.15, y: 0.35 },
    { x: 0.55, y: 0.30 },
    { x: 0.65, y: 0.75 },
    { x: 0.20, y: 0.80 }
  ]);
  const [privacyMasks, setPrivacyMasks] = useState([
    { x: 0.75, y: 0.15, w: 0.20, h: 0.25 }
  ]);

  // Target simulation state
  const targetsRef = useRef([
    {
      id: '#H-492',
      x: 0.25,
      y: 0.50,
      vx: 0.0008,
      vy: 0.0004,
      w: 0.06,
      h: 0.14,
      label: 'Human',
      confidence: 98.4,
      inBreach: true
    },
    {
      id: '#H-510',
      x: 0.70,
      y: 0.60,
      vx: -0.0006,
      vy: 0.0003,
      w: 0.055,
      h: 0.13,
      label: 'Human',
      confidence: 94.1,
      inBreach: false
    }
  ]);

  useEffect(() => {
    let animationFrameId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let tick = 0;

    const render = () => {
      tick++;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Clear background
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, width, height);

      // Save transform for PTZ offsets
      ctx.save();
      const centerX = width / 2;
      const centerY = height / 2;
      ctx.translate(centerX + ptzPan, centerY + ptzTilt);
      ctx.scale(ptzZoom, ptzZoom);
      ctx.translate(-centerX, -centerY);

      // 2. Render simulated environment (Facility perspective & fence)
      // Sky/Horizon
      const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
      if (filter === 'night') {
        skyGradient.addColorStop(0, '#021808');
        skyGradient.addColorStop(0.5, '#052910');
        skyGradient.addColorStop(1, '#021506');
      } else if (filter === 'thermal') {
        skyGradient.addColorStop(0, '#100028');
        skyGradient.addColorStop(0.5, '#400050');
        skyGradient.addColorStop(1, '#800040');
      } else {
        skyGradient.addColorStop(0, '#080e1d');
        skyGradient.addColorStop(0.5, '#0d172e');
        skyGradient.addColorStop(1, '#111f3d');
      }
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height * 0.55);

      // Ground plane
      const groundGradient = ctx.createLinearGradient(0, height * 0.55, 0, height);
      groundGradient.addColorStop(0, filter === 'thermal' ? '#5a0040' : '#0c1322');
      groundGradient.addColorStop(1, filter === 'thermal' ? '#220020' : '#080c14');
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, height * 0.55, width, height * 0.45);

      // Perspective grid lines (Tactical ground)
      ctx.strokeStyle = filter === 'night' ? 'rgba(0, 255, 100, 0.12)' : 'rgba(0, 240, 255, 0.08)';
      ctx.lineWidth = 1;
      const horizonY = height * 0.55;
      for (let i = -width; i < width * 2; i += 80) {
        ctx.beginPath();
        ctx.moveTo(width / 2, horizonY);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let y = horizonY + 20; y < height; y += (y - horizonY) * 0.55 + 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Facility perimeter fence & posts
      ctx.strokeStyle = filter === 'night' ? '#124520' : '#1e3050';
      ctx.lineWidth = 2;
      for (let x = 40; x < width; x += 70) {
        ctx.beginPath();
        ctx.moveTo(x, horizonY - 40);
        ctx.lineTo(x, horizonY + 30);
        ctx.stroke();
      }
      // Fence wires
      ctx.strokeStyle = filter === 'night' ? 'rgba(30, 90, 40, 0.5)' : 'rgba(40, 70, 110, 0.4)';
      ctx.lineWidth = 1;
      for (let offset = -35; offset <= 25; offset += 15) {
        ctx.beginPath();
        ctx.moveTo(0, horizonY + offset);
        ctx.lineTo(width, horizonY + offset);
        ctx.stroke();
      }

      // Distant building silhouettes
      ctx.fillStyle = filter === 'thermal' ? '#300040' : '#070b14';
      ctx.fillRect(width * 0.1, horizonY - 80, 120, 80);
      ctx.fillRect(width * 0.35, horizonY - 110, 160, 110);
      ctx.fillRect(width * 0.7, horizonY - 95, 140, 95);

      // Building indicator lights
      ctx.fillStyle = filter === 'night' ? '#00ff66' : '#00f0ff';
      ctx.beginPath();
      ctx.arc(width * 0.42, horizonY - 105, 2, 0, Math.PI * 2);
      ctx.fill();

      // 3. Render Detection Polygon Zones (if mode is zones or view)
      if (zonePoints.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(zonePoints[0].x * width, zonePoints[0].y * height);
        for (let i = 1; i < zonePoints.length; i++) {
          ctx.lineTo(zonePoints[i].x * width, zonePoints[i].y * height);
        }
        ctx.closePath();
        
        ctx.fillStyle = isAlert || mode === 'zones' 
          ? 'rgba(239, 68, 68, 0.18)' 
          : 'rgba(0, 240, 255, 0.12)';
        ctx.fill();

        ctx.strokeStyle = isAlert || mode === 'zones'
          ? 'rgba(239, 68, 68, 0.85)'
          : 'rgba(0, 240, 255, 0.7)';
        ctx.lineWidth = mode === 'zones' ? 3 : 2;
        ctx.setLineDash(mode === 'zones' ? [6, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]);

        // Zone nodes when in zones mode
        if (mode === 'zones') {
          zonePoints.forEach((p, idx) => {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x * width, p.y * height, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Node index
            ctx.fillStyle = '#000000';
            ctx.font = '10px JetBrains Mono';
            ctx.fillText(idx + 1, p.x * width - 3, p.y * height + 3);
          });
        }
      }

      // 4. Update and render animated Human Targets & Bounding Boxes
      if (isPlaying) {
        targetsRef.current.forEach(t => {
          t.x += t.vx;
          t.y += t.vy;
          // Boundary bounce inside frame
          if (t.x < 0.15 || t.x > 0.85) t.vx *= -1;
          if (t.y < 0.40 || t.y > 0.75) t.vy *= -1;
        });
      }

      targetsRef.current.forEach(t => {
        const bx = t.x * width;
        const by = t.y * height;
        const bw = t.w * width;
        const bh = t.h * height;

        // Draw human stylized silhouette
        ctx.fillStyle = filter === 'thermal' ? '#ffff00' : (filter === 'night' ? '#80ffaa' : '#cbd5e1');
        // Head
        ctx.beginPath();
        ctx.arc(bx + bw / 2, by + bh * 0.2, bw * 0.22, 0, Math.PI * 2);
        ctx.fill();
        // Torso & legs
        ctx.fillRect(bx + bw * 0.28, by + bh * 0.35, bw * 0.44, bh * 0.35);
        ctx.fillRect(bx + bw * 0.28, by + bh * 0.70, bw * 0.18, bh * 0.28);
        ctx.fillRect(bx + bw * 0.54, by + bh * 0.70, bw * 0.18, bh * 0.28);

        // AI Bounding Box
        const isThreat = t.inBreach || isAlert;
        const boxColor = isThreat ? '#ef4444' : '#00f0ff';
        const boxGlow = isThreat ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 240, 255, 0.3)';

        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);

        // Corner brackets (Tactical YOLO aesthetic)
        const cl = 8;
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        // Top-left
        ctx.beginPath();
        ctx.moveTo(bx, by + cl); ctx.lineTo(bx, by); ctx.lineTo(bx + cl, by); ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(bx + bw - cl, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cl); ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(bx, by + bh - cl); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cl, by + bh); ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(bx + bw - cl, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cl); ctx.stroke();

        // Label Tag
        const tagText = `${t.label} ${t.confidence}% ${t.id}`;
        ctx.font = 'bold 11px JetBrains Mono';
        const textMetrics = ctx.measureText(tagText);
        const tagWidth = textMetrics.width + 12;
        const tagHeight = 18;

        ctx.fillStyle = boxColor;
        ctx.fillRect(bx, by - tagHeight, tagWidth, tagHeight);

        ctx.fillStyle = '#060a12';
        ctx.fillText(tagText, bx + 6, by - 5);

        // Alert banner if breach
        if (isThreat) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
          ctx.fillRect(bx, by + bh + 4, tagWidth + 24, 16);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px JetBrains Mono';
          ctx.fillText('⚠ ZONE BREACH', bx + 6, by + bh + 16);
        }
      });

      // 5. Render Privacy Masks
      privacyMasks.forEach(mask => {
        ctx.fillStyle = '#030508';
        ctx.fillRect(mask.x * width, mask.y * height, mask.w * width, mask.h * height);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(mask.x * width, mask.y * height, mask.w * width, mask.h * height);

        // Pattern inside mask
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText('PRIVACY MASK [ENCRYPTED]', mask.x * width + 10, mask.y * height + 20);
      });

      // Restore transform before drawing screen-space HUD
      ctx.restore();

      // 6. Tactical Screen-space HUD Overlays
      // Blinking REC Indicator
      const isBlink = Math.floor(tick / 30) % 2 === 0;
      ctx.fillStyle = isBlink ? '#ef4444' : 'rgba(239, 68, 68, 0.3)';
      ctx.beginPath();
      ctx.arc(24, 24, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px JetBrains Mono';
      ctx.fillText('REC', 36, 28);

      // Camera name & IP
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '600 12px Plus Jakarta Sans';
      ctx.fillText(cameraName.toUpperCase(), 75, 28);

      // Realtime UTC Clock
      const now = new Date();
      const timeStr = `${now.toISOString().replace('T', ' ').substring(0, 23)} UTC`;
      ctx.font = '12px JetBrains Mono';
      ctx.fillStyle = '#00f0ff';
      const timeWidth = ctx.measureText(timeStr).width;
      ctx.fillText(timeStr, width - timeWidth - 20, 28);

      // Telemetry Specs
      ctx.font = '11px JetBrains Mono';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillText(`FPS: 30.0  BITRATE: 4.8 Mbps  LATENCY: 38ms  ZOOM: ${ptzZoom.toFixed(1)}X`, 24, height - 20);

      // AI Inference tag
      const aiTag = `AI: YOLOv9-EDGE (TENSOR-RT) • STATUS: ACTIVE`;
      const aiTagWidth = ctx.measureText(aiTag).width;
      ctx.fillStyle = isAlert ? '#ef4444' : '#10b981';
      ctx.fillText(aiTag, width - aiTagWidth - 20, height - 20);

      // Crosshair center mark if PTZ mode
      if (mode === 'ptz') {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(width / 2 - 20, height / 2);
        ctx.lineTo(width / 2 + 20, height / 2);
        ctx.moveTo(width / 2, height / 2 - 20);
        ctx.lineTo(width / 2, height / 2 + 20);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 40, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Loop
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, filter, ptzPan, ptzTilt, ptzZoom, zonePoints, privacyMasks, mode, cameraName, isAlert]);

  // Handle canvas click for interactive zone / mask editing
  const handleCanvasClick = (e) => {
    if (mode === 'zones') {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const newPoints = [...zonePoints, { x, y }];
      setZonePoints(newPoints);
      if (onZoneChange) onZoneChange(newPoints);
    }
  };

  const handleResetZone = () => {
    const defaults = [
      { x: 0.15, y: 0.35 },
      { x: 0.55, y: 0.30 },
      { x: 0.65, y: 0.75 },
      { x: 0.20, y: 0.80 }
    ];
    setZonePoints(defaults);
    if (onZoneChange) onZoneChange(defaults);
  };

  const handlePtzMove = (dx, dy) => {
    setPtzPan(prev => Math.max(-120, Math.min(120, prev + dx)));
    setPtzTilt(prev => Math.max(-80, Math.min(80, prev + dy)));
  };

  const handleZoom = (dz) => {
    setPtzZoom(prev => Math.max(1, Math.min(4, prev + dz)));
  };

  return (
    <div className="relative group rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col" ref={containerRef}>
      {/* CCTV Viewport Container */}
      <div className="relative w-full cctv-scanline" style={{ aspectRatio }}>
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          onClick={handleCanvasClick}
          className={`w-full h-full object-cover block cursor-${mode === 'zones' ? 'crosshair' : 'default'}`}
        />

        {/* Top-level Alert Banner if Active Breach */}
        {isAlert && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-red-600/90 text-white font-mono text-xs font-bold tracking-wider flex items-center gap-2 border border-red-400 shadow-lg animate-pulse">
            <AlertTriangle size={15} />
            CRITICAL INTRUSION DETECTED • TARGET TRACKED
          </div>
        )}

        {/* Mode specific helper overlay */}
        {mode === 'zones' && (
          <div className="absolute bottom-4 left-4 z-20 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md text-xs font-mono text-cyan-400 border border-cyan-500/40 flex items-center gap-3">
            <span>Click canvas to place polygon boundary points ({zonePoints.length} points)</span>
            <button 
              onClick={handleResetZone}
              className="text-xs text-red-400 hover:text-red-300 underline cursor-pointer"
            >
              Reset Zone
            </button>
          </div>
        )}
      </div>

      {/* Embedded Camera Controls Bar */}
      {showControls && (
        <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 backdrop-blur-md flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
          {/* Left: Playback & Audio Controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
              title={isPlaying ? 'Pause Feed' : 'Resume Feed'}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            </button>
            <button 
              onClick={() => setAudioMuted(!audioMuted)}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
              title={audioMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {audioMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <div className="h-4 w-px bg-slate-800 mx-1"></div>
            <span className="text-slate-400">Stream: <span className="text-cyan-400">RTSP/WebRTC Live</span></span>
          </div>

          {/* Center: Vision Filter Modes (RGB / Night / Thermal) */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilter('normal')}
              className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${filter === 'normal' ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              RGB Color
            </button>
            <button
              onClick={() => setFilter('night')}
              className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${filter === 'night' ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Night IR
            </button>
            <button
              onClick={() => setFilter('thermal')}
              className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${filter === 'thermal' ? 'bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Thermal FLIR
            </button>
          </div>

          {/* Right: PTZ Quick Controls */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 mr-1 hidden sm:inline">PTZ:</span>
            <button 
              onClick={() => handlePtzMove(-15, 0)} 
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="Pan Left"
            >
              ◀
            </button>
            <button 
              onClick={() => handlePtzMove(0, -10)} 
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="Tilt Up"
            >
              ▲
            </button>
            <button 
              onClick={() => handlePtzMove(0, 10)} 
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="Tilt Down"
            >
              ▼
            </button>
            <button 
              onClick={() => handlePtzMove(15, 0)} 
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="Pan Right"
            >
              ▶
            </button>
            <button 
              onClick={() => handleZoom(0.2)} 
              className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 cursor-pointer font-bold ml-1"
              title="Zoom In"
            >
              +
            </button>
            <button 
              onClick={() => handleZoom(-0.2)} 
              className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 cursor-pointer font-bold"
              title="Zoom Out"
            >
              -
            </button>
            <button 
              onClick={() => { setPtzPan(0); setPtzTilt(0); setPtzZoom(1); }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer ml-1"
              title="Reset PTZ Home"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
