import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { CalibrationModal } from '../../components/floor-plan/CalibrationModal';
import { AutomationListPanel } from '../../components/automation/AutomationListPanel';

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

  // IoT Devices State (Product Direction Adjustment)
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<DeviceCatalogItem | null>(null);
  const [controlModalDevice, setControlModalDevice] = useState<IoTDevice | null>(null);

  // Publish & Preview Monitoring States
  const [publishStatus, setPublishStatus] = useState<string>('DRAFT');
  const [isPreviewMonitoring, setIsPreviewMonitoring] = useState<boolean>(false);
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
  const [leftTab, setLeftTab] = useState<'devices' | 'library' | 'rooms' | 'structure'>('devices');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [showRoomPolygons, setShowRoomPolygons] = useState<boolean>(true);
  const [drawingTargetRoomId, setDrawingTargetRoomId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('SAVED');
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null);

  // Modals & Calibration Tool State (Phase 10)
  const [isAddFloorOpen, setIsAddFloorOpen] = useState<boolean>(false);
  const [isUploadBgOpen, setIsUploadBgOpen] = useState<boolean>(false);
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
      const updated = await roomApi.updateRoomPolygon(roomId, points);
      setRooms((prev) => prev.map((r) => (r.id === roomId ? updated.room : r)));
      setSaveStatus('SAVED');
      setLastErrorMessage(null);
      if (floorPlan) refreshSpatialDetections(floorPlan.id);
    } catch (err: any) {
      setSaveStatus('ERROR');
      setLastErrorMessage(err?.message || 'Gagal menyimpan bentuk poligon ruangan');
      console.error('Failed to update room polygon:', err);
      alert(`Gagal menyimpan poligon: ${err?.message || 'Pastikan garis poligon tidak bersilangan dan minimal memiliki 3 titik.'}`);
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

  // Selected Entities
  const selectedObject =
    floorPlan?.objects?.find((o) => o.id === selectedObjectId) || null;
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || null;
  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || null;

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

  return (
    <div className="flex flex-col gap-3.5 p-4 max-w-[1920px] mx-auto min-h-screen">
      {/* Workspace Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-[0_10px_30px_-5px_rgba(112,118,150,0.06)]">
        <div className="flex items-center gap-3">
          {role === 'TECHNICIAN' ? (
            <Link
              to="/technician"
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Kembali ke Ruang Kerja Teknisi"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          ) : (
            <Link
              to="/"
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Kembali ke Dashboard Admin"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <div className="p-2.5 rounded-2xl bg-purple-50 text-[#8B5CF6] border border-purple-100 shadow-xs">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#181829] tracking-tight">
                Smart Home 2D Floor Plan Studio
              </h1>
              {role === 'TECHNICIAN' ? (
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                  Field Specialist
                </Badge>
              ) : (
                <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-bold">
                  Super Admin
                </Badge>
              )}
              <Badge
                variant={
                  publishStatus === 'PUBLISHED'
                    ? 'success'
                    : publishStatus === 'PREVIEW'
                    ? 'purple'
                    : 'default'
                }
                className="text-[10px] font-mono font-bold"
              >
                {publishStatus}
              </Badge>
              {isPreviewMonitoring && (
                <div className="flex items-center gap-1.5">
                  <Badge variant="purple" className="text-[10px] uppercase font-mono flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>[VIRTUAL DEVICE / SIMULATED]</span>
                  </Badge>
                  {lastTelemetryTime && (
                    <span className="text-[10px] font-mono font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      Sync: {lastTelemetryTime.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-[#71758E] mt-0.5">
              Dashboard konfigurasi perangkat IoT, penempatan ikon denah, dan publikasi monitoring
            </p>
          </div>
        </div>

        {/* Quick Summary Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#71758E]">
          <span className="font-bold text-[#181829]">{activeHouse?.name}</span>
          <span>•</span>
          <span className="font-bold text-purple-700">{activeFloor?.name}</span>
          <span>•</span>
          <span className="font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-purple-600" />
            <span>
              Perangkat: {devices.length}
              {quota?.maxDevices ? ` / ${quota.maxDevices}` : ''}
            </span>
          </span>
          <span>•</span>
          <span className="font-semibold text-slate-600">{rooms.length} Ruangan</span>

          {/* Phase 11 Handover Action & Status Badges */}
          {activeHouse && (activeHouse.setupStatus === 'CONFIGURING' || !activeHouse.setupStatus) && (
            <button
              type="button"
              onClick={handleMarkReadyForHandover}
              className="flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              title="Tandai properti siap untuk serah terima (Handover)"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ajukan Siap Handover</span>
            </button>
          )}

          {activeHouse?.setupStatus === 'READY_FOR_HANDOVER' && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Menunggu Handover Admin</span>
            </Badge>
          )}

          {activeHouse?.setupStatus === 'ACTIVE' && (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Properti Aktif</span>
            </Badge>
          )}

          <button
            onClick={() => setIsAutomationPanelOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 ml-1 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-xs transition-colors"
            title="Buka Smart Home Automation Engine"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Otomasi</span>
          </button>
        </div>
      </div>

      {/* Main Toolbar */}
      <FloorPlanToolbar
        houses={houses}
        activeHouse={activeHouse}
        activeFloor={activeFloor}
        floorPlan={floorPlan}
        toolMode={toolMode}
        onChangeToolMode={(mode) => {
          setToolMode(mode);
          if (mode === 'draw-room') {
            setSelectedObjectId(null);
            setSelectedRoomId(null);
            setSelectedDeviceId(null);
          } else if (mode === 'place-device') {
            setLeftTab('devices');
          } else if (mode === 'calibrate') {
            setSelectedObjectId(null);
            setSelectedRoomId(null);
            setSelectedDeviceId(null);
          }
        }}
        onSelectHouse={handleSelectHouse}
        onSelectFloor={handleSelectFloor}
        onOpenAddFloor={() => setIsAddFloorOpen(true)}
        onOpenUploadBackground={() => setIsUploadBgOpen(true)}
        hasBackgroundImage={!!floorPlan?.imagePath}
        onDeleteBackground={handleToolbarDeleteBackground}
        onDeleteActiveFloor={handleDeleteActiveFloor}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        snapToGrid={snapToGrid}
        onToggleSnap={handleToggleSnap}
        showRoomPolygons={showRoomPolygons}
        onToggleRoomPolygons={() => setShowRoomPolygons(!showRoomPolygons)}
        onOpenCalibrationModal={() => {
          if (floorPlan?.calibrationPoints) {
            setCalibrationPoint1(floorPlan.calibrationPoints.point1);
            setCalibrationPoint2(floorPlan.calibrationPoints.point2);
            setIsCalibrationOpen(true);
          } else {
            setToolMode('calibrate');
          }
        }}
        canUndo={history.length > 1}
        onUndo={handleUndo}
        canRedo={future.length > 0}
        onRedo={handleRedo}
        zoomLevel={zoomLevel}
        onZoomIn={() => setZoomLevel((z) => Math.min(400, z + 15))}
        onZoomOut={() => setZoomLevel((z) => Math.max(25, z - 15))}
        onResetZoom={() => setZoomLevel(100)}
        saveStatus={saveStatus}
        lastErrorMessage={lastErrorMessage}
        onResetCalibration={handleResetCalibration}
        isPreviewMonitoring={isPreviewMonitoring}
        onTogglePreviewMonitoring={() => {
          const next = !isPreviewMonitoring;
          setIsPreviewMonitoring(next);
          if (next) {
            setSelectedDeviceId(null);
            setSelectedObjectId(null);
            setSelectedRoomId(null);
            setToolMode('select');
          }
        }}
        publishStatus={publishStatus}
        onOpenPublishModal={() => setIsPublishModalOpen(true)}
        onOpenAutomationModal={() => setIsAutomationPanelOpen(true)}
      />

      {/* 3-Pane Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 h-[calc(100vh-230px)] min-h-[640px]">
        {/* =========================================================================
            LEFT PANEL (3 cols): IoT Catalog, Furniture Library, Rooms, Structure
            ========================================================================= */}
        <div className="lg:col-span-3 h-full flex flex-col bg-white rounded-3xl border border-slate-200/80 shadow-[0_10px_30px_-5px_rgba(112,118,150,0.06)] overflow-hidden">
          {/* Tab Switcher */}
          <div className="p-2 border-b border-slate-100 flex items-center gap-1 bg-slate-50/50">
            <button
              onClick={() => setLeftTab('devices')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                leftTab === 'devices'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-[#71758E] hover:text-[#181829]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>IoT ({devices.length})</span>
            </button>
            <button
              onClick={() => setLeftTab('rooms')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                leftTab === 'rooms'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-[#71758E] hover:text-[#181829]'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Ruang ({rooms.length})</span>
            </button>
            <button
              onClick={() => setLeftTab('library')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                leftTab === 'library'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-[#71758E] hover:text-[#181829]'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Mebel</span>
            </button>
            <button
              onClick={() => setLeftTab('structure')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                leftTab === 'structure'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-[#71758E] hover:text-[#181829]'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Lantai</span>
            </button>
          </div>

          {/* Panel Body */}
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
                        ? 'border-purple-500 bg-purple-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-purple-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[#181829]">{fl.name}</div>
                      <div className="text-[11px] text-[#71758E]">
                        Tingkat: {fl.levelNumber}
                      </div>
                    </div>
                    {fl.id === activeFloor?.id && (
                      <Badge variant="purple">
                        Aktif
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            CENTER CANVAS (6 cols): SVG Floor Plan Canvas + Interactive Devices
            ========================================================================= */}
        <div className="lg:col-span-6 h-full flex flex-col bg-[#0F172A] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative">
          {floorPlan ? (
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
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <AlertCircle className="w-8 h-8 text-slate-500 mb-2" />
              <p className="text-xs font-semibold text-slate-300">Denah tidak tersedia</p>
              <p className="text-[11px] text-slate-500 mt-1">Pilih lantai lain atau buat denah baru.</p>
            </div>
          )}
        </div>

        {/* =========================================================================
            RIGHT PANEL (3 cols): Contextual Inspector (Device / Room / Object)
            ========================================================================= */}
        <div className="lg:col-span-3 h-full flex flex-col bg-white rounded-3xl border border-slate-200/80 shadow-[0_10px_30px_-5px_rgba(112,118,150,0.06)] overflow-hidden">
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
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-400">
              <Cpu className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Tidak Ada Elemen Dipilih</p>
              <p className="text-[11px] text-[#71758E] mt-1 max-w-[220px]">
                Klik ikon perangkat IoT, poligon ruangan, atau mebel pada denah untuk mengonfigurasi.
              </p>
            </div>
          )}
        </div>
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
