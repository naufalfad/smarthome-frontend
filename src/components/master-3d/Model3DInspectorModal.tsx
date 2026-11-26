import React, { useState } from 'react';
import {
  X,
  Upload,
  Box,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUp,
  Ruler,
  Maximize2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Model3DCanvasPreview } from './Model3DCanvasPreview';

interface Model3DInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'DEVICE' | 'OBJECT';
  item: {
    id: string;
    name: string;
    category: string;
    description?: string | null;
    color?: string | null;
    modelGlbPath?: string | null;
    placementTarget?: string;
    defaultElevation?: number;
    dimensionLength?: number;
    dimensionWidth?: number;
    dimensionHeight?: number;
  } | null;
  onUploadGlb: (id: string, file: File) => Promise<void>;
  onSaveMetadata: (id: string, metadata: {
    placementTarget: string;
    defaultElevation: number;
    dimensionLength: number;
    dimensionWidth: number;
    dimensionHeight: number;
  }) => Promise<void>;
  modelStreamUrl?: string | null;
}

export const Model3DInspectorModal: React.FC<Model3DInspectorModalProps> = ({
  isOpen,
  onClose,
  type,
  item,
  onUploadGlb,
  onSaveMetadata,
  modelStreamUrl,
}) => {
  if (!isOpen || !item) return null;

  const [length, setLength] = useState<number>(item.dimensionLength ?? (type === 'DEVICE' ? 0.12 : 1.0));
  const [width, setWidth] = useState<number>(item.dimensionWidth ?? (type === 'DEVICE' ? 0.12 : 1.0));
  const [height, setHeight] = useState<number>(item.dimensionHeight ?? (type === 'DEVICE' ? 0.04 : 0.8));
  const [target, setTarget] = useState<string>(item.placementTarget ?? (type === 'DEVICE' ? 'WALL' : 'FLOOR'));
  const [elevation, setElevation] = useState<number>(item.defaultElevation ?? (type === 'DEVICE' ? 1.2 : 0.0));

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.glb')) {
      setStatusMessage({
        type: 'error',
        text: 'Format berkas harus biner GLB (.glb).',
      });
      return;
    }

    try {
      setIsUploading(true);
      setStatusMessage(null);
      await onUploadGlb(item.id, file);
      setStatusMessage({
        type: 'success',
        text: `Model 3D '${file.name}' berhasil diunggah!`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal mengunggah berkas model 3D.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setStatusMessage(null);
      await onSaveMetadata(item.id, {
        placementTarget: target,
        defaultElevation: elevation,
        dimensionLength: length,
        dimensionWidth: width,
        dimensionHeight: height,
      });
      setStatusMessage({
        type: 'success',
        text: 'Metrik spasial 3D berhasil disimpan!',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal menyimpan konfigurasi.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {item.name}
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {type === 'DEVICE' ? 'Perangkat IoT' : 'Addon Interior'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Inspeksi Model 3D, Dimensi Metrik (P × L × T), & Elevasi Penempatan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left: 3D High-res Viewport (7 cols) */}
          <div className="lg:col-span-7 p-6 bg-slate-950 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
            <div className="relative w-full h-80 rounded-xl overflow-hidden border border-slate-800/80 shadow-inner">
              <Model3DCanvasPreview
                modelUrl={modelStreamUrl}
                dimensions={{ length, width, height }}
                color={item.color || '#6366F1'}
                label={item.name}
                placementTarget={target}
                autoRotate={true}
                className="w-full h-full"
              />
            </div>

            {/* Quick Upload Button directly below 3D preview */}
            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  Berkas Model 3D Asli (.GLB)
                </span>
                {item.modelGlbPath ? (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Model Tersimpan
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Menggunakan Fallback Box
                  </span>
                )}
              </div>

              <label className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-dashed border-indigo-500/40 hover:border-indigo-400 bg-indigo-950/20 hover:bg-indigo-900/30 text-indigo-300 text-xs font-medium cursor-pointer transition-all">
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengunggah Model 3D ({uploadProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>{item.modelGlbPath ? 'Ganti Berkas .GLB Baru' : 'Unggah File .GLB'}</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".glb"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
              <p className="text-[10px] text-slate-500 mt-1">
                Format biner standard <strong>.glb</strong> (glTF Binary) hingga 50MB. Tekstur & material menyatu.
              </p>
            </div>
          </div>

          {/* Right: Spatial Configuration Panel (5 cols) */}
          <div className="lg:col-span-5 p-6 space-y-4 bg-slate-900/80 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-indigo-400" />
                Dimensi Metrik Fisik (Meter)
              </h3>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Panjang (X)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      min="0.05"
                      value={length}
                      onChange={(e) => setLength(parseFloat(e.target.value) || 0.1)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] text-slate-500">m</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Lebar/Tebal (Y)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      min="0.05"
                      value={width}
                      onChange={(e) => setWidth(parseFloat(e.target.value) || 0.1)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] text-slate-500">m</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tinggi (Z)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      min="0.05"
                      value={height}
                      onChange={(e) => setHeight(parseFloat(e.target.value) || 0.1)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] text-slate-500">m</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Aturan Penempatan 3D
                </h3>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Target Pemasangan</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['FLOOR', 'WALL', 'CEILING', 'TABLETOP'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTarget(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border text-left transition-all ${
                          target === t
                            ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {t === 'FLOOR' && '🛋️ Lantai (Floor)'}
                        {t === 'WALL' && '🧱 Dinding (Wall)'}
                        {t === 'CEILING' && '💡 Plafon (Ceiling)'}
                        {t === 'TABLETOP' && '📱 Di Meja (Tabletop)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                    <span>Elevasi Default dari Lantai</span>
                    <span className="text-indigo-400 font-mono text-xs">{elevation.toFixed(2)} m</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="3.5"
                    step="0.05"
                    value={elevation}
                    onChange={(e) => setElevation(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                    <span>0m (Lantai)</span>
                    <span>1.2m (Saklar)</span>
                    <span>2.2m (AC)</span>
                    <span>3.0m (Plafon)</span>
                  </div>
                </div>
              </div>

              {statusMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Simpan Pengaturan 3D</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
