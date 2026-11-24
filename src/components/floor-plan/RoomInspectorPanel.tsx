import React from 'react';
import {
  Sliders,
  Home,
  Palette,
  Maximize2,
  Trash2,
  Edit3,
  Box,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Room, RoomType, FloorPlanObject } from '../../types/floor-plan';
import { ROOM_TYPE_LABELS } from './RoomExplorerPanel';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface RoomInspectorPanelProps {
  room: Room;
  linkedObjects: FloorPlanObject[];
  onUpdateRoom: (roomId: string, updates: Partial<Room>) => void;
  onDeleteRoom: (roomId: string) => void;
  onEditPolygon: (roomId: string) => void;
  onSelectObject: (objectId: string) => void;
  isCalibrated: boolean;
}

const COLOR_SWATCHES = [
  '#6366F1', // Indigo
  '#3B82F6', // Blue
  '#0EA5E9', // Sky
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#F59E0B', // Amber
  '#F97316', // Orange
  '#EF4444', // Red
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#64748B', // Slate
];

export const RoomInspectorPanel: React.FC<RoomInspectorPanelProps> = ({
  room,
  linkedObjects,
  onUpdateRoom,
  onDeleteRoom,
  onEditPolygon,
  onSelectObject,
  isCalibrated,
}) => {
  const vertexCount =
    room.polygonCoordinates && Array.isArray(room.polygonCoordinates)
      ? room.polygonCoordinates.length
      : 0;
  const hasPolygon = vertexCount >= 3;

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-purple-50/40">
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
            style={{ backgroundColor: room.color || '#6366F1' }}
          />
          <h3 className="text-xs font-bold text-[#181829]">Room Inspector</h3>
        </div>
        <Badge variant="purple" className="text-[10px]">
          {ROOM_TYPE_LABELS[room.type] || room.type}
        </Badge>
      </div>

      <div className="flex-1 p-3.5 space-y-4">
        {/* Room Name Input */}
        <div>
          <label className="block text-[11px] font-semibold text-[#71758E] mb-1">
            Nama Ruangan
          </label>
          <input
            type="text"
            value={room.name}
            onChange={(e) => onUpdateRoom(room.id, { name: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-[#181829] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
          />
        </div>

        {/* Room Type Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-[#71758E] mb-1">
            Kategori / Tipe Ruangan
          </label>
          <select
            value={room.type}
            onChange={(e) =>
              onUpdateRoom(room.id, { type: e.target.value as RoomType })
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#181829] bg-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200 cursor-pointer"
          >
            {Object.entries(ROOM_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label} ({key})
              </option>
            ))}
          </select>
        </div>

        {/* Room Color Picker */}
        <div>
          <label className="block text-[11px] font-semibold text-[#71758E] mb-1.5 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-purple-600" />
            <span>Warna Penanda Poligon</span>
          </label>
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => onUpdateRoom(room.id, { color: swatch })}
                className={`w-6 h-6 rounded-lg transition-transform ${
                  room.color === swatch
                    ? 'scale-110 ring-2 ring-purple-600 ring-offset-1 shadow-xs'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: swatch }}
                title={swatch}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={room.color || '#6366F1'}
              onChange={(e) => onUpdateRoom(room.id, { color: e.target.value })}
              className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5"
            />
            <input
              type="text"
              value={room.color || '#6366F1'}
              onChange={(e) => onUpdateRoom(room.id, { color: e.target.value })}
              placeholder="#6366F1"
              className="flex-1 px-2.5 py-1.5 rounded-xl border border-slate-200 font-mono text-xs text-[#181829] uppercase focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Geometry Stats Card */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#71758E]">Luas Ruangan:</span>
            <span className="font-mono font-bold text-purple-700">
              {room.areaSquareMeters != null
                ? `${room.areaSquareMeters.toFixed(2)} m²`
                : isCalibrated
                ? 'Belum dihitung'
                : 'Belum kalibrasi skala'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#71758E]">Jumlah Sudut:</span>
            <span className="font-mono font-bold text-slate-800">
              {vertexCount} titik sudut
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#71758E]">Status Poligon:</span>
            <span className={`font-semibold ${hasPolygon ? 'text-emerald-700' : 'text-amber-700'}`}>
              {hasPolygon ? 'Batas Terpasang' : 'Belum Digambar'}
            </span>
          </div>
        </div>

        {/* Polygon Edit / Draw Button */}
        <div>
          <Button
            variant="secondary"
            size="sm"
            pill
            onClick={() => onEditPolygon(room.id)}
            className="w-full text-xs gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{hasPolygon ? 'Edit Titik Sudut Poligon pada Denah' : 'Gambar Poligon untuk Ruangan Ini'}</span>
          </Button>
        </div>

        {/* Linked Objects in Room */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-[#71758E] flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-purple-600" />
              <span>Objek di Ruangan Ini</span>
            </label>
            <span className="text-[10px] font-mono font-bold text-slate-500">
              {linkedObjects.length} objek
            </span>
          </div>

          {linkedObjects.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic py-1">
              Belum ada perabot atau objek interior yang ditempatkan di ruangan ini.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {linkedObjects.map((obj) => (
                <div
                  key={obj.id}
                  onClick={() => onSelectObject(obj.id)}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-purple-50/50 border border-slate-100 hover:border-purple-200 cursor-pointer transition-colors text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                    <span className="font-semibold text-[#181829] truncate">
                      {obj.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {Math.round(obj.width)}×{Math.round(obj.height)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Room Action */}
        <div className="pt-3 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            pill
            onClick={() => {
              if (
                window.confirm(
                  `Hapus ruangan "${room.name}"? Objek di dalamnya akan tetap disimpan tanpa asosiasi ruangan.`
                )
              ) {
                onDeleteRoom(room.id);
              }
            }}
            className="w-full text-rose-600 hover:bg-rose-50 text-xs gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Ruangan Ini</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

