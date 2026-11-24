import React, { useState } from 'react';
import {
  Search,
  Plus,
  Home,
  Layers,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Maximize2,
  Box,
  Compass,
} from 'lucide-react';
import { Room, RoomType } from '../../types/floor-plan';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface RoomExplorerPanelProps {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string | null) => void;
  onStartDrawRoom: () => void;
  onDeleteRoom: (roomId: string) => void;
  hiddenRoomIds: Set<string>;
  onToggleRoomVisibility: (roomId: string) => void;
  onEditRoomPolygon: (roomId: string) => void;
}

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  LIVING_ROOM: 'Ruang Tamu',
  BEDROOM: 'Kamar Tidur',
  KITCHEN: 'Dapur',
  BATHROOM: 'Kamar Mandi',
  DINING_ROOM: 'Ruang Makan',
  WORKSPACE: 'Ruang Kerja',
  GARAGE: 'Garasi',
  OTHER: 'Lainnya',
};

export const RoomExplorerPanel: React.FC<RoomExplorerPanelProps> = ({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onStartDrawRoom,
  onDeleteRoom,
  hiddenRoomIds,
  onToggleRoomVisibility,
  onEditRoomPolygon,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.name
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());
    const matchesType =
      selectedType === 'ALL' || room.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header Controls: Search & Draw Room Button */}
      <div className="p-3 border-b border-slate-100 bg-white space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ruangan..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-[#181829] placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px]"
              >
                ✕
              </button>
            )}
          </div>

          <Button
            variant="purple"
            size="sm"
            pill
            onClick={onStartDrawRoom}
            className="text-xs gap-1.5 shrink-0"
            title="Mulai menggambar batas poligon ruangan baru pada denah"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Gambar</span>
          </Button>
        </div>

        {/* Room Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedType('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${selectedType === 'ALL'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-[#71758E] hover:bg-slate-200 hover:text-[#181829]'
              }`}
          >
            Semua ({rooms.length})
          </button>
          {Object.entries(ROOM_TYPE_LABELS).map(([typeKey, label]) => {
            const count = rooms.filter((r) => r.type === typeKey).length;
            if (count === 0 && selectedType !== typeKey) return null;
            return (
              <button
                key={typeKey}
                onClick={() => setSelectedType(typeKey)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${selectedType === typeKey
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-[#71758E] hover:bg-slate-200 hover:text-[#181829]'
                  }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredRooms.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Home className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">
              {rooms.length === 0
                ? 'Belum ada ruangan pada lantai ini'
                : 'Tidak ada ruangan yang cocok'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 mb-3">
              {rooms.length === 0
                ? 'Klik tombol "Gambar" di atas untuk menggambar batas ruangan pada kanvas denah.'
                : 'Coba ubah kata kunci pencarian atau filter tipe.'}
            </p>
            {rooms.length === 0 && (
              <Button
                variant="secondary"
                size="sm"
                pill
                onClick={onStartDrawRoom}
                className="text-xs gap-1 text-purple-700 border-purple-200 hover:bg-purple-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Gambar Ruangan Pertama</span>
              </Button>
            )}
          </div>
        ) : (
          filteredRooms.map((room) => {
            const isSelected = room.id === selectedRoomId;
            const isHidden = hiddenRoomIds.has(room.id);
            const objectCount =
              room._count?.floorPlanObjects ??
              room.floorPlanObjects?.length ??
              0;
            const hasPolygon =
              room.polygonCoordinates &&
              Array.isArray(room.polygonCoordinates) &&
              room.polygonCoordinates.length >= 3;

            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className={`group relative p-3 rounded-2xl border transition-all cursor-pointer ${isSelected
                    ? 'border-purple-500 bg-purple-50/40 shadow-xs'
                    : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/60'
                  }`}
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Left: Color Dot & Room Name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 shadow-xs"
                      style={{ backgroundColor: room.color || '#6366F1' }}
                    />
                    <div className="min-w-0">
                      <h4
                        className={`text-xs font-bold truncate ${isSelected ? 'text-purple-900' : 'text-[#181829]'
                          }`}
                      >
                        {room.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-[#71758E] mt-0.5">
                        <span>{ROOM_TYPE_LABELS[room.type] || room.type}</span>
                        <span>•</span>
                        <span className={`font-semibold ${hasPolygon ? 'text-emerald-700' : 'text-amber-600'}`}>
                          {hasPolygon
                            ? room.areaSquareMeters != null
                              ? `${room.areaSquareMeters.toFixed(1)} m²`
                              : 'Poligon Aktif'
                            : 'Belum digambar'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Object count pill */}
                    <div
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600"
                      title={`${objectCount} objek di ruangan ini`}
                    >
                      <Box className="w-3 h-3 text-slate-400" />
                      <span>{objectCount}</span>
                    </div>

                    {/* Visibility Toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleRoomVisibility(room.id);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                      title={isHidden ? 'Tampilkan ruangan' : 'Sembunyikan ruangan'}
                    >
                      {isHidden ? (
                        <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </button>

                    {/* Edit Polygon Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRoom(room.id);
                        onEditRoomPolygon(room.id);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-100/60 transition-colors"
                      title="Edit sudut poligon ruangan"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Room Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            `Hapus ruangan "${room.name}"? Objek di dalamnya akan tetap disimpan tanpa asosiasi ruangan.`
                          )
                        ) {
                          onDeleteRoom(room.id);
                        }
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Hapus ruangan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {!hasPolygon && (
                  <div className="mt-2 text-[10px] text-amber-600 bg-amber-50 rounded-lg p-1.5 flex items-center gap-1">
                    <span>⚠️ Batas poligon belum digambar.</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50 text-[10px] text-[#71758E] flex items-center justify-between">
        <span>Total: {rooms.length} Ruangan</span>
        <span className="font-medium text-slate-600">
          {rooms.filter((r) => r.polygonCoordinates && r.polygonCoordinates.length >= 3).length} Memiliki Poligon
        </span>
      </div>
    </div>
  );
};

