import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Layers,
  Radio,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Maximize2,
  DoorClosed,
  Sparkles,
  Move,
  Info,
  Smartphone,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Video,
  Zap,
  Shield,
  Search,
  X,
  Lock,
  Unlock,
  Lightbulb,
  Wind,
  Activity,
  Flame,
  ChevronDown,
  Eye,
  EyeOff,
} from 'lucide-react';
import { DashboardFloor, DashboardRoom } from '../../types/dashboard';
import { IoTDevice } from '../../types/device';
import {
  getDeviceVisualTheme,
  DeviceAmbientGlowDefs,
  getDeviceHaloGradientUrl,
  DeviceSvgIcon,
  DeviceVisualTheme,
} from '../../utils/device-visual';
import { floorPlanApi } from '../../services/floor-plan.api';
import { useAuthenticatedBlobUrl } from '../../hooks/useAuthenticatedBlobUrl';
import { getFloorPlanImageTransform } from '../../utils/floor-plan-visual';

/**
 * Standalone HTML-safe Device Icon Badge component that wraps DeviceSvgIcon in a valid <svg> viewport.
 */
export const DeviceIconBadge: React.FC<{
  type: string;
  theme?: DeviceVisualTheme;
  className?: string;
}> = ({ type, theme, className = 'w-5 h-5' }) => {
  const resolvedTheme = theme || getDeviceVisualTheme({ type, status: 'ONLINE' } as any);
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <DeviceSvgIcon type={type} theme={resolvedTheme} />
    </svg>
  );
};

export type FunctionalCategory = 'ALL' | 'VISUAL' | 'CONTROL' | 'SENSOR';

/**
 * Universal category matching helper aligned with 2D Configuration Studio & Isometric Reference
 */
export function isDeviceMatchingCategory(type: string, category: string): boolean {
  if (!category || category === 'Overview' || category === 'ALL') return true;

  const t = type.toUpperCase();
  if (category === 'Engine room' || category === 'CONTROL') {
    return (
      t.includes('LIGHT') ||
      t.includes('DIMMER') ||
      t.includes('AC') ||
      t.includes('LOCK') ||
      t.includes('SWITCH') ||
      t.includes('PLUG') ||
      t.includes('SOCKET') ||
      t.includes('CURTAIN') ||
      t.includes('VALVE') ||
      t.includes('FAN') ||
      t.includes('SIREN') ||
      t.includes('THERMOSTAT')
    );
  }

  if (category === 'Internet device' || category === 'SENSOR') {
    return (
      t.includes('SENSOR') ||
      t.includes('METER') ||
      t.includes('DETECTOR') ||
      t.includes('MOTION') ||
      (t.includes('DOOR') && !t.includes('BELL') && !t.includes('LOCK')) ||
      t.includes('WINDOW') ||
      t.includes('GAS') ||
      t.includes('SMOKE') ||
      t.includes('LEAK') ||
      t.includes('TEMP') ||
      t.includes('HUMIDITY') ||
      t.includes('AIR') ||
      t.includes('GATEWAY') ||
      t.includes('ROUTER')
    );
  }

  if (category === 'Office device' || category === 'VISUAL') {
    return (
      t.includes('CAMERA') ||
      t.includes('DOORBELL') ||
      t.includes('CCTV') ||
      t.includes('DISPLAY') ||
      t.includes('HUB') ||
      t.includes('STREAM')
    );
  }

  if (category === 'Other device' || category === 'OTHER') {
    return (
      !isDeviceMatchingCategory(type, 'Engine room') &&
      !isDeviceMatchingCategory(type, 'Internet device') &&
      !isDeviceMatchingCategory(type, 'Office device')
    );
  }

  return true;
}

/**
 * Categorizes IoT devices into the 3 core functional categories:
 * 1. VISUAL: Cameras, Video Doorbell, Streaming (Visual & CCTV)
 * 2. CONTROL: Controllable actuators, lights, climate, locks, switches
 * 3. SENSOR: Informational & environmental monitoring sensors
 */
export function getDeviceFunctionalCategory(type: string): 'VISUAL' | 'CONTROL' | 'SENSOR' {
  if (isDeviceMatchingCategory(type, 'Office device')) return 'VISUAL';
  if (isDeviceMatchingCategory(type, 'Engine room')) return 'CONTROL';
  return 'SENSOR';
}

/**
 * Returns human-readable status text & color badge for customer sidebar cards
 */
