import React, { useState } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Ruler, Check, AlertCircle } from 'lucide-react';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  point1: { x: number; y: number } | null;
  point2: { x: number; y: number } | null;
  onSaveCalibration: (distanceMeters: number) => Promise<void>;
  onResetCalibration?: () => Promise<void>;
  isCalibrated?: boolean;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({
  isOpen,
  onClose,
  point1,
  point2,
  onSaveCalibration,
  onResetCalibration,
  isCalibrated = false,
}) => {
  const [distanceMeters, setDistanceMeters] = useState<string>('10.0');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const pixelDistance =
    point1 && point2
      ? Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2))
      : 0;

  const cleanInput = distanceMeters.trim().replace(',', '.');
  const meters = parseFloat(cleanInput);
  const isValidMeters = !isNaN(meters) && meters > 0 && isFinite(meters);
  const calculatedRatio = isValidMeters ? (pixelDistance / meters).toFixed(2) : '0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidMeters) {
      setError('Masukkan jarak riil yang valid (lebih besar dari 0 meter, contoh: 10.0).');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSaveCalibration(meters);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan kalibrasi skala.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!onResetCalibration) return;
    const ok = window.confirm('Apakah Anda yakin ingin menghapus kalibrasi skala dan mengembalikan ke skala standar (50 px/m)?');
    if (!ok) return;

    try {
      setIsResetting(true);
      setError(null);
      await onResetCalibration();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal mereset kalibrasi skala.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kalibrasi Skala Denah (2-Titik)"
      description="Tentukan jarak nyata antara 2 titik acuan pada denah untuk mengkalibrasi rasio piksel ke meter."
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {isCalibrated && onResetCalibration && (
              <Button
                variant="ghost"
                size="sm"
                pill
                onClick={handleReset}
                disabled={isSubmitting || isResetting}
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs"
              >
                {isResetting ? 'Mereset...' : 'Hapus Kalibrasi'}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" pill onClick={onClose} disabled={isSubmitting || isResetting}>
              Batal
            </Button>
            <Button
              variant="purple"
              size="sm"
              pill
              onClick={handleSubmit}
              disabled={isSubmitting || isResetting || !isValidMeters}
              className="gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Terapkan Skala'}</span>
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
          <div>
            <span className="text-[#71758E] block text-[11px]">Titik A:</span>
            <span className="font-mono font-bold text-[#181829]">
              X: {point1 ? point1.x.toFixed(1) : 0}, Y: {point1 ? point1.y.toFixed(1) : 0}
            </span>
          </div>
          <div>
            <span className="text-[#71758E] block text-[11px]">Titik B:</span>
            <span className="font-mono font-bold text-[#181829]">
              X: {point2 ? point2.x.toFixed(1) : 0}, Y: {point2 ? point2.y.toFixed(1) : 0}
            </span>
          </div>
          <div className="col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-[#71758E]">Jarak Garis Acuan:</span>
            <span className="font-mono font-extrabold text-purple-700">
              {pixelDistance.toFixed(1)} px
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#181829] mb-1.5">
            Panjang Nyata Garis Acuan (Meter)
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={distanceMeters}
              onChange={(e) => {
                setError(null);
                setDistanceMeters(e.target.value);
              }}
              placeholder="Contoh: 10.0"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-[#181829] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-purple-100 transition-all font-mono"
              autoFocus
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              meter
            </span>
          </div>
          <p className="text-[11px] text-[#71758E] mt-1">
            Gunakan panjang dinding atau pintu yang diketahui ukurannya (misal panjang dinding luar 10m atau pintu 0.9m).
          </p>
        </div>

        {isValidMeters && (
          <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-100 flex items-center justify-between text-xs">
            <span className="text-purple-900 font-medium">Hasil Rasio Skala:</span>
            <span className="font-mono font-bold text-purple-700">
              {calculatedRatio} px / meter
            </span>
          </div>
        )}
      </form>
    </Modal>
  );
};

