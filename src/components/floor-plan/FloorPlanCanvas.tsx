import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  FloorPlan,
  FloorPlanObject,
  ObjectCatalogItem,
  Room,
  PolygonPoint,
} from '../../types/floor-plan';
import { IoTDevice, DeviceType } from '../../types/device';
import { floorPlanApi } from '../../services/floor-plan.api';
import { useAuthenticatedBlobUrl } from '../../hooks/useAuthenticatedBlobUrl';
import {
  getDeviceVisualTheme,
  DeviceVisualTheme,
  DeviceAmbientGlowDefs,
  getDeviceHaloGradientUrl,
  DeviceSvgIcon,
} from '../../utils/device-visual';
import {
  Compass,
  PenTool,
  Edit3,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  Eye,
  Radio,
  Power,
  Lock,
  Unlock,
  Camera,
  Activity,
  Flame,
  Thermometer,
  Wind,
  Lightbulb,
  Ruler,
  Upload,
  Undo2,
  X,
} from 'lucide-react';
import { ToolMode } from './FloorPlanToolbar';
import { sanitizeSvgInner } from '../../utils/sanitizeSvg';

function computeShoelaceArea(points: PolygonPoint[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const cur = points[i];
    const nxt = points[(i + 1) % points.length];
    sum += cur.x * nxt.y - nxt.x * cur.y;
  }
  return Math.abs(sum) / 2;
}

interface FloorPlanCanvasProps {
  floorPlan: FloorPlan;
  rooms?: Room[];
  devices?: IoTDevice[];
  selectedObjectId: string | null;
  selectedRoomId?: string | null;
  selectedDeviceId?: string | null;
  toolMode?: ToolMode;
  hiddenRoomIds?: Set<string>;
  onSelectObject: (objectId: string | null) => void;
  onSelectRoom?: (roomId: string | null) => void;
  onSelectDevice?: (deviceId: string | null) => void;
  onUpdateObject: (objectId: string, updates: Partial<FloorPlanObject>) => void;
  // Device drag and resize callbacks
  onUpdateDevicePosition?: (
    deviceId: string,
    x: number,
    y: number,
    normX: number,
    normY: number
  ) => void;
  onCommitDevicePosition?: (
    deviceId: string,
    x: number,
    y: number,
    normX: number,
    normY: number
  ) => void;
  onUpdateDeviceSize?: (
    deviceId: string,
    width: number,
    height: number
  ) => void;
  onCommitDeviceSize?: (
    deviceId: string,
    width: number,
    height: number
  ) => void;
  onAddObjectAt: (catalogItem: ObjectCatalogItem, worldX: number, worldY: number) => void;
  onPlaceDeviceAt?: (worldX: number, worldY: number, normX: number, normY: number) => void;
  onOpenDeviceControl?: (device: IoTDevice) => void;
  onFinishDrawRoom?: (points: PolygonPoint[]) => void;
  onUpdateRoomPolygon?: (roomId: string, points: PolygonPoint[]) => void;
  onOpenCalibrationModal?: (point1: PolygonPoint, point2: PolygonPoint) => void;
  onOpenUploadBackground?: () => void;
  onExitToolMode?: () => void;
  showGrid: boolean;
  snapToGrid: boolean;
  zoomLevel: number;
  onZoomChange: (level: number) => void;
  isPreviewMonitoring?: boolean;
  showRoomPolygons?: boolean;
}

type DragMode =
  | { type: 'NONE' }
  | { type: 'PAN'; startX: number; startY: number; startViewBoxX: number; startViewBoxY: number }
  | { type: 'MOVE_OBJECT'; objectId: string; startWorldX: number; startWorldY: number; origObjX: number; origObjY: number }
  | {
      type: 'MOVE_DEVICE';
      deviceId: string;
      startWorldX: number;
      startWorldY: number;
      origDevX: number;
      origDevY: number;
      currentX: number;
      currentY: number;
    }
  | {
      type: 'RESIZE_DEVICE';
      deviceId: string;
      handle: 'se' | 'sw' | 'ne' | 'nw';
      startWorldX: number;
      startWorldY: number;
      origSize: number;
      centerX: number;
      centerY: number;
      currentSize: number;
    }
  | { type: 'ROTATE_OBJECT'; objectId: string; centerX: number; centerY: number }
  | { type: 'RESIZE_OBJECT'; objectId: string; handle: 'se' | 'sw' | 'ne' | 'nw'; startWorldX: number; startWorldY: number; origX: number; origY: number; origW: number; origH: number }
  | { type: 'MOVE_VERTEX'; roomId: string; vertexIndex: number; startWorldX: number; startWorldY: number; origVertexX: number; origVertexY: number };

