import React from 'react';
import {
  Layers,
  Plus,
  UploadCloud,
  Grid,
  Magnet,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Home,
  MousePointer,
  PenTool,
  Edit3,
  Cpu,
  Eye,
  EyeOff,
  Send,
  Sparkles,
  Trash2,
  Zap,
  ExternalLink,
  Ruler,
  Box,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { House, Floor, FloorPlan } from '../../types/floor-plan';

export type SaveStatus = 'SAVED' | 'SAVING' | 'ERROR';
export type ToolMode = 'select' | 'place-device' | 'draw-room' | 'edit-room' | 'calibrate';

interface FloorPlanToolbarProps {
  houses: House[];
  activeHouse: House | null;
  activeFloor: Floor | null;
  floorPlan?: FloorPlan | null;
  toolMode?: ToolMode;
  onChangeToolMode?: (mode: ToolMode) => void;
  onSelectHouse: (houseId: string) => void;
  onSelectFloor: (floorId: string) => void;
  onOpenAddFloor: () => void;
  onOpenUploadBackground: () => void;
  hasBackgroundImage?: boolean;
  onDeleteBackground?: () => void;
  onDeleteActiveFloor?: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  showRoomPolygons?: boolean;
  onToggleRoomPolygons?: () => void;
  onOpenCalibrationModal?: () => void;
  canUndo: boolean;
  onUndo: () => void;
  canRedo: boolean;
  onRedo: () => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  saveStatus: SaveStatus;
  lastErrorMessage?: string | null;
  onResetCalibration?: () => void;
  // Product adjustment: Preview Monitoring & Publish
  isPreviewMonitoring?: boolean;
  onTogglePreviewMonitoring?: () => void;
  publishStatus?: string;
  onOpenPublishModal?: () => void;
  onOpenAutomationModal?: () => void;
}

export const FloorPlanToolbar: React.FC<FloorPlanToolbarProps> = ({
  houses,
  activeHouse,
  activeFloor,
  floorPlan,
  toolMode = 'select',
  onChangeToolMode,
  onSelectHouse,
  onSelectFloor,
  onOpenAddFloor,
  onOpenUploadBackground,
  hasBackgroundImage = false,
  onDeleteBackground,
  onDeleteActiveFloor,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnap,
  showRoomPolygons = true,
  onToggleRoomPolygons,
  onOpenCalibrationModal,
  canUndo,
  onUndo,
  canRedo,
  onRedo,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  saveStatus,
  lastErrorMessage,
  onResetCalibration,
  isPreviewMonitoring = false,
  onTogglePreviewMonitoring,
  publishStatus = 'DRAFT',
  onOpenPublishModal,
  onOpenAutomationModal,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
      {/* Left: House & Floor Selectors */}
      <div className="flex items-center gap-2">
        {/* House Selector */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
          <Home className="w-3.5 h-3.5 text-purple-600" />
          <select
            value={activeHouse?.id || ''}
            onChange={(e) => onSelectHouse(e.target.value)}
            disabled={isPreviewMonitoring}
            className="bg-transparent text-xs font-bold text-[#181829] focus:outline-none cursor-pointer disabled:opacity-60"
          >
            {houses.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        {/* Floor Selector */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-50/60 border border-purple-200">
          <Layers className="w-3.5 h-3.5 text-purple-700" />
          <select
            value={activeFloor?.id || ''}
            onChange={(e) => onSelectFloor(e.target.value)}
            className="bg-transparent text-xs font-bold text-purple-900 focus:outline-none cursor-pointer"
          >
            {activeHouse?.floors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Add Floor & Delete Floor Buttons (Admin only, disabled in preview) */}
        {!isPreviewMonitoring && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              pill
              onClick={onOpenAddFloor}
              className="text-xs gap-1 text-slate-600 hover:text-purple-700 hover:bg-purple-50 px-2.5 py-1.5"
              title="Tambah lantai bertingkat"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Lantai</span>
            </Button>

            {/* Delete Floor Button (Visible if house has > 1 floor) */}
            {activeHouse && activeHouse.floors && activeHouse.floors.length > 1 && onDeleteActiveFloor && (
              <Button
                variant="ghost"
                size="sm"
                pill
                type="button"
                onClick={onDeleteActiveFloor}
                className="text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5"
                title={`Hapus ${activeFloor?.name || 'lantai ini'}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Lantai</span>
              </Button>
            )}
          </div>
        )}

        {/* Tool Mode Selector (Hidden in Preview Monitoring) */}
        {!isPreviewMonitoring && onChangeToolMode && (
          <div className="flex items-center gap-1 ml-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => onChangeToolMode('select')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                toolMode === 'select'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Mode Pilih / Pindahkan Objek & Perangkat (V)"
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span>Pilih / Geser</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeToolMode('draw-room')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                toolMode === 'draw-room'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Mode Gambar Poligon Ruangan (R)"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Gambar Ruang</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeToolMode('calibrate')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                toolMode === 'calibrate'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Mode Kalibrasi Skala 2-Titik (K)"
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Kalibrasi Skala</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeToolMode('place-device')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                toolMode === 'place-device'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Mode Pasang Perangkat IoT (P)"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Pasang IoT</span>
            </button>
          </div>
        )}

        {/* Calibration Status Badge */}
        {!isPreviewMonitoring && floorPlan && (
          floorPlan.isCalibrated ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenCalibrationModal}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors shadow-2xs"
                title="Skala metrik terkalibrasi. Klik untuk melihat detail atau kalibrasi ulang."
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{floorPlan.pixelsPerMeter ? `${floorPlan.pixelsPerMeter.toFixed(1)} px/m (1m)` : 'Terkalibrasi'}</span>
              </button>
              {onResetCalibration && (
                <button
                  type="button"
                  onClick={onResetCalibration}
                  className="p-1 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                  title="Hapus / reset kalibrasi skala"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onChangeToolMode?.('calibrate')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors shadow-2xs"
              title="Skala belum dikalibrasi. Klik untuk mengkalibrasi jarak nyata 2-titik."
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Belum Kalibrasi</span>
            </button>
          )
        )}
      </div>

      {/* Center Tools: Upload, Grid, Snap, Room Polygons, Undo/Redo, Zoom */}
      <div className="flex items-center gap-1.5">
        {!isPreviewMonitoring && (
          <>
            {/* Upload Background & Delete Background Button */}
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                pill
                onClick={onOpenUploadBackground}
                className="text-xs gap-1.5"
                title="Unggah atau ganti gambar arsitektur denah (PNG/JPG/SVG)"
              >
                <UploadCloud className="w-3.5 h-3.5 text-purple-600" />
                <span>{hasBackgroundImage ? 'Ganti Denah' : 'Denah Latar'}</span>
              </Button>

              {hasBackgroundImage && onDeleteBackground && (
                <button
                  type="button"
                  onClick={onDeleteBackground}
                  className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors"
                  title="Hapus gambar denah pada lantai ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            {/* Grid Toggle */}
            <button
              type="button"
              onClick={onToggleGrid}
              className={`p-1.5 rounded-xl border transition-all ${
                showGrid
                  ? 'bg-purple-100 border-purple-300 text-purple-700'
                  : 'border-slate-200 text-slate-400 hover:bg-slate-100'
              }`}
              title={showGrid ? 'Sembunyikan Grid' : 'Tampilkan Grid'}
            >
              <Grid className="w-4 h-4" />
            </button>

            {/* Snap to Grid */}
            <button
              type="button"
              onClick={onToggleSnap}
              className={`p-1.5 rounded-xl border transition-all ${
                snapToGrid
                  ? 'bg-purple-100 border-purple-300 text-purple-700'
                  : 'border-slate-200 text-slate-400 hover:bg-slate-100'
              }`}
              title={snapToGrid ? 'Snap to Grid Aktif' : 'Snap to Grid Nonaktif'}
            >
              <Magnet className="w-4 h-4" />
            </button>

            {/* Room Polygons Toggle */}
            {onToggleRoomPolygons && (
              <button
                type="button"
                onClick={onToggleRoomPolygons}
                className={`p-1.5 rounded-xl border transition-all ${
                  showRoomPolygons
                    ? 'bg-purple-100 border-purple-300 text-purple-700'
                    : 'border-slate-200 text-slate-400 hover:bg-slate-100'
                }`}
                title={showRoomPolygons ? 'Sembunyikan Poligon Ruangan' : 'Tampilkan Poligon Ruangan'}
              >
                <Box className="w-4 h-4" />
              </button>
            )}

            <div className="h-4 w-px bg-slate-200 mx-1" />

            {/* Undo / Redo */}
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1" />
          </>
        )}

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-1">
          <button
            type="button"
            onClick={onZoomOut}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-600"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono font-bold text-[#181829] px-1 min-w-[42px] text-center">
            {zoomLevel}%
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-600"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 ml-0.5 border-l border-slate-200 pl-1.5"
            title="Reset View"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Right: Preview Monitoring, Publish & Save Status */}
      <div className="flex items-center gap-2">
        {/* Mode Switcher: Configuration vs Preview Monitoring (Admin-Only Workflow) */}
        {onTogglePreviewMonitoring && (
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                if (isPreviewMonitoring) onTogglePreviewMonitoring();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !isPreviewMonitoring
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Mode Konfigurasi (Admin) - Tempatkan, geser, resize & atur perangkat"
            >
              <Cpu className="w-3.5 h-3.5 text-purple-600" />
              <span>Mode Konfigurasi (Admin)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isPreviewMonitoring) onTogglePreviewMonitoring();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isPreviewMonitoring
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Preview Monitoring (Client View) - Simulasi Dashboard Klien"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Monitoring (Client View)</span>
            </button>
          </div>
        )}

        {/* Full Dashboard Experience Button in Preview Monitoring */}
        {isPreviewMonitoring && (
          <a
            href="/preview"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 transition-all text-xs font-bold shadow-xs"
            title="Buka User Dashboard Penuh di tab baru"
          >
            <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
            <span>Dashboard Penuh</span>
          </a>
        )}

        {/* Phase 7: Smart Home Automation Button */}
        {onOpenAutomationModal && (
          <button
            type="button"
            onClick={onOpenAutomationModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 hover:border-violet-300 text-violet-700 transition-all text-xs font-bold shadow-xs"
            title="Kelola Aturan Otomasi Pintar (IF-THEN)"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-violet-600" />
            <span>Otomasi (IF-THEN)</span>
          </button>
        )}

        {/* Publish Status Badge & Modal Trigger */}
        {onOpenPublishModal && (
          <button
            type="button"
            onClick={onOpenPublishModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-xs font-semibold"
            title="Kelola status publikasi dashboard"
          >
            <Send className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-slate-600">Publikasi:</span>
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
          </button>
        )}

        {/* Save Status Indicator */}
        {!isPreviewMonitoring && (
          <div className="flex items-center">
            {saveStatus === 'SAVED' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tersimpan</span>
              </div>
            )}
            {saveStatus === 'SAVING' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
                <Loader2 className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                <span>Menyimpan...</span>
              </div>
            )}
            {saveStatus === 'ERROR' && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold cursor-help"
                title={lastErrorMessage || 'Gagal menyimpan perubahan. Periksa koneksi atau validitas data.'}
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Gagal simpan</span>
                {lastErrorMessage && (
                  <span className="hidden xl:inline font-normal text-[11px] text-rose-600/90 max-w-[180px] truncate">
                    ({lastErrorMessage})
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
