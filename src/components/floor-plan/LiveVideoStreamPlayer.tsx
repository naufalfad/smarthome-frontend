import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Eye,
  Moon,
  Sun,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Camera,
  RotateCcw,
  Wifi,
  Radio,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { IoTDevice } from '../../types/device';

interface LiveVideoStreamPlayerProps {
  device: IoTDevice;
  compact?: boolean;
  onControlDevice?: (deviceId: string, action: string, payload?: any) => Promise<void>;
}

export const LiveVideoStreamPlayer: React.FC<LiveVideoStreamPlayerProps> = ({
  device,
  compact = false,
  onControlDevice,
}) => {
  const cfg = (device.configuration as Record<string, any>) || {};

  // Stream properties from database configuration
  const resolution = cfg.resolution || '2K QHD (2560x1440)';
  const fps = cfg.fps || 30;
  const bitrateKbps = cfg.bitrateKbps || 2450;
  const codec = cfg.codec || 'H.265 / HEVC';
  const signalDbm = cfg.signalStrengthDbm || -45;
  const cameraPreset = cfg.cameraPreset || 'TERAS_FRONT';
  const ptzCapable = Boolean(cfg.ptzCapable || device.type === 'INDOOR_CAMERA');
  const hasTwoWayAudio = Boolean(cfg.twoWayAudio || device.type === 'VIDEO_DOORBELL');

  // Interactive UI State
  const [isNightVision, setIsNightVision] = useState<boolean>(Boolean(cfg.nightVision));
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isTalking, setIsTalking] = useState<boolean>(false);
  const [panAngle, setPanAngle] = useState<number>(cfg.panAngle || 0);
  const [tiltAngle, setTiltAngle] = useState<number>(cfg.tiltAngle || 0);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [snapshotFlash, setSnapshotFlash] = useState<boolean>(false);
  const [showAiBox, setShowAiBox] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Live ticking clock overlay
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const yr = now.getFullYear();
      const mo = pad(now.getMonth() + 1);
      const da = pad(now.getDate());
      const hr = pad(now.getHours());
      const mi = pad(now.getMinutes());
      const se = pad(now.getSeconds());
      setCurrentTimeStr(`${yr}-${mo}-${da} ${hr}:${mi}:${se}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Canvas Procedural Rendering for CCTV Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;

    const render = () => {
      tick++;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Base Background Gradient
      if (isNightVision) {
        // Infrared Monochromatic Greenish-Gray
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#09140e');
        grad.addColorStop(1, '#020704');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      } else {
        // Realistic Ambient Day Scene
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#1a2238');
        grad.addColorStop(0.5, '#121829');
        grad.addColorStop(1, '#0a0d17');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // Procedural Perspective Elements based on Preset
      ctx.save();
      ctx.translate(panAngle * 1.5, tiltAngle * 1.2);

      if (cameraPreset === 'TERAS_FRONT' || device.type === 'OUTDOOR_CAMERA') {
        // Floor / Pavement
        ctx.fillStyle = isNightVision ? '#0d2217' : '#1e293b';
        ctx.beginPath();
        ctx.moveTo(w * 0.1, h);
        ctx.lineTo(w * 0.9, h);
        ctx.lineTo(w * 0.7, h * 0.45);
        ctx.lineTo(w * 0.3, h * 0.45);
        ctx.closePath();
        ctx.fill();

        // Architectural Pillars
        ctx.fillStyle = isNightVision ? '#173626' : '#334155';
        ctx.fillRect(w * 0.15, h * 0.2, w * 0.08, h * 0.8);
        ctx.fillRect(w * 0.77, h * 0.2, w * 0.08, h * 0.8);

        // Entrance Door Frame
        ctx.strokeStyle = isNightVision ? '#2a5a40' : '#475569';
        ctx.lineWidth = 3;
        ctx.strokeRect(w * 0.4, h * 0.35, w * 0.2, h * 0.45);
      } else if (cameraPreset === 'INDOOR_PANORAMA' || device.type === 'INDOOR_CAMERA') {
        // Room Walls Perspective
        ctx.strokeStyle = isNightVision ? '#1f4833' : '#334155';
        ctx.lineWidth = 2;

        // Back wall
        ctx.strokeRect(w * 0.2, h * 0.2, w * 0.6, h * 0.6);
        // Diagonal wall edges
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(w * 0.2, h * 0.2);
        ctx.moveTo(w, 0); ctx.lineTo(w * 0.8, h * 0.2);
        ctx.moveTo(0, h); ctx.lineTo(w * 0.2, h * 0.8);
        ctx.moveTo(w, h); ctx.lineTo(w * 0.8, h * 0.8);
        ctx.stroke();

        // Living Room Sofa Siluet
        ctx.fillStyle = isNightVision ? '#193f2c' : '#1e293b';
        ctx.fillRect(w * 0.28, h * 0.55, w * 0.44, h * 0.18);
        ctx.fillStyle = isNightVision ? '#275d42' : '#334155';
        ctx.fillRect(w * 0.32, h * 0.5, w * 0.36, h * 0.1);
      } else {
        // Doorbell vertical perspective
        ctx.fillStyle = isNightVision ? '#0d2217' : '#1e293b';
        ctx.fillRect(w * 0.2, h * 0.3, w * 0.6, h * 0.7);
        ctx.strokeStyle = isNightVision ? '#38df8b' : '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(w * 0.3, h * 0.4, w * 0.4, h * 0.5);
      }

      ctx.restore();

      // Simulated AI Human Detection Bounding Box (Oscillates subtly)
      if (showAiBox) {
        const boxX = w * 0.48 + Math.sin(tick * 0.03) * 15 + panAngle * 1.5;
        const boxY = h * 0.42 + Math.cos(tick * 0.02) * 8 + tiltAngle * 1.2;
        const boxW = w * 0.16;
        const boxH = h * 0.34;

        ctx.strokeStyle = isNightVision ? '#4ade80' : '#10b981';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Corner accents
        ctx.fillStyle = isNightVision ? '#4ade80' : '#10b981';
        const cLen = 8;
        ctx.fillRect(boxX, boxY, cLen, 3);
        ctx.fillRect(boxX, boxY, 3, cLen);
        ctx.fillRect(boxX + boxW - cLen, boxY, cLen, 3);
        ctx.fillRect(boxX + boxW - 3, boxY, 3, cLen);

        // Label Tag
        ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
        ctx.fillRect(boxX, boxY - 18, 90, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('Human 96%', boxX + 6, boxY - 5);
      }

      // CRT Scanlines Effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1.5);
      }

      // Subtle Sensor Noise
      ctx.fillStyle = isNightVision ? 'rgba(74, 222, 128, 0.04)' : 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < 40; i++) {
        const rx = Math.random() * w;
        const ry = Math.random() * h;
        ctx.fillRect(rx, ry, 2, 2);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isNightVision, panAngle, tiltAngle, cameraPreset, device.type, showAiBox]);

  const handleToggleNightVision = () => {
    const nextVal = !isNightVision;
    setIsNightVision(nextVal);
    if (onControlDevice) {
      onControlDevice(device.id, 'SET_CONFIG', { nightVision: nextVal }).catch(console.warn);
    }
  };

  const handlePanTilt = (dx: number, dy: number) => {
    setPanAngle((prev) => Math.max(-60, Math.min(60, prev + dx)));
    setTiltAngle((prev) => Math.max(-30, Math.min(30, prev + dy)));
  };

  const handleResetPtz = () => {
    setPanAngle(0);
    setTiltAngle(0);
  };

  const handleSnapshot = () => {
    setSnapshotFlash(true);
    setTimeout(() => setSnapshotFlash(false), 300);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* CCTV Screen Frame */}
      <div className="relative w-full aspect-video bg-[#0b0e17] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl select-none group">
        
        {/* Procedural CCTV Video Canvas */}
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            snapshotFlash ? 'opacity-30 bg-white' : 'opacity-100'
          }`}
        />

        {/* Top-Left OSD: Live Indicator & Camera Metadata */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none text-white drop-shadow-md">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-red-600/90 text-white shadow-xs">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
            <span className="text-xs font-mono font-bold tracking-wide text-slate-100">
              {device.name.toUpperCase()}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-300">
            {currentTimeStr} • {resolution}
          </span>
        </div>

        {/* Top-Right OSD: Signal & Mode Badges */}
        <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-none drop-shadow-md">
          {isNightVision && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
              <Moon className="w-3 h-3" />
              IR NIGHT
            </span>
          )}
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-black/60 text-slate-200 border border-white/10">
            <Wifi className="w-3 h-3 text-emerald-400" />
            {signalDbm} dBm
          </span>
        </div>

        {/* Bottom-Left OSD: Bitrate & FPS Telemetry */}
        <div className="absolute bottom-3 left-3 pointer-events-none font-mono text-[10px] text-slate-300 bg-black/60 px-2 py-1 rounded-md border border-white/10 backdrop-blur-xs">
          {fps} FPS • {bitrateKbps} Kbps • {codec}
        </div>

        {/* Bottom-Right Overlay Controls (Quick Action Icons) */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md p-1.5 rounded-xl border border-white/15">
          <button
            type="button"
            onClick={handleToggleNightVision}
            title={isNightVision ? 'Beralih ke Mode Siang' : 'Beralih ke Night Vision IR'}
            className={`p-1.5 rounded-lg transition-colors ${
              isNightVision
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {isNightVision ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setShowAiBox(!showAiBox)}
            title="Toggle AI Object Detection Bounding Box"
            className={`p-1.5 rounded-lg transition-colors ${
              showAiBox
                ? 'bg-indigo-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Nyalakan Audio' : 'Bisukan Audio'}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleSnapshot}
            title="Ambil Foto Tangkapan Layar (Snapshot)"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Auxiliary Controls (PTZ D-pad & Intercom Bar) */}
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
          {/* Two-Way Audio Talk (Doorbell & Indoor Cam) */}
          {hasTwoWayAudio ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onMouseDown={() => setIsTalking(true)}
                onMouseUp={() => setIsTalking(false)}
                onTouchStart={() => setIsTalking(true)}
                onTouchEnd={() => setIsTalking(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs select-none ${
                  isTalking
                    ? 'bg-red-600 text-white shadow-red-600/30 scale-95 ring-4 ring-red-200'
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/25'
                }`}
              >
                {isTalking ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
                <span>{isTalking ? 'Sedang Berbicara...' : 'Tahan untuk Bicara'}</span>
              </button>
              <span className="text-[11px] text-slate-500">
                Mikrofon interkom 2-arah terenkripsi
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Radio className="w-4 h-4 text-purple-600" />
              <span>Saluran stream aman RTSP / H.265 aktif</span>
            </div>
          )}

          {/* PTZ Joystick / Direction D-Pad (Indoor 360 Camera) */}
          {ptzCapable && (
            <div className="flex items-center gap-2 self-end">
              <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">
                Rotasi 360° PTZ:
              </span>
              <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                <div />
                <button
                  type="button"
                  onClick={() => handlePanTilt(0, -10)}
                  title="Tilt Up"
                  className="p-1 hover:bg-slate-100 rounded text-slate-700"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <div />
                <button
                  type="button"
                  onClick={() => handlePanTilt(-15, 0)}
                  title="Pan Left"
                  className="p-1 hover:bg-slate-100 rounded text-slate-700"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetPtz}
                  title="Reset Posisi Tengah"
                  className="p-1 hover:bg-purple-50 text-purple-600 rounded font-mono text-[9px] font-bold"
                >
                  <RotateCcw className="w-3 h-3 mx-auto" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePanTilt(15, 0)}
                  title="Pan Right"
                  className="p-1 hover:bg-slate-100 rounded text-slate-700"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <div />
                <button
                  type="button"
                  onClick={() => handlePanTilt(0, 10)}
                  title="Tilt Down"
                  className="p-1 hover:bg-slate-100 rounded text-slate-700"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <div />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