export const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({
  floorPlan,
  rooms = [],
  devices = [],
  selectedObjectId,
  selectedRoomId = null,
  selectedDeviceId = null,
  toolMode = 'select',
  hiddenRoomIds = new Set(),
  onSelectObject,
  onSelectRoom,
  onSelectDevice,
  onUpdateObject,
  onUpdateDevicePosition,
  onCommitDevicePosition,
  onUpdateDeviceSize,
  onCommitDeviceSize,
  onAddObjectAt,
  onPlaceDeviceAt,
  onOpenDeviceControl,
  onFinishDrawRoom,
  onUpdateRoomPolygon,
  onOpenCalibrationModal,
  onOpenUploadBackground,
  onExitToolMode,
  showGrid,
  snapToGrid,
  zoomLevel,
  onZoomChange,
  isPreviewMonitoring = false,
  showRoomPolygons = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // SVG ViewBox state (World coordinate window)
  const initialWidth = floorPlan.imageWidth || floorPlan.viewBoxWidth || 1600;
  const initialHeight = floorPlan.imageHeight || floorPlan.viewBoxHeight || 1000;
  const [viewBox, setViewBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0,
    y: 0,
    w: initialWidth,
    h: initialHeight,
  });

  // Keep callback refs stable to prevent unbinding / rebinding global mouse listeners during drag
  const onUpdateDevicePositionRef = useRef(onUpdateDevicePosition);
  onUpdateDevicePositionRef.current = onUpdateDevicePosition;

  const onCommitDevicePositionRef = useRef(onCommitDevicePosition);
  onCommitDevicePositionRef.current = onCommitDevicePosition;

  const onUpdateDeviceSizeRef = useRef(onUpdateDeviceSize);
  onUpdateDeviceSizeRef.current = onUpdateDeviceSize;

  const onCommitDeviceSizeRef = useRef(onCommitDeviceSize);
  onCommitDeviceSizeRef.current = onCommitDeviceSize;

  const onUpdateObjectRef = useRef(onUpdateObject);
  onUpdateObjectRef.current = onUpdateObject;

  const onUpdateRoomPolygonRef = useRef(onUpdateRoomPolygon);
  onUpdateRoomPolygonRef.current = onUpdateRoomPolygon;

  // Drag interaction state
  const dragRef = useRef<DragMode>({ type: 'NONE' });
  const [dragMode, setDragMode] = useState<DragMode>({ type: 'NONE' });

  // Drawing room polygon state
  const [drawPoints, setDrawPoints] = useState<PolygonPoint[]>([]);
  const [drawCursor, setDrawCursor] = useState<PolygonPoint | null>(null);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const [editingVertices, setEditingVertices] = useState<PolygonPoint[] | null>(null);

  // Scale calibration interaction state
  const [calibPoint1, setCalibPoint1] = useState<PolygonPoint | null>(null);
  const [calibCursor, setCalibCursor] = useState<PolygonPoint | null>(null);

  useEffect(() => {
    if (toolMode !== 'calibrate') {
      setCalibPoint1(null);
      setCalibCursor(null);
    }
  }, [toolMode]);

  // Drawing Room Controls (Undo point, Cancel drawing, Finish drawing)
  const handleUndoDrawPoint = useCallback(() => {
    setDrawPoints((prev) => prev.slice(0, -1));
  }, []);

  const handleCancelDrawRoom = useCallback(() => {
    setDrawPoints([]);
    setDrawCursor(null);
    if (onExitToolMode) onExitToolMode();
  }, [onExitToolMode]);

  const handleCompleteDrawRoom = useCallback(() => {
    if (drawPoints.length >= 3 && onFinishDrawRoom) {
      onFinishDrawRoom(drawPoints);
      setDrawPoints([]);
      setDrawCursor(null);
    }
  }, [drawPoints, onFinishDrawRoom]);

  // Context menu on canvas (Right-click to undo last point during drawing)
  const handleCanvasContextMenu = useCallback((e: React.MouseEvent) => {
    if (toolMode === 'draw-room') {
      e.preventDefault();
      if (drawPoints.length > 0) {
        setDrawPoints((prev) => prev.slice(0, -1));
      } else {
        if (onExitToolMode) onExitToolMode();
      }
    }
  }, [toolMode, drawPoints.length, onExitToolMode]);

  // Keyboard shortcut listener (Backspace / Delete to undo, Escape to cancel, Enter to finish)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (toolMode === 'draw-room') {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          setDrawPoints((prev) => prev.slice(0, -1));
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setDrawPoints([]);
          setDrawCursor(null);
          if (onExitToolMode) onExitToolMode();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (drawPoints.length >= 3 && onFinishDrawRoom) {
            onFinishDrawRoom(drawPoints);
            setDrawPoints([]);
            setDrawCursor(null);
          }
        }
      } else if (toolMode === 'calibrate') {
        if (e.key === 'Escape') {
          e.preventDefault();
          setCalibPoint1(null);
          setCalibCursor(null);
          if (onExitToolMode) onExitToolMode();
        }
      } else if (toolMode === 'edit-room') {
        if (e.key === 'Escape') {
          e.preventDefault();
          if (onExitToolMode) onExitToolMode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toolMode, drawPoints, onFinishDrawRoom, onExitToolMode]);

  // Image load state
  const [imageError, setImageError] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Synchronize editingVertices with selected room
  useEffect(() => {
    // Avoid resetting while user is actively dragging a vertex
    if (dragRef.current.type === 'MOVE_VERTEX') return;

    if (toolMode === 'edit-room' && selectedRoomId) {
      const targetRoom = rooms.find((r) => r.id === selectedRoomId);
      if (targetRoom && targetRoom.polygonCoordinates) {
        setEditingVertices(targetRoom.polygonCoordinates);
      }
    } else {
      setEditingVertices(null);
    }
  }, [toolMode, selectedRoomId, rooms]);

  // Handle image load error reset
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [floorPlan.id, floorPlan.imagePath]);

  // Stable Background Image URL (fetched via authenticated shared HTTP client)
  const rawBackgroundImageUrl = useMemo(() => {
    return floorPlan.imagePath
      ? floorPlanApi.getBackgroundImageUrl(floorPlan.id, floorPlan.updatedAt || '1')
      : null;
  }, [floorPlan.id, floorPlan.imagePath, floorPlan.updatedAt]);

  const { blobUrl: backgroundImageUrl, error: bgFetchError } =
    useAuthenticatedBlobUrl(rawBackgroundImageUrl);

  useEffect(() => {
    if (bgFetchError) {
      setImageError(true);
    }
  }, [bgFetchError]);

  // Coordinate Conversion: Screen (pixel) to SVG World (units) using exact SVG CTM
  const screenToWorld = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const svg = svgRef.current;
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const transformed = pt.matrixTransform(ctm.inverse());
        return {
          x: Math.round(transformed.x * 10) / 10,
          y: Math.round(transformed.y * 10) / 10,
        };
      }

      // Robust fallback if CTM is temporarily unavailable
      const rect = svg.getBoundingClientRect();
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;

      const scaleX = rect.width > 0 ? viewBox.w / rect.width : 1;
      const scaleY = rect.height > 0 ? viewBox.h / rect.height : 1;

      return {
        x: viewBox.x + screenX * scaleX,
        y: viewBox.y + screenY * scaleY,
      };
    },
    [viewBox]
  );

  // Zoom to level handler
  const handleZoom = useCallback(
    (nextZoom: number, centerScreenX?: number, centerScreenY?: number) => {
      if (!svgRef.current) return;
      const clampedZoom = Math.max(25, Math.min(400, nextZoom));
      const rect = svgRef.current.getBoundingClientRect();

      const cx = centerScreenX !== undefined ? centerScreenX : rect.left + rect.width / 2;
      const cy = centerScreenY !== undefined ? centerScreenY : rect.top + rect.height / 2;

      const worldCenterBefore = screenToWorld(cx, cy);

      const baseW = floorPlan.imageWidth || floorPlan.viewBoxWidth || 1600;
      const baseH = floorPlan.imageHeight || floorPlan.viewBoxHeight || 1000;
      const newW = baseW * (100 / clampedZoom);
      const newH = baseH * (100 / clampedZoom);

      const factorX = rect.width > 0 ? (cx - rect.left) / rect.width : 0.5;
      const factorY = rect.height > 0 ? (cy - rect.top) / rect.height : 0.5;

      const newX = worldCenterBefore.x - factorX * newW;
      const newY = worldCenterBefore.y - factorY * newH;

      setViewBox({ x: newX, y: newY, w: newW, h: newH });
      onZoomChange(clampedZoom);
    },
    [floorPlan, screenToWorld, onZoomChange]
  );

  // Auto-reset viewBox whenever switching floor plan
  useEffect(() => {
    const baseW = floorPlan.imageWidth || floorPlan.viewBoxWidth || 1600;
    const baseH = floorPlan.imageHeight || floorPlan.viewBoxHeight || 1000;
    setViewBox({
      x: 0,
      y: 0,
      w: baseW,
      h: baseH,
    });
  }, [floorPlan.id]);

  // Sync external zoomLevel prop
  useEffect(() => {
    const baseW = floorPlan.imageWidth || floorPlan.viewBoxWidth || 1600;
    const baseH = floorPlan.imageHeight || floorPlan.viewBoxHeight || 1000;
    const targetW = baseW * (100 / zoomLevel);
    const targetH = baseH * (100 / zoomLevel);

    if (Math.abs(viewBox.w - targetW) > 1) {
      setViewBox((prev) => ({
        ...prev,
        w: targetW,
        h: targetH,
      }));
    }
  }, [zoomLevel, floorPlan]);

  // Wheel Zoom Listener using native non-passive listener to prevent page-level scrolling
  const zoomLevelRef = useRef(zoomLevel);
  zoomLevelRef.current = zoomLevel;
  const handleZoomRef = useRef(handleZoom);
  handleZoomRef.current = handleZoom;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      // Intercept wheel event and stop page-level scrolling
      e.preventDefault();
      e.stopPropagation();

      const zoomDelta = e.deltaY < 0 ? 10 : -10;
      handleZoomRef.current(zoomLevelRef.current + zoomDelta, e.clientX, e.clientY);
    };

    container.addEventListener('wheel', onWheel, { passive: false });

    // Touch gesture support for mobile / tablets (1-finger pan & 2-finger pinch zoom)
    let pinchStartDist: number | null = null;
    let zoomStart = 100;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        const panAction: DragMode = {
          type: 'PAN',
          startX: t.clientX,
          startY: t.clientY,
          startViewBoxX: viewBox.x,
          startViewBoxY: viewBox.y,
        };
        dragRef.current = panAction;
        setDragMode(panAction);
      } else if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        pinchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        zoomStart = zoomLevelRef.current;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && dragRef.current.type === 'PAN') {
        const t = e.touches[0];
        const world = screenToWorld(t.clientX, t.clientY);
        processDrag(t.clientX, t.clientY, world);
      } else if (e.touches.length === 2 && pinchStartDist !== null) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const scaleDelta = currentDist / pinchStartDist;
        const nextZoom = Math.max(25, Math.min(400, Math.round(zoomStart * scaleDelta)));
        handleZoomRef.current(nextZoom);
      }
    };

    const onTouchEnd = () => {
      handleMouseUp();
      pinchStartDist = null;
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Complete drag interactions
  const handleMouseUp = useCallback(() => {
    const active = dragRef.current;
    dragRef.current = { type: 'NONE' };
    setDragMode({ type: 'NONE' });

    // 1. Commit Device Move to database
    if (active.type === 'MOVE_DEVICE') {
      const baseW = floorPlan.imageWidth || floorPlan.viewBoxWidth || 1600;
      const baseH = floorPlan.imageHeight || floorPlan.viewBoxHeight || 1000;
      const finalX = active.currentX;
      const finalY = active.currentY;
      const normX = baseW > 0 ? Math.max(0, Math.min(1, Math.round((finalX / baseW) * 10000) / 10000)) : 0;
      const normY = baseH > 0 ? Math.max(0, Math.min(1, Math.round((finalY / baseH) * 10000) / 10000)) : 0;
      if (onCommitDevicePositionRef.current) {
        onCommitDevicePositionRef.current(active.deviceId, finalX, finalY, normX, normY);
      }
    }

    // 2. Commit Device Resize to database
    if (active.type === 'RESIZE_DEVICE') {
      if (onCommitDeviceSizeRef.current) {
        onCommitDeviceSizeRef.current(active.deviceId, active.currentSize, active.currentSize);
      }
    }

    // 3. Commit Room Vertex
    if (active.type === 'MOVE_VERTEX' && active.roomId) {
      setEditingVertices((current) => {
        if (current && current.length >= 3 && onUpdateRoomPolygonRef.current) {
          onUpdateRoomPolygonRef.current(active.roomId, current);
        }
        return current;
      });
    }
  }, [floorPlan]);

  // Process mouse movements during drag
  const processDrag = useCallback(
    (clientX: number, clientY: number, world: { x: number; y: number }) => {
      const active = dragRef.current;
      const baseW = floorPlan.imageWidth || floorPlan.viewBoxWidth || 1600;
      const baseH = floorPlan.imageHeight || floorPlan.viewBoxHeight || 1000;

      if (active.type === 'PAN') {
        const dxScreen = clientX - active.startX;
        const dyScreen = clientY - active.startY;
        const scaleFactor = viewBox.w / (svgRef.current?.clientWidth || 1);
        setViewBox((prev) => ({
          ...prev,
          x: active.startViewBoxX - dxScreen * scaleFactor,
          y: active.startViewBoxY - dyScreen * scaleFactor,
        }));
      } else if (active.type === 'MOVE_OBJECT') {
        let newX = active.origObjX + (world.x - active.startWorldX);
        let newY = active.origObjY + (world.y - active.startWorldY);

        if (snapToGrid) {
          newX = Math.round(newX / 20) * 20;
          newY = Math.round(newY / 20) * 20;
        }

        if (onUpdateObjectRef.current) {
          onUpdateObjectRef.current(active.objectId, { x: newX, y: newY });
        }
      } else if (active.type === 'MOVE_DEVICE') {
        let newX = active.origDevX + (world.x - active.startWorldX);
        let newY = active.origDevY + (world.y - active.startWorldY);

        if (snapToGrid) {
          newX = Math.round(newX / 20) * 20;
          newY = Math.round(newY / 20) * 20;
        }

        active.currentX = newX;
        active.currentY = newY;

        const normX = baseW > 0 ? Math.max(0, Math.min(1, Math.round((newX / baseW) * 10000) / 10000)) : 0;
        const normY = baseH > 0 ? Math.max(0, Math.min(1, Math.round((newY / baseH) * 10000) / 10000)) : 0;

        if (onUpdateDevicePositionRef.current) {
          onUpdateDevicePositionRef.current(active.deviceId, newX, newY, normX, normY);
        }
      } else if (active.type === 'RESIZE_DEVICE') {
        // Calculate radial distance from center
        const dx = Math.abs(world.x - active.centerX);
        const dy = Math.abs(world.y - active.centerY);
        const maxDelta = Math.max(dx, dy);
        const newSize = Math.round(maxDelta * 2);
        const clampedSize = Math.max(28, Math.min(120, newSize));

        active.currentSize = clampedSize;

        if (onUpdateDeviceSizeRef.current) {
          onUpdateDeviceSizeRef.current(active.deviceId, clampedSize, clampedSize);
        }
      } else if (active.type === 'ROTATE_OBJECT') {
        const angleRad = Math.atan2(world.y - active.centerY, world.x - active.centerX);
        let deg = Math.round((angleRad * 180) / Math.PI + 90);
        if (deg < 0) deg += 360;
        deg = deg % 360;

        if (snapToGrid) {
          deg = Math.round(deg / 15) * 15;
        }

        if (onUpdateObjectRef.current) {
          onUpdateObjectRef.current(active.objectId, { rotation: deg });
        }
      } else if (active.type === 'RESIZE_OBJECT') {
        const dx = world.x - active.startWorldX;
        const dy = world.y - active.startWorldY;

        let newW = active.origW;
        let newH = active.origH;
        let newX = active.origX;
        let newY = active.origY;

        if (active.handle === 'se') {
          newW = Math.max(15, active.origW + dx);
          newH = Math.max(15, active.origH + dy);
        } else if (active.handle === 'sw') {
          newW = Math.max(15, active.origW - dx);
          newH = Math.max(15, active.origH + dy);
          newX = active.origX + dx;
        } else if (active.handle === 'ne') {
          newW = Math.max(15, active.origW + dx);
          newH = Math.max(15, active.origH - dy);
          newY = active.origY + dy;
        } else if (active.handle === 'nw') {
          newW = Math.max(15, active.origW - dx);
          newH = Math.max(15, active.origH - dy);
          newX = active.origX + dx;
          newY = active.origY + dy;
        }

        if (snapToGrid) {
          newW = Math.round(newW / 10) * 10;
          newH = Math.round(newH / 10) * 10;
        }

        if (onUpdateObjectRef.current) {
          onUpdateObjectRef.current(active.objectId, {
            x: newX,
            y: newY,
            width: newW,
            height: newH,
          });
        }
      } else if (active.type === 'MOVE_VERTEX') {
        const step = (floorPlan.isCalibrated && floorPlan.pixelsPerMeter)
          ? floorPlan.pixelsPerMeter / 2
          : 20;
        const dx = world.x - active.startWorldX;
        const dy = world.y - active.startWorldY;
        let vx = active.origVertexX + dx;
        let vy = active.origVertexY + dy;

        if (snapToGrid) {
          vx = Math.round(vx / step) * step;
          vy = Math.round(vy / step) * step;
        } else {
          vx = Math.round(vx * 10) / 10;
          vy = Math.round(vy * 10) / 10;
        }

        setEditingVertices((prev) => {
          if (!prev) return prev;
          if (prev[active.vertexIndex]?.x === vx && prev[active.vertexIndex]?.y === vy) {
            return prev;
          }
          const next = [...prev];
          next[active.vertexIndex] = { x: vx, y: vy };
          return next;
        });
      }
    },
    [viewBox, snapToGrid, floorPlan]
  );

  // Global window listeners for drag & drop
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (dragRef.current.type !== 'NONE') {
        const world = screenToWorld(e.clientX, e.clientY);
        processDrag(e.clientX, e.clientY, world);
      }
    };

    const handleGlobalMouseUp = () => {
      if (dragRef.current.type !== 'NONE') {
        handleMouseUp();
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [screenToWorld, processDrag, handleMouseUp]);

  // Main Canvas Mouse Down
  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 1 || e.altKey || (e.button === 0 && e.shiftKey)) {
      // Middle click or Alt+drag or Shift+drag -> Pan Viewport
      e.preventDefault();
      const panAction: DragMode = {
        type: 'PAN',
        startX: e.clientX,
        startY: e.clientY,
        startViewBoxX: viewBox.x,
        startViewBoxY: viewBox.y,
      };
      dragRef.current = panAction;
      setDragMode(panAction);
      return;
    }

    if (isPreviewMonitoring) {
      // In preview monitoring mode, dragging the canvas background pans the viewport smoothly
      const panAction: DragMode = {
        type: 'PAN',
        startX: e.clientX,
        startY: e.clientY,
        startViewBoxX: viewBox.x,
        startViewBoxY: viewBox.y,
      };
      dragRef.current = panAction;
      setDragMode(panAction);
      return;
    }

    const world = screenToWorld(e.clientX, e.clientY);
    const baseW = floorPlan.imageWidth || floorPlan.viewBoxWidth || 1600;
    const baseH = floorPlan.imageHeight || floorPlan.viewBoxHeight || 1000;
    const normX = baseW > 0 ? Math.max(0, Math.min(1, Math.round((world.x / baseW) * 10000) / 10000)) : 0;
    const normY = baseH > 0 ? Math.max(0, Math.min(1, Math.round((world.y / baseH) * 10000) / 10000)) : 0;

    // Mode: Place Device
    if (toolMode === 'place-device') {
      if (onPlaceDeviceAt) {
        onPlaceDeviceAt(world.x, world.y, normX, normY);
      }
      return;
    }

    // Mode: Scale Calibration (Phase 10)
    if (toolMode === 'calibrate') {
      const step = (floorPlan.isCalibrated && floorPlan.pixelsPerMeter) ? floorPlan.pixelsPerMeter / 2 : 20;
      const ptX = snapToGrid ? Math.round(world.x / step) * step : Math.round(world.x * 10) / 10;
      const ptY = snapToGrid ? Math.round(world.y / step) * step : Math.round(world.y * 10) / 10;
      const clickPoint = { x: ptX, y: ptY };

      if (!calibPoint1) {
        setCalibPoint1(clickPoint);
      } else {
        const dist = Math.hypot(clickPoint.x - calibPoint1.x, clickPoint.y - calibPoint1.y);
        if (dist >= 5) {
          if (onOpenCalibrationModal) {
            onOpenCalibrationModal(calibPoint1, clickPoint);
          }
          setCalibPoint1(null);
          setCalibCursor(null);
        }
      }
      return;
    }

    // Mode: Draw Room Polygon
    if (toolMode === 'draw-room') {
      const step = (floorPlan.isCalibrated && floorPlan.pixelsPerMeter) ? floorPlan.pixelsPerMeter / 2 : 20;
      let ptX = snapToGrid ? Math.round(world.x / step) * step : Math.round(world.x * 10) / 10;
      let ptY = snapToGrid ? Math.round(world.y / step) * step : Math.round(world.y * 10) / 10;

      // Close polygon if clicking near first point
      if (drawPoints.length >= 3) {
        const first = drawPoints[0];
        const dist = Math.hypot(ptX - first.x, ptY - first.y);
        if (dist <= 25) {
          if (onFinishDrawRoom) {
            onFinishDrawRoom(drawPoints);
          }
          setDrawPoints([]);
          setDrawCursor(null);
          return;
        }
      }

      setDrawPoints((prev) => [...prev, { x: ptX, y: ptY }]);
      return;
    }

    // Left click on empty canvas -> Deselect all & Pan viewport
    if (e.button === 0) {
      onSelectObject(null);
      if (onSelectRoom) onSelectRoom(null);
      if (onSelectDevice) onSelectDevice(null);

      const panAction: DragMode = {
        type: 'PAN',
        startX: e.clientX,
        startY: e.clientY,
        startViewBoxX: viewBox.x,
        startViewBoxY: viewBox.y,
      };
      dragRef.current = panAction;
      setDragMode(panAction);
    }
  };

  // Canvas Mouse Move (for drawing room & calibration guides)
  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const step = (floorPlan.isCalibrated && floorPlan.pixelsPerMeter) ? floorPlan.pixelsPerMeter / 2 : 20;
    const world = screenToWorld(e.clientX, e.clientY);

    if (toolMode === 'draw-room') {
      const cx = snapToGrid ? Math.round(world.x / step) * step : Math.round(world.x * 10) / 10;
      const cy = snapToGrid ? Math.round(world.y / step) * step : Math.round(world.y * 10) / 10;
      setDrawCursor({ x: cx, y: cy });
    } else if (toolMode === 'calibrate') {
      const cx = snapToGrid ? Math.round(world.x / step) * step : Math.round(world.x * 10) / 10;
      const cy = snapToGrid ? Math.round(world.y / step) * step : Math.round(world.y * 10) / 10;
      setCalibCursor({ x: cx, y: cy });
    }
  };

  // Object Interactions (Move, Select)
  const handleObjectMouseDown = (e: React.MouseEvent, obj: FloorPlanObject) => {
    if (isPreviewMonitoring) return;
    e.stopPropagation();
    if (toolMode !== 'select') return;

    onSelectObject(obj.id);
    if (onSelectRoom) onSelectRoom(null);
    if (onSelectDevice) onSelectDevice(null);

    const world = screenToWorld(e.clientX, e.clientY);
    const moveAction: DragMode = {
      type: 'MOVE_OBJECT',
      objectId: obj.id,
      startWorldX: world.x,
      startWorldY: world.y,
      origObjX: obj.x,
      origObjY: obj.y,
    };
    dragRef.current = moveAction;
    setDragMode(moveAction);
  };

  // Device Interactions (Move, Select, Open Preview)
  const handleDeviceMouseDown = (e: React.MouseEvent, dev: IoTDevice) => {
    e.preventDefault();
    e.stopPropagation(); // MUST NOT reach handleCanvasMouseDown

    if (isPreviewMonitoring) {
      // In Preview Monitoring: Click opens interactive device control modal!
      if (onOpenDeviceControl) {
        onOpenDeviceControl(dev);
      }
      return;
    }

    if (toolMode !== 'select') return;
    if (e.button !== 0) return; // Left click only

    if (onSelectDevice) onSelectDevice(dev.id);
    onSelectObject(null);
    if (onSelectRoom) onSelectRoom(null);

    const world = screenToWorld(e.clientX, e.clientY);
    const moveAction: DragMode = {
      type: 'MOVE_DEVICE',
      deviceId: dev.id,
      startWorldX: world.x,
      startWorldY: world.y,
      origDevX: dev.x,
      origDevY: dev.y,
      currentX: dev.x,
      currentY: dev.y,
    };
    dragRef.current = moveAction;
    setDragMode(moveAction);
  };

  // Device Resize Handle MouseDown
  const handleDeviceResizeHandleMouseDown = (
    e: React.MouseEvent,
    dev: IoTDevice,
    handle: 'se' | 'sw' | 'ne' | 'nw'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPreviewMonitoring) return;

    const world = screenToWorld(e.clientX, e.clientY);
    const currentSize = dev.iconWidth || 48;
    const resizeAction: DragMode = {
      type: 'RESIZE_DEVICE',
      deviceId: dev.id,
      handle,
      startWorldX: world.x,
      startWorldY: world.y,
      origSize: currentSize,
      centerX: dev.x,
      centerY: dev.y,
      currentSize,
    };
    dragRef.current = resizeAction;
    setDragMode(resizeAction);
  };

  // Rotation Handle
  const handleRotateHandleMouseDown = (e: React.MouseEvent, obj: FloorPlanObject) => {
    e.stopPropagation();
    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;
    const rotateAction: DragMode = {
      type: 'ROTATE_OBJECT',
      objectId: obj.id,
      centerX,
      centerY,
    };
    dragRef.current = rotateAction;
    setDragMode(rotateAction);
  };

  // Resize Handle
  const handleResizeHandleMouseDown = (
    e: React.MouseEvent,
    obj: FloorPlanObject,
    handle: 'se' | 'sw' | 'ne' | 'nw'
  ) => {
    e.stopPropagation();
    const world = screenToWorld(e.clientX, e.clientY);
    const resizeAction: DragMode = {
      type: 'RESIZE_OBJECT',
      objectId: obj.id,
      handle,
      startWorldX: world.x,
      startWorldY: world.y,
      origX: obj.x,
      origY: obj.y,
      origW: obj.width,
      origH: obj.height,
    };
    dragRef.current = resizeAction;
    setDragMode(resizeAction);
  };

  // Room Vertex Edit Handle
  const handleVertexMouseDown = (
    e: React.MouseEvent,
    roomId: string,
    vertexIndex: number
  ) => {
    e.stopPropagation();
    const world = screenToWorld(e.clientX, e.clientY);
    const orig = editingVertices?.[vertexIndex] || world;
    const moveVertexAction: DragMode = {
      type: 'MOVE_VERTEX',
      roomId,
      vertexIndex,
      startWorldX: world.x,
      startWorldY: world.y,
      origVertexX: orig.x,
      origVertexY: orig.y,
    };
    dragRef.current = moveVertexAction;
    setDragMode(moveVertexAction);
  };

  // Helper: Format points string for SVG polygon
  const formatPolygonPoints = (pts: PolygonPoint[]): string => {
    return pts.map((p) => `${p.x},${p.y}`).join(' ');
  };

  // Helper: Centroid for room labels
  const getPolygonCentroid = (pts: PolygonPoint[]): { x: number; y: number } => {
    if (!pts || pts.length === 0) return { x: 0, y: 0 };
    let sumX = 0;
    let sumY = 0;
    pts.forEach((p) => {
      sumX += p.x;
      sumY += p.y;
    });
    return { x: sumX / pts.length, y: sumY / pts.length };
  };

  const objects = floorPlan.objects || [];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#181F38] overflow-hidden select-none"
      style={{
        touchAction: 'none',
        overscrollBehavior: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1.2px, transparent 1.2px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* PREVIEW MONITORING DEMO BANNER */}
      {isPreviewMonitoring && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-purple-600 text-white shadow-xl shadow-purple-900/40 border border-purple-400/30">
            <Sparkles className="w-4 h-4 fill-white animate-pulse" />
            <span className="text-xs font-black tracking-wider uppercase font-mono">
              [SIMULATION / DEMO] Mode Preview Monitoring
            </span>
            <span className="text-[11px] text-purple-200 pl-1 border-l border-purple-400/40">
              Klik ikon perangkat untuk mencoba kontrol interaktif
            </span>
          </div>
        </div>
      )}

      {/* CAD INTERACTION FLOATING HUDS */}
      {toolMode === 'draw-room' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-purple-500/40 shadow-xl text-xs text-white animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-1.5 font-bold text-purple-300 border-r border-slate-700/80 pr-3">
            <PenTool className="w-4 h-4 text-purple-400" />
            <span>Menggambar Poligon Ruang</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-700 font-mono text-[11px]">
              {drawPoints.length} titik
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleUndoDrawPoint}
              disabled={drawPoints.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold disabled:opacity-40 disabled:pointer-events-none transition-colors border border-slate-700"
              title="Hapus titik terakhir (Backspace / Delete / Klik Kanan)"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Hapus Titik</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400">⌫</kbd>
            </button>

            <button
              type="button"
              onClick={handleCancelDrawRoom}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 text-slate-300 font-semibold transition-colors border border-slate-700 hover:border-rose-800"
              title="Batalkan penggambaran (Escape)"
            >
              <X className="w-3.5 h-3.5" />
              <span>Batal</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400">Esc</kbd>
            </button>

            <button
              type="button"
              onClick={handleCompleteDrawRoom}
              disabled={drawPoints.length < 3}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-xs"
              title="Selesaikan poligon ruangan (Enter / Klik dekat titik awal)"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Selesai</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-purple-800 text-white text-[10px] font-mono">↵</kbd>
            </button>
          </div>
        </div>
      )}

      {toolMode === 'edit-room' && selectedRoomId && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-purple-500/40 shadow-xl text-xs text-white animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-1.5 font-bold text-purple-300">
            <Edit3 className="w-4 h-4 text-purple-400" />
            <span>Mode Edit Sudut Ruangan</span>
            <span className="text-[11px] font-normal text-slate-400">
              (Tarik titik untuk geser • Klik kanan titik untuk menghapus)
            </span>
          </div>
          <button
            type="button"
            onClick={() => { if (onExitToolMode) onExitToolMode(); }}
            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Selesai Edit</span>
          </button>
        </div>
      )}

      {toolMode === 'calibrate' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 shadow-xl text-xs text-white animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-1.5 font-bold text-cyan-300">
            <Ruler className="w-4 h-4 text-cyan-400" />
            <span>
              {calibPoint1 ? 'Klik Titik B untuk mengukur jarak acuan' : 'Klik Titik A pada garis acuan denah'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setCalibPoint1(null);
              setCalibCursor(null);
              if (onExitToolMode) onExitToolMode();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 text-slate-300 font-semibold transition-colors border border-slate-700"
          >
            <X className="w-3.5 h-3.5" />
            <span>Batal</span>
          </button>
        </div>
      )}

      {/* SVG Canvas Viewport */}
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className={`w-full h-full transition-colors ${
          toolMode === 'draw-room' || toolMode === 'calibrate'
            ? 'cursor-crosshair'
            : toolMode === 'place-device'
            ? 'cursor-copy'
            : toolMode === 'edit-room'
            ? 'cursor-default'
            : isPreviewMonitoring
            ? 'cursor-default'
            : 'cursor-grab active:cursor-grabbing'
        }`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onContextMenu={handleCanvasContextMenu}
      >
        <defs>
          {/* Dynamic Metric Grid Patterns (Phase 10 CAD) */}
          {floorPlan.pixelsPerMeter && floorPlan.pixelsPerMeter > 0 ? (
            <>
              <pattern
                id="grid-pattern-metric-1m"
                width={floorPlan.pixelsPerMeter}
                height={floorPlan.pixelsPerMeter}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${floorPlan.pixelsPerMeter} 0 L 0 0 0 ${floorPlan.pixelsPerMeter}`}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                />
              </pattern>
              <pattern
                id="grid-pattern-metric-5m"
                width={floorPlan.pixelsPerMeter * 5}
                height={floorPlan.pixelsPerMeter * 5}
                patternUnits="userSpaceOnUse"
              >
                <rect
                  width={floorPlan.pixelsPerMeter * 5}
                  height={floorPlan.pixelsPerMeter * 5}
                  fill="url(#grid-pattern-metric-1m)"
                />
                <path
                  d={`M ${floorPlan.pixelsPerMeter * 5} 0 L 0 0 0 ${floorPlan.pixelsPerMeter * 5}`}
                  fill="none"
                  stroke="rgba(168, 85, 247, 0.28)"
                  strokeWidth="1.5"
                />
              </pattern>
            </>
          ) : (
            <>
              <pattern id="grid-pattern-small" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
              </pattern>
              <pattern id="grid-pattern-large" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#grid-pattern-small)" />
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" />
              </pattern>
            </>
          )}

          {/* Master IoT Ambient Glow Gradients */}
          <DeviceAmbientGlowDefs />
        </defs>

        {/* 1. Background Grid */}
        {showGrid && (
          <rect
            x={viewBox.x - 2000}
            y={viewBox.y - 2000}
            width={viewBox.w + 4000}
            height={viewBox.h + 4000}
            fill={
              floorPlan.pixelsPerMeter && floorPlan.pixelsPerMeter > 0
                ? 'url(#grid-pattern-metric-5m)'
                : 'url(#grid-pattern-large)'
            }
            pointerEvents="none"
          />
        )}

        {/* 2. Uploaded Floor Plan Image */}
        {floorPlan.imagePath && floorPlan.isBackgroundVisible && !imageError && backgroundImageUrl && (
          <g>
            <image
              href={backgroundImageUrl}
              x="0"
              y="0"
              width={floorPlan.imageWidth || 1600}
              height={floorPlan.imageHeight || 1000}
              opacity={floorPlan.backgroundOpacity ?? 1}
              preserveAspectRatio="none"
              onError={() => setImageError(true)}
              onLoad={() => setImageLoaded(true)}
            />
          </g>
        )}

        {/* 3. Room Polygons Layer (Hidden by default to prevent user distraction) */}
        {showRoomPolygons && (
          <g id="room-polygons-layer">
            {rooms
              .filter((r) => r.isActive && !hiddenRoomIds.has(r.id))
              .map((room) => {
                if (!room.polygonCoordinates || room.polygonCoordinates.length < 3) return null;

                const isSelected = room.id === selectedRoomId;
                const isHovered = room.id === hoveredRoomId;
                const pts =
                  isSelected && editingVertices ? editingVertices : room.polygonCoordinates;
                const ptsStr = formatPolygonPoints(pts);
                const centroid = getPolygonCentroid(pts);
                const roomColor = room.color || '#3B82F6';

                return (
                  <g
                    key={room.id}
                    onMouseEnter={() => setHoveredRoomId(room.id)}
                    onMouseLeave={() => setHoveredRoomId(null)}
                    onClick={(e) => {
                      if (isPreviewMonitoring) return;
                      e.stopPropagation();
                      if (onSelectRoom) onSelectRoom(room.id);
                      onSelectObject(null);
                      if (onSelectDevice) onSelectDevice(null);
                    }}
                    className={!isPreviewMonitoring ? 'cursor-pointer' : undefined}
                  >
                    <polygon
                      points={ptsStr}
                      fill={roomColor}
                      fillOpacity={isSelected ? 0.28 : isHovered ? 0.2 : 0.12}
                      stroke={roomColor}
                      strokeWidth={isSelected ? 3 : 1.5}
                      strokeDasharray={isSelected ? '6 4' : undefined}
                    />

                    {/* Room Label */}
                    <g transform={`translate(${centroid.x}, ${centroid.y})`} pointerEvents="none">
                      <rect
                        x="-50"
                        y="-12"
                        width="100"
                        height="24"
                        rx="12"
                        fill="rgba(15, 23, 42, 0.75)"
                        stroke={roomColor}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {room.name}
                      </text>
                    </g>
                  </g>
                );
              })}
          </g>
        )}

        {/* 4. Floor Plan Furniture Objects Layer */}
        <g id="objects-layer">
          {objects.map((obj) => {
            const isSelected = obj.id === selectedObjectId;
            const centerX = obj.width / 2;
            const centerY = obj.height / 2;

            return (
              <g
                key={obj.id}
                transform={`translate(${obj.x}, ${obj.y}) rotate(${obj.rotation}, ${centerX}, ${centerY})`}
                onMouseDown={(e) => handleObjectMouseDown(e, obj)}
                className={!isPreviewMonitoring ? 'cursor-move group' : undefined}
              >
                {obj.catalogObject?.svgContent ? (
                  <svg
                    width={obj.width}
                    height={obj.height}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeSvgInner(obj.catalogObject.svgContent),
                    }}
                  />
                ) : (
                  <rect
                    x="0"
                    y="0"
                    width={obj.width}
                    height={obj.height}
                    rx="6"
                    fill="#CBD5E1"
                    stroke="#475569"
                    strokeWidth="2"
                  />
                )}

                {/* Name Label */}
                <text
                  x={centerX}
                  y={obj.height + 14}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#94A3B8"
                  fontWeight="600"
                  className="select-none pointer-events-none"
                >
                  {obj.name}
                </text>

                {/* Selection Bounding Box & Handles */}
                {isSelected && !isPreviewMonitoring && (
                  <g>
                    <rect
                      x="-2"
                      y="-2"
                      width={obj.width + 4}
                      height={obj.height + 4}
                      rx="4"
                      fill="rgba(139, 92, 246, 0.12)"
                      stroke="#8B5CF6"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                      pointerEvents="none"
                    />

                    {/* Rotation Stalk */}
                    <line
                      x1={centerX}
                      y1="0"
                      x2={centerX}
                      y2="-22"
                      stroke="#8B5CF6"
                      strokeWidth="2"
                      strokeDasharray="2 2"
                      pointerEvents="none"
                    />
                    <circle
                      cx={centerX}
                      cy="-22"
                      r="6"
                      fill="#8B5CF6"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      onMouseDown={(e) => handleRotateHandleMouseDown(e, obj)}
                      style={{ cursor: 'grab' }}
                    />

                    {/* Resize Handles */}
                    {(['se', 'sw', 'ne', 'nw'] as const).map((handle) => {
                      const hx = handle.includes('e') ? obj.width : 0;
                      const hy = handle.includes('s') ? obj.height : 0;
                      return (
                        <circle
                          key={handle}
                          cx={hx}
                          cy={hy}
                          r="5"
                          fill="#8B5CF6"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                          onMouseDown={(e) => handleResizeHandleMouseDown(e, obj, handle)}
                          className="cursor-nwse-resize"
                        />
                      );
                    })}
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* 5. IOT DEVICES LAYER (Interactive Monitoring & Placement Markers) */}
        <g id="iot-devices-layer">
          {devices.map((dev) => {
            const isSelected = dev.id === selectedDeviceId;
            const theme = getDeviceVisualTheme(dev);

            // Visual sizing: iconWidth / iconHeight or fallback to 48px
            const size = dev.iconWidth || 48;
            const R = size / 2; // Outer radius
            const hitRadius = Math.max(24, R + 8); // Minimum 48px hit diameter

            return (
              <g
                key={dev.id}
                transform={`translate(${dev.x}, ${dev.y})`}
                className="select-none"
              >
                {/* 1. AMBIENT ILLUMINATION HALO ON FLOOR PLAN (Only for illuminated/active devices) */}
                {theme.hasAmbientHalo && (
                  <circle
                    cx="0"
                    cy="0"
                    r={R * theme.haloRadiusFactor}
                    fill={getDeviceHaloGradientUrl(theme)}
                    pointerEvents="none"
                  />
                )}

                {/* INVISIBLE EXPANDED HIT AREA (Ensures effortless 100% reliable mouse clicks & drags) */}
                <circle
                  cx="0"
                  cy="0"
                  r={hitRadius}
                  fill="transparent"
                  pointerEvents="all"
                  className={isPreviewMonitoring ? 'cursor-pointer' : 'cursor-move'}
                  onMouseDown={(e) => handleDeviceMouseDown(e, dev)}
                />

                {/* Outer Selection Highlight Outline */}
                {isSelected && !isPreviewMonitoring && (
                  <rect
                    x={-R - 6}
                    y={-R - 6}
                    width={size + 12}
                    height={size + 12}
                    rx={R + 6}
                    fill="rgba(139, 92, 246, 0.14)"
                    stroke="#8B5CF6"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    pointerEvents="none"
                  />
                )}

                {/* VISUAL PIN CONTAINER (Nyala 1.0 vs Redup 0.45) */}
                <g opacity={theme.pinOpacity ?? (theme.isActive ? 1.0 : 0.45)} pointerEvents="none">
                  {/* Status Indicator Glow Ring */}
                  <circle
                    cx="0"
                    cy="0"
                    r={R + 3.5}
                    fill="none"
                    stroke={theme.ringColor}
                    strokeWidth={theme.isActive ? 2.8 : 1.5}
                    opacity={theme.isActive ? 0.95 : 0.4}
                  />

                  {/* Device Pin Base Circle with State-Aware Theme Color */}
                  <circle
                    cx="0"
                    cy="0"
                    r={R}
                    fill={theme.pinBgColor}
                    stroke={theme.pinBorderColor}
                    strokeWidth="2"
                  />

                  {/* Scalable Vector Icon (Centered & Proportionate to size) */}
                  <svg
                    x={-R * 0.55}
                    y={-R * 0.55}
                    width={R * 1.1}
                    height={R * 1.1}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={theme.strokeColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <DeviceSvgIcon type={dev.type} theme={theme} />
                  </svg>
                </g>

                {/* Device Name & Status Tag Below Marker */}
                <g transform={`translate(0, ${R + 10})`} pointerEvents="none">
                  {/* Name pill background */}
                  <rect
                    x="-60"
                    y="0"
                    width="120"
                    height="19"
                    rx="9.5"
                    fill="rgba(15, 23, 42, 0.92)"
                    stroke={theme.isActive ? `${theme.primaryColor}55` : 'rgba(255, 255, 255, 0.15)'}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="13"
                    textAnchor="middle"
                    fill="#F8FAFC"
                    fontSize="9.5"
                    fontWeight="bold"
                    className="select-none"
                  >
                    {dev.name.length > 15 ? `${dev.name.slice(0, 14)}…` : dev.name}
                  </text>

                  {/* Status Indicator Pill with vibrant state color */}
                  <g transform="translate(0, 22)">
                    <rect
                      x="-50"
                      y="0"
                      width="100"
                      height="17"
                      rx="8.5"
                      fill={theme.pinBgColor}
                      stroke={theme.primaryColor}
                      strokeWidth={theme.isActive ? 1.5 : 1}
                      opacity={theme.isActive ? 1.0 : 0.8}
                    />
                    {/* Status dot */}
                    <circle cx="-36" cy="8.5" r="3" fill={theme.primaryColor} />
                    <text
                      x="4"
                      y="12"
                      textAnchor="middle"
                      fill={theme.primaryColor}
                      fontSize="8.5"
                      fontWeight="bold"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      className="select-none"
                    >
                      {theme.statusText}
                    </text>
                  </g>
                </g>

                {/* RESIZE HANDLES (Visible ONLY when selected in Configuration Mode) */}
                {isSelected && !isPreviewMonitoring && (
                  <g id={`resize-handles-${dev.id}`}>
                    {/* Corner: Bottom-Right (SE) */}
                    <circle
                      cx={R + 6}
                      cy={R + 6}
                      r="6"
                      fill="#8B5CF6"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      onMouseDown={(e) => handleDeviceResizeHandleMouseDown(e, dev, 'se')}
                      className="cursor-nwse-resize hover:scale-125 transition-transform"
                    >
                      <title>Tarik untuk mengubah ukuran ikon</title>
                    </circle>

                    {/* Corner: Bottom-Left (SW) */}
                    <circle
                      cx={-R - 6}
                      cy={R + 6}
                      r="6"
                      fill="#8B5CF6"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      onMouseDown={(e) => handleDeviceResizeHandleMouseDown(e, dev, 'sw')}
                      className="cursor-nesw-resize hover:scale-125 transition-transform"
                    >
                      <title>Tarik untuk mengubah ukuran ikon</title>
                    </circle>

                    {/* Corner: Top-Right (NE) */}
                    <circle
                      cx={R + 6}
                      cy={-R - 6}
                      r="6"
                      fill="#8B5CF6"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      onMouseDown={(e) => handleDeviceResizeHandleMouseDown(e, dev, 'ne')}
                      className="cursor-nesw-resize hover:scale-125 transition-transform"
                    >
                      <title>Tarik untuk mengubah ukuran ikon</title>
                    </circle>

                    {/* Corner: Top-Left (NW) */}
                    <circle
                      cx={-R - 6}
                      cy={-R - 6}
                      r="6"
                      fill="#8B5CF6"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      onMouseDown={(e) => handleDeviceResizeHandleMouseDown(e, dev, 'nw')}
                      className="cursor-nwse-resize hover:scale-125 transition-transform"
                    >
                      <title>Tarik untuk mengubah ukuran ikon</title>
                    </circle>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* 6. Room Polygon Vertex Edit Handles */}
        {toolMode === 'edit-room' && editingVertices && selectedRoomId && (
          <g id="room-polygon-edit-handles">
            {editingVertices.map((vertex, idx) => {
              const isBeingDragged =
                dragMode.type === 'MOVE_VERTEX' &&
                dragMode.vertexIndex === idx;

              return (
                <g key={`vertex-handle-${idx}`} className="cursor-move">
                  {/* Invisible enlarged hit area for effortless, jitter-free grabbing & right-click deletion */}
                  <circle
                    cx={vertex.x}
                    cy={vertex.y}
                    r="14"
                    fill="transparent"
                    onMouseDown={(e) => handleVertexMouseDown(e, selectedRoomId, idx)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!editingVertices || !selectedRoomId) return;
                      if (editingVertices.length <= 3) {
                        alert('Poligon ruangan memerlukan minimal 3 titik sudut.');
                        return;
                      }
                      const nextVertices = editingVertices.filter((_, i) => i !== idx);
                      setEditingVertices(nextVertices);
                      if (onUpdateRoomPolygonRef.current) {
                        onUpdateRoomPolygonRef.current(selectedRoomId, nextVertices);
                      }
                    }}
                  >
                    <title>Geser untuk memindahkan • Klik kanan untuk menghapus titik sudut</title>
                  </circle>
                  {/* Visible stable vertex marker (no CSS scale transitions to eliminate jitter) */}
                  <circle
                    cx={vertex.x}
                    cy={vertex.y}
                    r={isBeingDragged ? 7 : 5.5}
                    fill={isBeingDragged ? '#A855F7' : '#8B5CF6'}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    pointerEvents="none"
                  />
                  {/* Inner center dot for CAD precision */}
                  <circle
                    cx={vertex.x}
                    cy={vertex.y}
                    r="1.5"
                    fill="#FFFFFF"
                    pointerEvents="none"
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* 7. Draw Room Polygon Preview Line & Reticle */}
        {toolMode === 'draw-room' && (
          <g id="draw-room-preview">
            {drawPoints.length > 0 && (
              <polyline
                points={formatPolygonPoints(drawPoints)}
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            )}
            {drawPoints.length > 0 && drawCursor && (
              <>
                <line
                  x1={drawPoints[drawPoints.length - 1].x}
                  y1={drawPoints[drawPoints.length - 1].y}
                  x2={drawCursor.x}
                  y2={drawCursor.y}
                  stroke="#8B5CF6"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                {drawPoints.length >= 2 && (
                  <line
                    x1={drawCursor.x}
                    y1={drawCursor.y}
                    x2={drawPoints[0].x}
                    y2={drawPoints[0].y}
                    stroke="rgba(16, 185, 129, 0.45)"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />
                )}
              </>
            )}
            {/* Draw Room Placed Points */}
            {drawPoints.map((pt, idx) => (
              <circle
                key={`draw-pt-${idx}`}
                cx={pt.x}
                cy={pt.y}
                r={idx === 0 ? '7' : '4'}
                fill={idx === 0 ? '#10B981' : '#8B5CF6'}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            ))}
            {/* Real-time Sub-pixel Precision Reticle at Cursor (+) */}
            {drawCursor && (
              <g pointerEvents="none" opacity="0.9">
                <line
                  x1={drawCursor.x - 12}
                  y1={drawCursor.y}
                  x2={drawCursor.x + 12}
                  y2={drawCursor.y}
                  stroke="#8B5CF6"
                  strokeWidth="1.5"
                />
                <line
                  x1={drawCursor.x}
                  y1={drawCursor.y - 12}
                  x2={drawCursor.x}
                  y2={drawCursor.y + 12}
                  stroke="#8B5CF6"
                  strokeWidth="1.5"
                />
                <circle
                  cx={drawCursor.x}
                  cy={drawCursor.y}
                  r="3.5"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="1.5"
                />
              </g>
            )}
          </g>
        )}

        {/* 8. Active Scale Calibration Line & Reticle (Phase 10) */}
        {toolMode === 'calibrate' && (
          <g id="calibrate-active-line">
            {calibPoint1 && calibCursor && (
              <>
                <line
                  x1={calibPoint1.x}
                  y1={calibPoint1.y}
                  x2={calibCursor.x}
                  y2={calibCursor.y}
                  stroke="#06B6D4"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                />
                {(() => {
                  const distPx = Math.hypot(calibCursor.x - calibPoint1.x, calibCursor.y - calibPoint1.y);
                  const midX = (calibPoint1.x + calibCursor.x) / 2;
                  const midY = (calibPoint1.y + calibCursor.y) / 2;
                  return (
                    <g transform={`translate(${midX}, ${midY - 14})`} pointerEvents="none">
                      <rect
                        x="-44"
                        y="-12"
                        width="88"
                        height="20"
                        rx="6"
                        fill="#0F172A"
                        stroke="#06B6D4"
                        strokeWidth="1.5"
                      />
                      <text
                        x="0"
                        y="2"
                        textAnchor="middle"
                        fill="#38BDF8"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {Math.round(distPx)} px
                      </text>
                    </g>
                  );
                })()}
              </>
            )}
            {/* Point 1 Marker */}
            {calibPoint1 && (
              <g pointerEvents="none">
                <circle cx={calibPoint1.x} cy={calibPoint1.y} r="8" fill="#06B6D4" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx={calibPoint1.x} cy={calibPoint1.y} r="3" fill="#FFFFFF" />
              </g>
            )}
            {/* Real-time Calibration Reticle (+) */}
            {calibCursor && (
              <g pointerEvents="none" opacity="0.95">
                <line
                  x1={calibCursor.x - 14}
                  y1={calibCursor.y}
                  x2={calibCursor.x + 14}
                  y2={calibCursor.y}
                  stroke="#06B6D4"
                  strokeWidth="1.5"
                />
                <line
                  x1={calibCursor.x}
                  y1={calibCursor.y - 14}
                  x2={calibCursor.x}
                  y2={calibCursor.y + 14}
                  stroke="#06B6D4"
                  strokeWidth="1.5"
                />
                <circle
                  cx={calibCursor.x}
                  cy={calibCursor.y}
                  r="4"
                  fill="none"
                  stroke="#06B6D4"
                  strokeWidth="1.5"
                />
                <circle
                  cx={calibCursor.x}
                  cy={calibCursor.y}
                  r="1.5"
                  fill="#06B6D4"
                />
              </g>
            )}
          </g>
        )}

        {/* 9. Persistent Scale Calibration Reference Dimension (Phase 10) */}
        {floorPlan.isCalibrated && floorPlan.calibrationPoints && (
          <g id="calibrate-reference-dimension" opacity="0.85">
            {(() => {
              const p1 = floorPlan.calibrationPoints.point1;
              const p2 = floorPlan.calibrationPoints.point2;
              const distM = floorPlan.calibrationPoints.distanceMeters;
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;
              return (
                <g>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  {/* Endpoint markers */}
                  <circle cx={p1.x} cy={p1.y} r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
                  <circle cx={p2.x} cy={p2.y} r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
                  {/* Dimension pill */}
                  <g transform={`translate(${midX}, ${midY - 14})`}>
                    <rect
                      x="-65"
                      y="-11"
                      width="130"
                      height="20"
                      rx="6"
                      fill="rgba(15, 23, 42, 0.9)"
                      stroke="#10B981"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      fill="#A7F3D0"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {distM} m ({floorPlan.pixelsPerMeter?.toFixed(1)} px/m)
                    </text>
                  </g>
                </g>
              );
            })()}
          </g>
        )}
      </svg>

      {/* Floating Guidance HUD Banner for CAD Tools */}
      {toolMode === 'calibrate' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-cyan-700 text-white shadow-xl shadow-cyan-950/40 border border-cyan-400/30">
            <Ruler className="w-4 h-4 text-cyan-200" />
            <span className="text-xs font-bold font-mono">
              {!calibPoint1
                ? 'KLIK TITIK AWAL (TITIK A) PADA DENAH SEBAGAI ACUAN JARAK'
                : 'KLIK TITIK KEDUA (TITIK B) UNTUK MENENTUKAN PANJANG ACUAN'}
            </span>
            {onExitToolMode && (
              <button
                type="button"
                onClick={onExitToolMode}
                className="pointer-events-auto ml-2 px-2.5 py-1 rounded-lg bg-black/25 hover:bg-black/40 text-[11px] font-bold"
              >
                Batal
              </button>
            )}
          </div>
        </div>
      )}

      {toolMode === 'draw-room' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-purple-700 text-white shadow-xl shadow-purple-950/40 border border-purple-400/30">
            <PenTool className="w-4 h-4 text-purple-200" />
            <span className="text-xs font-bold font-mono">
              {drawPoints.length === 0
                ? 'KLIK TITIK-TITIK SUDUT RUANGAN PADA DENAH'
                : `TITIK TERPILIH: ${drawPoints.length}. KLIK TITIK AWAL HIJAU UNTUK MENUTUP POLIGON.`}
            </span>
            {drawPoints.length >= 3 && floorPlan.pixelsPerMeter && (
              <span className="text-xs bg-purple-900/90 px-2 py-0.5 rounded-md font-bold text-emerald-300 border border-emerald-500/30">
                ~{(computeShoelaceArea(drawPoints) / (floorPlan.pixelsPerMeter * floorPlan.pixelsPerMeter)).toFixed(1)} m²
              </span>
            )}
            {onExitToolMode && (
              <button
                type="button"
                onClick={onExitToolMode}
                className="pointer-events-auto ml-2 px-2.5 py-1 rounded-lg bg-black/25 hover:bg-black/40 text-[11px] font-bold"
              >
                Selesai / Batal
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty State Banner when no blueprint image is uploaded for this house */}
      {!floorPlan.imagePath && toolMode !== 'draw-room' && toolMode !== 'calibrate' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none select-none z-20">
          <div className="max-w-md bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-3xl p-8 shadow-2xl space-y-4 pointer-events-auto">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <Upload className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Belum Ada Denah Lantai
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Belum ada denah lantai yang diunggah. Silakan klik <strong className="text-indigo-400">'Unggah Denah'</strong> untuk memulai kalibrasi dan pemetaan ruangan.
              </p>
            </div>
            {onOpenUploadBackground && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onOpenUploadBackground}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer pointer-events-auto active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Unggah Denah Sekarang</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
