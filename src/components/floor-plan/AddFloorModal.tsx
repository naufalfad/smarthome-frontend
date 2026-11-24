import React, { useState } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Layers, Plus } from 'lucide-react';

interface AddFloorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFloor: (name: string, levelNumber?: number) => Promise<void>;
  suggestedLevel: number;
}

export const AddFloorModal: React.FC<AddFloorModalProps> = ({
  isOpen,
  onClose,
  onAddFloor,
  suggestedLevel,
}) => {
  const [name, setName] = useState<string>(`Lantai ${suggestedLevel}`);
  const [levelNumber, setLevelNumber] = useState<number>(suggestedLevel);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setName(`Lantai ${suggestedLevel}`);
      setLevelNumber(suggestedLevel);
      setError(null);
    }
  }, [isOpen, suggestedLevel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama lantai wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onAddFloor(name.trim(), levelNumber);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan lantai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Lantai Baru"
      description="Tambahkan lantai bertingkat pada denah rumah untuk memisahkan tata letak spasial."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" pill onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            variant="purple"
            size="sm"
            pill
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Menyimpan...' : 'Tambah Lantai'}</span>
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#181829] mb-1.5">
            Nama Lantai
          </label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Lantai 2 (Upper Floor)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-[#181829] placeholder:text-slate-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-purple-100 transition-all"
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#181829] mb-1.5">
            Tingkat Lantai (Level Number)
          </label>
          <div className="relative">
            <input
              type="number"
              value={levelNumber}
              onChange={(e) => setLevelNumber(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-[#181829] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>
          <p className="text-[11px] text-[#71758E] mt-1">
            Gunakan angka 1 untuk lantai dasar, 2 untuk lantai atas, atau -1 untuk ruang bawah tanah (basement).
          </p>
        </div>
      </form>
    </Modal>
  );
};

