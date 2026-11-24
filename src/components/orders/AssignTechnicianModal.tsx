import React, { useState, useEffect } from 'react';
import { UserCheck, Wrench, AlertCircle, Loader2, X, Briefcase } from 'lucide-react';
import { serviceOrderApi } from '../../services/service-order.api';
import { ServiceOrder, TechnicianSummaryDTO } from '../../types/service-order';
import { Button } from '../ui/button';

interface AssignTechnicianModalProps {
  order: ServiceOrder | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignTechnicianModal: React.FC<AssignTechnicianModalProps> = ({
  order,
  onClose,
  onSuccess,
}) => {
  const [technicians, setTechnicians] = useState<TechnicianSummaryDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!order) return;
    const fetchTechs = async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await serviceOrderApi.listTechnicians();
        setTechnicians(list);
        const firstEligible = list.find((t) => t.isEligibleForAssignment);
        if (firstEligible) {
          setSelectedTechId(firstEligible.technicianProfileId);
        }
      } catch (err: any) {
        setError(err?.message || 'Gagal memuat daftar teknisi');
      } finally {
        setLoading(false);
      }
    };
    fetchTechs();
  }, [order]);

  if (!order) return null;

  const eligibleTechnicians = technicians.filter((t) => t.isEligibleForAssignment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechId) {
      setError('Silakan pilih teknisi yang memenuhi syarat.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await serviceOrderApi.assignTechnician(order.id, {
        technicianProfileId: selectedTechId,
        technicianInstructions: instructions.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal menugaskan teknisi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Tugaskan Teknisi</h3>
              <p className="text-xs text-slate-400 font-mono">{order.orderNumber} - {order.propertyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1.5">
              Pilih Teknisi Siap Tugas (Status: AVAILABLE) <span className="text-cyan-400">*</span>
            </label>

            {loading ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                Memuat daftar teknisi...
              </div>
            ) : eligibleTechnicians.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Tidak ada teknisi yang siap ditugaskan saat ini.</p>
                  <p className="text-[11px] text-amber-400/80 mt-1">
                    Semua teknisi sedang BUSY, ON_LEAVE, atau INACTIVE. Buka menu Kelola Ketersediaan Teknisi untuk mengubah status.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {eligibleTechnicians.map((t) => (
                  <label
                    key={t.technicianProfileId}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedTechId === t.technicianProfileId
                        ? 'bg-cyan-950/30 border-cyan-500/80 ring-1 ring-cyan-500/50'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="technicianSelect"
                        value={t.technicianProfileId}
                        checked={selectedTechId === t.technicianProfileId}
                        onChange={(e) => setSelectedTechId(e.target.value)}
                        className="text-cyan-500 focus:ring-cyan-500 h-4 w-4 bg-slate-900 border-slate-700"
                      />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{t.name}</span>
                          {t.employeeCode && (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {t.employeeCode}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {t.specialization || 'Umum'} {t.serviceArea ? `• Area: ${t.serviceArea}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
                        <Briefcase className="w-3 h-3" />
                        {t.activeAssignmentCount} tugas aktif
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Instruksi Khusus untuk Teknisi (Opsional)
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Contoh: Harap hubungi kontak pelanggan 1 hari sebelum kunjungan survei..."
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Instruksi ini hanya dapat dilihat oleh teknisi yang ditugaskan dan Super Admin (tidak terlihat oleh Pelanggan).
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={onClose}
              className="text-xs border-slate-700 text-slate-300"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || eligibleTechnicians.length === 0}
              className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Menugaskan...
                </>
              ) : (
                'Konfirmasi Penugasan'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
