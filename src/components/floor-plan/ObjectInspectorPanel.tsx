import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Box,
  Layers,
  RotateCw,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Move,
  Ruler,
  Eye,
  EyeOff,
  Image,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Info,
  X,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FloorPlan, FloorPlanObject, Room } from '../../types/floor-plan';

interface ObjectInspectorPanelProps {
  floorPlan: FloorPlan | null;
  selectedObject: FloorPlanObject | null;
  rooms?: Room[];
  suggestedRoomId?: string | null;
  onAssignRoom?: (objectId: string, roomId: string | null) => void;
  onUpdateObject: (objectId: string, updates: Partial<FloorPlanObject>) => void;
  onDeleteObject: (objectId: string) => void;
  onDuplicateObject: (objectId: string) => void;
  onBringForward: (objectId: string) => void;
  onSendBackward: (objectId: string) => void;
  onBringToFront: (objectId: string) => void;
  onSendToBack: (objectId: string) => void;
  onUpdatePlanConfig: (updates: Partial<FloorPlan>) => void;
  onOpenUploadBackground: () => void;
  onDeleteBackground: () => void;
  onStartCalibration?: () => void;
  onClose?: () => void;
}

export const ObjectInspectorPanel: React.FC<ObjectInspectorPanelProps> = ({
  floorPlan,
  selectedObject,
  rooms = [],
  suggestedRoomId,
  onAssignRoom,
  onUpdateObject,
  onDeleteObject,
  onDuplicateObject,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onUpdatePlanConfig,
  onOpenUploadBackground,
  onDeleteBackground,
  onStartCalibration,
  onClose,
}) => {
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(1);

  // Sync aspect ratio when selected object changes
  useEffect(() => {
    if (selectedObject && selectedObject.height > 0) {
      setAspectRatio(selectedObject.width / selectedObject.height);
    }
  }, [selectedObject?.id]);

  const handleWidthChange = (newWidth: number) => {
    if (newWidth <= 5) return;
    if (lockAspectRatio && aspectRatio > 0) {
      const newHeight = Math.round(newWidth / aspectRatio);
      onUpdateObject(selectedObject!.id, { width: newWidth, height: newHeight });
    } else {
      onUpdateObject(selectedObject!.id, { width: newWidth });
    }
  };

  const handleHeightChange = (newHeight: number) => {
    if (newHeight <= 5) return;
    if (lockAspectRatio && aspectRatio > 0) {
      const newWidth = Math.round(newHeight * aspectRatio);
      onUpdateObject(selectedObject!.id, { width: newWidth, height: newHeight });
    } else {
      onUpdateObject(selectedObject!.id, { height: newHeight });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-600" />
          <h3 className="text-xs font-bold text-[#181829]">
            {selectedObject ? 'Object Inspector' : 'Floor Plan Overview'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {selectedObject && (
            <Badge variant="purple" className="text-[10px]">
              {selectedObject.category}
            </Badge>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="Tutup Panel Objek"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3.5 space-y-4">
        {selectedObject ? (
          /* =========================================================
             OBJECT INSPECTOR (WHEN OBJECT SELECTED)
             ========================================================= */
          <div className="space-y-4">
            {/* Object Title & Identity */}
            <div>
              <label className="block text-[11px] font-semibold text-[#71758E] mb-1">
                Nama Objek
              </label>
              <input
                type="text"
                value={selectedObject.name}
                onChange={(e) =>
                  onUpdateObject(selectedObject.id, { name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-[#181829] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
              />
            </div>

            {/* Position X and Y */}
            <div>
              <label className="block text-[11px] font-semibold text-[#71758E] mb-1">
                Posisi Koordinat Spasial
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center rounded-xl border border-slate-200 px-2.5 py-1.5 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-200">
                  <span className="text-[11px] font-bold text-slate-400 mr-1.5">X:</span>
                  <input
                    type="number"
                    value={Math.round(selectedObject.x)}
                    onChange={(e) =>
                      onUpdateObject(selectedObject.id, {
                        x: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full text-xs font-mono text-[#181829] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">px</span>
                </div>

                <div className="flex items-center rounded-xl border border-slate-200 px-2.5 py-1.5 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-200">
                  <span className="text-[11px] font-bold text-slate-400 mr-1.5">Y:</span>
                  <input
                    type="number"
                    value={Math.round(selectedObject.y)}
                    onChange={(e) =>
                      onUpdateObject(selectedObject.id, {
                        y: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full text-xs font-mono text-[#181829] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">px</span>
                </div>
              </div>
            </div>

            {/* Dimensions: Width and Height */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-[#71758E]">
                  Dimensi Ukuran
                </label>
                <button
                  type="button"
                  onClick={() => setLockAspectRatio(!lockAspectRatio)}
                  className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
                    lockAspectRatio
                      ? 'bg-purple-100 text-purple-700 font-bold'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title={lockAspectRatio ? 'Rasio Terkunci' : 'Kunci Rasio'}
                >
                  {lockAspectRatio ? (
                    <Lock className="w-3 h-3" />
                  ) : (
                    <Unlock className="w-3 h-3" />
                  )}
                  <span>{lockAspectRatio ? 'Rasio Terkunci' : 'Bebas'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center rounded-xl border border-slate-200 px-2.5 py-1.5 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-200">
                  <span className="text-[11px] font-bold text-slate-400 mr-1.5">W:</span>
                  <input
                    type="number"
                    min="10"
                    value={Math.round(selectedObject.width)}
                    onChange={(e) => handleWidthChange(parseFloat(e.target.value) || 10)}
                    className="w-full text-xs font-mono text-[#181829] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">px</span>
                </div>

                <div className="flex items-center rounded-xl border border-slate-200 px-2.5 py-1.5 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-200">
                  <span className="text-[11px] font-bold text-slate-400 mr-1.5">H:</span>
                  <input
                    type="number"
                    min="10"
                    value={Math.round(selectedObject.height)}
                    onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 10)}
                    className="w-full text-xs font-mono text-[#181829] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">px</span>
                </div>
              </div>
            </div>

            {/* Rotation */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-[#71758E]">
                  Rotasi (Derajat)
                </label>
                <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#181829]">
                  <span>{Math.round(selectedObject.rotation)}°</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={Math.round(selectedObject.rotation)}
                  onChange={(e) =>
                    onUpdateObject(selectedObject.id, {
                      rotation: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full accent-purple-600"
                />
                <button
                  type="button"
                  onClick={() =>
                    onUpdateObject(selectedObject.id, {
                      rotation: (Math.round(selectedObject.rotation) + 90) % 360,
                    })
                  }
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Putar 90° searah jarum jam"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Z-Index / Layer Ordering */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-semibold text-[#71758E] mb-1.5">
                Urutan Lapisan (Z-Index: {selectedObject.zIndex})
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => onBringToFront(selectedObject.id)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 text-slate-600 transition-all text-center"
                  title="Paling Depan"
                >
                  <ChevronsUp className="w-4 h-4 text-purple-600" />
                  <span className="text-[9px] mt-0.5">Top</span>
                </button>
                <button
                  type="button"
                  onClick={() => onBringForward(selectedObject.id)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 text-slate-600 transition-all text-center"
                  title="Maju Satu Lapisan"
                >
                  <ArrowUp className="w-4 h-4 text-slate-700" />
                  <span className="text-[9px] mt-0.5">Maju</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSendBackward(selectedObject.id)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 text-slate-600 transition-all text-center"
                  title="Mundur Satu Lapisan"
                >
                  <ArrowDown className="w-4 h-4 text-slate-700" />
                  <span className="text-[9px] mt-0.5">Mundur</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSendToBack(selectedObject.id)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 text-slate-600 transition-all text-center"
                  title="Paling Belakang"
                >
                  <ChevronsDown className="w-4 h-4 text-slate-500" />
                  <span className="text-[9px] mt-0.5">Bottom</span>
                </button>
              </div>
            </div>

            {/* Action Buttons: Duplicate & Delete */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                pill
                onClick={() => onDuplicateObject(selectedObject.id)}
                className="flex-1 gap-1.5 text-xs"
              >
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>Duplikat</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                pill
                onClick={() => onDeleteObject(selectedObject.id)}
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 gap-1.5 text-xs px-3"
                title="Hapus objek ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </Button>
            </div>
          </div>
        ) : (
          /* =========================================================
             FLOOR PLAN OVERVIEW (WHEN NO OBJECT SELECTED)
             ========================================================= */
          <div className="space-y-4">
            {/* General Metadata Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#71758E]">Lantai Aktif:</span>
                <span className="font-bold text-[#181829]">
                  {floorPlan?.floor?.name || 'Lantai 1'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#71758E]">Total Objek:</span>
                <span className="font-mono font-bold text-purple-700">
                  {floorPlan?.objects?.length || 0} entitas
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#71758E]">Resolusi Viewport:</span>
                <span className="font-mono text-slate-600">
                  {Math.round(floorPlan?.viewBoxWidth || 1600)} ×{' '}
                  {Math.round(floorPlan?.viewBoxHeight || 1000)} px
                </span>
              </div>
            </div>

            {/* Background Image Controls */}
            <div className="p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#181829] flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-purple-600" />
                  <span>Gambar Denah</span>
                </h4>
                {floorPlan?.imagePath && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePlanConfig({
                        isBackgroundVisible: !floorPlan.isBackgroundVisible,
                      })
                    }
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                    title={
                      floorPlan.isBackgroundVisible ? 'Sembunyikan Denah' : 'Tampilkan Denah'
                    }
                  >
                    {floorPlan.isBackgroundVisible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                )}
              </div>

              {floorPlan?.imagePath ? (
                <div className="space-y-3">
                  {/* Opacity slider */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-[#71758E]">Transparansi / Opacity:</span>
                      <span className="font-mono font-bold text-slate-700">
                        {Math.round((floorPlan.backgroundOpacity ?? 1) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={floorPlan.backgroundOpacity ?? 1}
                      onChange={(e) =>
                        onUpdatePlanConfig({
                          backgroundOpacity: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-purple-600"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      pill
                      onClick={onOpenUploadBackground}
                      className="flex-1 text-xs"
                    >
                      Ganti Denah
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      pill
                      onClick={onDeleteBackground}
                      className="text-rose-600 hover:bg-rose-50 text-xs px-2.5"
                      title="Hapus referensi gambar denah"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-center py-2">
                  <p className="text-[11px] text-[#71758E]">
                    Belum ada denah referensi diunggah pada lantai ini.
                  </p>
                  <Button
                    variant="purple"
                    size="sm"
                    pill
                    onClick={onOpenUploadBackground}
                    className="w-full text-xs"
                  >
                    Unggah Gambar Denah
                  </Button>
                </div>
              )}
            </div>

            {/* Quick Helper Tip */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-[#71758E] flex items-start gap-2">
              <Info className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
              <span>
                Pilih salah satu objek pada kanvas untuk mengubah posisi, ukuran, orientasi, atau urutan lapisannya.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

