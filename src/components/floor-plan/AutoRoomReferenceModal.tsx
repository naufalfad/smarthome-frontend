import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Home,
  LayoutGrid,
  Building,
  CheckCircle2,
  Layers,
  ArrowRight,
  Ruler,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import {
  ROOM_TEMPLATES,
  RoomTemplateKey,
  generateAutoRoomReferences,
  GeneratedRoomReference,
} from '../../utils/room-reference-generator';

interface AutoRoomReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasBounds: { width: number; height: number; x?: number; y?: number };
  pixelsPerMeter?: number | null;
  currentRoomCount: number;
  onApply: (rooms: GeneratedRoomReference[], replaceExisting: boolean) => Promise<void>;
}

export const AutoRoomReferenceModal: React.FC<AutoRoomReferenceModalProps> = ({
  isOpen,
  onClose,
  canvasBounds,
  pixelsPerMeter,
  currentRoomCount,
  onApply,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<RoomTemplateKey>('STANDARD_HOUSE');
  const [replaceExisting, setReplaceExisting] = useState<boolean>(currentRoomCount > 0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Compute live preview of generated rooms
  const generatedRooms = useMemo(() => {
    return generateAutoRoomReferences(canvasBounds, selectedTemplate, pixelsPerMeter);
  }, [canvasBounds, selectedTemplate, pixelsPerMeter]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      await onApply(generatedRooms, replaceExisting);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal menerapkan referensi ruangan otomatis.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Referensi Ruangan Otomatis (Client-Side)"
      description="Hasilkan partisi ruangan acuan proporsional di atas denah secara otomatis tanpa API luar. Titik sudut poligon dapat Anda sesuaikan dengan mudah di kanvas."
      size="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              {generatedRooms.length} ruangan acuan siap dibuat dengan tinggi plafon rata-rata 3.0m
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" pill onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              variant="purple"
              size="sm"
              pill
              onClick={handleSubmit}
              disabled={isSubmitting || generatedRooms.length === 0}
              className="gap-1.5 shadow-md shadow-purple-600/30"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menerapkan...' : `Terapkan ${generatedRooms.length} Ruangan`}</span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 py-1">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Template Selection Grid */}
        <div>
          <label className="block text-xs font-bold text-[#181829] mb-2 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Pilih Template Tata Ruang Acuan</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.values(ROOM_TEMPLATES).map((tmpl) => {
              const isSelected = selectedTemplate === tmpl.key;
              const Icon = tmpl.key === 'STANDARD_HOUSE' ? Home : tmpl.key === 'TWO_BEDROOM' ? LayoutGrid : Building;

              return (
                <div
                  key={tmpl.key}
                  onClick={() => setSelectedTemplate(tmpl.key)}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/50 shadow-sm shadow-purple-100 ring-2 ring-purple-600/20'
                      : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {tmpl.badge}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[#181829] pt-1">{tmpl.name}</h4>
                    <p className="text-[11px] text-[#71758E] leading-relaxed">{tmpl.description}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-purple-700">{tmpl.roomCount} Partisi Ruangan</span>
                    <span className="text-xs">{isSelected ? '✓ Terpilih' : 'Pilih'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Interactive SVG Blueprint Preview */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-950 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold flex items-center gap-1.5 text-purple-300">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Pratinjau Poligon Acuan di Atas Kanvas
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Ukuran Kanvas: {Math.round(canvasBounds.width)} × {Math.round(canvasBounds.height)} px
            </span>
          </div>

          {/* SVG Miniature Viewport */}
          <div className="relative w-full h-48 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
            <svg
              viewBox={`${canvasBounds.x || 0} ${canvasBounds.y || 0} ${canvasBounds.width} ${canvasBounds.height}`}
              className="w-full h-full object-contain"
            >
              {/* Outer Boundary Guideline */}
              <rect
                x={canvasBounds.x || 0}
                y={canvasBounds.y || 0}
                width={canvasBounds.width}
                height={canvasBounds.height}
                fill="none"
                stroke="#334155"
                strokeWidth="2"
                strokeDasharray="6 6"
              />

              {/* Render Room Polygons */}
              {generatedRooms.map((room, idx) => {
                const pointsStr = room.polygonCoordinates.map((p) => `${p.x},${p.y}`).join(' ');

                // Calculate center point for label
                const avgX =
                  room.polygonCoordinates.reduce((sum, p) => sum + p.x, 0) / room.polygonCoordinates.length;
                const avgY =
                  room.polygonCoordinates.reduce((sum, p) => sum + p.y, 0) / room.polygonCoordinates.length;

                return (
                  <g key={idx}>
                    <polygon
                      points={pointsStr}
                      fill={room.color}
                      fillOpacity="0.35"
                      stroke={room.color}
                      strokeWidth="3"
                    />
                    <circle cx={avgX} cy={avgY} r="4" fill={room.color} />
                    <text
                      x={avgX}
                      y={avgY - 8}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="14"
                      fontWeight="bold"
                      className="select-none pointer-events-none drop-shadow"
                    >
                      {room.name}
                    </text>
                    {room.estimatedAreaM2 && (
                      <text
                        x={avgX}
                        y={avgY + 12}
                        textAnchor="middle"
                        fill="#CBD5E1"
                        fontSize="11"
                        fontWeight="600"
                        className="select-none pointer-events-none drop-shadow"
                      >
                        {room.estimatedAreaM2} m²
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* 3. Room Details Summary Pills */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-[#71758E]">
            Daftar Ruangan yang Akan Dibuat:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {generatedRooms.map((room, idx) => (
              <div
                key={idx}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: room.color }} />
                  <span className="font-semibold text-slate-800 truncate">{room.name}</span>
                </div>
                <span className="text-[10px] font-mono font-medium text-slate-500 shrink-0">
                  +{room.ceilingHeight.toFixed(1)}m
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Replace Existing Rooms Option */}
        {currentRoomCount > 0 && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-2.5">
            <input
              type="checkbox"
              id="replaceExisting"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
            />
            <label htmlFor="replaceExisting" className="text-xs text-amber-900 cursor-pointer select-none">
              <strong>Ganti & reset {currentRoomCount} ruangan yang ada saat ini</strong> pada lantai ini.
              (Hanya poligon batas ruangan yang diperbarui, perangkat & furnitur tetap aman).
            </label>
          </div>
        )}
      </div>
    </Modal>
  );
};
