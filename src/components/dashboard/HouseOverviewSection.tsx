import React from 'react';
import {
  Home,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Lightbulb,
  Wind,
  Lock,
  Activity,
  Layers,
  Sparkles,
  Sliders,
  ChevronRight,
  Shield,
  Maximize2,
} from 'lucide-react';
import { HouseOverviewData, DashboardFloor, DashboardRoom } from '../../types/dashboard';
import { EnvironmentalCard } from './EnvironmentalCard';
import { IoTDevice } from '../../types/device';
import { InteractiveFloorPlanSection } from './InteractiveFloorPlanSection';

interface HouseOverviewSectionProps {
  data: HouseOverviewData;
  onSelectDevice: (device: IoTDevice) => void;
  onNavigateTab: (tab: 'floorplan' | 'rooms' | 'automation' | 'activity') => void;
  floors?: DashboardFloor[];
  activeFloorId?: string;
  onSelectFloor?: (floorId: string) => void;
  devices?: IoTDevice[];
  rooms?: DashboardRoom[];
}

export const HouseOverviewSection: React.FC<HouseOverviewSectionProps> = ({
  data,
  onSelectDevice,
  onNavigateTab,
  floors,
  activeFloorId,
  onSelectFloor,
  devices,
  rooms,
}) => {
  const { houseSummary, environmental, deviceSummary, quickStats } = data;

  return (
    <div className="space-y-6">
      {/* 1. House Summary Banner & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* House Info Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
            <Home className="w-56 h-56" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase">
                {houseSummary.publishStatus}
              </span>
              {houseSummary.clientName && (
                <span className="text-xs text-purple-200">
                  Pemilik: {houseSummary.clientName}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black tracking-tight">{houseSummary.name}</h2>
            <p className="text-xs text-purple-100 mt-1 max-w-md leading-relaxed">
              Sistem Smart Home mandiri 2D. Memantau telemetri sensor virtual dan menjalankan aturan otomasi backend secara otomatis.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-white/20 text-xs">
            <div>
              <span className="text-purple-200 text-[10px] uppercase font-bold">Lantai</span>
              <p className="text-lg font-black">{houseSummary.totalFloors}</p>
            </div>
            <div>
              <span className="text-purple-200 text-[10px] uppercase font-bold">Ruangan</span>
              <p className="text-lg font-black">{houseSummary.totalRooms}</p>
            </div>
            <div>
              <span className="text-purple-200 text-[10px] uppercase font-bold">Perangkat</span>
              <p className="text-lg font-black">{houseSummary.totalDevices}</p>
            </div>
          </div>
        </div>

        {/* Device Health Status Widget */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-[#71758E] tracking-wider">
              Status Perangkat
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-[#181829]">
                {quickStats.activeDevices} <span className="text-sm font-semibold text-[#71758E]">/ {quickStats.totalDevices}</span>
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-[#71758E] mt-1">Perangkat berdaya aktif & siaga</p>
          </div>

          <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#71758E]">Aktif:</span>
              <span className="font-bold text-emerald-600">{quickStats.activeDevices} unit</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#71758E]">Offline:</span>
              <span className="font-bold text-slate-400">{houseSummary.offlineDevices} unit</span>
            </div>
          </div>
        </div>

        {/* Automation Status Widget */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-[#71758E] tracking-wider">
                Mesin Otomasi
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span>
                ACTIVE
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-[#181829]">
                {quickStats.activeAutomationsCount} <span className="text-sm font-semibold text-[#71758E]">Aturan</span>
              </span>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Zap className="w-5 h-5 fill-current" />
              </div>
            </div>
            <p className="text-xs text-[#71758E] mt-1">Berjalan mandiri di backend 24/7</p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[#71758E]">Terakhir dipicu:</span>
            <span className="font-bold text-slate-700">
              {houseSummary.automationStatus.lastTriggeredAt
                ? new Date(houseSummary.automationStatus.lastTriggeredAt).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Belum ada'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Environmental Monitoring Gauges (Section 3 requirement) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-[#181829] flex items-center gap-2">
              <span>Pemantauan Lingkungan Rumah</span>
              {quickStats.warningSensorsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  {quickStats.warningSensorsCount} Peringatan
                </span>
              )}
            </h3>
            <p className="text-xs text-[#71758E]">
              Data telemetri simulasi aktual yang dihasilkan secara otomatis di backend
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <EnvironmentalCard
            type="temperature"
            title="Suhu Ruangan"
            metric={environmental.temperature}
          />
          <EnvironmentalCard
            type="humidity"
            title="Kelembapan Udara"
            metric={environmental.humidity}
          />
          <EnvironmentalCard
            type="aqi"
            title="Indeks Kualitas Udara"
            metric={environmental.aqi}
          />
          <EnvironmentalCard
            type="pm25"
            title="Partikel Halus (PM2.5)"
            metric={environmental.pm25}
          />
          <EnvironmentalCard
            type="pm10"
            title="Partikel Debu (PM10)"
            metric={environmental.pm10}
          />
        </div>
      </div>

      {/* 2.5 Live Interactive Floor Plan (Embedded on Main Dashboard) */}
      {floors && floors.length > 0 && activeFloorId && onSelectFloor && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#181829] flex items-center gap-2">
                <span>Denah Interaktif & Pemantauan Perangkat</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  LIVE 2D VIEW
                </span>
              </h3>
              <p className="text-xs text-[#71758E]">
                Pantau letak perangkat secara langsung, scroll untuk zoom, geser kanvas, dan klik perangkat untuk mengontrol
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('floorplan')}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100/70 border border-purple-200 transition-colors shadow-2xs"
              title="Perluas ke Layar Penuh"
            >
              <span>Layar Penuh</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <InteractiveFloorPlanSection
            floors={floors}
            activeFloorId={activeFloorId}
            onSelectFloor={onSelectFloor}
            devices={devices || []}
            rooms={rooms || []}
            onSelectDevice={onSelectDevice}
            variant="embedded"
          />
        </div>
      )}

      {/* 3. Device Category Breakdown (Section 3 requirement) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-[#181829]">
              Ringkasan Kategori Perangkat
            </h3>
            <p className="text-xs text-[#71758E]">
              Kelompok perangkat IoT terpasang berdasarkan katalog standar
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('floorplan')}
            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <span>Buka Denah 2D</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Lighting */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-purple-200 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-[#181829]">
                  {deviceSummary.lighting.active} / {deviceSummary.lighting.total} Aktif
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-[#181829]">Pencahayaan</h4>
              <p className="text-xs text-[#71758E] mt-0.5">Smart Light & Dimmer</p>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-amber-400 h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      deviceSummary.lighting.total > 0
                        ? (deviceSummary.lighting.active / deviceSummary.lighting.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
              {deviceSummary.lighting.devices.slice(0, 2).map((dev) => (
                <div
                  key={dev.id}
                  onClick={() => onSelectDevice(dev)}
                  className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <span className="font-semibold text-slate-700 truncate max-w-[140px]">{dev.name}</span>
                  <span className={`text-[10px] font-bold ${dev.status === 'ON' ? 'text-amber-600' : 'text-slate-400'}`}>
                    {dev.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Climate */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-purple-200 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center">
                  <Wind className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-[#181829]">
                  {deviceSummary.climate.active} / {deviceSummary.climate.total} Aktif
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-[#181829]">Tata Udara (AC)</h4>
              <p className="text-xs text-[#71758E] mt-0.5">Smart AC & Thermostat</p>

              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-sky-500 h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      deviceSummary.climate.total > 0
                        ? (deviceSummary.climate.active / deviceSummary.climate.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
              {deviceSummary.climate.devices.slice(0, 2).map((dev) => (
                <div
                  key={dev.id}
                  onClick={() => onSelectDevice(dev)}
                  className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <span className="font-semibold text-slate-700 truncate max-w-[140px]">{dev.name}</span>
                  <span className={`text-[10px] font-bold ${dev.status === 'ON' ? 'text-sky-600' : 'text-slate-400'}`}>
                    {dev.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-purple-200 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-[#181829]">
                  {deviceSummary.security.active} / {deviceSummary.security.total} Terkunci
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-[#181829]">Keamanan</h4>
              <p className="text-xs text-[#71758E] mt-0.5">Smart Door Lock</p>

              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-rose-500 h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      deviceSummary.security.total > 0
                        ? (deviceSummary.security.active / deviceSummary.security.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
              {deviceSummary.security.devices.slice(0, 2).map((dev) => (
                <div
                  key={dev.id}
                  onClick={() => onSelectDevice(dev)}
                  className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <span className="font-semibold text-slate-700 truncate max-w-[140px]">{dev.name}</span>
                  <span className={`text-[10px] font-bold ${dev.status === 'LOCKED' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {dev.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sensors */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-purple-200 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-[#181829]">
                  {deviceSummary.sensors.total} Sensor
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-[#181829]">Sensor Lingkungan</h4>
              <p className="text-xs text-[#71758E] mt-0.5">Suhu, Lembap & Kualitas Udara</p>

              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
              {deviceSummary.sensors.devices.slice(0, 2).map((dev) => (
                <div
                  key={dev.id}
                  onClick={() => onSelectDevice(dev)}
                  className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <span className="font-semibold text-slate-700 truncate max-w-[140px]">{dev.name}</span>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                    READ-ONLY
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

