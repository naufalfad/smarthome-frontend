import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Sparkles,
  Home,
  LayoutGrid,
  Building,
  CheckCircle2,
  Layers,
  Sliders,
  RefreshCw,
  Eye,
  AlertCircle,
  HelpCircle,
  Scan,
  Maximize2,
  X,
  FileImage,
} from 'lucide-react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import {
  ROOM_TEMPLATES,
  RoomTemplateKey,
  generateAutoRoomReferences,
  GeneratedRoomReference,
} from '../../utils/room-reference-generator';
import {
  detectRoomsFromFloorPlanImage,
  loadImage,
  DetectedRoomResult,
} from '../../utils/floor-plan-image-detector';

interface AutoRoomReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasBounds: { width: number; height: number; x?: number; y?: number };
  pixelsPerMeter?: number | null;
  currentRoomCount: number;
  backgroundImageUrl?: string | null;
  onApply: (rooms: GeneratedRoomReference[], replaceExisting: boolean) => Promise<void>;
}

export const AutoRoomReferenceModal: React.FC<AutoRoomReferenceModalProps> = ({
  isOpen,
  onClose,
  canvasBounds,
  pixelsPerMeter,
  currentRoomCount,
  backgroundImageUrl,
  onApply,
}) => {
  // Mode selection: Dynamic Image Scan vs Template Fallback
  const [activeTab, setActiveTab] = useState<'IMAGE_SCAN' | 'TEMPLATE'>(
    backgroundImageUrl ? 'IMAGE_SCAN' : 'TEMPLATE'
  );

  // Template mode state
  const [selectedTemplate, setSelectedTemplate] = useState<RoomTemplateKey>('STANDARD_HOUSE');

  // Dynamic Image Scan Tuner states
  const [wallThreshold, setWallThreshold] = useState<number>(145);
  const [minRoomAreaPercent, setMinRoomAreaPercent] = useState<number>(1.5);
  const [wallDilation, setWallDilation] = useState<number>(2);
  const [hoveredRoomIndex, setHoveredRoomIndex] = useState<number | null>(null);

  // Loaded image cache & detected rooms
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [detectedRooms, setDetectedRooms] = useState<DetectedRoomResult[]>([]);
  const [selectedRoomIndices, setSelectedRoomIndices] = useState<Set<number>>(new Set());

  // Form submission & replacement
  const [replaceExisting, setReplaceExisting] = useState<boolean>(currentRoomCount > 0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // References to prevent passive re-scans & selection wipeouts
  const prevParamsRef = useRef<string>('');
  const isInitialScanDoneRef = useRef<boolean>(false);

  // Reset tab and flags when modal opens
  useEffect(() => {
    if (isOpen) {
      if (backgroundImageUrl) {
        setActiveTab('IMAGE_SCAN');
      } else {
        setActiveTab('TEMPLATE');
      }
      setError(null);
      isInitialScanDoneRef.current = false;
      prevParamsRef.current = '';
    }
  }, [isOpen, backgroundImageUrl]);

  // Load image when backgroundImageUrl changes or modal opens
  useEffect(() => {
    if (!isOpen || !backgroundImageUrl) {
      setLoadedImage(null);
      setDetectedRooms([]);
      return;
    }

    let isMounted = true;
    setIsAnalyzing(true);
    setError(null);

    loadImage(backgroundImageUrl)
      .then((img) => {
        if (!isMounted) return;
        setLoadedImage(img);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Gagal memuat denah untuk analisis citra:', err);
        setError('Gambar denah belum dapat dianalisis. Anda tetap bisa menggunakan Template Standar.');
        setActiveTab('TEMPLATE');
      })
      .finally(() => {
        if (isMounted) setIsAnalyzing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, backgroundImageUrl]);

  // Run dynamic detection ONLY when loadedImage or slider parameters actually change
  useEffect(() => {
    if (!loadedImage || !isOpen) return;

    const currentParamsKey = `${canvasBounds.width}_${canvasBounds.height}_${canvasBounds.x || 0}_${canvasBounds.y || 0}_${pixelsPerMeter || 0}_${wallThreshold}_${minRoomAreaPercent}_${wallDilation}`;
    const paramsChanged = prevParamsRef.current !== currentParamsKey;

    // If parameters have not changed and initial scan is already complete, do not re-scan or reset selections
    if (!paramsChanged && isInitialScanDoneRef.current) {
      return;
    }
    prevParamsRef.current = currentParamsKey;

    try {
      setIsAnalyzing(true);
      const results = detectRoomsFromFloorPlanImage(
        loadedImage,
        canvasBounds,
        pixelsPerMeter,
        {
          wallThreshold,
          minRoomAreaPercent,
          wallDilation,
        }
      );

      setDetectedRooms(results);

      // Only auto-select all rooms on initial scan or when user intentionally tweaks detection sliders
      if (!isInitialScanDoneRef.current || paramsChanged) {
        setSelectedRoomIndices(new Set(results.map((_, i) => i)));
        isInitialScanDoneRef.current = true;
      }
    } catch (err: any) {
      console.error('Error during room detection:', err);
      setError('Deteksi citra denah terhambat: ' + (err?.message || 'Format gambar tidak didukung'));
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    loadedImage,
    isOpen,
    canvasBounds.width,
    canvasBounds.height,
    canvasBounds.x,
    canvasBounds.y,
    pixelsPerMeter,
    wallThreshold,
    minRoomAreaPercent,
    wallDilation,
  ]);

  // Generated rooms from template mode
  const templateRooms = useMemo(() => {
    return generateAutoRoomReferences(canvasBounds, selectedTemplate, pixelsPerMeter);
  }, [canvasBounds, selectedTemplate, pixelsPerMeter]);

  // Active rooms to apply based on current tab
  const activeRoomsToApply: GeneratedRoomReference[] = useMemo(() => {
    if (activeTab === 'IMAGE_SCAN') {
      return detectedRooms.filter((_, i) => selectedRoomIndices.has(i));
    }
    return templateRooms;
  }, [activeTab, detectedRooms, selectedRoomIndices, templateRooms]);

  const toggleRoomSelection = (index: number) => {
    setSelectedRoomIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (activeRoomsToApply.length === 0) return;
    try {
      setIsSubmitting(true);
      setError(null);
      await onApply(activeRoomsToApply, replaceExisting);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal menerapkan referensi ruangan otomatis.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewBoxStr = `${canvasBounds.x || 0} ${canvasBounds.y || 0} ${canvasBounds.width} ${canvasBounds.height}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Referensi Ruangan Otomatis (Smart Dynamic Scanner)"
      description="Pindai partisi ruangan langsung dari garis gambar denah asli, atau gunakan template proporsional arsitektur."
      size="4xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              {activeRoomsToApply.length} ruangan terpilih siap dibuat dengan tinggi dinding default 3.0m
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button variant="ghost" size="sm" pill onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              variant="purple"
              size="sm"
              pill
              onClick={handleSubmit}
              disabled={isSubmitting || activeRoomsToApply.length === 0}
              className="gap-1.5 shadow-md shadow-purple-600/30"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? 'Menerapkan...'
                  : `Terapkan ${activeRoomsToApply.length} Ruangan Terdeteksi`}
              </span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 py-1">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('IMAGE_SCAN')}
              disabled={!backgroundImageUrl}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'IMAGE_SCAN'
                  ? 'bg-purple-100 text-purple-700 shadow-xs'
                  : backgroundImageUrl
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-400 cursor-not-allowed opacity-50'
              }`}
            >
              <Scan className="w-3.5 h-3.5 text-purple-600" />
              <span>Pindai Gambar Denah (Dinamis Client-Side)</span>
              {backgroundImageUrl && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-purple-200/80 text-[10px] text-purple-800">
                  Aktif
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('TEMPLATE')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'TEMPLATE'
                  ? 'bg-purple-100 text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
              <span>Template Presets (Acuan Cepat)</span>
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span>Ganti {currentRoomCount} ruangan yang ada</span>
          </label>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: DYNAMIC IMAGE SCANNER                                   */}
        {/* ============================================================== */}
        {activeTab === 'IMAGE_SCAN' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Interactive Canvas Overlay Preview */}
            <div className="lg:col-span-7 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-purple-600" />
                  Visualisasi Deteksi di Atas Gambar Denah Asli
                </span>
                <span className="text-[11px] text-slate-500">
                  {detectedRooms.length} ruangan teridentifikasi
                </span>
              </div>

              <div className="relative w-full aspect-4/3 max-h-[360px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center">
                {isAnalyzing && (
                  <div className="absolute inset-0 z-20 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                    <span>Memindai partisi dinding denah...</span>
                  </div>
                )}

                <svg
                  viewBox={viewBoxStr}
                  className="w-full h-full object-contain select-none"
                  style={{ background: '#0f172a' }}
                >
                  {/* Real floor plan image rendered underneath */}
                  {backgroundImageUrl && (
                    <image
                      href={backgroundImageUrl}
                      x={canvasBounds.x || 0}
                      y={canvasBounds.y || 0}
                      width={canvasBounds.width}
                      height={canvasBounds.height}
                      preserveAspectRatio="none"
                      opacity={0.85}
                    />
                  )}

                  {/* Detected room polygon overlays */}
                  {detectedRooms.map((room, idx) => {
                    const isSelected = selectedRoomIndices.has(idx);
                    const isHovered = hoveredRoomIndex === idx;
                    const pts = room.polygonCoordinates.map((p) => `${p.x},${p.y}`).join(' ');

                    return (
                      <g
                        key={idx}
                        className="cursor-pointer transition-opacity"
                        onMouseEnter={() => setHoveredRoomIndex(idx)}
                        onMouseLeave={() => setHoveredRoomIndex(null)}
                        onClick={() => toggleRoomSelection(idx)}
                      >
                        <polygon
                          points={pts}
                          fill={room.color}
                          fillOpacity={isSelected ? (isHovered ? 0.6 : 0.35) : 0.05}
                          stroke={room.color}
                          strokeWidth={isHovered ? 4 : isSelected ? 2.5 : 1}
                          strokeDasharray={isSelected ? 'none' : '4 4'}
                        />

                        {isSelected && (
                          <g transform={`translate(${room.center.x}, ${room.center.y})`}>
                            <rect
                              x={-45}
                              y={-14}
                              width={90}
                              height={28}
                              rx={6}
                              fill="rgba(15, 23, 42, 0.85)"
                              stroke={room.color}
                              strokeWidth={1}
                            />
                            <text
                              x={0}
                              y={-1}
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize={9}
                              fontWeight="bold"
                            >
                              {room.name.length > 13 ? room.name.slice(0, 11) + '…' : room.name}
                            </text>
                            <text
                              x={0}
                              y={9}
                              textAnchor="middle"
                              fill="#94a3b8"
                              fontSize={8}
                            >
                              {room.estimatedAreaM2} m²
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>💡 Klik ruangan pada gambar untuk memilih/batal memilih.</span>
                <span>Resolusi: {canvasBounds.width} × {canvasBounds.height}</span>
              </div>
            </div>

            {/* Right: Tuning Sliders & Detected Room List */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              {/* Tuner Controls Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Sliders className="w-3.5 h-3.5 text-purple-600" />
                    Parameter Analisis Citra (Real-Time)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setWallThreshold(145);
                      setMinRoomAreaPercent(1.5);
                      setWallDilation(2);
                    }}
                    className="text-[11px] text-purple-600 hover:underline"
                  >
                    Reset Default
                  </button>
                </div>

                {/* Wall Threshold Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Sensitivitas Dinding (Threshold)</span>
                    <span className="font-mono font-semibold text-purple-700">{wallThreshold}</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="220"
                    value={wallThreshold}
                    onChange={(e) => setWallThreshold(Number(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-slate-600">
                    <span>Garis Hitam Pekat</span>
                    <span>Garis Tipis / Sketsa Abu</span>
                  </div>
                </div>

                {/* Min Room Area Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Filter Ukuran Minimum</span>
                    <span className="font-mono font-semibold text-purple-700">{minRoomAreaPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.5"
                    value={minRoomAreaPercent}
                    onChange={(e) => setMinRoomAreaPercent(Number(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-slate-600">
                    <span>Termasuk Ruang Kecil</span>
                    <span>Hanya Ruangan Utama</span>
                  </div>
                </div>

                {/* Wall Dilation (Door Gap Closing) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Penyambung Celah Pintu (Gap Closing)</span>
                    <span className="font-mono font-semibold text-purple-700">{wallDilation} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    value={wallDilation}
                    onChange={(e) => setWallDilation(Number(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-slate-600">
                    <span>Tanpa Dilatasi</span>
                    <span>Tutup Celah Kusen Pintu</span>
                  </div>
                </div>
              </div>

              {/* Detected Room List */}
              <div className="space-y-1.5 flex-1 max-h-[190px] overflow-y-auto pr-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 px-1">
                  <span>Daftar Ruangan Terdeteksi ({selectedRoomIndices.size}/{detectedRooms.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedRoomIndices.size === detectedRooms.length) {
                        setSelectedRoomIndices(new Set());
                      } else {
                        setSelectedRoomIndices(new Set(detectedRooms.map((_, i) => i)));
                      }
                    }}
                    className="text-purple-600 hover:underline"
                  >
                    {selectedRoomIndices.size === detectedRooms.length ? 'Batal Semua' : 'Pilih Semua'}
                  </button>
                </div>

                {detectedRooms.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                    Tidak ada ruangan yang terdeteksi dengan batas slider saat ini. Coba geser Sensitivitas Dinding.
                  </div>
                ) : (
                  detectedRooms.map((room, idx) => {
                    const isSelected = selectedRoomIndices.has(idx);
                    const isHovered = hoveredRoomIndex === idx;

                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredRoomIndex(idx)}
                        onMouseLeave={() => setHoveredRoomIndex(null)}
                        onClick={() => toggleRoomSelection(idx)}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                          isHovered ? 'ring-2 ring-purple-400' : ''
                        } ${
                          isSelected
                            ? 'bg-white border-slate-200 shadow-xs'
                            : 'bg-slate-50/70 border-slate-100 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleRoomSelection(idx);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: room.color }}
                          />
                          <span className="font-semibold text-slate-800">{room.name}</span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <span>{room.estimatedAreaM2} m²</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                            {room.polygonCoordinates.length} titik
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: TEMPLATE PRESETS FALLBACK                               */}
        {/* ============================================================== */}
        {activeTab === 'TEMPLATE' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left: Template Cards */}
            <div className="md:col-span-6 space-y-2.5">
              <span className="text-xs font-semibold text-slate-700">Pilih Tata Letak Acuan:</span>

              {Object.entries(ROOM_TEMPLATES).map(([key, tpl]) => {
                const isSelected = selectedTemplate === key;
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedTemplate(key as RoomTemplateKey)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {key === 'STANDARD_HOUSE' && <Home className="w-4 h-4 text-purple-600" />}
                        {key === 'TWO_BEDROOM' && <LayoutGrid className="w-4 h-4 text-purple-600" />}
                        {key === 'STUDIO_APARTMENT' && <Building className="w-4 h-4 text-purple-600" />}
                        <span className="text-xs font-bold text-slate-800">{tpl.name}</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {tpl.roomCount} Ruangan
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Right: Template Mini SVG Blueprint Preview */}
            <div className="md:col-span-6 flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Pratinjau Poligon Ruangan Acuan:
              </span>

              <div className="w-full aspect-4/3 max-h-[280px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center">
                <svg
                  viewBox={viewBoxStr}
                  className="w-full h-full object-contain select-none"
                  style={{ background: '#0f172a' }}
                >
                  {/* Grid Lines */}
                  <defs>
                    <pattern id="tmpl-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#tmpl-grid)" />

                  {/* Template Polygons */}
                  {templateRooms.map((room, idx) => {
                    const pts = room.polygonCoordinates.map((p) => `${p.x},${p.y}`).join(' ');
                    const minX = Math.min(...room.polygonCoordinates.map((p) => p.x));
                    const maxX = Math.max(...room.polygonCoordinates.map((p) => p.x));
                    const minY = Math.min(...room.polygonCoordinates.map((p) => p.y));
                    const maxY = Math.max(...room.polygonCoordinates.map((p) => p.y));
                    const cx = (minX + maxX) / 2;
                    const cy = (minY + maxY) / 2;

                    return (
                      <g key={idx}>
                        <polygon
                          points={pts}
                          fill={room.color}
                          fillOpacity={0.35}
                          stroke={room.color}
                          strokeWidth={2}
                        />
                        <text
                          x={cx}
                          y={cy - 4}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize={11}
                          fontWeight="bold"
                        >
                          {room.name}
                        </text>
                        <text
                          x={cx}
                          y={cy + 10}
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize={9}
                        >
                          {room.estimatedAreaM2} m² • T: 3.0m
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