export function getDeviceQuickStatusText(dev: IoTDevice): { text: string; colorClass: string } {
  const cat = getDeviceFunctionalCategory(dev.type);
  const cfg = (dev.configuration as Record<string, any>) || {};

  if (cat === 'VISUAL') {
    const isLive = dev.status === 'ONLINE' || cfg.streamStatus === 'ONLINE';
    return {
      text: isLive ? 'LIVE STREAM' : 'OFFLINE',
      colorClass: isLive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200',
    };
  }

  if (cat === 'CONTROL') {
    if (dev.type.includes('LOCK')) {
      const isLocked = cfg.lockState !== 'UNLOCKED' && dev.status !== 'UNLOCKED';
      return {
        text: isLocked ? 'TERKUNCI' : 'TERBUKA',
        colorClass: isLocked ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200',
      };
    }
    if (dev.type.includes('AC') || dev.type.includes('THERMOSTAT')) {
      const temp = cfg.temperature || cfg.targetTemperature;
      return {
        text: temp !== undefined ? `${temp}°C` : (dev.status === 'ON' ? 'AKTIF' : 'PADAM'),
        colorClass: dev.status === 'ON' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-100 text-slate-500 border-slate-200',
      };
    }
    if (dev.type.includes('LIGHT') || dev.type.includes('DIMMER')) {
      const isOn = cfg.power !== false && dev.status === 'ON';
      const brightness = cfg.brightness !== undefined ? `${cfg.brightness}%` : '';
      return {
        text: isOn ? `ON ${brightness}`.trim() : 'PADAM',
        colorClass: isOn ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200',
      };
    }
    const isOn = cfg.power !== false && dev.status === 'ON';
    return {
      text: isOn ? 'AKTIF' : 'STANDBY',
      colorClass: isOn ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200',
    };
  }

  // SENSOR CATEGORY
  if (dev.type.includes('DOOR') || dev.type.includes('WINDOW')) {
    const isClosed = cfg.contact !== false && cfg.isOpen !== true && dev.status !== 'OPEN';
    return {
      text: isClosed ? 'TERTUTUP (AMAN)' : 'TERBUKA',
      colorClass: isClosed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200',
    };
  }
  if (dev.type.includes('GAS')) {
    return {
      text: '0 PPM (NORMAL)',
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  if (dev.type.includes('SMOKE') || dev.type.includes('FIRE')) {
    return {
      text: 'AMAN (NORMAL)',
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  if (dev.type.includes('WATER_LEVEL')) {
    const lvl = cfg.waterLevelPercent;
    return {
      text: lvl !== undefined ? `${lvl}% TERISI` : (dev.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE'),
      colorClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    };
  }
  if (dev.type.includes('AIR') || dev.type.includes('TEMP')) {
    const aqi = cfg.aqi;
    return {
      text: aqi !== undefined ? `${aqi} AQI` : (dev.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE'),
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  return {
    text: 'SIAGA (NORMAL)',
    colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
}

interface InteractiveFloorPlanSectionProps {
  floors: DashboardFloor[];
  activeFloorId: string;
  onSelectFloor: (floorId: string) => void;
  devices: IoTDevice[];
  rooms: DashboardRoom[];
  onSelectDevice: (device: IoTDevice) => void;
  variant?: 'embedded' | 'fullscreen';
  categoryFilter?: string;
  onClearCategoryFilter?: () => void;
  isDeviceDrawerOpen?: boolean;
  onToggleDeviceDrawer?: (open: boolean) => void;
}

export const InteractiveFloorPlanSection: React.FC<InteractiveFloorPlanSectionProps> = ({
  floors,
  activeFloorId,
  onSelectFloor,
  devices,
  rooms,
  onSelectDevice,
  variant = 'fullscreen',
  categoryFilter: externalCategoryFilter,
  onClearCategoryFilter,
  isDeviceDrawerOpen: externalDrawerOpen,
  onToggleDeviceDrawer,
}) => {
  // Category & Room Filter State
  const [internalCategoryFilter, setInternalCategoryFilter] = useState<string>('Overview');
  const activeCategory = externalCategoryFilter !== undefined ? externalCategoryFilter : internalCategoryFilter;
  const isCategoryActive = Boolean(activeCategory && activeCategory !== 'Overview' && activeCategory !== 'ALL');

  const [selectedRoomId, setSelectedRoomId] = useState<string>('ALL');
  const [inspectedRoom, setInspectedRoom] = useState<DashboardRoom | null>(null);

  // Transform & Viewport State (Zoom, Pan & 90° Rotation)
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showMobileHint, setShowMobileHint] = useState<boolean>(true);

  // Sidebar Collapsible & Highlight State
  const [internalDrawerOpen, setInternalDrawerOpen] = useState<boolean>(false);
  const isDrawerOpen = externalDrawerOpen !== undefined ? externalDrawerOpen : internalDrawerOpen;
  const setDrawerOpen = (open: boolean) => {
    if (onToggleDeviceDrawer) {
      onToggleDeviceDrawer(open);
    } else {
      setInternalDrawerOpen(open);
    }
  };

  const [highlightedDeviceId, setHighlightedDeviceId] = useState<string | null>(null);
  const [hoveredDeviceId, setHoveredDeviceId] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [sidebarSearch, setSidebarSearch] = useState<string>('');

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

  // Filter devices by Room (spotlight handles category dimming instead of hard vanishing)
  const filteredDevices = floorDevices.filter((dev) => {
    if (selectedRoomId !== 'ALL') {
      const matchesRoom =
        dev.roomId === selectedRoomId ||
        dev.manualRoomName?.toLowerCase() === selectedRoomId.toLowerCase();
      if (!matchesRoom) return false;
    }
    return true;
  });

  // Smart De-cluttering: fan out devices that share overlapping or near-identical coordinates (<55px)
  const positionedDevices = useMemo(() => {
    const items = filteredDevices.map((d) => ({
      ...d,
      renderX: d.x,
      renderY: d.y,
      isClustered: false,
    }));

    const CLUSTER_THRESHOLD = 55;
    const visited = new Set<string>();

    for (let i = 0; i < items.length; i++) {
      const base = items[i];
      if (visited.has(base.id)) continue;

      const cluster = [base];
      visited.add(base.id);

      for (let j = i + 1; j < items.length; j++) {
        const other = items[j];
        if (visited.has(other.id)) continue;
        const dist = Math.hypot(base.x - other.x, base.y - other.y);
        if (dist < CLUSTER_THRESHOLD) {
          cluster.push(other);
          visited.add(other.id);
        }
      }

      if (cluster.length > 1) {
        const centerX = cluster.reduce((sum, d) => sum + d.x, 0) / cluster.length;
        const centerY = cluster.reduce((sum, d) => sum + d.y, 0) / cluster.length;
        const orbitRadius = cluster.length <= 2 ? 38 : cluster.length <= 4 ? 48 : 58;

        cluster.forEach((d, idx) => {
          const angle = (idx / cluster.length) * 2 * Math.PI - Math.PI / 2;
          d.renderX = Math.round(centerX + Math.cos(angle) * orbitRadius);
          d.renderY = Math.round(centerY + Math.sin(angle) * orbitRadius);
          d.isClustered = true;
        });
      }
    }

    return items;
  }, [filteredDevices]);

  // Categorized Device Lists for Sidebar Drawer
  const searchFilter = (d: IoTDevice) => {
    if (!sidebarSearch.trim()) return true;
    const term = sidebarSearch.toLowerCase();
    const roomName = d.room?.name || d.manualRoomName || '';
    return d.name.toLowerCase().includes(term) || roomName.toLowerCase().includes(term) || d.type.toLowerCase().includes(term);
  };

  const visualDevices = floorDevices.filter(
    (d) => isDeviceMatchingCategory(d.type, 'Office device') && searchFilter(d)
  );
  const controlDevices = floorDevices.filter(
    (d) => isDeviceMatchingCategory(d.type, 'Engine room') && searchFilter(d)
  );
  const sensorDevices = floorDevices.filter(
    (d) => isDeviceMatchingCategory(d.type, 'Internet device') && searchFilter(d)
  );
  const otherDevices = floorDevices.filter(
    (d) => isDeviceMatchingCategory(d.type, 'Other device') && searchFilter(d)
  );

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
    setRotation(0);
  }, []);

  // Rotate canvas clockwise by 90 degrees
  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Zoom by step (50% to 400% smooth zoom)
  const handleZoomStep = useCallback((delta: number) => {
    setZoomLevel((prev) => Math.max(50, Math.min(400, prev + delta)));
  }, []);

  // Native non-passive Wheel Zoom Listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const zoomFactor = e.deltaY < 0 ? 15 : -15;
      setZoomLevel((prev) => Math.max(50, Math.min(400, prev + zoomFactor)));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Mouse Pan Start Handler (Allows dragging at ANY zoom level)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    if (isDrawerOpen) setDrawerOpen(false);
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...panOffset };
  };

  // Global Window Listeners while dragging (Prevents sticking, dropping, or freezing on edges)
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const rawX = panStartRef.current.x + dx;
      const rawY = panStartRef.current.y + dy;

      const container = containerRef.current;
      const contW = container?.clientWidth || 800;
      const contH = container?.clientHeight || 600;
      // Generous Google Maps bounds: user can pan anywhere to center any room/corner
      const limitX = Math.max(contW * 1.5, contW * (zoomLevel / 100));
      const limitY = Math.max(contH * 1.5, contH * (zoomLevel / 100));

      setPanOffset({
        x: Math.max(-limitX, Math.min(limitX, rawX)),
        y: Math.max(-limitY, Math.min(limitY, rawY)),
      });
    };

    const handleWindowMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDragging, zoomLevel]);

  // Touch Gesture Handlers (Mobile 1-finger pan & 2-finger pinch zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    setShowMobileHint(false);
    if (isDrawerOpen) setDrawerOpen(false);
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...panOffset };
      pinchStartDistRef.current = null;
    } else if (e.touches.length === 2) {
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
      const rawX = panStartRef.current.x + dx;
      const rawY = panStartRef.current.y + dy;

      const container = containerRef.current;
      const contW = container?.clientWidth || 800;
      const contH = container?.clientHeight || 600;
      const limitX = Math.max(contW * 1.5, contW * (zoomLevel / 100));
      const limitY = Math.max(contH * 1.5, contH * (zoomLevel / 100));

      setPanOffset({
        x: Math.max(-limitX, Math.min(limitX, rawX)),
        y: Math.max(-limitY, Math.min(limitY, rawY)),
      });
    } else if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const scaleDelta = currentDist / pinchStartDistRef.current;
      const nextZoom = Math.max(50, Math.min(400, Math.round(zoomStartRef.current * scaleDelta)));
      setZoomLevel(nextZoom);
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    pinchStartDistRef.current = null;
  };

  // Ensure window horizontal scroll is always reset to 0 to prevent any page displacement
  useEffect(() => {
    window.scrollTo({ left: 0 });
  }, []);

  // Device Selection from Sidebar & Canvas
  const handleSelectDeviceFromSidebar = (dev: IoTDevice) => {
    setHighlightedDeviceId(dev.id);
    onSelectDevice(dev);
  };

  const handleSelectDeviceFromCanvas = (dev: IoTDevice) => {
    setHighlightedDeviceId(dev.id);
    if (isDrawerOpen) setDrawerOpen(false);
    onSelectDevice(dev);
  };

  const isFullscreen = variant === 'fullscreen';

  // Container styling: Fullscreen = True Frameless edge-to-edge; Embedded = compact card
  const containerWrapperClass = isFullscreen
    ? 'w-full h-full relative overflow-hidden bg-[#EEF2F8]'
    : 'w-full h-[480px] sm:h-[540px] lg:h-[600px] rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden relative bg-[#EEF2F8]';

  return (
    <div className={containerWrapperClass}>

      {/* ===================================================================== */}
      {/* 1. BOUNDLESS FRAMELESS CANVAS VIEWPORT (Google Maps Style Edge-to-Edge)*/}
      {/* ===================================================================== */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          touchAction: 'none',
          backgroundImage: 'radial-gradient(circle, #CBD5E1 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
          backgroundColor: '#F8FAFC',
        }}
        className={`w-full h-full absolute inset-0 overflow-hidden flex items-center justify-center select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Floating Mobile Gesture Hint */}
        {showMobileHint && (
          <div className="sm:hidden absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-pulse">
            <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-medium text-white shadow-md flex items-center gap-1.5">
              <Smartphone className="w-3 h-3 text-purple-400" />
              1 jari geser • 2 jari zoom
            </span>
          </div>
        )}

        {currentFloor ? (
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
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

              {/* Floor Plan Background Image with dynamic rotation transform */}
              {authenticatedPlanImageUrl && (() => {
                const imgTransform = getFloorPlanImageTransform(
                  currentPlan?.rotation || 0,
                  viewBoxW,
                  viewBoxH
                );
                return (
                  <g transform={imgTransform.transform || undefined}>
                    <image
                      href={authenticatedPlanImageUrl}
                      x="0"
                      y="0"
                      width={imgTransform.renderWidth}
                      height={imgTransform.renderHeight}
                      preserveAspectRatio="none"
                      className="rounded-2xl"
                    />
                  </g>
                );
              })()}

              {/* Room Polygons Layer */}
              {currentRooms.map((room) => {
                if (!room.polygonCoordinates || room.polygonCoordinates.length < 3) return null;
                const ptsStr = room.polygonCoordinates.map((p) => `${p.x},${p.y}`).join(' ');
                const isInspected = inspectedRoom?.id === room.id;
                const isRoomActive = selectedRoomId === 'ALL' || selectedRoomId === room.id || isInspected;
                const roomColor = room.color || '#6366F1';

                return (
                  <polygon
                    key={room.id}
                    points={ptsStr}
                    fill={roomColor}
                    fillOpacity={isInspected ? 0.32 : isRoomActive ? 0.14 : 0.03}
                    stroke={isInspected ? '#4F6BFF' : roomColor}
                    strokeWidth={isInspected ? 2.5 : isRoomActive ? 2 : 0.8}
                    strokeDasharray={isRoomActive ? 'none' : '4 4'}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (inspectedRoom?.id === room.id) {
                        setInspectedRoom(null);
                      } else {
                        setInspectedRoom(room);
                        setDrawerOpen(false); // close device drawer so they don't overlap
                      }
                    }}
                    className="cursor-pointer transition-all hover:fill-opacity-35"
                  />
                );
              })}

              {/* IoT Interactive Devices Layer (Monitoring & Click to Control) */}
              {positionedDevices.map((dev) => {
                const theme = getDeviceVisualTheme(dev);
                const R = dev.iconWidth ? dev.iconWidth / 2 : 22;
                const sensorReading = getSensorDisplay(dev);
                const devConfig = (dev.configuration as Record<string, any>) || {};
                const labelPos = devConfig.labelPosition || devConfig.labelPlacement || 'bottom';
                const isHighlighted = highlightedDeviceId === dev.id;
                const isHovered = hoveredDeviceId === dev.id;
                const shouldShowLabel = showLabels || isHighlighted || isHovered;

                const isMatchingCat = isDeviceMatchingCategory(dev.type, activeCategory);
                const isDimmed = isCategoryActive && !isMatchingCat;

                // Compute label transform based on orientation
                let labelTransform = `translate(0, ${R + 13})`;
                if (labelPos === 'top') {
                  labelTransform = `translate(0, ${-R - 15})`;
                } else if (labelPos === 'left') {
                  labelTransform = `translate(${-R - 45}, 0)`;
                } else if (labelPos === 'right') {
                  labelTransform = `translate(${R + 45}, 0)`;
                }

                return (
                  <g key={dev.id}>
                    {/* Clustered connector line back to original anchor if fanned out */}
                    {dev.isClustered && (
                      <line
                        x1={dev.x}
                        y1={dev.y}
                        x2={dev.renderX}
                        y2={dev.renderY}
                        stroke="#4F6BFF"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        opacity="0.45"
                      />
                    )}

                    <g
                      transform={`translate(${dev.renderX}, ${dev.renderY})${rotation !== 0 ? ` rotate(${-rotation})` : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectDeviceFromCanvas(dev);
                      }}
                      onMouseEnter={() => setHoveredDeviceId(dev.id)}
                      onMouseLeave={() => setHoveredDeviceId(null)}
                      style={{
                        opacity: isDimmed ? 0.22 : 1,
                        filter: isDimmed ? 'grayscale(80%)' : 'none',
                        transition: 'opacity 0.25s ease, filter 0.25s ease',
                      }}
                      className="cursor-pointer group select-none transition-transform duration-300"
                    >
                      {/* Category Spotlight Focus Ring (animated when matching active filter) */}
                      {isCategoryActive && isMatchingCat && (
                        <circle
                          r={R + 8}
                          fill="none"
                          stroke="#4F6BFF"
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                          className="animate-spin"
                          style={{ animationDuration: '6s' }}
                        />
                      )}

                      {/* Highlight Pulsing Outer Ring when selected from sidebar */}
                      {isHighlighted && !isCategoryActive && (
                        <circle
                          r={R + 10}
                          fill="none"
                          stroke="#4F6BFF"
                          strokeWidth="3"
                          strokeDasharray="4 2"
                          className="animate-spin"
                          style={{ animationDuration: '4s' }}
                        />
                      )}

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
                        stroke={isHighlighted || (isCategoryActive && isMatchingCat) ? '#4F6BFF' : theme.ringColor}
                        strokeWidth={theme.isActive || isHighlighted ? 2.5 : 1}
                        opacity={theme.isActive || isHighlighted ? 0.9 : 0.4}
                      />

                      {/* Main Circular Device Body */}
                      <circle
                        r={R}
                        fill={theme.pinBgColor}
                        stroke={isHighlighted || (isCategoryActive && isMatchingCat) ? '#4F6BFF' : theme.pinBorderColor}
                        strokeWidth={isHighlighted || (isCategoryActive && isMatchingCat) ? 3 : 2}
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

                      {/* Sensor Value Pill / Status Tag (Respects labelPosition & showLabels) */}
                      {shouldShowLabel && labelPos !== 'hidden' && (
                        sensorReading ? (
                          <g transform={labelTransform}>
                            <rect
                              x={-(sensorReading.length * 4.2 + 8)}
                              y="-9"
                              width={sensorReading.length * 8.4 + 16}
                              height="18"
                              rx="9"
                              fill="rgba(15, 23, 42, 0.9)"
                              stroke={isHighlighted ? '#A855F7' : theme.pinBorderColor}
                              strokeWidth={isHighlighted ? 2 : 1.2}
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
                          <g transform={labelTransform}>
                            <rect
                              x={-(dev.name.length * 3.5 + 8)}
                              y="-8"
                              width={dev.name.length * 7 + 16}
                              height="16"
                              rx="8"
                              fill="rgba(15, 23, 42, 0.85)"
                              stroke={isHighlighted ? '#A855F7' : 'rgba(255, 255, 255, 0.2)'}
                              strokeWidth={isHighlighted ? 2 : 1}
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
                        )
                      )}
                    </g>
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
            <h3 className="text-sm font-bold text-[#181829]">Belum Ada Lantai</h3>
            <p className="text-xs text-[#71758E] mt-1">
              Data lantai dan denah belum dikonfigurasi untuk rumah ini.
            </p>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 2. FLOATING ISLAND 1: TOP CONTROLS (Focus Chip & Optional Embedded HUD) */}
      {/* ===================================================================== */}
      {variant === 'embedded' && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 flex-wrap pointer-events-none max-w-[calc(100vw-32px)]">
          <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-lg">
            {floors.length > 1 && (
              <div className="flex items-center gap-0.5">
                {floors.map((fl) => (
                  <button
                    key={fl.id}
                    onClick={() => {
                      onSelectFloor(fl.id);
                      handleResetFit();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeFloorId === fl.id
                        ? 'bg-[#4F6BFF] text-white shadow-xs'
                        : 'text-[#71758E] hover:text-[#181829] hover:bg-slate-50'
                    }`}
                  >
                    {fl.name}
                  </button>
                ))}
              </div>
            )}
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1 px-2 py-1 text-xs">
              <DoorClosed className="w-3.5 h-3.5 text-[#4F6BFF] shrink-0" />
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
        </div>
      )}

      {/* Floating Category Focus Chip (Centered at top of canvas when active) */}
      {isCategoryActive && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#4F6BFF]/40 shadow-lg shadow-indigo-500/10 text-xs animate-in fade-in slide-in-from-top-1 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-[#4F6BFF] animate-pulse" />
          <span className="font-bold text-slate-800">
            Fokus: <span className="text-[#4F6BFF] font-black">{activeCategory}</span>
          </span>
          <span className="text-slate-500 font-mono text-[11px]">
            ({floorDevices.filter((d) => isDeviceMatchingCategory(d.type, activeCategory)).length} perangkat)
          </span>
          {onClearCategoryFilter && (
            <button
              type="button"
              onClick={onClearCategoryFilter}
              className="ml-1 p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="Reset ke Overview (Tampilkan Semua Perangkat)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. FLOATING ISLAND 2: TOP-RIGHT TOGGLE BUTTON (Daftar IoT)            */}
      {/* ===================================================================== */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto">
        <button
          onClick={() => {
            setDrawerOpen(!isDrawerOpen);
            setInspectedRoom(null);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shadow-lg backdrop-blur-xl border cursor-pointer ${
            isDrawerOpen
              ? 'bg-[#4F6BFF] text-white border-[#4F6BFF] shadow-indigo-500/30'
              : 'bg-white/95 text-slate-700 hover:text-[#4F6BFF] hover:bg-indigo-50/50 border-slate-200/90'
          }`}
          title={isDrawerOpen ? 'Tutup Panel Daftar Perangkat' : 'Buka Daftar Perangkat'}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{isDrawerOpen ? 'Tutup List' : 'Daftar IoT'}</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              isDrawerOpen ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {floorDevices.length}
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* 4. FLOATING ISLAND 3: BOTTOM-RIGHT NAVIGATION HUD (Google Maps Style) */}
      {/* ===================================================================== */}
      <div className="absolute bottom-6 right-4 sm:right-6 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200/90 shadow-xl">
        <button
          onClick={() => handleZoomStep(15)}
          disabled={zoomLevel >= 400}
          className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-purple-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Perbesar (Scroll Up)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <span className="text-[11px] font-mono font-bold text-slate-600 px-1.5 min-w-[42px] text-center select-none">
          {zoomLevel}%
        </span>

        <button
          onClick={() => handleZoomStep(-15)}
          disabled={zoomLevel <= 50}
          className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-purple-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Perkecil (Scroll Down)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        <button
          onClick={handleResetFit}
          className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-purple-600 transition-colors flex items-center gap-1"
          title="Pusatkan Denah / Reset Tampilan (Fit to Frame)"
        >
          <Maximize2 className="w-4 h-4" />
          <span className="text-[10px] font-bold hidden sm:inline">Pusatkan</span>
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        {/* 90-Degree Floor Plan View Rotation Button */}
        <button
          onClick={handleRotate}
          className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-purple-600 transition-colors flex items-center gap-1"
          title="Putar Orientasi Denah 90°"
        >
          <RotateCw className="w-4 h-4 text-purple-600" />
          {rotation > 0 && (
            <span className="text-[10px] font-bold text-purple-600 hidden sm:inline">{rotation}°</span>
          )}
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        {/* Label Toggle Button (Show/Hide Text Tags for Ultra-Clean Minimalist View) */}
        <button
          onClick={() => setShowLabels((prev) => !prev)}
          className={`p-2 rounded-xl transition-colors flex items-center gap-1 ${
            showLabels
              ? 'text-purple-600 hover:bg-purple-50'
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
          }`}
          title={showLabels ? 'Sembunyikan Label Teks (Mode Bersih)' : 'Tampilkan Semua Label Teks'}
        >
          {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span className="text-[10px] font-bold hidden sm:inline">
            {showLabels ? 'Label' : 'Ikon'}
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* 5. FLOATING ISLAND 4: BOTTOM-LEFT HINT & STATS                        */}
      {/* ===================================================================== */}
      <div className="hidden lg:flex absolute bottom-6 left-6 z-20 items-center gap-3 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-lg text-[11px] text-[#71758E]">
        <span className="font-bold text-[#181829] flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          Interaktif:
        </span>
        <span>Klik ikon di denah untuk kontrol</span>
        <span className="text-slate-300">•</span>
        <span className="flex items-center gap-1">
          <Move className="w-3 h-3 text-slate-400" /> Geser & zoom bebas
        </span>
      </div>

      {/* ===================================================================== */}
      {/* 6. CUSTOMER ROOM INSPECTOR DRAWER / POP-UP                            */}
      {/* ===================================================================== */}
      {inspectedRoom && (
        <aside className="absolute top-4 right-4 bottom-6 w-[calc(100vw-32px)] sm:w-[380px] lg:w-[420px] rounded-3xl bg-white/95 backdrop-blur-2xl shadow-2xl border border-slate-200/90 flex flex-col z-30 transition-all duration-300 ease-out overflow-hidden animate-in fade-in slide-in-from-right-4">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50 shrink-0">
            <div className="flex items-center gap-2.5">
              <span
                className="w-4 h-4 rounded-full border border-black/10 shadow-xs shrink-0"
                style={{ backgroundColor: inspectedRoom.color || '#6366F1' }}
              />
              <div>
                <h3 className="text-xs font-bold text-[#181829]">{inspectedRoom.name}</h3>
                <p className="text-[10px] text-slate-500">{inspectedRoom.floorName || currentFloor?.name || 'Lantai 1'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-indigo-700 border border-indigo-200">
                {inspectedRoom.type}
              </span>
              <button
                type="button"
                onClick={() => setInspectedRoom(null)}
                className="p-1.5 rounded-xl hover:bg-indigo-100/70 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Tutup Panel Ruangan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Luas</span>
                <span className="text-xs font-bold text-[#181829] font-mono">
                  {inspectedRoom.areaSquareMeters ? `${inspectedRoom.areaSquareMeters.toFixed(1)} m²` : '-'}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-sky-50/60 border border-sky-100 text-center">
                <span className="text-[10px] text-sky-600 block font-medium">Suhu</span>
                <span className="text-xs font-bold text-sky-800 font-mono">
                  {inspectedRoom.environmental?.temperature !== null && inspectedRoom.environmental?.temperature !== undefined
                    ? `${inspectedRoom.environmental.temperature}°C`
                    : '-'}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
                <span className="text-[10px] text-emerald-600 block font-medium">Kelembapan</span>
                <span className="text-xs font-bold text-emerald-800 font-mono">
                  {inspectedRoom.environmental?.humidity !== null && inspectedRoom.environmental?.humidity !== undefined
                    ? `${inspectedRoom.environmental.humidity}%`
                    : '-'}
                </span>
              </div>
            </div>

            {/* Devices in Room */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
                <span>Perangkat di Ruangan Ini</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {floorDevices.filter((d) => d.roomId === inspectedRoom.id).length} unit
                </span>
              </div>

              {(() => {
                const roomDevs = floorDevices.filter((d) => d.roomId === inspectedRoom.id);
                if (roomDevs.length === 0) {
                  return (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-xs">Belum ada perangkat IoT terpasang di ruangan ini.</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    {roomDevs.map((dev) => {
                      const theme = getDeviceVisualTheme(dev);
                      const status = getDeviceQuickStatusText(dev);
                      return (
                        <div
                          key={dev.id}
                          onClick={() => {
                            onSelectDevice(dev);
                          }}
                          className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-white hover:border-[#4F6BFF] transition-all cursor-pointer group flex items-center justify-between gap-2.5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                              <DeviceIconBadge type={dev.type} theme={theme} className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-[#181829] truncate group-hover:text-[#4F6BFF] transition-colors">
                                {dev.name}
                              </h4>
                              <p className="text-[10px] text-[#71758E] font-mono">{dev.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${status.colorClass}`}>
                              {status.text}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#4F6BFF] group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <span>Status: Normal</span>
            <span className="text-[10px] text-[#4F6BFF] font-semibold">Klik perangkat untuk kontrol</span>
          </div>
        </aside>
      )}

      {/* ===================================================================== */}
      {/* 7. FLOATING DEVICE DRAWER: GOOGLE MAPS HOVERING SIDE SHEET PANEL      */}
      {/* ===================================================================== */}
      {isDrawerOpen && (
        <aside
          className="absolute top-4 right-4 bottom-6 w-[calc(100vw-32px)] sm:w-[380px] lg:w-[420px] rounded-3xl bg-white/95 backdrop-blur-2xl shadow-2xl border border-slate-200/90 flex flex-col z-30 transition-all duration-300 ease-out overflow-hidden animate-in fade-in slide-in-from-right duration-200"
        >
        {/* Sidebar Header with Search & Close */}
        <div className="p-4 border-b border-slate-100 space-y-3 shrink-0 bg-slate-50/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4F6BFF] flex items-center justify-center font-bold text-xs">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#181829] uppercase tracking-wider">
                  Daftar Perangkat IoT
                </h3>
                <p className="text-[11px] text-[#71758E]">
                  {currentFloor?.name} • {floorDevices.length} Terpasang
                </p>
              </div>
            </div>

            {/* Close Sidebar Button */}
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="Tutup Panel Perangkat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input in Sidebar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Cari perangkat / ruangan..."
              className="w-full bg-white pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
            {sidebarSearch && (
              <button
                onClick={() => setSidebarSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Device Cards by Categories */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* CATEGORY 1: VISUAL & KAMERA (STREAMING) */}
          {(activeCategory === 'Overview' || activeCategory === 'Office device') && visualDevices.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#4F6BFF] uppercase tracking-wider px-1">
                <div className="flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-[#4F6BFF]" />
                  <span>Visual & Kamera</span>
                </div>
                <span className="text-[10px] text-slate-400 lowercase font-normal">
                  {visualDevices.length} unit
                </span>
              </div>

              <div className="space-y-2">
                {visualDevices.map((dev) => {
                  const theme = getDeviceVisualTheme(dev);
                  const status = getDeviceQuickStatusText(dev);
                  const isHighlighted = highlightedDeviceId === dev.id;

                  return (
                    <div
                      key={dev.id}
                      id={`device-card-${dev.id}`}
                      onClick={() => handleSelectDeviceFromSidebar(dev)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer group space-y-2 ${
                        isHighlighted
                          ? 'bg-indigo-50/80 border-[#4F6BFF] shadow-xs ring-1 ring-[#4F6BFF]'
                          : 'bg-slate-50/80 hover:bg-indigo-50/40 border-slate-200/80 hover:border-[#4F6BFF]/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#4F6BFF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <DeviceIconBadge type={dev.type} theme={theme} className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#181829] group-hover:text-[#4F6BFF] transition-colors">
                              {dev.name}
                            </h4>
                            <p className="text-[11px] text-[#71758E]">
                              {dev.room?.name || dev.manualRoomName || 'Ruangan'}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${status.colorClass}`}>
                          {status.text}
                        </span>
                      </div>

                      {/* Video Streaming Snapshot Preview Hint */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-500">
                        <span className="font-mono">
                          {((dev.configuration as Record<string, any>)?.resolution) || dev.type}
                        </span>
                        <span className="text-[#4F6BFF] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                          Buka Stream <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CATEGORY 2: KONTROL JARAK JAUH (AKTUATOR & IKLIM) */}
          {(activeCategory === 'Overview' || activeCategory === 'Engine room') && controlDevices.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-amber-700 uppercase tracking-wider px-1">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Kontrol & Aktuator</span>
                </div>
                <span className="text-[10px] text-slate-400 lowercase font-normal">
                  {controlDevices.length} unit
                </span>
              </div>

              <div className="space-y-2">
                {controlDevices.map((dev) => {
                  const theme = getDeviceVisualTheme(dev);
                  const status = getDeviceQuickStatusText(dev);
                  const isHighlighted = highlightedDeviceId === dev.id;
                  const cfg = (dev.configuration as Record<string, any>) || {};

                  return (
                    <div
                      key={dev.id}
                      id={`device-card-${dev.id}`}
                      onClick={() => handleSelectDeviceFromSidebar(dev)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer group space-y-2 ${
                        isHighlighted
                          ? 'bg-amber-50/80 border-amber-400 shadow-xs ring-1 ring-amber-400'
                          : 'bg-slate-50/80 hover:bg-amber-50/40 border-slate-200/80 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <DeviceIconBadge type={dev.type} theme={theme} className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#181829] group-hover:text-amber-700 transition-colors">
                              {dev.name}
                            </h4>
                            <p className="text-[11px] text-[#71758E]">
                              {dev.room?.name || dev.manualRoomName || 'Ruangan'}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${status.colorClass}`}>
                          {status.text}
                        </span>
                      </div>

                      {/* Quick Control Values */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-500">
                        <span>
                          {cfg.brightness !== undefined
                            ? `Brightness: ${cfg.brightness}%`
                            : cfg.temperature !== undefined
                            ? `Set Temp: ${cfg.temperature}°C`
                            : cfg.batteryLevel !== undefined
                            ? `Baterai: ${cfg.batteryLevel}%`
                            : 'Siaga Kontrol'}
                        </span>
                        <span className="text-amber-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                          Atur <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CATEGORY 3: SENSOR & INFORMASI KONDISI (MONITORING SAJA) */}
          {(activeCategory === 'Overview' || activeCategory === 'Internet device') && sensorDevices.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 uppercase tracking-wider px-1">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sensor & Jaringan</span>
                </div>
                <span className="text-[10px] text-slate-400 lowercase font-normal">
                  {sensorDevices.length} unit
                </span>
              </div>

              <div className="space-y-2">
                {sensorDevices.map((dev) => {
                  const theme = getDeviceVisualTheme(dev);
                  const status = getDeviceQuickStatusText(dev);
                  const isHighlighted = highlightedDeviceId === dev.id;
                  const reading = getSensorDisplay(dev);

                  return (
                    <div
                      key={dev.id}
                      id={`device-card-${dev.id}`}
                      onClick={() => handleSelectDeviceFromSidebar(dev)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer group space-y-2 ${
                        isHighlighted
                          ? 'bg-emerald-50/80 border-emerald-400 shadow-xs ring-1 ring-emerald-400'
                          : 'bg-slate-50/80 hover:bg-emerald-50/40 border-slate-200/80 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <DeviceIconBadge type={dev.type} theme={theme} className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#181829] group-hover:text-emerald-700 transition-colors">
                              {dev.name}
                            </h4>
                            <p className="text-[11px] text-[#71758E]">
                              {dev.room?.name || dev.manualRoomName || 'Ruangan'}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${status.colorClass}`}>
                          {status.text}
                        </span>
                      </div>

                      {/* Realtime Sensor Telemetry Readout */}
                      {reading && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                          <span className="text-slate-500">Nilai Realtime:</span>
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {reading}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty Search Fallback */}
          {visualDevices.length === 0 && controlDevices.length === 0 && sensorDevices.length === 0 && (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium">Tidak ada perangkat yang cocok dengan pencarian.</p>
              <button
                onClick={() => setSidebarSearch('')}
                className="text-xs text-purple-600 font-bold hover:underline"
              >
                Reset Pencarian
              </button>
            </div>
          )}

        </div>

        {/* Sidebar Footer Info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {floorDevices.length} Terhubung
          </span>
          <span className="text-[10px] text-purple-600 font-semibold">Klik kartu untuk kontrol</span>
        </div>
      </aside>
      )}

    </div>
  );
};
