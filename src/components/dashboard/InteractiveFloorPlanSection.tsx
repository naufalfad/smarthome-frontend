import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Layers,
  Radio,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  DoorClosed,
  Sparkles,
  Move,
  Info,
  Smartphone,
} from 'lucide-react';
import { DashboardFloor, DashboardRoom } from '../../types/dashboard';
import { IoTDevice } from '../../types/device';
import {
  getDeviceVisualTheme,
  DeviceAmbientGlowDefs,
  getDeviceHaloGradientUrl,
  DeviceSvgIcon,
} from '../../utils/device-visual';
import { DEVICE_TEMPLATES } from '../floor-plan/DeviceLibraryPanel';
import { floorPlanApi } from '../../services/floor-plan.api';
import { useAuthenticatedBlobUrl } from '../../hooks/useAuthenticatedBlobUrl';

interface InteractiveFloorPlanSectionProps {
  floors: DashboardFloor[];
  activeFloorId: string;
  onSelectFloor: (floorId: string) => void;
  devices: IoTDevice[];
  rooms: DashboardRoom[];
  onSelectDevice: (device: IoTDevice) => void;
  variant?: 'embedded' | 'fullscreen';
}

export const InteractiveFloorPlanSection: React.FC<InteractiveFloorPlanSectionProps> = ({
  floors,
  activeFloorId,
  onSelectFloor,
  devices,
  rooms,
  onSelectDevice,
  variant = 'fullscreen',
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('ALL');
  
  // Transform & Viewport State (Zoom & Pan)
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showMobileHint, setShowMobileHint] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pinchStartDistRef = useRef<number | null>(null);
  const zoomStartRef = useRef<number>(100);

  const currentFloor = floors.find((f) => f.id === activeFloorId) || floors[0];
  const currentPlan = currentFloor?.floorPlan;

  // Fetch protected floor plan background via authenticated Bearer transport
  const rawPlanImageUrl = currentPlan?.imagePath
    ? floorPlanApi.getBackgroundImageUrl(currentPlan.id, (currentPlan as any).updatedAt || '1')
    : null;
  const { blobUrl: authenticatedPlanImageUrl } = useAuthenticatedBlobUrl(rawPlanImageUrl);

  // Filter devices for current floor
  const floorDevices = devices.filter(
    (d) => !d.floorId || d.floorId === currentFloor?.id
  );

  // Filter devices by category and room
  const filteredDevices = floorDevices.filter((dev) => {
    if (categoryFilter !== 'ALL') {
      const template = DEVICE_TEMPLATES.find((t: any) => t.type === dev.type);
      const cat = dev.catalogItem?.category || template?.category;
      if (cat !== categoryFilter) return false;
    }
    if (selectedRoomId !== 'ALL') {
      const matchesRoom =
        dev.roomId === selectedRoomId ||
        dev.manualRoomName?.toLowerCase() === selectedRoomId.toLowerCase();
      if (!matchesRoom) return false;
    }
    return true;
  });

  const viewBoxW = currentPlan?.imageWidth || currentPlan?.viewBoxWidth || 1600;
  const viewBoxH = currentPlan?.imageHeight || currentPlan?.viewBoxHeight || 1000;

  // Current floor rooms
  const currentRooms = rooms.filter(
    (r) => !r.floorId || r.floorId === currentFloor?.id
  );

  // Extract latest sensor value display string
  const getSensorDisplay = (dev: IoTDevice) => {
    const cfg = (dev.configuration as Record<string, any>) || {};
    if (cfg.temperature !== undefined) return `${cfg.temperature}°C`;
    if (cfg.humidity !== undefined) return `${cfg.humidity}%`;
    if (cfg.aqi !== undefined) return `${cfg.aqi} AQI`;
    if (cfg.pm25 !== undefined) return `${cfg.pm25} µg`;
    if (dev.telemetry && dev.telemetry.length > 0) {
      const t = dev.telemetry[0];
      if (t.value !== null && t.value !== undefined) {
        return `${Math.round(t.value * 10) / 10} ${t.unit || ''}`;
      }
    }
    return null;
  };

  // Reset to optimal fit
  const handleResetFit = useCallback(() => {
    setZoomLevel(100);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Zoom by step
  const handleZoomStep = useCallback((delta: number) => {
    setZoomLevel((prev) => Math.max(50, Math.min(300, prev + delta)));
  }, []);

  // Native non-passive Wheel Zoom Listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const zoomFactor = e.deltaY < 0 ? 10 : -10;
      setZoomLevel((prev) => Math.max(50, Math.min(300, prev + zoomFactor)));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Mouse Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...panOffset };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPanOffset({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  // Touch Gesture Handlers (Mobile 1-finger pan & 2-finger pinch zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    setShowMobileHint(false);
    if (e.touches.length === 1) {
      // 1 Finger -> Pan
      isDraggingRef.current = true;
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...panOffset };
      pinchStartDistRef.current = null;
    } else if (e.touches.length === 2) {
      // 2 Fingers -> Pinch Zoom
      isDraggingRef.current = false;
      setIsDragging(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      pinchStartDistRef.current = dist;
      zoomStartRef.current = zoomLevel;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPanOffset({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    } else if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const scaleDelta = currentDist / pinchStartDistRef.current;
      const nextZoom = Math.max(50, Math.min(300, Math.round(zoomStartRef.current * scaleDelta)));
      setZoomLevel(nextZoom);
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    pinchStartDistRef.current = null;
  };

  // Container height based on variant
  const containerHeightClass = variant === 'embedded'
    ? 'h-[440px] sm:h-[500px] lg:h-[560px]'
    : 'h-[calc(100vh-210px)] min-h-[560px]';

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col ${containerHeightClass} transition-all`}>
      {/* Top Filter and Navigation Header */}
      <div className="px-4 sm:px-6 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2.5 bg-slate-50/70">
        {/* Floor switcher & Room selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {floors.length > 1 && (
            <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs">
              {floors.map((fl) => (
                <button
                  key={fl.id}
                  onClick={() => {
                    onSelectFloor(fl.id);
                    handleResetFit();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFloorId === fl.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-[#71758E] hover:text-[#181829] hover:bg-slate-50'
                  }`}
                >
                  {fl.name}
                </button>
              ))}
            </div>
          )}

          {/* Room Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-2xs text-xs">
            <DoorClosed className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Ruangan ({currentRooms.length})</option>
              {currentRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.deviceCount} unit)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="hidden sm:flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs">
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'LIGHTING', label: 'Lampu' },
            { id: 'CLIMATE', label: 'AC' },
            { id: 'SECURITY', label: 'Kunci' },
            { id: 'SENSORS', label: 'Sensor' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                categoryFilter === cat.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-[#71758E] hover:text-[#181829] hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Floor Plan Canvas Viewport (Modern Warm Studio Canvas) */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          touchAction: 'none',
          backgroundImage: 'radial-gradient(circle, #CBD5E1 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
          backgroundColor: '#F8FAFC',
        }}
        className={`flex-1 relative overflow-hidden flex items-center justify-center select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Floating Mobile Gesture Hint */}
        {showMobileHint && (
          <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-pulse">
            <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-medium text-white shadow-md flex items-center gap-1.5">
              <Smartphone className="w-3 h-3 text-purple-400" />
              1 jari geser • 2 jari zoom
            </span>
          </div>
        )}

        {currentPlan?.imagePath ? (
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel / 100})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.12s ease-out',
            }}
            className="w-full h-full flex items-center justify-center p-4 sm:p-8 pointer-events-none"
          >
            <svg
              viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-full max-h-[85vh] select-none pointer-events-auto filter drop-shadow-xl rounded-2xl overflow-visible"
            >
              <defs>
                <DeviceAmbientGlowDefs prefix="dashboard-" />
              </defs>

              {/* 1. Floor Plan Background Image */}
              {authenticatedPlanImageUrl && (
                <image
                  href={authenticatedPlanImageUrl}
                  x="0"
                  y="0"
                  width={viewBoxW}
                  height={viewBoxH}
                  preserveAspectRatio="xMidYMid meet"
                  className="rounded-2xl"
                />
              )}

              {/* 2. Room Polygons Layer */}
              {currentRooms.map((room) => {
                if (!room.polygonCoordinates || room.polygonCoordinates.length < 3) return null;
                const ptsStr = room.polygonCoordinates.map((p) => `${p.x},${p.y}`).join(' ');
                const isRoomActive = selectedRoomId === 'ALL' || selectedRoomId === room.id;
                const roomColor = room.color || '#8B5CF6';

                return (
                  <polygon
                    key={room.id}
                    points={ptsStr}
                    fill={roomColor}
                    fillOpacity={isRoomActive ? 0.14 : 0.03}
                    stroke={roomColor}
                    strokeWidth={isRoomActive ? 2 : 0.8}
                    strokeDasharray={isRoomActive ? 'none' : '4 4'}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRoomId(selectedRoomId === room.id ? 'ALL' : room.id);
                    }}
                    className="cursor-pointer transition-all hover:fill-opacity-25"
                  />
                );
              })}

              {/* 3. IoT Interactive Devices Layer (Monitoring & Click to Control) */}
              {filteredDevices.map((dev) => {
                const theme = getDeviceVisualTheme(dev);
                const R = dev.iconWidth ? dev.iconWidth / 2 : 22;
                const sensorReading = getSensorDisplay(dev);

                return (
                  <g
                    key={dev.id}
                    transform={`translate(${dev.x}, ${dev.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDevice(dev);
                    }}
                    className="cursor-pointer group select-none"
                  >
                    {/* Gradient Ambient Halo if active */}
                    {theme.hasAmbientHalo && (
                      <circle
                        r={R + 10}
                        fill={getDeviceHaloGradientUrl(theme, 'dashboard-')}
                        opacity={theme.haloOpacity || 0.3}
                      />
                    )}

                    {/* Outer Glow Ring */}
                    <circle
                      r={R + 4}
                      fill="none"
                      stroke={theme.ringColor}
                      strokeWidth={theme.isActive ? 2.5 : 1}
                      opacity={theme.isActive ? 0.9 : 0.4}
                    />

                    {/* Main Circular Device Body */}
                    <circle
                      r={R}
                      fill={theme.pinBgColor}
                      stroke={theme.pinBorderColor}
                      strokeWidth="2"
                      className="transition-all duration-300 group-hover:scale-110 filter drop-shadow-md"
                    />

                    {/* Device Icon */}
                    <g
                      transform={`translate(-${R * 0.55}, -${R * 0.55})`}
                      className="transition-transform duration-200 group-hover:scale-110 pointer-events-none"
                    >
                      <svg width={R * 1.1} height={R * 1.1} viewBox="0 0 24 24" fill="none">
                        <DeviceSvgIcon type={dev.type} theme={theme} />
                      </svg>
                    </g>

                    {/* Sensor Value Pill / Status Tag */}
                    {sensorReading ? (
                      <g transform={`translate(0, ${R + 13})`}>
                        <rect
                          x={-(sensorReading.length * 4.2 + 8)}
                          y="-9"
                          width={sensorReading.length * 8.4 + 16}
                          height="18"
                          rx="9"
                          fill="rgba(15, 23, 42, 0.9)"
                          stroke={theme.pinBorderColor}
                          strokeWidth="1.2"
                          className="filter drop-shadow-xs"
                        />
                        <text
                          textAnchor="middle"
                          y="3.5"
                          fontSize="9.5"
                          fontWeight="bold"
                          fill="#FFFFFF"
                          className="font-mono tracking-tight"
                        >
                          {sensorReading}
                        </text>
                      </g>
                    ) : (
                      <g transform={`translate(0, ${R + 12})`}>
                        <rect
                          x={-(dev.name.length * 3.5 + 8)}
                          y="-8"
                          width={dev.name.length * 7 + 16}
                          height="16"
                          rx="8"
                          fill="rgba(15, 23, 42, 0.85)"
                          stroke="rgba(255, 255, 255, 0.2)"
                          strokeWidth="1"
                        />
                        <text
                          textAnchor="middle"
                          y="3"
                          fontSize="9"
                          fontWeight="bold"
                          fill="#FFFFFF"
                        >
                          {dev.name}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-purple-100/80 text-purple-600 flex items-center justify-center mb-3">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-[#181829]">Belum Ada Denah 2D</h3>
            <p className="text-xs text-[#71758E] mt-1">
              Admin belum mengunggah gambar denah untuk lantai ini.
            </p>
          </div>
        )}

        {/* Floating HUD Controls (Bottom Right) */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-lg">
          <button
            onClick={() => handleZoomStep(15)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-purple-600 transition-colors"
            title="Perbesar (Scroll Up)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-mono font-bold text-slate-600 px-1.5 min-w-[42px] text-center select-none">
            {zoomLevel}%
          </span>

          <button
            onClick={() => handleZoomStep(-15)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-purple-600 transition-colors"
            title="Perkecil (Scroll Down)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-0.5" />

          <button
            onClick={handleResetFit}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-purple-600 transition-colors flex items-center gap-1"
            title="Pas ke Layar / Reset Posisi"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="text-[10px] font-bold hidden sm:inline">Fit</span>
          </button>
        </div>

        {/* Floating Interactive Device Legend (Bottom Left - Desktop) */}
        <div className="hidden lg:flex absolute bottom-4 left-4 z-20 items-center gap-3 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-[11px] text-[#71758E]">
          <span className="font-bold text-[#181829] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Interaktif:
          </span>
          <span>Klik ikon perangkat untuk mengontrol</span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1">
            <Move className="w-3 h-3 text-slate-400" /> Geser kanvas
          </span>
        </div>
      </div>
    </div>
  );
};
