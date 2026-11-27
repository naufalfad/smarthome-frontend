import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Map,
  Layers,
  Box,
  FolderTree,
  Home,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  PenTool,
  Radio,
  Cpu,
  Send,
  Eye,
  Zap,
  ArrowLeft,
  Clock,
  Plus,
  Trash2,
  MousePointer,
  Ruler,
  RotateCw,
  RotateCcw,
  UploadCloud,
  Grid,
  Magnet,
  Undo2,
  Redo2,
  Tag,
  ExternalLink,
  Loader2,
  X,
  SlidersHorizontal,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sun,
  CloudSun,
  Bell,
  Shield,
  Activity,
  Video,
  Sliders,
  Building2,
  BarChart3,
  Moon,
  ChevronDown,
  ShoppingBag,
  Power,
  Flame,
  Thermometer,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { floorPlanApi } from '../../services/floor-plan.api';
import { roomApi } from '../../services/room.api';
import { deviceApi } from '../../services/device.api';
import { publishApi } from '../../services/publish.api';
import {
  House,
  Floor,
  FloorPlan,
  FloorPlanObject,
  ObjectCatalogItem,
  Room,
  PolygonPoint,
} from '../../types/floor-plan';
import { IoTDevice, DeviceCatalogItem } from '../../types/device';
import {
  FloorPlanToolbar,
  SaveStatus,
  ToolMode,
} from '../../components/floor-plan/FloorPlanToolbar';
import { FloorPlanCanvas } from '../../components/floor-plan/FloorPlanCanvas';
import { DeviceLibraryPanel } from '../../components/floor-plan/DeviceLibraryPanel';
import { DeviceInspectorPanel } from '../../components/floor-plan/DeviceInspectorPanel';
import { DeviceControlModal } from '../../components/floor-plan/DeviceControlModal';
import { PublishModal } from '../../components/floor-plan/PublishModal';
import { ObjectLibraryPanel } from '../../components/floor-plan/ObjectLibraryPanel';
import { ObjectInspectorPanel } from '../../components/floor-plan/ObjectInspectorPanel';
import { RoomExplorerPanel } from '../../components/floor-plan/RoomExplorerPanel';
import { RoomInspectorPanel } from '../../components/floor-plan/RoomInspectorPanel';
import { AddFloorModal } from '../../components/floor-plan/AddFloorModal';
import { UploadBackgroundModal } from '../../components/floor-plan/UploadBackgroundModal';
import { AutoRoomReferenceModal } from '../../components/floor-plan/AutoRoomReferenceModal';
import { GeneratedRoomReference } from '../../utils/room-reference-generator';
import { CalibrationModal } from '../../components/floor-plan/CalibrationModal';
import { AutomationListPanel } from '../../components/automation/AutomationListPanel';
import { useAuthenticatedBlobUrl } from '../../hooks/useAuthenticatedBlobUrl';
import { ProceduralDollhouseViewer } from '../../components/viewer/ProceduralDollhouseViewer';

