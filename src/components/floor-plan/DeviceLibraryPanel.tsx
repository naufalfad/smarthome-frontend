import React, { useState, useEffect, useCallback } from 'react';
import {
  Lightbulb,
  Sliders,
  Wind,
  Lock,
  Thermometer,
  Activity,
  Camera,
  DoorClosed,
  AppWindow,
  Flame,
  Droplets,
  Search,
  Check,
  Radio,
  HelpCircle,
  Cpu,
  Loader2,
  Sparkles,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { DeviceCatalogItem, DeviceCapability, IoTDevice } from '../../types/device';
import { deviceApi } from '../../services/device.api';
import { getDeviceVisualTheme } from '../../utils/device-visual';
import { Badge } from '../ui/badge';

export function getDeviceIconComponent(iconName: string): React.ComponentType<{ className?: string }> {
  const norm = (iconName || '').toLowerCase().trim();
  switch (norm) {
    case 'lightbulb':
    case 'light':
      return Lightbulb;
    case 'sliders':
    case 'dimmer':
      return Sliders;
    case 'wind':
    case 'ac':
      return Wind;
    case 'lock':
    case 'smart_lock':
      return Lock;
    case 'thermometer':
    case 'temp':
      return Thermometer;
    case 'activity':
    case 'air_quality':
      return Activity;
    case 'camera':
      return Camera;
    case 'door':
    case 'door_sensor':
      return DoorClosed;
    case 'window':
    case 'window_sensor':
      return AppWindow;
    case 'flame':
    case 'smoke':
      return Flame;
    case 'droplets':
    case 'water':
      return Droplets;
    default:
      return Cpu;
  }
}

export interface DeviceTemplate {
  type: string;
  label: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  defaultName: string;
  description: string;
}

export const DEVICE_TEMPLATES: DeviceTemplate[] = [
  {
    type: 'SMART_LIGHT',
    label: 'Smart Light',
    category: 'LIGHTING',
    icon: Lightbulb,
    color: '#EAB308',
    defaultName: 'Smart Light',
    description: 'Lampu cerdas dengan kontrol daya dan pengaturan tingkat kecerahan.',
  },
  {
    type: 'LIGHT',
    label: 'Smart Light',
    category: 'LIGHTING',
    icon: Lightbulb,
    color: '#EAB308',
    defaultName: 'Smart Light',
    description: 'Lampu cerdas on/off dan dimming.',
  },
  {
    type: 'SMART_DIMMER',
    label: 'Smart Dimmer Light',
    category: 'LIGHTING',
    icon: Sliders,
    color: '#F59E0B',
    defaultName: 'Smart Dimmer Light',
    description: 'Lampu dimmer presisi dengan pengaturan kecerahan dan temperatur warna cahaya.',
  },
  {
    type: 'SMART_AC',
    label: 'Smart AC',
    category: 'CLIMATE',
    icon: Wind,
    color: '#3B82F6',
    defaultName: 'Smart AC',
    description: 'Air Conditioner cerdas dengan pengatur target suhu, mode operasi, dan kecepatan kipas.',
  },
  {
    type: 'AC',
    label: 'Air Conditioner (AC)',
    category: 'CLIMATE',
    icon: Wind,
    color: '#3B82F6',
    defaultName: 'Air Conditioner',
    description: 'Pengatur suhu ruangan & mode pendingin.',
  },
  {
    type: 'SMART_LOCK',
    label: 'Smart Door Lock',
    category: 'SECURITY',
    icon: Lock,
    color: '#EF4444',
    defaultName: 'Smart Door Lock',
    description: 'Kunci pintu digital otomatis dengan status penguncian dan fitur auto-lock.',
  },
  {
    type: 'LOCK',
    label: 'Smart Door Lock',
    category: 'SECURITY',
    icon: Lock,
    color: '#EF4444',
    defaultName: 'Smart Door Lock',
    description: 'Kunci pintu digital otomatis & log akses.',
  },
  {
    type: 'TEMP_HUMIDITY_SENSOR',
    label: 'Temperature & Humidity Sensor',
    category: 'SENSORS',
    icon: Thermometer,
    color: '#10B981',
    defaultName: 'Sensor Suhu & Kelembapan',
    description: 'Sensor pemantau suhu dan kelembapan lingkungan ruangan secara berkala (Read-Only).',
  },
  {
    type: 'AIR_QUALITY_SENSOR',
    label: 'Air Quality Sensor',
    category: 'SENSORS',
    icon: Activity,
    color: '#06B6D4',
    defaultName: 'Sensor Kualitas Udara',
    description: 'Sensor pendeteksi indeks kualitas udara (AQI), partikel halus PM2.5, dan debu PM10 (Read-Only).',
  },
];

interface DeviceLibraryPanelProps {
  selectedCatalogItem: DeviceCatalogItem | null;
  onSelectCatalogItem: (item: DeviceCatalogItem | null) => void;
  placedDevicesCount?: number;
  placedDevices?: IoTDevice[];
  selectedDeviceId?: string | null;
  onSelectPlacedDevice?: (deviceId: string) => void;
  quota?: {
    currentDevices: number;
    maxDevices: number | null;
    isQuotaReached: boolean;
  } | null;
}

export const DeviceLibraryPanel: React.FC<DeviceLibraryPanelProps> = ({
  selectedCatalogItem,
  onSelectCatalogItem,
  placedDevicesCount = 0,
  placedDevices = [],
  selectedDeviceId = null,
  onSelectPlacedDevice,
  quota = null,
}) => {
  const [subTab, setSubTab] = useState<'catalog' | 'placed'>('catalog');
  const [catalogItems, setCatalogItems] = useState<DeviceCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const loadCatalog = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await deviceApi.getCatalog(activeCategory, search);
      setCatalogItems(items);
    } catch (err: any) {
      console.warn('Failed to fetch device catalog from API:', err);
      setError('Gagal memuat katalog perangkat IoT.');
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, search]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-50 text-purple-600">
              <Radio className="w-4 h-4" />
            </div>


            <div>
              <h3 className="text-xs font-bold text-[#181829]">Perangkat IoT</h3>
              <p className="text-[11px] text-[#71758E]">
                {subTab === 'catalog'
                  ? 'Pilih dari katalog lalu klik denah untuk memasang'
                  : 'Daftar perangkat terpasang & telemetri real-time'}
              </p>
            </div>


          </div>


          <Badge variant="purple" className="font-mono text-[10px]">
            {placedDevices.length} Terpasang
          </Badge>
        </div>



        {/* Sub-tab: Katalog vs Terpasang */}
        <div className="flex p-0.5 rounded-xl bg-slate-100 text-xs font-bold">
          <button
            type="button"
            onClick={() => setSubTab('catalog')}
            className={`flex-1 py-1 px-2 rounded-lg transition-all ${
              subTab === 'catalog'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Katalog Perangkat
          </button>
          <button
            type="button"
            onClick={() => setSubTab('placed')}
            className={`flex-1 py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              subTab === 'placed'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Terpasang</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-800">
              {placedDevices.length}
            </span>
          </button>
        </div>

        {/* Phase 11 Quota Indicator & Warning */}
        {quota && quota.maxDevices !== null && (
          <div
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-between border ${
              quota.isQuotaReached
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-purple-50 text-purple-700 border-purple-200'
            }`}
          >
            <span>Kuota Perangkat:</span>
            <span>
              {placedDevicesCount} / {quota.maxDevices}
            </span>
          </div>
        )}

        {quota?.isQuotaReached && (
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-medium flex items-start gap-1.5 leading-snug">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              Batas kuota perangkat telah tercapai ({quota.maxDevices} perangkat). Penambahan perangkat baru dibatasi.
            </span>
          </div>
        )}

        {/* Selected Placement Mode Banner */}
        {subTab === 'catalog' && selectedCatalogItem ? (
          <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2.5">
              {React.createElement(getDeviceIconComponent(selectedCatalogItem.icon), {
                className: 'w-4 h-4 text-purple-700 shrink-0',
              })}
              <div>
                <div className="text-xs font-bold text-purple-900">
                  Siap Memasang: {selectedCatalogItem.name}
                </div>


                <div className="text-[10px] text-purple-700">
                  Klik titik mana saja di denah rumah untuk menempatkan
                </div>


              </div>


            </div>


            <button
              onClick={() => onSelectCatalogItem(null)}
              className="text-[10px] font-bold text-purple-800 hover:text-purple-950 px-2 py-1 rounded-lg bg-white/80 border border-purple-200 transition-colors"
            >
              Batal
            </button>
          </div>


        ) : null}

        {subTab === 'catalog' && (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari tipe atau nama perangkat..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-colors"
              />
            </div>



            {/* Category Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'LIGHTING', label: 'Pencahayaan' },
                { id: 'CLIMATE', label: 'Iklim / AC' },
                { id: 'SECURITY', label: 'Keamanan' },
                { id: 'SENSORS', label: 'Sensor' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-purple-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>


          </>
        )}
      </div>

      {/* Catalog Items List vs Placed Devices Real-time List */}
      {subTab === 'catalog' ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs gap-2">
              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
              <span>Memuat katalog perangkat dari database...</span>
            </div>


          ) : error ? (
            <div className="text-center py-8 text-rose-500 text-xs space-y-2">
              <p>{error}</p>
              <button
                onClick={loadCatalog}
                className="px-3 py-1 bg-purple-50 text-purple-700 text-[11px] font-bold rounded-lg border border-purple-200 hover:bg-purple-100"
              >
                Coba Lagi
              </button>
            </div>


          ) : catalogItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Tidak ada perangkat yang cocok dengan pencarian
            </div>


          ) : (
            catalogItems.map((item) => {
              const IconComp = getDeviceIconComponent(item.icon);
              const isSelected = selectedCatalogItem?.id === item.id;
              const itemColor = item.color || '#8B5CF6';
              const capabilities: DeviceCapability[] = (item.capabilities as unknown as DeviceCapability[]) || [];
              const isSensor = item.category === 'SENSORS';

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectCatalogItem(isSelected ? null : item)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 group ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50/60 shadow-xs ring-1 ring-purple-500/20'
                      : 'border-slate-200/90 hover:border-purple-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: `${itemColor}18`,
                        color: itemColor,
                      }}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>



                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-[#181829] truncate">
                          {item.name}
                        </span>
                        {isSelected ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-md shrink-0">
                            <Check className="w-3 h-3" /> Dipilih
                          </span>
                        ) : (
                          <Badge variant="default" className="text-[9px] font-mono shrink-0">
                            {item.category}
                          </Badge>
                        )}
                      </div>


                      <p className="text-[11px] text-[#71758E] line-clamp-2 mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    </div>


                  </div>



                  {/* Capabilities Badges */}
                  {capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100">
                      {isSensor && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200/60">
                          Read-Only Sensor
                        </span>
                      )}
                      {capabilities.map((cap) => (
                        <span
                          key={cap.property}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                        >
                          {cap.label}
                          {cap.unit ? ` (${cap.unit})` : ''}
                        </span>
                      ))}
                    </div>


                  )}
                </div>


              );
            })
          )}
        </div>


      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 font-medium">
            <span>{placedDevices.length} Perangkat pada Denah</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[10.5px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>



          {placedDevices.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs space-y-1">
              <Cpu className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
              <p className="font-semibold text-slate-600">Belum ada perangkat terpasang</p>
              <p className="text-[11px] text-slate-400">Pilih tab "Katalog" lalu klik denah untuk memasang perangkat.</p>
            </div>


          ) : (
            placedDevices.map((dev) => {
              const isSelected = selectedDeviceId === dev.id;
              const theme = getDeviceVisualTheme(dev);
              const IconComp = getDeviceIconComponent(dev.catalogItem?.icon || dev.type);
              const config = (dev.configuration as Record<string, any>) || {};
              const devType = dev.catalogItem?.deviceType || dev.type;

              // Extract friendly live readings
              let metricSummary = '';
              if (devType === 'TEMP_HUMIDITY_SENSOR') {
                const t = config.temperature !== undefined ? `${config.temperature}°C` : '--';
                const h = config.humidity !== undefined ? `${config.humidity}%` : '--';
                metricSummary = `Suhu: ${t} • Kelembapan: ${h}`;
              } else if (devType === 'AIR_QUALITY_SENSOR') {
                const aqi = config.aqi !== undefined ? `AQI: ${config.aqi}` : '--';
                const pm = config.pm25 !== undefined ? `PM2.5: ${config.pm25} µg/m³` : '';
                metricSummary = `${aqi} • ${pm}`;
              } else if (devType === 'SMART_AC') {
                const target = config.targetTemperature !== undefined ? `Target: ${config.targetTemperature}°C` : '';
                const curr = config.currentTemperature !== undefined ? `Suhu Ruang: ${config.currentTemperature}°C` : '';
                const power = config.power ? 'ON' : 'OFF';
                metricSummary = `${power} • ${target} (${curr})`;
              } else if (devType === 'SMART_LIGHT' || devType === 'SMART_DIMMER') {
                const br = config.brightness !== undefined ? `${config.brightness}%` : '';
                const power = config.power ? 'ON' : 'OFF';
                metricSummary = `${power} • Kecerahan: ${br}`;
              } else if (devType === 'SMART_LOCK') {
                metricSummary = `Kunci: ${config.lockState || dev.status}`;
              }

              return (
                <div
                  key={dev.id}
                  onClick={() => onSelectPlacedDevice?.(dev.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50/70 shadow-xs ring-1 ring-purple-500/20'
                      : 'border-slate-200/90 hover:border-purple-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                        style={{
                          backgroundColor: `${theme.primaryColor}18`,
                          color: theme.primaryColor,
                        }}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>


                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#181829] truncate">
                          {dev.name}
                        </div>


                        <div className="text-[10px] text-slate-400 truncate">
                          {dev.manualRoomName || dev.catalogItem?.name || dev.type}
                        </div>


                      </div>


                    </div>



                    <span
                      className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 shrink-0"
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



                  {metricSummary && (
                    <div className="flex items-center justify-between text-[11px] font-mono text-purple-900 bg-purple-50/80 px-2 py-1 rounded-lg border border-purple-100">
                      <span className="truncate">{metricSummary}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0 ml-1" />
                    </div>


                  )}
                </div>


              );
            })
          )}
        </div>


      )}

      {/* Footer Instructions */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-[#71758E] flex items-center gap-2">
        <HelpCircle className="w-3.5 h-3.5 text-purple-600 shrink-0" />
        <span>
          {subTab === 'catalog'
            ? 'Pilih jenis perangkat dari katalog, lalu klik titik denah untuk memasang.'
            : 'Klik perangkat untuk melihat konfigurasi, status, dan riwayat di panel kanan.'}
        </span>
      </div>
    </div>
  );
};
