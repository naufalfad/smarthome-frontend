import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Trash2,
  X,
  Compass,
  MapPin,
  Radio,
  Sliders,
  Power,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCw,
  Info,
  CheckCircle2,
  Sparkles,
  Maximize2,
  Wind,
  Thermometer,
  Activity,
  Lightbulb,
  Server,
  Wifi,
  Clock,
} from 'lucide-react';
import { IoTDevice, DeviceCapability } from '../../types/device';
import { Room } from '../../types/floor-plan';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { getDeviceIconComponent } from './DeviceLibraryPanel';
import { getDeviceVisualTheme } from '../../utils/device-visual';
import { deviceApi } from '../../services/device.api';

interface DeviceInspectorPanelProps {
  device: IoTDevice | null;
  rooms: Room[];
  onUpdateDevice: (id: string, updates: Partial<IoTDevice>) => Promise<void>;
  onDeleteDevice: (id: string) => Promise<void>;
  onClose: () => void;
}

export const DeviceInspectorPanel: React.FC<DeviceInspectorPanelProps> = ({
  device,
  rooms,
  onUpdateDevice,
  onDeleteDevice,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [manualRoomName, setManualRoomName] = useState('');
  const [iconSize, setIconSize] = useState<number>(48);
  const [integrationStatus, setIntegrationStatus] = useState<string>('UNCONFIGURED');
  const [status, setStatus] = useState<string>('OFFLINE');
  const [capabilities, setCapabilities] = useState<DeviceCapability[]>([]);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const prevDeviceIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (device) {
      const isNewDevice = prevDeviceIdRef.current !== device.id;
      prevDeviceIdRef.current = device.id;

      if (isNewDevice) {
        setName(device.name || '');
        setManualRoomName(device.manualRoomName || '');
        setIconSize(device.iconWidth || 48);
      }
      setIntegrationStatus(device.integrationStatus || 'UNCONFIGURED');
      setStatus(device.status || 'OFFLINE');

      const existingConfig = (device.configuration as Record<string, any>) || {};
      const defaultCfg = (device.catalogItem?.defaultConfiguration as Record<string, any>) || {};
      setConfig({ ...defaultCfg, ...existingConfig });

      // Resolve capabilities on device change
      if (isNewDevice) {
        if (device.catalogItem?.capabilities && Array.isArray(device.catalogItem.capabilities)) {
          setCapabilities(device.catalogItem.capabilities as unknown as DeviceCapability[]);
        } else {
          deviceApi
            .getCapabilities(device.type)
            .then((caps) => setCapabilities(caps))
            .catch((err) => console.warn('Failed to fetch capabilities for', device.type, err));
        }
      }
    }
  }, [device]);

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-400">
        <Cpu className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
        <p className="text-xs font-semibold text-slate-500">Tidak ada perangkat yang dipilih</p>
        <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
          Klik salah satu ikon perangkat pada denah untuk melihat konfigurasi dan statusnya.
        </p>
      </div>
    );
  }

  const catalogItem = device.catalogItem;
  const iconName = catalogItem?.icon || device.type;
  const IconComponent = getDeviceIconComponent(iconName);
  const itemColor = catalogItem?.color || '#8B5CF6';
  const isSensor = catalogItem?.category === 'SENSORS';
  const theme = getDeviceVisualTheme(device);

  const handleSave = async (fieldsToUpdate: Partial<IoTDevice>) => {
    try {
      setIsSaving(true);
      await onUpdateDevice(device.id, fieldsToUpdate);
    } catch (err) {
      console.error('Failed to update device:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateConfigProperty = async (property: string, value: any) => {
    const updatedConfig = { ...config, [property]: value };
    setConfig(updatedConfig);

    // Derived high-level status synchronization
    let nextStatus = status;
    if (property === 'power') {
      nextStatus = value ? 'ON' : 'OFF';
      setStatus(nextStatus);
    } else if (property === 'lockState') {
      nextStatus = value;
      setStatus(nextStatus);
    }

    try {
      setIsSaving(true);
      await deviceApi.updateDeviceConfiguration(device.id, { [property]: value }, false);
      await onUpdateDevice(device.id, {
        configuration: updatedConfig,
        status: nextStatus,
        integrationStatus: 'SIMULATED',
      });
    } catch (err: any) {
      alert(`Gagal menyimpan konfigurasi: ${err.message || 'Format tidak valid'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
            style={{
              backgroundColor: `${itemColor}18`,
              color: itemColor,
            }}
          >
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#181829] leading-tight truncate max-w-[150px]">
              {catalogItem?.name || device.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-mono text-purple-700 font-bold uppercase">
                {catalogItem?.category || device.type}
              </span>
              <span
                className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full border flex items-center gap-1 shrink-0"
                style={{
                  backgroundColor: `${theme.primaryColor}18`,
                  color: theme.primaryColor,
                  borderColor: `${theme.primaryColor}40`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                {theme.statusText}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Tutup Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Device Name */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700">Nama Perangkat</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => handleSave({ name })}
            placeholder="cth. Lampu Meja Belajar"
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-colors font-medium text-[#181829]"
          />
        </div>

        {/* Icon Display Size */}
        <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs font-bold text-[#181829]">
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Ukuran Tampilan Ikon</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-lg">
              {iconSize}px
            </span>
          </div>

          <p className="text-[11px] text-[#71758E]">
            Atur ukuran ikon pada denah. Aspect ratio 1:1 terkunci (28px – 120px).
          </p>

          <input
            type="range"
            min={28}
            max={120}
            step={2}
            value={iconSize}
            onChange={(e) => {
              const val = Number(e.target.value);
              setIconSize(val);
              handleSave({ iconWidth: val, iconHeight: val });
            }}
            className="w-full accent-purple-600 cursor-pointer"
          />

          <div className="flex items-center justify-between gap-1 pt-1">
            {[
              { label: 'Kecil', size: 36 },
              { label: 'Normal', size: 48 },
              { label: 'Besar', size: 64 },
              { label: 'Ekstra', size: 84 },
            ].map((preset) => (
              <button
                key={preset.size}
                type="button"
                onClick={() => {
                  setIconSize(preset.size);
                  handleSave({ iconWidth: preset.size, iconHeight: preset.size });
                }}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  iconSize === preset.size
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {preset.label} ({preset.size})
              </button>
            ))}
          </div>
        </div>

        {/* Phase 6: Hardware Abstraction & Provider Details */}
        <div className="space-y-2 p-3 rounded-xl bg-purple-50/50 border border-purple-200/80">
          <div className="flex items-center justify-between text-xs font-bold text-[#181829]">
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-purple-600" />
              <span>Provider & Koneksi</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
              {device.providerType || 'VIRTUAL'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-white border border-purple-100 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Status Koneksi</span>
              <div className="flex items-center gap-1.5 mt-1 font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{device.connectionStatus || 'ONLINE'}</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-white border border-purple-100 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Sumber Data</span>
              <div className="mt-1 font-mono font-bold text-purple-800 text-[11px]">
                {device.dataSource || 'SIMULATION'}
              </div>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-white border border-purple-100 flex items-center justify-between text-[10.5px]">
            <span className="text-slate-500 font-medium">Sinkronisasi Live:</span>
            <div className="flex items-center gap-1.5 text-emerald-600 font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>
                {device.lastSeenAt
                  ? new Date(device.lastSeenAt).toLocaleTimeString()
                  : 'Aktif'}
              </span>
            </div>
          </div>

          <div className="text-[10px] text-purple-700 font-medium leading-tight">
            ⚡ Beroperasi melalui <strong>Virtual Device Provider</strong> (Simulated Engine).
          </div>
        </div>

        {/* Dynamic Capabilities Configuration Section */}
        {capabilities.length > 0 && (
          <div className="space-y-3 p-3.5 rounded-2xl bg-purple-50/40 border border-purple-200/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-950">
                <Sliders className="w-3.5 h-3.5 text-purple-700" />
                <span>Konfigurasi & Kemampuan</span>
              </div>
              {isSensor ? (
                <span className="text-[9px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sensor
                </span>
              ) : (
                <span className="text-[9px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  Dapat Dikontrol
                </span>
              )}
            </div>

            <div className="space-y-3 pt-1">
              {capabilities.map((cap) => {
                const val = config[cap.property] ?? cap.defaultValue;

                // 1. Read-Only Sensor Property
                if (!cap.controllable) {
                  return (
                    <div
                      key={cap.property}
                      className="p-2.5 rounded-xl bg-white border border-purple-200/60 flex items-center justify-between shadow-2xs"
                    >
                      <div>
                        <span className="text-[11px] font-bold text-slate-700 block">
                          {cap.label}
                        </span>
                        {cap.description && (
                          <span className="text-[10px] text-slate-400 block line-clamp-1">
                            {cap.description}
                          </span>
                        )}
                      </div>
                      <div className="text-right flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Telemetry Live" />
                        <span className="text-sm font-extrabold text-purple-950 font-mono transition-all">
                          {val}
                        </span>
                        {cap.unit && (
                          <span className="text-xs font-semibold text-purple-700">
                            {cap.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                // 2. Controllable: Boolean (Power, AutoLock, etc.)
                if (cap.type === 'boolean') {
                  const isChecked = Boolean(val);
                  return (
                    <div
                      key={cap.property}
                      className="p-2.5 rounded-xl bg-white border border-purple-200/60 flex items-center justify-between shadow-2xs"
                    >
                      <div>
                        <span className="text-[11px] font-bold text-slate-800 block">
                          {cap.label}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {isChecked ? 'Status: Aktif / Menyala' : 'Status: Non-aktif / Mati'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpdateConfigProperty(cap.property, !isChecked)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                          isChecked
                            ? catalogItem?.category === 'LIGHTING'
                              ? 'bg-amber-500 hover:bg-amber-600 text-white'
                              : catalogItem?.category === 'CLIMATE'
                              ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isChecked ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>
                  );
                }

                // 3. Controllable: Number Range (Brightness, Target Temp, Color Temp)
                if (cap.type === 'number') {
                  const numVal = Number(val ?? cap.defaultValue);
                  return (
                    <div
                      key={cap.property}
                      className="p-2.5 rounded-xl bg-white border border-purple-200/60 space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{cap.label}</span>
                        <span className="font-mono font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          {numVal} {cap.unit || ''}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={cap.min ?? 0}
                        max={cap.max ?? 100}
                        step={cap.step ?? 1}
                        value={numVal}
                        onChange={(e) =>
                          handleUpdateConfigProperty(cap.property, Number(e.target.value))
                        }
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>
                          Min: {cap.min}
                          {cap.unit}
                        </span>
                        <span>
                          Max: {cap.max}
                          {cap.unit}
                        </span>
                      </div>
                    </div>
                  );
                }

                // 4. Controllable: Enum Options (AC Mode, Fan Speed, Lock State)
                if (cap.type === 'enum' && cap.options) {
                  return (
                    <div
                      key={cap.property}
                      className="p-2.5 rounded-xl bg-white border border-purple-200/60 space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{cap.label}</span>
                        <span className="font-mono font-bold text-purple-700 text-[11px]">
                          {val}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        {cap.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleUpdateConfigProperty(cap.property, opt)}
                            className={`py-1 px-2 rounded-lg text-[10px] font-bold transition-all ${
                              val === opt
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        )}

        {/* Location / Room Name (Clean manual input) */}
        <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#181829]">
            <MapPin className="w-3.5 h-3.5 text-purple-600" />
            <span>Lokasi / Ruangan (Opsional)</span>
          </div>

          <p className="text-[11px] text-[#71758E]">
            Tulis nama ruangan tempat perangkat berada untuk memudahkan identifikasi.
          </p>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600">Nama Ruangan / Area</label>
            <input
              type="text"
              value={manualRoomName}
              onChange={(e) => setManualRoomName(e.target.value)}
              onBlur={() => handleSave({ manualRoomName })}
              placeholder="cth. Ruang Keluarga, Kamar Utama, Teras"
              className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors font-medium"
            />
          </div>
        </div>

        {/* Position & Relative Coordinates */}
        <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs font-bold text-[#181829]">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-purple-600" />
              <span>Koordinat Posisi</span>
            </div>
            <span className="text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-mono font-bold">
              Scale-Invariant
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-slate-400 font-mono">World X / Y</span>
              <div className="font-mono font-bold text-[#181829] mt-0.5">
                {Math.round(device.x)}px, {Math.round(device.y)}px
              </div>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-purple-600 font-mono">Relatif Norm</span>
              <div className="font-mono font-bold text-purple-800 mt-0.5">
                {(device.normalizedX * 100).toFixed(1)}%, {(device.normalizedY * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Delete Device */}
        <div className="pt-2">
          <Button
            variant="danger"
            size="sm"
            className="w-full text-xs gap-1.5"
            onClick={() => {
              if (window.confirm(`Hapus perangkat '${device.name}' dari denah?`)) {
                onDeleteDevice(device.id);
              }
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Perangkat dari Denah</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
