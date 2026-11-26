import React, { useState, useEffect } from 'react';
import {
  X,
  Power,
  Lock,
  Unlock,
  Thermometer,
  Wind,
  Sun,
  Activity,
  Sliders,
  Sparkles,
  Info,
  CheckCircle2,
  RefreshCw,
  Droplets,
  AlertTriangle,
} from 'lucide-react';
import { IoTDevice, DeviceCapability } from '../../types/device';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { getDeviceIconComponent } from './DeviceLibraryPanel';
import { getDeviceVisualTheme } from '../../utils/device-visual';
import { deviceApi } from '../../services/device.api';
import { LiveVideoStreamPlayer } from './LiveVideoStreamPlayer';

interface DeviceControlModalProps {
  device: IoTDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onControlDevice?: (
    deviceId: string,
    action: string,
    payload?: any
  ) => Promise<void>;
}

export const DeviceControlModal: React.FC<DeviceControlModalProps> = ({
  device,
  isOpen,
  onClose,
  onControlDevice,
}) => {
  if (!isOpen || !device) return null;

  const [capabilities, setCapabilities] = useState<DeviceCapability[]>([]);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [status, setStatus] = useState<string>(device.status || 'OFFLINE');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [commandStatus, setCommandStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [commandError, setCommandError] = useState<string | null>(null);

  useEffect(() => {
    if (device) {
      setStatus(device.status || 'OFFLINE');
      const existingConfig = (device.configuration as Record<string, any>) || {};
      const defaultCfg = (device.catalogItem?.defaultConfiguration as Record<string, any>) || {};
      setConfig({ ...defaultCfg, ...existingConfig });

      if (device.catalogItem?.capabilities && Array.isArray(device.catalogItem.capabilities)) {
        setCapabilities(device.catalogItem.capabilities as unknown as DeviceCapability[]);
      } else {
        deviceApi
          .getCapabilities(device.type)
          .then((caps) => setCapabilities(caps))
          .catch((err) => console.warn('Failed to load capabilities:', err));
      }
    }
  }, [device]);

  const catalogItem = device.catalogItem;
  const iconName = catalogItem?.icon || device.type;
  const IconComponent = getDeviceIconComponent(iconName);
  const itemColor = catalogItem?.color || '#8B5CF6';
  
  const isVisualDevice =
    catalogItem?.category === 'VISUAL' ||
    device.type === 'OUTDOOR_CAMERA' ||
    device.type === 'INDOOR_CAMERA' ||
    device.type === 'VIDEO_DOORBELL' ||
    device.type === 'SMART_DISPLAY_HUB' ||
    device.type.includes('CAMERA');

  const isSensor =
    catalogItem?.category === 'MONITORING' ||
    catalogItem?.category === 'SENSORS' ||
    (!isVisualDevice && capabilities.length > 0 && capabilities.every((c) => !c.controllable));

  const handleUpdateConfigProperty = async (property: string, value: any) => {
    const nextConfig = { ...config, [property]: value };
    setConfig(nextConfig);

    let nextStatus = status;
    if (property === 'power') {
      nextStatus = value ? 'ON' : 'OFF';
      setStatus(nextStatus);
    } else if (property === 'lockState') {
      nextStatus = value;
      setStatus(nextStatus);
    }

    if (onControlDevice) {
      try {
        setIsLoading(true);
        setCommandStatus('PROCESSING');
        setCommandError(null);

        // Map to standardized Phase 6 command action
        let action = 'SET_CONFIG';
        if (property === 'power') {
          action = 'SET_POWER';
        } else if (property === 'lockState') {
          action = value === 'LOCKED' ? 'LOCK' : 'UNLOCK';
        } else if (property === 'brightness') {
          action = 'SET_BRIGHTNESS';
        } else if (property === 'targetTemperature') {
          action = 'SET_TEMPERATURE';
        }

        await onControlDevice(device.id, action, {
          [property]: value,
          ...(property === 'power' ? { power: value } : {}),
          ...(property === 'lockState' ? { lockState: value } : {}),
        });
        setCommandStatus('SUCCESS');
        setTimeout(() => setCommandStatus('IDLE'), 2500);
      } catch (err: any) {
        console.error('Failed to control device:', err);
        setCommandStatus('FAILED');
        setCommandError(err.message || 'Perintah kontrol gagal diproses');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTogglePower = () => {
    const isCurrentlyOn = config.power ?? (status === 'ON');
    handleUpdateConfigProperty('power', !isCurrentlyOn);
  };

  const handleToggleLock = () => {
    const currentLock = config.lockState ?? status;
    const nextLock = currentLock === 'LOCKED' ? 'UNLOCKED' : 'LOCKED';
    handleUpdateConfigProperty('lockState', nextLock);
  };

  const isPowerOn = config.power ?? (status === 'ON');
  const isLocked = (config.lockState ?? status) === 'LOCKED';
  const theme = getDeviceVisualTheme({
    ...device,
    status: status as any,
    configuration: config,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`bg-white rounded-3xl shadow-2xl border border-slate-200 w-full ${isVisualDevice ? 'max-w-xl' : 'max-w-md'} overflow-hidden animate-in zoom-in-95 duration-200`}>
        {/* Banner VIRTUAL PROVIDER / SIMULATION (Phase 6 requirement) */}
        <div className="bg-purple-600 px-4 py-2 flex items-center justify-between text-white shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-black tracking-wider uppercase">
            <Sparkles className="w-4 h-4 fill-white" />
            <span>[VIRTUAL DEVICE] MONITORING & KONTROL</span>
          </div>
          <div className="flex items-center gap-1.5">
            {commandStatus === 'PROCESSING' && (
              <span className="text-[10px] font-mono bg-purple-800 px-2 py-0.5 rounded text-amber-200 animate-pulse font-bold">
                Memproses...
              </span>
            )}
            {commandStatus === 'SUCCESS' && (
              <span className="text-[10px] font-mono bg-emerald-600 px-2 py-0.5 rounded text-white font-bold">
                ✓ Sukses
              </span>
            )}
            {commandStatus === 'FAILED' && (
              <span className="text-[10px] font-mono bg-red-600 px-2 py-0.5 rounded text-white font-bold">
                ✗ Gagal
              </span>
            )}
            <span className="text-[10px] font-mono bg-purple-700/80 px-2 py-0.5 rounded text-purple-100">
              Preview Mode
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
              style={{
                backgroundColor: `${itemColor}18`,
                color: itemColor,
              }}
            >
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#181829] leading-tight">
                {device.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold text-[#71758E]">
                  {device.manualRoomName || 'Tanpa Ruangan'}
                </span>
                <span className="text-[10px] text-slate-300">•</span>
                <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                  {catalogItem?.category || device.type}
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5"
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
            className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Command Error Alert */}
          {commandError && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Perintah Gagal / Ditolak</span>
                <span className="text-[11px] leading-snug">{commandError}</span>
              </div>
            </div>
          )}

          {/* VISUAL LIVE CAMERA STREAM PLAYER */}
          {isVisualDevice ? (
            <div className="space-y-3">
              <LiveVideoStreamPlayer
                device={{
                  ...device,
                  configuration: config,
                  status,
                }}
                onControlDevice={onControlDevice}
              />
            </div>
          ) : isSensor ? (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="text-[11px] text-amber-900 font-medium leading-snug">
                  Perangkat ini adalah <strong>sensor pembacaan (monitoring only)</strong>. Tidak ada kontrol saklar ON/OFF.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {capabilities.map((cap) => {
                  const val = config[cap.property] ?? cap.defaultValue;
                  return (
                    <div
                      key={cap.property}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
                    >
                      <span className="text-[11px] font-bold text-slate-600 block">
                        {cap.label}
                      </span>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-[#181829] font-mono">
                          {val}
                        </span>
                        {cap.unit && (
                          <span className="text-xs font-bold text-purple-700">
                            {cap.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* CONTROLLABLE DEVICE VIEW */
            <div className="space-y-4">
              {/* Primary Power / Lock Switch */}
              {capabilities.some((c) => c.property === 'power') && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Daya Utama</span>
                    <span className="text-[11px] text-slate-500 block">
                      Status saat ini: {isPowerOn ? 'Menyala (ON)' : 'Mati (OFF)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTogglePower}
                    className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs ${
                      isPowerOn
                        ? (catalogItem?.category === 'LIGHTING' || device.type.includes('LIGHT'))
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25'
                          : (catalogItem?.category === 'CLIMATE' || device.type.includes('AC'))
                          ? 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-cyan-500/25'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    <span>{isPowerOn ? 'MENYALA' : 'MATI'}</span>
                  </button>
                </div>
              )}

              {capabilities.some((c) => c.property === 'lockState') && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Status Kunci Pintu</span>
                    <span className="text-[11px] text-slate-500 block">
                      Status fisik: {isLocked ? 'TERKUNCI (LOCKED)' : 'TERBUKA (UNLOCKED)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleLock}
                    className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs ${
                      isLocked
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                        : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25'
                    }`}
                  >
                    {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    <span>{isLocked ? 'TERKUNCI' : 'TERBUKA'}</span>
                  </button>
                </div>
              )}

              {/* Read-only Live Telemetry Properties (e.g. Current Temp on AC, Power Draw) */}
              {capabilities.some((c) => !c.controllable) && (
                <div className="grid grid-cols-2 gap-2 p-3 bg-purple-50/60 rounded-2xl border border-purple-100/80">
                  {capabilities
                    .filter((c) => !c.controllable)
                    .map((cap) => {
                      const val = config[cap.property] ?? cap.defaultValue;
                      return (
                        <div key={cap.property} className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {cap.label}
                          </span>
                          <span className="text-lg font-black text-purple-900 font-mono">
                            {val} {cap.unit || ''}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Number Controls (Brightness, Target Temp, etc.) */}
              {capabilities
                .filter((c) => c.controllable && c.type === 'number')
                .map((cap) => {
                  const numVal = Number(config[cap.property] ?? cap.defaultValue);
                  return (
                    <div
                      key={cap.property}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{cap.label}</span>
                        <span className="font-mono font-black text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md">
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
                    </div>
                  );
                })}

              {/* Enum Controls (AC Mode, Fan Speed) */}
              {capabilities
                .filter((c) => c.controllable && c.type === 'enum' && c.property !== 'lockState')
                .map((cap) => {
                  const currentVal = config[cap.property] ?? cap.defaultValue;
                  return (
                    <div
                      key={cap.property}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{cap.label}</span>
                        <span className="font-mono font-bold text-purple-700">{currentVal}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {cap.options?.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleUpdateConfigProperty(cap.property, opt)}
                            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                              currentVal === opt
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Phase 6 Hardware Abstraction & Provider Note */}
          <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200/80 text-[11px] text-purple-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <p className="leading-snug">
              <strong>Virtual Device Provider:</strong> Perintah dikirim melalui Standardized Command Lifecycle ke Virtual Device Provider backend. Telemetri dihasilkan otonom oleh Background IoT Simulation Engine (5s interval).
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs font-bold">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
};