export const FloorPlanWorkspacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const houseIdFromUrl = searchParams.get('houseId');
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const STORAGE_KEY_HOUSE = 'smarthome_active_house_id';
  const STORAGE_KEY_FLOOR = 'smarthome_active_floor_id';

  // Houses & Floors State
  const [houses, setHouses] = useState<House[]>([]);
  const [activeHouse, setActiveHouse] = useState<House | null>(null);
  const [activeFloor, setActiveFloor] = useState<Floor | null>(null);
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Authenticated Background Blueprint URL for Canvas & Dynamic Room Scanner
  const rawBackgroundImageUrl = useMemo(() => {
    return floorPlan?.imagePath
      ? floorPlanApi.getBackgroundImageUrl(floorPlan.id, floorPlan.updatedAt || '1')
      : null;
  }, [floorPlan?.id, floorPlan?.imagePath, floorPlan?.updatedAt]);
  const { blobUrl: backgroundImageUrl } = useAuthenticatedBlobUrl(rawBackgroundImageUrl);

  // Stable Canvas Bounds for Auto Room Reference Modal
  const stableCanvasBounds = useMemo(() => ({
    width: floorPlan?.viewBoxWidth || floorPlan?.imageWidth || 1200,
    height: floorPlan?.viewBoxHeight || floorPlan?.imageHeight || 900,
    x: floorPlan?.viewBoxX || 0,
    y: floorPlan?.viewBoxY || 0,
  }), [
    floorPlan?.viewBoxWidth,
    floorPlan?.imageWidth,
    floorPlan?.viewBoxHeight,
    floorPlan?.imageHeight,
    floorPlan?.viewBoxX,
    floorPlan?.viewBoxY,
  ]);

  // IoT Devices State (Product Direction Adjustment)
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<DeviceCatalogItem | null>(null);
  const [controlModalDevice, setControlModalDevice] = useState<IoTDevice | null>(null);

  // Publish & Preview Monitoring States
  const [publishStatus, setPublishStatus] = useState<string>('DRAFT');
  const [isPreviewMonitoring, setIsPreviewMonitoring] = useState<boolean>(false);
  const [is3dMode, setIs3dMode] = useState<boolean>(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isAutomationPanelOpen, setIsAutomationPanelOpen] = useState<boolean>(false);
  const [lastTelemetryTime, setLastTelemetryTime] = useState<Date | null>(null);
  const [isEngineRunning, setIsEngineRunning] = useState<boolean>(true);

  // Spatial Rooms State (Phase 3 - Optional)
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [hiddenRoomIds, setHiddenRoomIds] = useState<Set<string>>(new Set());
  const [spatialDetections, setSpatialDetections] = useState<Record<string, string | null>>({});

  // Studio UI States
  const [leftTab, setLeftTab] = useState<'summary' | 'devices' | 'library' | 'rooms' | 'structure'>('summary');
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState<boolean>(false);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('Overview');
  const [canvasTheme, setCanvasTheme] = useState<'light' | 'dark'>('light');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  // Derived metrics for Reference-style Hero Dashboard Cards
  const onlineDevicesCount = devices.filter((d) => d.status === 'ONLINE' || d.status === 'ON').length;
  const offlineOrAlertCount = devices.filter((d) => d.status === 'OFFLINE' || d.status === 'ERROR').length;
  const normalPercent = devices.length > 0 ? Math.round((onlineDevicesCount / devices.length) * 100) : 100;
  const alertPercent = devices.length > 0 ? Math.round((offlineOrAlertCount / devices.length) * 100) : 0;

  // 4 Categories breakdown for 2x2 grid
  const controlDevicesCount = devices.filter((d) =>
    ['SMART_LIGHT', 'SMART_DIMMER', 'SMART_AC', 'SMART_LOCK', 'SMART_SWITCH', 'SMART_PLUG', 'SMART_CURTAIN', 'LIGHT', 'SWITCH', 'LOCK', 'AC', 'FAN'].includes(d.type)
  ).length;

  const sensorDevicesCount = devices.filter((d) =>
    ['DOOR_SENSOR', 'SMOKE_DETECTOR', 'GAS_DETECTOR', 'MOTION_SENSOR', 'AIR_QUALITY_SENSOR', 'TEMPERATURE_SENSOR', 'WATER_LEAK_SENSOR', 'WATER_LEVEL_SENSOR'].includes(d.type) ||
    d.type.includes('SENSOR')
  ).length;

  const visualDevicesCount = devices.filter((d) =>
    ['OUTDOOR_CAMERA', 'INDOOR_CAMERA', 'VIDEO_DOORBELL', 'SMART_DISPLAY_HUB'].includes(d.type) ||
    d.type.includes('CAMERA')
  ).length;

  const otherOrObjectsCount = (floorPlan?.objects?.length || 0) + Math.max(0, devices.length - controlDevicesCount - sensorDevicesCount - visualDevicesCount);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [showRoomPolygons, setShowRoomPolygons] = useState<boolean>(true);
  const [labelDisplayMode, setLabelDisplayMode] = useState<'all' | 'hover' | 'compact'>('all');
  const [drawingTargetRoomId, setDrawingTargetRoomId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('SAVED');
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null);

  // Modals & Calibration Tool State (Phase 10)
  const [isAddFloorOpen, setIsAddFloorOpen] = useState<boolean>(false);
  const [isUploadBgOpen, setIsUploadBgOpen] = useState<boolean>(false);
  const [isAutoRoomRefOpen, setIsAutoRoomRefOpen] = useState<boolean>(false);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState<boolean>(false);
  const [calibrationPoint1, setCalibrationPoint1] = useState<{ x: number; y: number } | null>(null);
  const [calibrationPoint2, setCalibrationPoint2] = useState<{ x: number; y: number } | null>(null);

  // Undo / Redo History Stacks
  const [history, setHistory] = useState<FloorPlanObject[][]>([]);
  const [future, setFuture] = useState<FloorPlanObject[][]>([]);

  // Debounce ref for auto-saving mutations
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Phase 11 Quota & Handover States
  const [quota, setQuota] = useState<{
    currentDevices: number;
    maxDevices: number | null;
    isQuotaReached: boolean;
  } | null>(null);

  const refreshQuota = useCallback(async (hId: string) => {
    try {
      const q = await floorPlanApi.getHouseQuota(hId);
      setQuota(q);
    } catch (e) {
      console.warn('Failed to fetch house quota:', e);
    }
  }, []);

  // Load rooms for active floor
  const loadRooms = useCallback(async (floorId: string) => {
    try {
      const data = await roomApi.getRoomsByFloor(floorId);
      setRooms(data);
    } catch (err) {
      console.warn('Failed to load rooms:', err);
    }
  }, []);

  // Load devices for active floor plan
  const loadDevices = useCallback(async (planId: string) => {
    try {
      const devList = await deviceApi.getDevicesByFloorPlan(planId);
      setDevices(devList);
    } catch (err) {
      console.warn('Failed to load devices:', err);
    }
  }, []);

  // Background Simulation Telemetry Polling (Phase 5 & Phase 6)
  // Continuously polls active floor plan devices every 4 seconds in both Studio and Preview modes
  useEffect(() => {
    if (!floorPlan?.id) return;

    let isMounted = true;

    const pollTelemetry = async () => {
      try {
        const telemetryData = await deviceApi.getFloorPlanTelemetry(floorPlan.id);
        if (!isMounted) return;

        setIsEngineRunning(telemetryData.engine?.isRunning ?? true);
        setLastTelemetryTime(new Date());

        // Update devices state with latest telemetry and configurations
        setDevices((prevDevices) => {
          return prevDevices.map((dev) => {
            const incoming = telemetryData.devices.find((d) => d.id === dev.id);
            if (!incoming) return dev;
            return {
              ...dev,
              status: incoming.status,
              integrationStatus: incoming.integrationStatus,
              configuration: incoming.configuration ?? dev.configuration,
              updatedAt: incoming.updatedAt,
            };
          });
        });

        // Also update controlModalDevice if currently open
        setControlModalDevice((currentModalDev) => {
          if (!currentModalDev) return null;
          const incoming = telemetryData.devices.find((d) => d.id === currentModalDev.id);
          if (!incoming) return currentModalDev;
          return {
            ...currentModalDev,
            status: incoming.status,
            integrationStatus: incoming.integrationStatus,
            configuration: incoming.configuration ?? currentModalDev.configuration,
            updatedAt: incoming.updatedAt,
          };
        });
      } catch (pollErr) {
        console.warn('Telemetry polling notice:', pollErr);
      }
    };

    pollTelemetry();
    const interval = setInterval(pollTelemetry, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [floorPlan?.id]);

  // Refresh publish status
  const refreshPublishStatus = useCallback(async (houseId: string) => {
    try {
      const statusRes = await publishApi.getPublishStatus(houseId);
      setPublishStatus(statusRes.publishStatus || 'DRAFT');
    } catch (err) {
      console.warn('Failed to fetch publish status:', err);
    }
  }, []);

  // Run spatial room detection
  const refreshSpatialDetections = useCallback(async (planId: string) => {
    try {
      const res = await roomApi.detectSpatialRooms(planId);
      const map: Record<string, string | null> = {};
      res.detections.forEach((d) => {
        map[d.objectId] = d.detectedRoomId;
      });
      setSpatialDetections(map);
    } catch (err) {
      console.warn('Spatial detection failed:', err);
    }
  }, []);

  // 1. Initial Load: Fetch Houses, active Floor, Plan, Rooms, and Devices
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let targetHouse: House | null = null;
      let houseList: House[] = [];

      // 1. If explicit houseId is in URL, fetch that exact House (Strict Isolation)
      if (houseIdFromUrl && houseIdFromUrl.trim()) {
        try {
          targetHouse = await floorPlanApi.getHouseById(houseIdFromUrl.trim());
        } catch (err: any) {
          setError(
            err?.message ||
              'Akses dilarang: Properti tidak ditemukan atau Anda tidak memiliki penugasan aktif pada properti ini.'
          );
          setIsLoading(false);
          return;
        }
      }

      // 2. Fetch accessible houses list (for switching in toolbar)
      try {
        houseList = await floorPlanApi.getHouses();
      } catch (err) {
        console.warn('Failed to fetch house list:', err);
      }

      // If targetHouse was fetched by ID, ensure it is present in the houses list
      if (targetHouse) {
        if (!houseList.some((h) => h.id === targetHouse!.id)) {
          houseList = [targetHouse, ...houseList];
        }
      } else if (houseList.length > 0) {
        // If NO houseId was specified in URL:
        // Use savedHouseId from localStorage if it exists in accessible houseList, otherwise first accessible house
        const savedHouseId = localStorage.getItem(STORAGE_KEY_HOUSE);
        targetHouse =
          (savedHouseId && houseList.find((h) => h.id === savedHouseId)) || houseList[0];

        // Sync URL param cleanly without reload
        if (targetHouse) {
          setSearchParams({ houseId: targetHouse.id }, { replace: true });
        }
      }

      setHouses(houseList);
      setActiveHouse(targetHouse);

      if (targetHouse) {
        localStorage.setItem(STORAGE_KEY_HOUSE, targetHouse.id);
        setPublishStatus((targetHouse as any).publishStatus || 'DRAFT');

        if (targetHouse.floors && targetHouse.floors.length > 0) {
          const savedFloorId = localStorage.getItem(STORAGE_KEY_FLOOR);
          const targetFloor =
            (savedFloorId && targetHouse.floors.find((f) => f.id === savedFloorId)) ||
            targetHouse.floors[0];

          setActiveFloor(targetFloor);
          localStorage.setItem(STORAGE_KEY_FLOOR, targetFloor.id);

          const plan = await floorPlanApi.getPlanByFloor(targetFloor.id);
          setFloorPlan(plan);
          setHistory([plan.objects || []]);
          await loadRooms(targetFloor.id);
          await loadDevices(plan.id);
          refreshPublishStatus(targetHouse.id);
          refreshQuota(targetHouse.id);
          refreshSpatialDetections(plan.id);
        } else {
          setActiveFloor(null);
          setFloorPlan(null);
          setRooms([]);
          setDevices([]);
        }
      } else {
        setActiveFloor(null);
        setFloorPlan(null);
        setRooms([]);
        setDevices([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat denah rumah.');
    } finally {
      setIsLoading(false);
    }
  }, [houseIdFromUrl, loadRooms, loadDevices, refreshPublishStatus, refreshSpatialDetections, setSearchParams]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Switch House
  const handleSelectHouse = async (houseId: string) => {
    const found = houses.find((h) => h.id === houseId);
    if (!found) return;
    setActiveHouse(found);
    localStorage.setItem(STORAGE_KEY_HOUSE, found.id);
    setSearchParams({ houseId: found.id }, { replace: true });
    setPublishStatus((found as any).publishStatus || 'DRAFT');
    if (found.floors && found.floors.length > 0) {
      handleSelectFloor(found.floors[0].id);
    } else {
      setActiveFloor(null);
      setFloorPlan(null);
      setRooms([]);
      setDevices([]);
    }
    refreshPublishStatus(found.id);
  };

  // 3. Switch Floor
  const handleSelectFloor = async (floorId: string) => {
    if (!activeHouse) return;
    const floor = activeHouse.floors.find((f) => f.id === floorId);
    if (!floor) return;

    try {
      setIsLoading(true);
      setActiveFloor(floor);
      localStorage.setItem(STORAGE_KEY_FLOOR, floor.id);
      setSelectedObjectId(null);
      setSelectedRoomId(null);
      setSelectedDeviceId(null);
      setToolMode('select');

      const plan = await floorPlanApi.getPlanByFloor(floor.id);
      setFloorPlan(plan);
      setHistory([plan.objects || []]);
      setFuture([]);
      await loadRooms(floor.id);
      await loadDevices(plan.id);
      refreshSpatialDetections(plan.id);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat denah lantai.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Add New Floor
  const handleAddFloor = async (name: string, levelNumber?: number) => {
    if (!activeHouse) return;
    try {
      const newFloor = await floorPlanApi.addFloor(activeHouse.id, { name, levelNumber });
      setActiveHouse((prev) =>
        prev
          ? {
              ...prev,
              floors: [...prev.floors, newFloor],
            }
          : prev
      );
      setHouses((prev) =>
        prev.map((h) =>
          h.id === activeHouse.id ? { ...h, floors: [...h.floors, newFloor] } : h
        )
      );
      handleSelectFloor(newFloor.id);
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan lantai baru');
    }
  };

  // 5. Upload Background Image
  const handleUploadBackground = async (file: File) => {
    if (!floorPlan) return;
    setSaveStatus('SAVING');
    try {
      const updated = await floorPlanApi.uploadBackground(floorPlan.id, file);
      setFloorPlan((prev) => (prev ? { ...prev, ...updated } : updated));
      setSaveStatus('SAVED');
      if (activeHouse) {
        refreshPublishStatus(activeHouse.id);
        refreshQuota(activeHouse.id);
      }
      if (rooms.length === 0) {
        setTimeout(() => setIsAutoRoomRefOpen(true), 400);
      }
    } catch (err) {
      setSaveStatus('ERROR');
      throw err;
    }
  };

  // 6. Delete Background Image
  const handleDeleteBackground = async () => {
    if (!floorPlan) return;
    setSaveStatus('SAVING');
    try {
      const updated = await floorPlanApi.deleteBackground(floorPlan.id);
      setFloorPlan((prev) => (prev ? { ...prev, ...updated, imagePath: null, imageWidth: null, imageHeight: null } : updated));
      setSaveStatus('SAVED');
      if (activeHouse) {
        refreshPublishStatus(activeHouse.id);
        refreshQuota(activeHouse.id);
      }
      if (rooms.length === 0) {
        setTimeout(() => setIsAutoRoomRefOpen(true), 400);
      }
    } catch (err) {
      setSaveStatus('ERROR');
      alert('Gagal menghapus gambar denah');
    }
  };

  // 6a. Delete Background Image with confirmation from toolbar
  const handleToolbarDeleteBackground = async () => {
    if (!floorPlan?.imagePath) return;
    if (
      !window.confirm(
        'Apakah Anda yakin ingin menghapus gambar denah pada lantai ini? Objek furnitur & perangkat IoT tetap aman pada posisinya.'
      )
    ) {
      return;
    }
    await handleDeleteBackground();
  };

  // 6b. Delete Active Floor
  const handleDeleteActiveFloor = async () => {
    if (!activeHouse || !activeFloor) return;
    if (activeHouse.floors.length <= 1) {
      alert('Rumah minimal harus memiliki 1 lantai. Tidak dapat menghapus lantai terakhir.');
      return;
    }

    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus "${activeFloor.name}"? Seluruh denah, ruangan, dan perangkat IoT pada lantai ini akan dihapus secara permanen.`
    );
    if (!confirmDelete) return;

    setSaveStatus('SAVING');
    try {
      const updatedHouse = await floorPlanApi.deleteFloor(activeHouse.id, activeFloor.id);
      setActiveHouse(updatedHouse);
      setHouses((prev) =>
        prev.map((h) => (h.id === updatedHouse.id ? updatedHouse : h))
      );

      // Switch to first remaining floor
      const nextFloor = updatedHouse.floors[0];
      if (nextFloor) {
        handleSelectFloor(nextFloor.id);
      }
      setSaveStatus('SAVED');
    } catch (err: any) {
      setSaveStatus('ERROR');
      alert(err.message || 'Gagal menghapus lantai');
    }
  };

  // 7. Update Floor Plan Config
  const handleUpdatePlanConfig = async (data: Partial<FloorPlan>) => {
    if (!floorPlan) return;
    setFloorPlan((prev) => (prev ? { ...prev, ...data } : null));

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus('SAVING');
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const updated = await floorPlanApi.updatePlanConfig(floorPlan.id, data);
        setFloorPlan((prev) => (prev ? { ...prev, ...updated } : updated));
        setSaveStatus('SAVED');
      } catch (err) {
        setSaveStatus('ERROR');
      }
    }, 600);
  };

  // =========================================================================
  // IOT DEVICE PLACEMENT & MANAGEMENT WORKFLOW
  // =========================================================================

  // Handle selecting a device catalog item for placement
  const handleSelectCatalogItem = (item: DeviceCatalogItem | null) => {
    setSelectedCatalogItem(item);
    if (item) {
      setToolMode('place-device');
      setSelectedDeviceId(null);
      setSelectedObjectId(null);
      setSelectedRoomId(null);
    } else {
      setToolMode('select');
    }
  };

  // Phase 11: Mark Property Ready for Handover
  const handleMarkReadyForHandover = async () => {
    if (!activeHouse) return;
    if (devices.length === 0) {
      alert('Minimal 1 perangkat IoT harus terpasang pada properti sebelum mengajukan serah terima.');
      return;
    }
    const ok = window.confirm(
      `Konfirmasi: Ajukan properti "${activeHouse.name}" dengan ${devices.length} perangkat IoT terpasang sebagai SIAP SERAH TERIMA (READY_FOR_HANDOVER)?`
    );
    if (!ok) return;
    try {
      await floorPlanApi.markReadyForHandover(activeHouse.id);
      alert('Properti berhasil ditandai siap serah terima (READY_FOR_HANDOVER). Super Admin dapat melakukan aktivasi final.');
      await loadInitialData();
    } catch (err: any) {
      alert(err?.message || 'Gagal menandai siap handover.');
    }
  };

  // Handle placing device on canvas click
  const handlePlaceDeviceAt = async (
    worldX: number,
    worldY: number,
    normX: number,
    normY: number
  ) => {
    if (!floorPlan || !selectedCatalogItem) return;
    setSaveStatus('SAVING');

    try {
      const isLock = selectedCatalogItem.deviceType.includes('LOCK');
      const isSensor = selectedCatalogItem.category === 'SENSORS';

      const created = await deviceApi.createDevice(floorPlan.id, {
        name: selectedCatalogItem.name,
        type: selectedCatalogItem.deviceType,
        catalogItemId: selectedCatalogItem.id,
        x: worldX,
        y: worldY,
        normalizedX: normX,
        normalizedY: normY,
        iconWidth: selectedCatalogItem.defaultWidth || 48,
        iconHeight: selectedCatalogItem.defaultHeight || 48,
        configuration: selectedCatalogItem.defaultConfiguration,
        integrationStatus: 'SIMULATED',
        status: isLock ? 'LOCKED' : isSensor ? 'ONLINE' : 'ON',
      });

      setDevices((prev) => [...prev, created]);
      setSelectedDeviceId(created.id);
      setSelectedObjectId(null);
      setSelectedRoomId(null);
      // Auto switch to select/move mode immediately after placement!
      setToolMode('select');
      setSelectedCatalogItem(null);
      setSaveStatus('SAVED');

      if (activeHouse) {
        refreshPublishStatus(activeHouse.id);
        refreshQuota(activeHouse.id);
      }
    } catch (err: any) {
      setSaveStatus('ERROR');
      alert(`Gagal menempatkan perangkat IoT: ${err.message || 'Kesalahan sistem'}`);
    }
  };

  // Real-time 60fps position update during drag (pure local state update, no debounced network spam)
  const handleUpdateDevicePosition = useCallback((
    deviceId: string,
    x: number,
    y: number,
    normX: number,
    normY: number
  ) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? { ...d, x, y, normalizedX: normX, normalizedY: normY }
          : d
      )
    );
  }, []);

  // Commit device position to backend once mouseup fires
  const handleCommitDevicePosition = useCallback(async (
    deviceId: string,
    x: number,
    y: number,
    normX: number,
    normY: number
  ) => {
    setSaveStatus('SAVING');
    try {
      await deviceApi.updateDevice(deviceId, {
        x,
        y,
        normalizedX: normX,
        normalizedY: normY,
      });
      setSaveStatus('SAVED');
      setLastErrorMessage(null);
      if (activeHouse) {
        refreshPublishStatus(activeHouse.id);
        refreshQuota(activeHouse.id);
      }
    } catch (err: any) {
      console.error('Failed to commit device position:', err);
      setSaveStatus('ERROR');
      setLastErrorMessage(err?.message || 'Gagal menyimpan posisi perangkat IoT');
    }
  }, [activeHouse, refreshPublishStatus]);

  // Real-time 60fps size update during resize handle drag
  const handleUpdateDeviceSize = useCallback((
    deviceId: string,
    width: number,
    height: number
  ) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? { ...d, iconWidth: width, iconHeight: height }
          : d
      )
    );
  }, []);

  // Commit device size to backend once mouseup fires
  const handleCommitDeviceSize = useCallback(async (
    deviceId: string,
    width: number,
    height: number
  ) => {
    setSaveStatus('SAVING');
    try {
      await deviceApi.updateDevice(deviceId, {
        iconWidth: width,
        iconHeight: height,
      });
      setSaveStatus('SAVED');
      setLastErrorMessage(null);
      if (activeHouse) {
        refreshPublishStatus(activeHouse.id);
        refreshQuota(activeHouse.id);
      }
    } catch (err: any) {
      console.error('Failed to commit device size:', err);
      setSaveStatus('ERROR');
      setLastErrorMessage(err?.message || 'Gagal menyimpan ukuran perangkat IoT');
    }
  }, [activeHouse, refreshPublishStatus]);

  // Handle updating device configuration / properties from inspector
  const handleUpdateDevice = async (id: string, updates: Partial<IoTDevice>) => {
    setSaveStatus('SAVING');
    try {
      const updated = await deviceApi.updateDevice(id, updates);
      setDevices((prev) => prev.map((d) => (d.id === id ? updated : d)));
      if (controlModalDevice?.id === id) {
        setControlModalDevice(updated);
      }
      setSaveStatus('SAVED');
      setLastErrorMessage(null);
      if (activeHouse) {
        refreshPublishStatus(activeHouse.id);
        refreshQuota(activeHouse.id);
      }
    } catch (err: any) {
      setSaveStatus('ERROR');
      setLastErrorMessage(err?.message || 'Gagal menyimpan konfigurasi perangkat');
      throw err;
    }
  };

  // Handle deleting a device
  const handleDeleteDevice = async (id: string) => {
    setSaveStatus('SAVING');
    try {
      await deviceApi.deleteDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
      if (selectedDeviceId === id) setSelectedDeviceId(null);
      setSaveStatus('SAVED');
      setLastErrorMessage(null);
      if (activeHouse) {
        refreshPublishStatus(activeHouse.id);
        refreshQuota(activeHouse.id);
      }
    } catch (err: any) {
      setSaveStatus('ERROR');
      setLastErrorMessage(err?.message || 'Gagal menghapus perangkat');
      alert('Gagal menghapus perangkat.');
    }
  };

  // Handle device control via Phase 5 Simulation Engine & capabilities
  const handleControlDevice = async (
    deviceId: string,
    action: string,
    payload?: any
  ) => {
    try {
      const updated = await deviceApi.controlDevice(deviceId, {
        action,
        payload,
      });

      setDevices((prev) => prev.map((d) => (d.id === deviceId ? updated : d)));
      if (controlModalDevice?.id === deviceId) {
        setControlModalDevice(updated);
      }
    } catch (err: any) {
      console.error('Failed to control device simulation:', err);
      throw err;
    }
  };

  // =========================================================================
  // OBJECT MANAGEMENT (FURNITURE)
  // =========================================================================

  const pushHistory = (newObjects: FloorPlanObject[]) => {
    setHistory((prev) => [...prev.slice(-25), newObjects]);
    setFuture([]);
  };

  const handleAddObject = async (
    catalogItem: ObjectCatalogItem,
    customWorldX?: number,
    customWorldY?: number
  ) => {
    if (!floorPlan) return;
    setSaveStatus('SAVING');

    const spawnX =
      customWorldX !== undefined
        ? customWorldX
        : Math.round(floorPlan.viewBoxWidth / 2 - catalogItem.defaultWidth / 2);
    const spawnY =
      customWorldY !== undefined
        ? customWorldY
        : Math.round(floorPlan.viewBoxHeight / 2 - catalogItem.defaultHeight / 2);

    try {
      const newObj = await floorPlanApi.createObject(floorPlan.id, {
        catalogObjectId: catalogItem.id,
        name: catalogItem.name,
        category: catalogItem.category,
        x: spawnX,
        y: spawnY,
        width: catalogItem.defaultWidth,
        height: catalogItem.defaultHeight,
        rotation: 0,
        zIndex: (floorPlan.objects?.length || 0) + 1,
      });

      const nextObjects = [...(floorPlan.objects || []), newObj];
      setFloorPlan((prev) => (prev ? { ...prev, objects: nextObjects } : null));
      pushHistory(nextObjects);
      setSelectedObjectId(newObj.id);
      setSelectedDeviceId(null);
      setSelectedRoomId(null);
      setSaveStatus('SAVED');
      refreshSpatialDetections(floorPlan.id);
    } catch (err) {
      setSaveStatus('ERROR');
      alert('Gagal menambahkan objek ke denah');
    }
  };

  const handleUpdateObject = (
    objectId: string,
    updates: Partial<FloorPlanObject>
  ) => {
    if (!floorPlan) return;

    const nextObjects = (floorPlan.objects || []).map((o) =>
      o.id === objectId ? { ...o, ...updates } : o
    );
    setFloorPlan((prev) => (prev ? { ...prev, objects: nextObjects } : null));

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus('SAVING');

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await floorPlanApi.updateObject(floorPlan.id, objectId, updates);
        setSaveStatus('SAVED');
        refreshSpatialDetections(floorPlan.id);
      } catch (err) {
        setSaveStatus('ERROR');
      }
    }, 400);
  };

  const handleDeleteObject = async (objectId: string) => {
    if (!floorPlan) return;
    setSaveStatus('SAVING');
    try {
      await floorPlanApi.deleteObject(floorPlan.id, objectId);
      const nextObjects = (floorPlan.objects || []).filter((o) => o.id !== objectId);
      setFloorPlan((prev) => (prev ? { ...prev, objects: nextObjects } : null));
      pushHistory(nextObjects);
      if (selectedObjectId === objectId) setSelectedObjectId(null);
      setSaveStatus('SAVED');
    } catch (err) {
      setSaveStatus('ERROR');
      alert('Gagal menghapus objek');
    }
  };

  const handleDuplicateObject = async (objectId: string) => {
    if (!floorPlan) return;
    const target = floorPlan.objects.find((o) => o.id === objectId);
    if (!target) return;

    setSaveStatus('SAVING');
    try {
      const duplicated = await floorPlanApi.duplicateObject(floorPlan.id, target.id);
      const nextObjects = [...floorPlan.objects, duplicated];
      setFloorPlan((prev) => (prev ? { ...prev, objects: nextObjects } : null));
      pushHistory(nextObjects);
      setSelectedObjectId(duplicated.id);
      setSaveStatus('SAVED');
    } catch (err) {
      setSaveStatus('ERROR');
      alert('Gagal menggandakan objek');
    }
  };

  const handleBringForward = async (objectId: string) => {
    if (!floorPlan) return;
    const current = floorPlan.objects.find((o) => o.id === objectId);
    if (!current) return;
    const nextZ = (current.zIndex || 0) + 1;
    handleUpdateObject(objectId, { zIndex: nextZ });
  };

  const handleSendBackward = async (objectId: string) => {
    if (!floorPlan) return;
    const current = floorPlan.objects.find((o) => o.id === objectId);
    if (!current) return;
    const nextZ = Math.max(1, (current.zIndex || 0) - 1);
    handleUpdateObject(objectId, { zIndex: nextZ });
  };

  const handleBringToFront = async (objectId: string) => {
    if (!floorPlan) return;
    const maxZ = Math.max(...floorPlan.objects.map((o) => o.zIndex || 0), 0);
    handleUpdateObject(objectId, { zIndex: maxZ + 1 });
  };

  const handleSendToBack = async (objectId: string) => {
    if (!floorPlan) return;
    handleUpdateObject(objectId, { zIndex: 1 });
  };

  const handleAssignObjectRoom = async (
    objectId: string,
    roomId: string | null
  ) => {
    if (!floorPlan) return;
    handleUpdateObject(objectId, { roomId });
  };

  // =========================================================================
  // ROOM SPATIAL MANAGEMENT & SCALE CALIBRATION (PHASE 10 CAD)
  // =========================================================================

  const handleOpenCalibration = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    setCalibrationPoint1(p1);
    setCalibrationPoint2(p2);
    setIsCalibrationOpen(true);
  };

  const handleSaveCalibration = async (distanceMeters: number) => {
    if (!floorPlan || !calibrationPoint1 || !calibrationPoint2) return;
    setSaveStatus('SAVING');
    try {
      const updated = await floorPlanApi.saveCalibration(floorPlan.id, {
        point1: calibrationPoint1,
        point2: calibrationPoint2,
        distanceMeters,
      });
      setFloorPlan((prev) => (prev ? { ...prev, ...updated } : updated));
      setToolMode('select');
      if (activeFloor) {
        await loadRooms(activeFloor.id);
      }
      setSaveStatus('SAVED');
      setLastErrorMessage(null);
    } catch (err: any) {
      console.error('Failed to save scale calibration:', err);
      setSaveStatus('ERROR');
      setLastErrorMessage(err?.message || 'Gagal menyimpan kalibrasi skala');
      throw err;
    }
  };

  const handleResetCalibration = async () => {
    if (!floorPlan) return;
    setSaveStatus('SAVING');
    try {
      const updated = await floorPlanApi.resetCalibration(floorPlan.id);
      setFloorPlan((prev) => (prev ? { ...prev, ...updated } : updated));
      if (activeFloor) {
        await loadRooms(activeFloor.id);
      }
      setSaveStatus('SAVED');
      setLastErrorMessage(null);
    } catch (err: any) {
      console.error('Failed to reset scale calibration:', err);
      setSaveStatus('ERROR');
      setLastErrorMessage(err?.message || 'Gagal mereset kalibrasi skala');
      alert(`Gagal mereset kalibrasi: ${err?.message || 'Kesalahan sistem'}`);
    }
  };

  const handleRotatePlan = async () => {
    if (!floorPlan) return;
    setSaveStatus('SAVING');
    try {
      const updated = await floorPlanApi.rotatePlan(floorPlan.id);
      setFloorPlan((prev) => (prev ? { ...prev, ...updated } : updated));
      setZoomLevel(100);
      if (activeFloor) {
        await loadRooms(activeFloor.id);
        await loadDevices(floorPlan.id);
      }
      setSaveStatus('SAVED');
      setLastErrorMessage(null);
    } catch (err: any) {
      console.error('Failed to rotate floor plan:', err);
      setSaveStatus('ERROR');
      setLastErrorMessage(err?.message || 'Gagal memutar denah');
      alert(`Gagal memutar denah: ${err?.message || 'Kesalahan sistem'}`);
    }
  };

  const handleFinishDrawRoom = async (points: PolygonPoint[]) => {
    if (!activeFloor) return;
    setSaveStatus('SAVING');
    try {
      if (drawingTargetRoomId) {
        // Associate directly to target room (e.g. from Phase 9 survey)
        const updated = await roomApi.updateRoomPolygon(drawingTargetRoomId, points);
        setRooms((prev) => prev.map((r) => (r.id === drawingTargetRoomId ? updated.room : r)));
        setSelectedRoomId(drawingTargetRoomId);
        setDrawingTargetRoomId(null);
      } else {
        // Check if there is an unmapped room on this floor
        const unmappedRoom = rooms.find((r) => !r.polygonCoordinates || r.polygonCoordinates.length < 3);
        if (unmappedRoom) {
          const updated = await roomApi.updateRoomPolygon(unmappedRoom.id, points);
          setRooms((prev) => prev.map((r) => (r.id === unmappedRoom.id ? updated.room : r)));
          setSelectedRoomId(unmappedRoom.id);
        } else {
          const roomNumber = rooms.length + 1;
          const created = await roomApi.createRoom(activeFloor.id, {
            name: `Ruangan ${roomNumber}`,
            type: 'OTHER',
            polygonCoordinates: points,
          });

          setRooms((prev) => [...prev, created]);
          setSelectedRoomId(created.id);
        }
      }
      setToolMode('select');
      setSaveStatus('SAVED');
      setLastErrorMessage(null);
      if (floorPlan) refreshSpatialDetections(floorPlan.id);
    } catch (err: any) {
      setSaveStatus('ERROR');
      setLastErrorMessage(err?.message || 'Gagal menyimpan poligon ruangan');
      alert(err?.message || 'Gagal menyimpan poligon ruangan. Pastikan garis poligon tidak bersilangan dan minimal memiliki 3 titik.');
    }
  };

  const handleDuplicateRoom = async (roomId: string) => {
    if (!activeFloor) return;
    const target = rooms.find((r) => r.id === roomId);
    if (!target || !target.polygonCoordinates || target.polygonCoordinates.length < 3) return;

    setSaveStatus('SAVING');
    try {
      const clonedCoordinates = target.polygonCoordinates.map((p) => ({
        x: Math.round(p.x + 35),
        y: Math.round(p.y + 35),
      }));

      const created = await roomApi.createRoom(activeFloor.id, {
        name: `${target.name} (Salinan)`,
        type: target.type,
        color: target.color || undefined,
        ceilingHeight: target.ceilingHeight ?? undefined,
        polygonCoordinates: clonedCoordinates,
      });

      setRooms((prev) => [...prev, created]);
      setSelectedRoomId(created.id);
      setToolMode('edit-room');
      setSaveStatus('SAVED');
      if (floorPlan) refreshSpatialDetections(floorPlan.id);
    } catch (err: any) {
      setSaveStatus('ERROR');
      setLastErrorMessage(err?.message || 'Gagal menduplikasi ruangan');
      alert(err?.message || 'Gagal menduplikasi ruangan.');
    }
  };

  const handleToggleRoomVisibility = (roomId: string) => {
    setHiddenRoomIds((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.add(roomId);
      }
      return next;
    });
  };

  const handleUpdateRoomPolygon = async (
    roomId: string,
    points: PolygonPoint[]
  ) => {
    setSaveStatus('SAVING');
    try {
      // Clean and sanitize points before sending
      let cleanPoints = points
        .filter((p) => p && typeof p.x === 'number' && typeof p.y === 'number' && Number.isFinite(p.x) && Number.isFinite(p.y))
        .map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));

      if (
        cleanPoints.length > 3 &&
        cleanPoints[0].x === cleanPoints[cleanPoints.length - 1].x &&
        cleanPoints[0].y === cleanPoints[cleanPoints.length - 1].y
      ) {
        cleanPoints.pop();
      }

      if (cleanPoints.length < 3) {
        throw new Error('Poligon ruangan memerlukan minimal 3 titik sudut.');
      }

      const updated = await roomApi.updateRoomPolygon(roomId, cleanPoints);
      setRooms((prev) => prev.map((r) => (r.id === roomId ? updated.room : r)));
      setSaveStatus('SAVED');
      setLastErrorMessage(null);
      if (floorPlan) refreshSpatialDetections(floorPlan.id);
    } catch (err: any) {
      setSaveStatus('ERROR');
      setLastErrorMessage(err?.message || 'Gagal menyimpan bentuk poligon ruangan');
      console.error('Failed to update room polygon:', err);
      setRooms((prev) => [...prev]);
      alert(`Gagal menyimpan poligon: ${err?.message || 'Pastikan garis poligon tidak bersilangan dan minimal memiliki 3 titik.'}`);
    }
  };

  const handleApplyAutoRoomReferences = async (
    roomsToCreate: GeneratedRoomReference[],
    replaceExisting: boolean
  ) => {
    if (!activeFloor) return;
    setSaveStatus('SAVING');

    try {
      if (replaceExisting && rooms.length > 0) {
        for (const existingRoom of rooms) {
          try {
            await roomApi.deleteRoom(existingRoom.id);
          } catch (delErr) {
            console.warn(`Failed to delete room ${existingRoom.id}:`, delErr);
          }
        }
      }

      const createdRooms: Room[] = [];
      for (const r of roomsToCreate) {
        // Sanitize polygon points before sending
        let cleanPolygon = r.polygonCoordinates;
        if (cleanPolygon && Array.isArray(cleanPolygon)) {
          cleanPolygon = cleanPolygon
            .filter((p) => p && typeof p.x === 'number' && typeof p.y === 'number' && Number.isFinite(p.x) && Number.isFinite(p.y))
            .map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
          // Ensure first and last point are not identical
          if (
            cleanPolygon.length > 3 &&
            cleanPolygon[0].x === cleanPolygon[cleanPolygon.length - 1].x &&
            cleanPolygon[0].y === cleanPolygon[cleanPolygon.length - 1].y
          ) {
            cleanPolygon.pop();
          }
        }

        const created = await roomApi.createRoom(activeFloor.id, {
          name: r.name,
          type: r.type,
          color: r.color,
          polygonCoordinates: cleanPolygon && cleanPolygon.length >= 3 ? cleanPolygon : undefined,
          ceilingHeight: r.ceilingHeight || 3.0,
        });
        createdRooms.push(created);
      }

      if (replaceExisting) {
        setRooms(createdRooms);
      } else {
        setRooms((prev) => [...prev, ...createdRooms]);
      }

      if (createdRooms.length > 0) {
        setSelectedRoomId(createdRooms[0].id);
        setToolMode('edit-room');
      }

      setSaveStatus('SAVED');
      setLastErrorMessage(null);
      if (floorPlan) refreshSpatialDetections(floorPlan.id);
    } catch (err: any) {
      setSaveStatus('ERROR');
      setLastErrorMessage(err?.message || 'Gagal menerapkan referensi ruangan');
      throw err;
    }
  };

  const handleUpdateRoom = async (roomId: string, data: any) => {
    setSaveStatus('SAVING');
    try {
      const updated = await roomApi.updateRoom(roomId, data);
      setRooms((prev) => prev.map((r) => (r.id === roomId ? updated : r)));
      setSaveStatus('SAVED');
    } catch (err) {
      setSaveStatus('ERROR');
      throw err;
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus ruangan ini?')) return;
    setSaveStatus('SAVING');
    try {
      await roomApi.deleteRoom(roomId);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      if (selectedRoomId === roomId) setSelectedRoomId(null);
      setSaveStatus('SAVED');
      if (floorPlan) refreshSpatialDetections(floorPlan.id);
    } catch (err) {
      setSaveStatus('ERROR');
      alert('Gagal menghapus ruangan');
    }
  };

  // Snap to Grid & Persistence
  const handleToggleSnap = async () => {
    const nextVal = !snapToGrid;
    setSnapToGrid(nextVal);
    if (floorPlan) {
      try {
        await floorPlanApi.updatePlanConfig(floorPlan.id, { gridSnap: nextVal });
      } catch (e) {
        console.warn('Could not persist gridSnap setting:', e);
      }
    }
  };

  // Undo / Redo
  const handleUndo = () => {
    if (history.length <= 1 || !floorPlan) return;
    const current = history[history.length - 1];
    const previous = history[history.length - 2];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setFuture((prev) => [current, ...prev]);
    setFloorPlan({ ...floorPlan, objects: previous });
    floorPlanApi.batchUpdateObjects(
      floorPlan.id,
      previous.map((o) => ({ id: o.id, x: o.x, y: o.y, width: o.width, height: o.height, rotation: o.rotation }))
    );
  };

  const handleRedo = () => {
    if (future.length === 0 || !floorPlan) return;
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setHistory((prev) => [...prev, next]);
    setFloorPlan({ ...floorPlan, objects: next });
    floorPlanApi.batchUpdateObjects(
      floorPlan.id,
      next.map((o) => ({ id: o.id, x: o.x, y: o.y, width: o.width, height: o.height, rotation: o.rotation }))
    );
  };

  const handleChangeToolMode = (mode: ToolMode) => {
    setToolMode(mode);
    if (mode === 'draw-room') {
      setSelectedObjectId(null);
      setSelectedRoomId(null);
      setSelectedDeviceId(null);
    } else if (mode === 'place-device') {
      setLeftTab('devices');
      setIsLeftPanelOpen(true);
    } else if (mode === 'calibrate') {
      setSelectedObjectId(null);
      setSelectedRoomId(null);
      setSelectedDeviceId(null);
    }
  };

  const handleTogglePreviewMonitoring = () => {
    const next = !isPreviewMonitoring;
    setIsPreviewMonitoring(next);
    if (next) {
      setIsLeftPanelOpen(false);
      setSelectedDeviceId(null);
      setSelectedObjectId(null);
      setSelectedRoomId(null);
      setToolMode('select');
    } else {
      setIsLeftPanelOpen(true);
    }
  };

  // Selected Entities
  const selectedObject =
    floorPlan?.objects?.find((o) => o.id === selectedObjectId) || null;
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || null;
  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || null;

  // Dynamic Layout: Hide empty sidebars during monitoring or 3D or when nothing is selected
  const hasInspectorTarget = !isPreviewMonitoring && !is3dMode && !!(selectedDevice || selectedRoom || selectedObject);
  const canvasColSpan = (isPreviewMonitoring || is3dMode)
    ? 'lg:col-span-12'
    : hasInspectorTarget
    ? 'lg:col-span-6'
    : 'lg:col-span-9';

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-600">Memuat data denah 2D dan ruangan...</p>
      </div>
    );
  }

  // Error state (e.g. 403 Forbidden or 404 Not Found)
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200 p-8 shadow-xs space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-extrabold text-slate-900">Akses Ditolak / Kesalahan</h2>
            <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            {role === 'TECHNICIAN' ? (
              <Link
                to="/technician"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Ruang Kerja Teknisi</span>
              </Link>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Dashboard Admin</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Graceful empty state when database legitimately has zero properties (no auto-demo creation)
  if (!isLoading && !error && houses.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 border border-purple-100 text-[#8B5CF6] flex items-center justify-center">
            <Radio className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#181829]">Belum Ada Properti Terdaftar</h2>
            <p className="text-xs text-[#71758E] mt-1 leading-relaxed">
              {role === 'TECHNICIAN'
                ? 'Belum ada properti aktif yang ditugaskan kepada Anda oleh Super Admin.'
                : 'Sistem tidak lagi membuat properti demo otomatis. Buat properti pertama untuk mulai mengonfigurasi denah 2D dan perangkat IoT.'}
            </p>
          </div>
          <div className="flex justify-center gap-2 pt-1">
            {role === 'TECHNICIAN' ? (
              <Link
                to="/technician"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Ruang Kerja Teknisi</span>
              </Link>
            ) : (
              <>
                <Button
                  variant="purple"
                  size="sm"
                  onClick={async () => {
                    const name = window.prompt('Masukkan nama properti baru:');
                    if (!name || !name.trim()) return;
                    try {
                      await floorPlanApi.createHouse({ name: name.trim() });
                      await loadInitialData();
                    } catch (e: any) {
                      alert(e?.message || 'Gagal membuat properti baru.');
                    }
                  }}
                >
                  Buat Properti Pertama
                </Button>
                <Button variant="secondary" size="sm" onClick={() => loadInitialData()}>
                  Muat Ulang
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Supporting Studio Configuration Modules for Interactive Sidebar
  const studioModules = [
    {
      id: 'summary',
      title: 'Ringkasan & Metrik',
      description: 'Alarm & status perangkat',
      icon: BarChart3,
      badge: offlineOrAlertCount > 0 ? `${offlineOrAlertCount} alert` : `${devices.length} IoT`,
      badgeAlert: offlineOrAlertCount > 0,
      isActive: isLeftPanelOpen && leftTab === 'summary',
      onClick: () => {
        setLeftTab('summary');
        setIsLeftPanelOpen(true);
      },
    },
    {
      id: 'devices',
      title: 'Katalog Perangkat',
      description: 'Pasang sensor & saklar IoT',
      icon: Cpu,
      badge: `${devices.length}`,
      isActive: isLeftPanelOpen && leftTab === 'devices',
      onClick: () => {
        setLeftTab('devices');
        setIsLeftPanelOpen(true);
      },
    },
    {
      id: 'rooms',
      title: 'Zonasi Ruangan',
      description: 'Poligon & batas ruang',
      icon: Home,
      badge: `${rooms.length}`,
      isActive: isLeftPanelOpen && leftTab === 'rooms',
      onClick: () => {
        setLeftTab('rooms');
        setIsLeftPanelOpen(true);
      },
    },
    {
      id: 'library',
      title: 'Mebel & Objek CAD',
      description: 'Perabot & interior denah',
      icon: Box,
      badge: `${floorPlan?.objects?.length || 0}`,
      isActive: isLeftPanelOpen && leftTab === 'library',
      onClick: () => {
        setLeftTab('library');
        setIsLeftPanelOpen(true);
      },
    },
    {
      id: 'structure',
      title: 'Struktur Lantai',
      description: activeFloor?.name || 'Level lantai aktif',
      icon: Layers,
      badge: `${activeHouse?.floors?.length || 1} Lt`,
      isActive: isLeftPanelOpen && leftTab === 'structure',
      onClick: () => {
        setLeftTab('structure');
        setIsLeftPanelOpen(true);
      },
    },
    {
      id: 'automation',
      title: 'Smart Automation',
      description: 'Aturan logika IF-THEN',
      icon: Zap,
      badge: 'IF-THEN',
      isActive: isAutomationPanelOpen,
      onClick: () => {
        setIsAutomationPanelOpen(true);
      },
    },
    {
      id: 'calibration',
      title: 'Kalibrasi Skala',
      description: floorPlan?.isCalibrated
        ? `${floorPlan.pixelsPerMeter ? floorPlan.pixelsPerMeter.toFixed(0) : ''} px/m`
        : 'Atur rasio meter denah',
      icon: Ruler,
      badge: floorPlan?.isCalibrated ? 'Terkalibrasi' : 'Perlu',
      isActive: toolMode === 'calibrate' || isCalibrationOpen,
      onClick: () => {
        if (floorPlan?.calibrationPoints) {
          setCalibrationPoint1(floorPlan.calibrationPoints.point1);
          setCalibrationPoint2(floorPlan.calibrationPoints.point2);
          setIsCalibrationOpen(true);
        } else {
          handleChangeToolMode('calibrate');
        }
      },
    },
    {
      id: 'background',
      title: 'Blueprint Denah',
      description: floorPlan?.imagePath ? 'Ganti / hapus denah latar' : 'Unggah denah latar',
      icon: UploadCloud,
      badge: floorPlan?.imagePath ? 'Tersedia' : 'Kosong',
      isActive: isUploadBgOpen,
      onClick: () => {
        setIsUploadBgOpen(true);
      },
    },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#EEF2F8] select-none text-[#1E2035] relative font-sans">
      {/* =========================================================================
          1. INTERACTIVE STUDIO CONFIGURATION SIDEBAR (Hover to expand with titles)
          ========================================================================= */}
      <aside
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`h-full bg-[#E5ECF6] border-r border-[#D7E2F0] flex flex-col justify-between shrink-0 z-30 shadow-md transition-all duration-300 ease-in-out select-none ${
          isSidebarHovered ? 'w-64 sm:w-72' : 'w-16 sm:w-[70px]'
        }`}
      >
        {/* Top: Donut/Circle Logo + Studio Branding (Revealed on hover) */}
        <div>
          <div className="p-3.5 flex items-center gap-3 border-b border-[#D7E2F0]/80 overflow-hidden">
            <div
              className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#7C3AED] p-0.5 shadow-md flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
              title="Studio Denah 2D"
            >
              <div className="w-5 h-5 rounded-full bg-[#E5ECF6] border-2 border-white" />
            </div>

            <div
              className={`flex flex-col transition-all duration-200 whitespace-nowrap overflow-hidden ${
                isSidebarHovered ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 pointer-events-none'
              }`}
            >
              <span className="text-xs font-black text-[#181829] tracking-tight">Studio Denah 2D</span>
              <span className="text-[10px] text-slate-500 font-medium truncate">Modul Konfigurasi IoT</span>
            </div>
          </div>

          {/* Module Navigation Items */}
          <div className="py-3 px-2 flex flex-col gap-1.5 overflow-y-auto no-scrollbar max-h-[calc(100vh-140px)]">
            {studioModules.map((mod) => (
              <button
                key={mod.id}
                type="button"
                onClick={mod.onClick}
                className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all cursor-pointer text-left relative group ${
                  mod.isActive
                    ? 'bg-[#4F6BFF] text-white shadow-md shadow-indigo-500/25 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
                title={!isSidebarHovered ? mod.title : undefined}
              >
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <mod.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                </div>

                <div
                  className={`flex-1 transition-all duration-200 overflow-hidden ${
                    isSidebarHovered ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 pointer-events-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold truncate leading-tight">{mod.title}</span>
                    {mod.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                          mod.isActive
                            ? 'bg-white/20 text-white'
                            : mod.badgeAlert
                            ? 'bg-[#FF5757] text-white animate-pulse'
                            : 'bg-slate-200/80 text-slate-700'
                        }`}
                      >
                        {mod.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[10px] truncate mt-0.5 ${
                      mod.isActive ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    {mod.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom of Sidebar: Canvas Theme Switch & Collapse Hint */}
        <div className="p-3 border-t border-[#D7E2F0]/80 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCanvasTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
                className="p-2 rounded-xl bg-white/70 hover:bg-white text-slate-600 hover:text-[#4F6BFF] transition-colors shadow-2xs cursor-pointer shrink-0"
                title={canvasTheme === 'light' ? 'Beralih ke Kanvas Gelap' : 'Beralih ke Kanvas Terang'}
              >
                {canvasTheme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
              </button>

              <div
                className={`flex flex-col transition-all duration-200 whitespace-nowrap overflow-hidden ${
                  isSidebarHovered ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0 pointer-events-none'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-700">Tema Kanvas</span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {canvasTheme === 'light' ? 'Mode Terang' : 'Mode Gelap'}
                </span>
              </div>
            </div>

            {isSidebarHovered && (
              <span className="text-[9px] font-mono text-slate-400 bg-white/60 px-2 py-0.5 rounded-lg border border-slate-200/60">
                Studio 2D
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* =========================================================================
          2. MAIN STUDIO WORKSPACE (Right of interactive sidebar)
          ========================================================================= */}
      <div className="flex-1 h-full flex flex-col overflow-hidden relative">
        {/* Top Header Bar: Truly responsive across all viewports & Inspect DevTools */}
        <header className="h-14 sm:h-16 px-2 sm:px-4 lg:px-6 flex items-center justify-between gap-1.5 sm:gap-2.5 shrink-0 z-20 bg-transparent min-w-0 w-full overflow-x-auto no-scrollbar">
          {/* 1. Left Group: Back Button + House/Floor Selector Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              to={role === 'TECHNICIAN' ? '/technician' : '/'}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-[#4F6BFF] border border-slate-200/90 shadow-xs transition-all text-xs font-bold shrink-0 cursor-pointer group"
              title="Kembali ke Dashboard Utama"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-[#4F6BFF] group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>

            <span className="font-extrabold text-xs text-slate-400 uppercase tracking-wider hidden 2xl:inline">
              IoT Studio
            </span>

            {/* Segmented House & Floor Selector Glass Pill */}
            <div className="flex items-center p-0.5 rounded-2xl bg-white/90 backdrop-blur-md shadow-xs border border-white/80 text-xs shrink-0">
              {/* House Dropdown */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-xl font-bold text-[#181829]">
                <Home className="w-3.5 h-3.5 text-[#4F6BFF] shrink-0" />
                <select
                  value={activeHouse?.id || ''}
                  onChange={(e) => handleSelectHouse(e.target.value)}
                  disabled={isPreviewMonitoring}
                  className="bg-transparent text-xs font-bold text-[#181829] focus:outline-none cursor-pointer max-w-[80px] sm:max-w-[110px] truncate"
                >
                  {houses.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Floor Dropdown */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[#F0F4FF] text-[#4F6BFF] font-bold border border-indigo-100 ml-0.5">
                <Layers className="w-3.5 h-3.5 text-[#4F6BFF] shrink-0" />
                <select
                  value={activeFloor?.id || ''}
                  onChange={(e) => handleSelectFloor(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#4F6BFF] focus:outline-none cursor-pointer max-w-[55px] sm:max-w-[80px] truncate"
                >
                  {activeHouse?.floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                {!isPreviewMonitoring && (
                  <div className="flex items-center pl-1 border-l border-indigo-200">
                    <button
                      type="button"
                      onClick={() => setIsAddFloorOpen(true)}
                      className="p-0.5 rounded-lg text-[#4F6BFF] hover:bg-white transition-colors cursor-pointer"
                      title="Tambah Lantai Baru"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    {activeHouse && activeHouse.floors && activeHouse.floors.length > 1 && (
                      <button
                        type="button"
                        onClick={handleDeleteActiveFloor}
                        className="p-0.5 rounded-lg text-rose-500 hover:bg-white transition-colors ml-0.5 cursor-pointer"
                        title={`Hapus ${activeFloor?.name || 'lantai ini'}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Handover Status Pill */}
            {activeHouse?.setupStatus === 'ACTIVE' && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="hidden md:inline">Aktif</span>
              </span>
            )}
            {activeHouse && (activeHouse.setupStatus === 'CONFIGURING' || !activeHouse.setupStatus) && (
              <button
                type="button"
                onClick={handleMarkReadyForHandover}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs hover:bg-emerald-700 transition-colors shrink-0 cursor-pointer"
                title="Tandai properti siap untuk serah terima (Handover)"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span className="hidden md:inline">Handover</span>
              </button>
            )}
          </div>

          {/* 2. Center Group: Category Filter */}
          {/* Desktop Version (>= 2xl / 1536px): Full 5 Segmented Buttons */}
          <div className="hidden 2xl:flex items-center gap-1 bg-white/85 backdrop-blur-md p-1 rounded-full shadow-xs border border-white/60 text-xs font-semibold shrink-0">
            {[
              { id: 'Overview', label: 'Overview', count: devices.length },
              { id: 'Engine room', label: 'Engine', count: controlDevicesCount },
              { id: 'Internet device', label: 'Sensor', count: sensorDevicesCount },
              { id: 'Office device', label: 'Office', count: visualDevicesCount },
              { id: 'Other device', label: 'Other', count: otherOrObjectsCount },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedCategoryTab(tab.id);
                  if (tab.id === 'Overview') {
                    setLeftTab('summary');
                  } else if (tab.id === 'Other device') {
                    setLeftTab('library');
                  } else {
                    setLeftTab('devices');
                  }
                  setIsLeftPanelOpen(true);
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                  selectedCategoryTab === tab.id
                    ? 'bg-[#4F6BFF] text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                title={`Filter kategori ${tab.id} (${tab.count} perangkat)`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    selectedCategoryTab === tab.id
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-200/70 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Compact Dropdown Version (< 1536px, e.g. Inspect DevTools opened / Laptop / Tablet): Fits cleanly */}
          <div className="2xl:hidden flex items-center shrink-0">
            <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-xs border border-white/80 text-xs font-bold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-[#4F6BFF] animate-pulse shrink-0" />
              <span className="text-slate-400 font-medium hidden md:inline text-[11px]">Kategori:</span>
              <select
                value={selectedCategoryTab}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCategoryTab(val);
                  if (val === 'Overview') {
                    setLeftTab('summary');
                  } else if (val === 'Other device') {
                    setLeftTab('library');
                  } else {
                    setLeftTab('devices');
                  }
                  setIsLeftPanelOpen(true);
                }}
                className="bg-transparent text-xs font-bold text-[#181829] focus:outline-none cursor-pointer max-w-[130px]"
              >
                <option value="Overview">Overview ({devices.length})</option>
                <option value="Engine room">Engine ({controlDevicesCount})</option>
                <option value="Internet device">Sensor ({sensorDevicesCount})</option>
                <option value="Office device">Office ({visualDevicesCount})</option>
                <option value="Other device">Other ({otherOrObjectsCount})</option>
              </select>
            </div>
          </div>

          {/* 3. Right Group: Telemetry, Mode Switcher, Publish, Save */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live Telemetry: Clock & Weather (Combined in one compact chip, visible only on wide screen >= 2xl) */}
            <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/80 backdrop-blur-md border border-white/80 text-xs font-mono font-bold text-slate-700 shadow-2xs shrink-0">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentTime || '11:25 AM'}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>28°C</span>
              </div>
            </div>

            {/* Mode Switcher: Desain vs Preview Monitoring vs 3D Twin */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-200/70 border border-slate-300/60 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIs3dMode(false);
                  if (isPreviewMonitoring) handleTogglePreviewMonitoring();
                }}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                  !isPreviewMonitoring && !is3dMode
                    ? 'bg-white text-[#4F6BFF] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Mode Desain / Konfigurasi 2D"
              >
                <PenTool className="w-3.5 h-3.5 sm:hidden text-[#4F6BFF]" />
                <span className="hidden sm:inline">Desain</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIs3dMode(false);
                  if (!isPreviewMonitoring) handleTogglePreviewMonitoring();
                }}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                  isPreviewMonitoring && !is3dMode
                    ? 'bg-[#4F6BFF] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Preview Monitoring Live 2D"
              >
                <Eye className="w-3.5 h-3.5 sm:hidden" />
                <span className="hidden sm:inline">Monitoring</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIs3dMode(true);
                  if (isPreviewMonitoring) setIsPreviewMonitoring(false);
                }}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                  is3dMode
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan 3D Procedural Dollhouse Digital Twin"
              >
                <Box className="w-3.5 h-3.5 sm:hidden" />
                <span className="hidden sm:inline">3D Twin</span>
              </button>
            </div>

            {/* Publish Trigger */}
            <button
              type="button"
              onClick={() => setIsPublishModalOpen(true)}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white/90 border border-slate-200 shadow-xs hover:border-[#4F6BFF] text-xs font-semibold transition-all shrink-0 cursor-pointer"
              title="Kelola status publikasi dashboard"
            >
              <Send className="w-3.5 h-3.5 text-[#4F6BFF]" />
              <Badge
                variant={
                  publishStatus === 'PUBLISHED'
                    ? 'success'
                    : publishStatus === 'PREVIEW'
                    ? 'purple'
                    : 'default'
                }
                className="text-[9.5px] font-mono font-bold"
              >
                {publishStatus}
              </Badge>
            </button>

            {/* Save Status Indicator */}
            {!isPreviewMonitoring && (
              <div className="flex items-center shrink-0">
                {saveStatus === 'SAVED' && (
                  <div
                    className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs"
                    title="Semua perubahan tersimpan otomatis"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {saveStatus === 'SAVING' && (
                  <div
                    className="w-7 h-7 rounded-full bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shadow-xs"
                    title="Menyimpan..."
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
                {saveStatus === 'ERROR' && (
                  <div
                    className="w-7 h-7 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs cursor-help"
                    title={lastErrorMessage || 'Gagal menyimpan perubahan'}
                  >
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* =========================================================================
            3. BOUNDLESS CANVAS VIEWPORT & FLOATING OVERLAYS
            ========================================================================= */}
        <main className="flex-1 w-full h-full relative overflow-hidden bg-[#EEF2F8]">
          {/* SVG Floor Plan Canvas or 3D Procedural Dollhouse */}
          {floorPlan ? (
            is3dMode ? (
              <ProceduralDollhouseViewer
                floorPlan={floorPlan}
                rooms={rooms}
                devices={devices}
                furniture={floorPlan.objects || []}
                selectedDeviceId={selectedDeviceId}
                selectedRoomId={selectedRoomId}
                onSelectDevice={(d) => setSelectedDeviceId(d ? d.id : null)}
                onOpenDeviceControl={(dev) => setControlModalDevice(dev)}
                onUpdateDevice={handleUpdateDevice}
                onSelectRoom={(id) => setSelectedRoomId(id)}
                className="w-full h-full min-h-[calc(100vh-140px)]"
              />
            ) : (
              <FloorPlanCanvas
              floorPlan={floorPlan}
              rooms={rooms}
              devices={devices}
              selectedObjectId={selectedObjectId}
              selectedRoomId={selectedRoomId}
              selectedDeviceId={selectedDeviceId}
              toolMode={toolMode}
              hiddenRoomIds={hiddenRoomIds}
              onSelectObject={(id) => {
                setSelectedObjectId(id);
                if (id) {
                  setSelectedRoomId(null);
                  setSelectedDeviceId(null);
                }
              }}
              onSelectRoom={(id) => {
                setSelectedRoomId(id);
                if (id) {
                  setSelectedObjectId(null);
                  setSelectedDeviceId(null);
                }
              }}
              onSelectDevice={(id) => {
                setSelectedDeviceId(id);
                if (id) {
                  setSelectedObjectId(null);
                  setSelectedRoomId(null);
                }
              }}
              onUpdateObject={handleUpdateObject}
              onUpdateDevicePosition={handleUpdateDevicePosition}
              onCommitDevicePosition={handleCommitDevicePosition}
              onUpdateDeviceSize={handleUpdateDeviceSize}
              onCommitDeviceSize={handleCommitDeviceSize}
              onAddObjectAt={handleAddObject}
              onPlaceDeviceAt={handlePlaceDeviceAt}
              onOpenDeviceControl={(dev) => setControlModalDevice(dev)}
              onFinishDrawRoom={handleFinishDrawRoom}
              onUpdateRoomPolygon={handleUpdateRoomPolygon}
              onOpenCalibrationModal={handleOpenCalibration}
              onOpenUploadBackground={() => setIsUploadBgOpen(true)}
              onExitToolMode={() => {
                setToolMode('select');
                setDrawingTargetRoomId(null);
              }}
              showGrid={showGrid}
              snapToGrid={snapToGrid}
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
              isPreviewMonitoring={isPreviewMonitoring}
              showRoomPolygons={showRoomPolygons}
              labelDisplayMode={labelDisplayMode}
              canvasTheme={canvasTheme}
              categoryFilter={selectedCategoryTab}
              onClearCategoryFilter={() => setSelectedCategoryTab('Overview')}
            />
          )
        ) : (
            <div className="flex-1 w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <AlertCircle className="w-10 h-10 text-slate-500 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Denah tidak tersedia</p>
              <p className="text-xs text-slate-500 mt-1">Pilih lantai lain atau buat denah baru.</p>
            </div>
          )}

          {/* =======================================================================
              CENTER FLOATING CAD TOOLS (Figma / Miro style hovering island)
              ======================================================================= */}
          {!isPreviewMonitoring && !is3dMode && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200/90 shadow-xl pointer-events-auto">
              <button
                type="button"
                onClick={() => handleChangeToolMode('select')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  toolMode === 'select'
                    ? 'bg-[#4F6BFF] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title="Mode Pilih & Geser Objek / Perangkat (V)"
              >
                <MousePointer className="w-3.5 h-3.5" />
                <span>Pilih</span>
              </button>

              <button
                type="button"
                onClick={() => handleChangeToolMode('draw-room')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  toolMode === 'draw-room'
                    ? 'bg-[#4F6BFF] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title="Mode Gambar Poligon Ruangan (R)"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Gambar Ruang</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAutoRoomRefOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-purple-700 bg-purple-50 hover:bg-purple-100 hover:text-purple-900 border border-purple-200/80 shadow-2xs cursor-pointer"
                title="Hasilkan referensi partisi ruangan otomatis di atas kanvas denah"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Auto Ruangan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (floorPlan?.calibrationPoints) {
                    setCalibrationPoint1(floorPlan.calibrationPoints.point1);
                    setCalibrationPoint2(floorPlan.calibrationPoints.point2);
                    setIsCalibrationOpen(true);
                  } else {
                    handleChangeToolMode('calibrate');
                  }
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  toolMode === 'calibrate'
                    ? 'bg-[#4F6BFF] text-white shadow-xs'
                    : floorPlan?.isCalibrated
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title="Kalibrasi Skala 2-Titik (K)"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">
                  {floorPlan?.isCalibrated
                    ? `${floorPlan.pixelsPerMeter ? floorPlan.pixelsPerMeter.toFixed(0) : ''}px/m`
                    : 'Skala'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleChangeToolMode('place-device')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  toolMode === 'place-device'
                    ? 'bg-[#4F6BFF] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title="Pasang Perangkat IoT (P)"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Pasang IoT</span>
              </button>

              <div className="h-4 w-px bg-slate-200 mx-0.5" />

              {/* Undo / Redo */}
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length <= 1}
                className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={future.length === 0}
                className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* =======================================================================
              4. FLOATING LEFT PANEL: THE HERO DASHBOARD CARDS (Matching Reference!)
              ======================================================================= */}
          {!isPreviewMonitoring && !is3dMode && isLeftPanelOpen && (
            <div className="absolute top-3 left-6 z-20 w-[360px] sm:w-[390px] flex flex-col gap-3 max-h-[calc(100vh-100px)] overflow-y-auto no-scrollbar pointer-events-auto animate-in fade-in slide-in-from-left duration-200">
              {/* Header Tab Switcher Pill */}
              <div className="flex items-center justify-between p-1 rounded-2xl bg-white/90 backdrop-blur-md shadow-xs border border-white/80 shrink-0">
                <div className="flex items-center gap-0.5 flex-1 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setLeftTab('summary')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      leftTab === 'summary'
                        ? 'bg-[#4F6BFF] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Ringkasan
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeftTab('devices')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                      leftTab === 'devices'
                        ? 'bg-[#4F6BFF] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Katalog ({devices.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeftTab('rooms')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                      leftTab === 'rooms'
                        ? 'bg-[#4F6BFF] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Ruang ({rooms.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeftTab('library')}
                    className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      leftTab === 'library'
                        ? 'bg-[#4F6BFF] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mebel
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLeftPanelOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors ml-1"
                  title="Tutup Panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* TAB 1: SUMMARY (The exact 3 reference dashboard cards!) */}
              {leftTab === 'summary' && (
                <>
                  {/* Card Row 1: Alarms Pills */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/90 backdrop-blur-xl p-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-700 leading-tight">
                        Equipment<br />alarm
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FF5757] text-white font-mono text-xs font-black shadow-xs shadow-red-500/20">
                        {offlineOrAlertCount}
                      </span>
                    </div>

                    <div className="bg-white/90 backdrop-blur-xl p-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-700 leading-tight">
                        Personnel<br />alarm
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-black border border-slate-200">
                        0
                      </span>
                    </div>
                  </div>

                  {/* Card 2: "All Internet of Things Equipment" Progress & Legend */}
                  <div className="bg-white/90 backdrop-blur-xl p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-3.5">
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-600 tracking-tight">
                        All Internet of Things Equipment
                      </h3>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">
                          {devices.length.toLocaleString()}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-400">
                          - {quota?.maxDevices ? `${quota.maxDevices - devices.length} sisa kuota` : 'aktif'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar matching reference */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${normalPercent}%` }}
                        className="bg-gradient-to-r from-[#4F6BFF] to-[#38BDF8] h-full"
                      />
                      <div
                        style={{ width: `${alertPercent}%` }}
                        className="bg-[#FF6584] h-full"
                      />
                      <div
                        style={{ width: `${Math.max(0, 100 - normalPercent - alertPercent)}%` }}
                        className="bg-slate-200 h-full"
                      />
                    </div>

                    {/* Legend breakdown matching reference */}
                    <div className="space-y-1.5 text-xs pt-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full border-2 border-[#4F6BFF] bg-white inline-block" />
                          <span className="font-semibold text-slate-700">Normal</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-800">{onlineDevicesCount}</span>
                          <span className="font-mono text-slate-400 text-[11px] w-9 text-right">{normalPercent}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full border-2 border-[#FF5757] bg-white inline-block" />
                          <span className="font-semibold text-slate-700">Breakdown</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-[#FF5757]">{offlineOrAlertCount}</span>
                          <span className="font-mono text-slate-400 text-[11px] w-9 text-right">{alertPercent}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-400 bg-white inline-block" />
                          <span className="font-semibold text-slate-700">Offline / Standby</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-600">{devices.length - onlineDevicesCount}</span>
                          <span className="font-mono text-slate-400 text-[11px] w-9 text-right">
                            {Math.max(0, 100 - normalPercent)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: "Equipment overview" 2x2 Grid */}
                  <div className="bg-white/90 backdrop-blur-xl p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-3">
                    <h3 className="text-xs font-extrabold text-slate-700 tracking-tight">
                      Equipment overview
                    </h3>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* 1. Engine room (Kontrol) */}
                      <div
                        onClick={() => {
                          setSelectedCategoryTab('Engine room');
                          setLeftTab('devices');
                        }}
                        className="p-3 rounded-2xl bg-slate-50/80 hover:bg-amber-50/50 border border-slate-100 hover:border-amber-200 transition-all cursor-pointer space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-600 group-hover:text-amber-800 truncate">
                            Engine room
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Power className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xl font-black text-slate-900 font-mono">
                            {controlDevicesCount}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-between">
                          <span>Connection rate</span>
                          <span className="font-bold text-slate-700">92%</span>
                        </div>
                      </div>

                      {/* 2. Networking device (Sensor) */}
                      <div
                        onClick={() => {
                          setSelectedCategoryTab('Internet device');
                          setLeftTab('devices');
                        }}
                        className="p-3 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/50 border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-600 group-hover:text-emerald-800 truncate">
                            Networking
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Activity className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xl font-black text-slate-900 font-mono">
                            {sensorDevicesCount}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-between">
                          <span>Connection rate</span>
                          <span className="font-bold text-slate-700">98%</span>
                        </div>
                      </div>

                      {/* 3. Office device (Visual & CCTV - Active Hero Style from reference!) */}
                      <div
                        onClick={() => {
                          setSelectedCategoryTab('Office device');
                          setLeftTab('devices');
                        }}
                        className="p-3 rounded-2xl bg-gradient-to-br from-[#4F6BFF] to-[#3B82F6] text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-100 truncate">
                            Office device
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                            <Video className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xl font-black text-white font-mono">
                            {visualDevicesCount}
                          </span>
                        </div>
                        <div className="text-[10px] text-blue-100 flex items-center justify-between">
                          <span>Connection rate</span>
                          <span className="font-bold text-white">82%</span>
                        </div>
                      </div>

                      {/* 4. Other device (Mebel & Ruang) */}
                      <div
                        onClick={() => {
                          setLeftTab('rooms');
                        }}
                        className="p-3 rounded-2xl bg-slate-50/80 hover:bg-purple-50/50 border border-slate-100 hover:border-purple-200 transition-all cursor-pointer space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-600 group-hover:text-purple-800 truncate">
                            Other device
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Box className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xl font-black text-slate-900 font-mono">
                            {otherOrObjectsCount}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-between">
                          <span>Connection rate</span>
                          <span className="font-bold text-slate-700">78%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2, 3, 4: INTERACTIVE PANELS (Katalog IoT, Ruangan, Mebel, Lantai) */}
              {leftTab !== 'summary' && (
                <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white flex flex-col h-[560px] overflow-hidden">
                  <div className="flex-1 overflow-hidden">
                    {leftTab === 'devices' && (
                      <DeviceLibraryPanel
                        selectedCatalogItem={selectedCatalogItem}
                        onSelectCatalogItem={handleSelectCatalogItem}
                        placedDevicesCount={devices.length}
                        placedDevices={devices}
                        selectedDeviceId={selectedDeviceId}
                        onSelectPlacedDevice={(devId) => {
                          setSelectedDeviceId(devId);
                          setSelectedObjectId(null);
                          setSelectedRoomId(null);
                          setToolMode('select');
                        }}
                        quota={quota}
                        categoryFilter={selectedCategoryTab}
                        onClearCategoryFilter={() => setSelectedCategoryTab('Overview')}
                      />
                    )}

                    {leftTab === 'rooms' && (
                      <RoomExplorerPanel
                        rooms={rooms}
                        selectedRoomId={selectedRoomId}
                        onSelectRoom={(id) => {
                          setSelectedRoomId(id);
                          setSelectedObjectId(null);
                          setSelectedDeviceId(null);
                        }}
                        onStartDrawRoom={() => {
                          setDrawingTargetRoomId(null);
                          setToolMode('draw-room');
                        }}
                        onDeleteRoom={handleDeleteRoom}
                        hiddenRoomIds={hiddenRoomIds}
                        onToggleRoomVisibility={handleToggleRoomVisibility}
                        onEditRoomPolygon={(id) => {
                          const targetRoom = rooms.find((r) => r.id === id);
                          if (targetRoom && targetRoom.polygonCoordinates && targetRoom.polygonCoordinates.length >= 3) {
                            setSelectedRoomId(id);
                            setToolMode('edit-room');
                          } else {
                            setDrawingTargetRoomId(id);
                            setSelectedRoomId(id);
                            setToolMode('draw-room');
                          }
                        }}
                        onOpenAutoRoomReference={() => setIsAutoRoomRefOpen(true)}
                      />
                    )}

                    {leftTab === 'library' && (
                      <ObjectLibraryPanel
                        onAddObject={(catalogItem) => handleAddObject(catalogItem)}
                      />
                    )}

                    {leftTab === 'structure' && (
                      <div className="p-4 space-y-3 overflow-y-auto h-full text-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="font-bold text-[#181829]">Lantai Terdaftar</span>
                          <Badge variant="purple">{activeHouse?.floors.length || 0} Lantai</Badge>
                        </div>
                        {activeHouse?.floors.map((fl) => (
                          <div
                            key={fl.id}
                            onClick={() => handleSelectFloor(fl.id)}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                              fl.id === activeFloor?.id
                                ? 'border-[#4F6BFF] bg-blue-50/50 shadow-xs'
                                : 'border-slate-200 hover:border-blue-200'
                            }`}
                          >
                            <div>
                              <div className="font-bold text-[#181829]">{fl.name}</div>
                              <div className="text-[11px] text-[#71758E]">
                                Tingkat: {fl.levelNumber}
                              </div>
                            </div>
                            {fl.id === activeFloor?.id && (
                              <Badge variant="purple">Aktif</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =======================================================================
              5. CONTEXTUAL RIGHT INSPECTOR PANEL (Device / Room / Object)
              ======================================================================= */}
          {hasInspectorTarget && (
            <aside className="absolute top-3 right-6 bottom-3 w-[360px] sm:w-[390px] z-20 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right duration-200">
              {selectedDevice ? (
                <DeviceInspectorPanel
                  device={selectedDevice}
                  rooms={rooms}
                  onUpdateDevice={handleUpdateDevice}
                  onDeleteDevice={handleDeleteDevice}
                  onClose={() => setSelectedDeviceId(null)}
                />
              ) : selectedRoom ? (
                <RoomInspectorPanel
                  room={selectedRoom}
                  linkedObjects={floorPlan?.objects.filter((o) => o.roomId === selectedRoom.id) || []}
                  onUpdateRoom={(roomId, updates) => handleUpdateRoom(roomId, updates)}
                  onDeleteRoom={(roomId) => handleDeleteRoom(roomId)}
                  onDuplicateRoom={(roomId) => handleDuplicateRoom(roomId)}
                  onEditPolygon={(roomId) => {
                    if (selectedRoom.polygonCoordinates && selectedRoom.polygonCoordinates.length >= 3) {
                      setToolMode('edit-room');
                    } else {
                      setDrawingTargetRoomId(roomId);
                      setToolMode('draw-room');
                    }
                  }}
                  onSelectObject={(objId) => {
                    setSelectedObjectId(objId);
                    setSelectedRoomId(null);
                  }}
                  isCalibrated={!!floorPlan?.isCalibrated}
                  onClose={() => setSelectedRoomId(null)}
                />
              ) : selectedObject ? (
                <ObjectInspectorPanel
                  floorPlan={floorPlan}
                  selectedObject={selectedObject}
                  rooms={rooms}
                  suggestedRoomId={spatialDetections[selectedObject.id]}
                  onAssignRoom={handleAssignObjectRoom}
                  onUpdateObject={handleUpdateObject}
                  onDeleteObject={handleDeleteObject}
                  onDuplicateObject={handleDuplicateObject}
                  onBringForward={handleBringForward}
                  onSendBackward={handleSendBackward}
                  onBringToFront={handleBringToFront}
                  onSendToBack={handleSendToBack}
                  onUpdatePlanConfig={handleUpdatePlanConfig}
                  onOpenUploadBackground={() => setIsUploadBgOpen(true)}
                  onDeleteBackground={handleDeleteBackground}
                  onClose={() => setSelectedObjectId(null)}
                />
              ) : null}
            </aside>
          )}

          {/* =======================================================================
              6. FLOATING BOTTOM-RIGHT HUD: ZOOM & VIEW TOGGLES
              ======================================================================= */}
          <div className="absolute bottom-6 right-6 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200/90 shadow-xl">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(100, z - 15))}
              disabled={zoomLevel <= 100}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-[#4F6BFF] disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Perkecil Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="text-[11px] font-mono font-bold text-slate-700 px-1 min-w-[42px] text-center select-none">
              {zoomLevel}%
            </span>

            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(400, z + 15))}
              disabled={zoomLevel >= 400}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-[#4F6BFF] disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Perbesar Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-200 mx-0.5" />

            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-[#4F6BFF] transition-colors flex items-center gap-1"
              title="Pusatkan Denah / Ukuran Pas Frame (100%)"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="text-[10px] font-bold hidden sm:inline">Pusatkan</span>
            </button>

            {floorPlan?.imagePath && (
              <>
                <div className="h-4 w-px bg-slate-200 mx-0.5" />
                <button
                  type="button"
                  onClick={handleRotatePlan}
                  className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-[#4F6BFF] transition-colors flex items-center gap-1"
                  title="Putar Orientasi Denah 90°"
                >
                  <RotateCw className="w-4 h-4 text-[#4F6BFF]" />
                </button>
              </>
            )}

            <div className="h-4 w-px bg-slate-200 mx-0.5" />

            {/* Grid Toggle */}
            <button
              type="button"
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-xl transition-all ${
                showGrid ? 'bg-indigo-50 text-[#4F6BFF] font-bold' : 'text-slate-400 hover:bg-slate-100'
              }`}
              title={showGrid ? 'Sembunyikan Grid' : 'Tampilkan Grid'}
            >
              <Grid className="w-4 h-4" />
            </button>

            {/* Canvas Theme Toggle (Light / Dark) */}
            <button
              type="button"
              onClick={() => setCanvasTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              title={canvasTheme === 'light' ? 'Beralih ke Kanvas Gelap' : 'Beralih ke Kanvas Terang'}
            >
              {canvasTheme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>
          </div>

          {/* =======================================================================
              7. FLOATING BOTTOM-LEFT PILL: RE-OPEN DASHBOARD & QUICK SUMMARY
              ======================================================================= */}
          <div className="absolute bottom-6 left-6 z-10 flex items-center gap-2 pointer-events-auto">
            {!isPreviewMonitoring && !is3dMode && !isLeftPanelOpen && (
              <button
                type="button"
                onClick={() => setIsLeftPanelOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 text-slate-800 hover:text-[#4F6BFF] hover:bg-blue-50/50 font-bold text-xs shadow-xl transition-all"
                title="Buka Dashboard IoT Overview"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#4F6BFF]" />
                <span>Buka Dashboard ({devices.length} IoT)</span>
              </button>
            )}

            {isLeftPanelOpen && (
              <div className="hidden 2xl:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm text-xs font-semibold text-slate-600">
                <span className="font-bold text-slate-800">{activeHouse?.name}</span>
                <span>•</span>
                <span>{activeFloor?.name}</span>
                <span>•</span>
                <span className="text-[#4F6BFF] font-bold">{devices.length} IoT</span>
                <span>•</span>
                <span className="text-emerald-600 font-bold">{rooms.length} Ruangan</span>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <AddFloorModal
        isOpen={isAddFloorOpen}
        onClose={() => setIsAddFloorOpen(false)}
        onAddFloor={handleAddFloor}
        suggestedLevel={(activeHouse?.floors.length || 0) + 1}
      />

      <UploadBackgroundModal
        isOpen={isUploadBgOpen}
        onClose={() => setIsUploadBgOpen(false)}
        onUpload={handleUploadBackground}
        existingImagePath={floorPlan?.imagePath}
        onDelete={handleDeleteBackground}
      />

      <AutoRoomReferenceModal
        isOpen={isAutoRoomRefOpen}
        onClose={() => setIsAutoRoomRefOpen(false)}
        canvasBounds={stableCanvasBounds}
        pixelsPerMeter={floorPlan?.pixelsPerMeter}
        currentRoomCount={rooms.length}
        backgroundImageUrl={backgroundImageUrl}
        onApply={handleApplyAutoRoomReferences}
      />

      <CalibrationModal
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        point1={calibrationPoint1}
        point2={calibrationPoint2}
        onSaveCalibration={handleSaveCalibration}
        onResetCalibration={handleResetCalibration}
        isCalibrated={floorPlan?.isCalibrated || false}
      />

      <DeviceControlModal
        device={controlModalDevice}
        isOpen={!!controlModalDevice}
        onClose={() => setControlModalDevice(null)}
        onControlDevice={handleControlDevice}
      />

      {activeHouse && (
        <PublishModal
          houseId={activeHouse.id}
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          onStatusChanged={() => {
            if (activeHouse) {
        refreshPublishStatus(activeHouse.id);
        refreshQuota(activeHouse.id);
      }
          }}
        />
      )}

      {/* Phase 7: Smart Home Automation List & Manager */}
      <AutomationListPanel
        isOpen={isAutomationPanelOpen}
        onClose={() => setIsAutomationPanelOpen(false)}
        devices={devices}
        houseId={activeHouse?.id}
      />
    </div>
  );
};
