import React, { useState } from 'react';
import { X, Plus, Box, Sparkles, Loader2, Ruler, Layers } from 'lucide-react';
import { CreateDeviceCatalogPayload, CreateObjectCatalogPayload } from '../../services/catalog-3d.api';

interface CreateMasterItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'DEVICE' | 'OBJECT';
  onCreateDevice: (payload: CreateDeviceCatalogPayload) => Promise<void>;
  onCreateObject: (payload: CreateObjectCatalogPayload) => Promise<void>;
}

export const CreateMasterItemModal: React.FC<CreateMasterItemModalProps> = ({
  isOpen,
  onClose,
  type,
  onCreateDevice,
  onCreateObject,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [deviceType, setDeviceType] = useState(type === 'DEVICE' ? 'SMART_SWITCH_3GANG' : '');
  const [category, setCategory] = useState(type === 'DEVICE' ? 'LIGHTING' : 'LIVING_ROOM');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#8B5CF6');
  const [placementTarget, setPlacementTarget] = useState(type === 'DEVICE' ? 'WALL' : 'FLOOR');
  const [defaultElevation, setDefaultElevation] = useState<number>(type === 'DEVICE' ? 1.2 : 0.0);
  const [length, setLength] = useState<number>(type === 'DEVICE' ? 0.12 : 1.2);
  const [width, setWidth] = useState<number>(type === 'DEVICE' ? 0.12 : 0.8);
  const [height, setHeight] = useState<number>(type === 'DEVICE' ? 0.04 : 0.75);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama master item wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (type === 'DEVICE') {
        await onCreateDevice({
          name: name.trim(),
          deviceType: deviceType.trim().toUpperCase() || 'CUSTOM_IOT_DEVICE',
          category,
          description: description.trim() || undefined,
          color,
          placementTarget,
          defaultElevation,
          dimensionLength: length,
          dimensionWidth: width,
          dimensionHeight: height,
          capabilities: [],
        });
      } else {
        await onCreateObject({
          name: name.trim(),
          category,
          description: description.trim() || undefined,
          placementTarget,
          defaultElevation,
          dimensionLength: length,
          dimensionWidth: width,
          dimensionHeight: height,
        });
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal menambahkan master data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {type === 'DEVICE' ? 'Tambah Master Perangkat IoT' : 'Tambah Master Addon Furnitur'}
              </h2>
              <p className="text-xs text-slate-400">Daftarkan item baru beserta metrik 3D fisiknya</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl text-xs bg-rose-950/50 border border-rose-500/40 text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nama Item Master</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'DEVICE' ? 'Contoh: Smart Wall Switch 3-Gang' : 'Contoh: Sofa Ruang Tamu 3 Dudukan'}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {type === 'DEVICE' ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Kode Device Type</label>
                <input
                  type="text"
                  required
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value)}
                  placeholder="SMART_SWITCH_3GANG"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:border-indigo-500 focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Kategori Ruang</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="LIVING_ROOM">Ruang Tamu (Living Room)</option>
                  <option value="BEDROOM">Kamar Tidur (Bedroom)</option>
                  <option value="KITCHEN">Dapur (Kitchen)</option>
                  <option value="BATHROOM">Kamar Mandi (Bathroom)</option>
                  <option value="GENERAL">Umum (General)</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Kategori Sistem</label>
              {type === 'DEVICE' ? (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="LIGHTING">Pencahayaan (Lighting)</option>
                  <option value="CLIMATE">Pengatur Suhu (Climate/AC)</option>
                  <option value="SECURITY">Keamanan (Security/CCTV)</option>
                  <option value="SENSORS">Sensor IoT (Sensors)</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:border-indigo-500 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Dimensi Fisik 3D */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-indigo-400" />
              Dimensi Fisik Metrik (Meter)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Panjang (P)</span>
                <input
                  type="number"
                  step="0.05"
                  min="0.02"
                  value={length}
                  onChange={(e) => setLength(parseFloat(e.target.value) || 0.1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Lebar (L)</span>
                <input
                  type="number"
                  step="0.05"
                  min="0.02"
                  value={width}
                  onChange={(e) => setWidth(parseFloat(e.target.value) || 0.1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Tinggi (T)</span>
                <input
                  type="number"
                  step="0.05"
                  min="0.02"
                  value={height}
                  onChange={(e) => setHeight(parseFloat(e.target.value) || 0.05)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Penempatan 3D */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Pemasangan</label>
              <select
                value={placementTarget}
                onChange={(e) => setPlacementTarget(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="FLOOR">🛋️ Lantai (FLOOR)</option>
                <option value="WALL">🧱 Dinding (WALL)</option>
                <option value="CEILING">💡 Plafon (CEILING)</option>
                <option value="TABLETOP">📱 Di Atas Meja (TABLETOP)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Elevasi Lantai (Meter)</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="4"
                value={defaultElevation}
                onChange={(e) => setDefaultElevation(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Deskripsi Tambahan</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan teknis atau spesifikasi model..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menambahkan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Daftarkan Master Item</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
