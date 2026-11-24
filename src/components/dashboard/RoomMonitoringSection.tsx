import React, { useState } from 'react';
import {
  DoorClosed,
  Thermometer,
  Droplets,
  Layers,
  ChevronRight,
  Radio,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { DashboardRoom, DashboardFloor } from '../../types/dashboard';
import { IoTDevice } from '../../types/device';
import { DEVICE_TEMPLATES } from '../floor-plan/DeviceLibraryPanel';
import { getDeviceVisualTheme } from '../../utils/device-visual';

interface RoomMonitoringSectionProps {
  rooms: DashboardRoom[];
  floors: DashboardFloor[];
  activeFloorId: string;
  onSelectFloor: (floorId: string) => void;
  unassignedDevices: IoTDevice[];
  onSelectDevice: (device: IoTDevice) => void;
}

export const RoomMonitoringSection: React.FC<RoomMonitoringSectionProps> = ({
  rooms,
  floors,
  activeFloorId,
  onSelectFloor,
  unassignedDevices,
  onSelectDevice,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Filter rooms for current active floor
  const currentFloorRooms = rooms.filter(
    (r) => !r.floorId || r.floorId === activeFloorId
  );

  const selectedRoom = currentFloorRooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="space-y-6">
      {/* Floor Switcher Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-[#181829]">
            Pemantauan Berbasis Ruangan
          </h3>
          <p className="text-xs text-[#71758E]">
            Melihat kondisi telemetri dan perangkat yang dialokasikan pada setiap zona ruangan
          </p>
        </div>

        {floors.length > 1 && (
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl shadow-xs">
            {floors.map((fl) => (
              <button
                key={fl.id}
                onClick={() => {
                  onSelectFloor(fl.id);
                  setSelectedRoomId(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeFloorId === fl.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-[#71758E] hover:text-[#181829]'
                }`}
              >
                {fl.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Room Cards Grid */}
      {currentFloorRooms.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
          <DoorClosed className="w-12 h-12 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
          <h4 className="text-sm font-bold text-slate-700">Belum Ada Ruangan Dikonfigurasi</h4>
          <p className="text-xs text-[#71758E] mt-1 max-w-sm mx-auto">
            Ruangan dapat digambar pada Studio Denah 2D oleh Administrator melalui Room Polygon Engine.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentFloorRooms.map((room) => {
            const isSelected = selectedRoomId === room.id;
            return (
              <div
                key={room.id}
                onClick={() => setSelectedRoomId(isSelected ? null : room.id)}
                className={`bg-white rounded-3xl p-5 border transition-all cursor-pointer shadow-xs hover:border-purple-300 ${
                  isSelected
                    ? 'border-purple-600 ring-2 ring-purple-600/10'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${room.color}15`,
                        color: room.color,
                      }}
                    >
                      <DoorClosed className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-[#181829]">{room.name}</h4>
                      <span className="text-[10px] font-bold text-[#71758E] uppercase tracking-wider">
                        {room.type} • {room.floorName}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {room.deviceCount} Unit
                  </span>
                </div>

                {/* Environmental summary for room if available */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <Thermometer className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <span className="text-[9px] text-[#71758E] uppercase font-bold block">Suhu</span>
                      <span className="font-extrabold text-[#181829]">
                        {room.environmental.temperature !== null
                          ? `${room.environmental.temperature}°C`
                          : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <Droplets className="w-4 h-4 text-sky-500 shrink-0" />
                    <div>
                      <span className="text-[9px] text-[#71758E] uppercase font-bold block">Kelembapan</span>
                      <span className="font-extrabold text-[#181829]">
                        {room.environmental.humidity !== null
                          ? `${room.environmental.humidity}%`
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Devices preview */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-[#71758E] mb-2 font-semibold">
                    <span>Perangkat Terpasang:</span>
                    <span className="text-purple-600 font-bold hover:underline">
                      {isSelected ? 'Tutup Detail' : 'Lihat Detail'}
                    </span>
                  </div>

                  {room.devices.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">Belum ada perangkat di ruangan ini.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {room.devices.slice(0, isSelected ? undefined : 3).map((dev) => (
                        <div
                          key={dev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDevice(dev as any);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-100 transition-colors text-xs"
                        >
                          <span className="font-bold text-[#181829] truncate max-w-[150px]">{dev.name}</span>
                          <span className={`text-[10px] font-extrabold ${dev.status === 'ON' || dev.status === 'LOCKED' ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {dev.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unassigned Devices Section (Devices without Room ID) */}
      {unassignedDevices.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div>
            <h4 className="text-sm font-extrabold text-[#181829]">
              Perangkat Tanpa Alokasi Ruangan Khusus ({unassignedDevices.length})
            </h4>
            <p className="text-xs text-[#71758E]">
              Perangkat yang ditempatkan secara bebas pada denah atau menggunakan nama ruangan manual
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {unassignedDevices.map((dev) => (
              <div
                key={dev.id}
                onClick={() => onSelectDevice(dev)}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-100 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <h5 className="text-xs font-bold text-[#181829]">{dev.name}</h5>
                  <p className="text-[10px] text-[#71758E]">
                    {dev.manualRoomName || 'Umum'} • {dev.type}
                  </p>
                </div>
                <span className={`text-[10px] font-bold ${dev.status === 'ON' || dev.status === 'LOCKED' ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {dev.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

