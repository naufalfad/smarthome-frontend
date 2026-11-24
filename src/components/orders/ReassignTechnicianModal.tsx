import React, { useState, useEffect } from 'react';
import { UserMinus, AlertTriangle, AlertCircle, Loader2, X, Briefcase, ShieldAlert } from 'lucide-react';
import { serviceOrderApi } from '../../services/service-order.api';
import { ServiceOrder, TechnicianSummaryDTO } from '../../types/service-order';
import { Button } from '../ui/button';

interface ReassignTechnicianModalProps {
  order: ServiceOrder | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReassignTechnicianModal: React.FC<ReassignTechnicianModalProps> = ({
  order,
  onClose,
  onSuccess,
}) => {
  const [technicians, setTechnicians] = useState<TechnicianSummaryDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const currentTech = order?.assignedTechnician as any;

  useEffect(() => {
    if (!order) return;
    const fetchTechs = async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await serviceOrderApi.listTechnicians();
        setTechnicians(list);
        // Find first eligible technician who is NOT the currently assigned technician
        const firstEligible = list.find(
          (t) => t.isEligibleForAssignment && t.technicianProfileId !== currentTech?.technicianProfileId
        );
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
  }, [order, currentTech]);

  if (!order) return null;

  // Filter out the currently assigned technician and ineligible technicians
  const eligibleReplacementTechs = technicians.filter(
    (t) => t.isEligibleForAssignment && t.technicianProfileId !== currentTech?.technicianProfileId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechId) {
      setError('Silakan pilih teknisi pengganti.');
      return;
    }

    if (!reason || reason.trim().length < 5) {
      setError('Alasan pengalihan tugas wajib diisi minimal 5 karakter.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await serviceOrderApi.reassignTechnician(order.id, {
        technicianProfileId: selectedTechId,
        reason: reason.trim(),
        technicianInstructions: instructions.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal mengalihkan penugasan teknisi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <UserMinus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Alihkan Penugasan Teknisi</h3>
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

        {/* Current Technician Card */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">
            Teknisi Saat Ini (Akan Dicabut):
          </span>
          <div className="flex items-center justify-between">
            <div className="font-bold text-white flex items-center gap-2">
              <span>{currentTech?.name || 'Teknisi Aktif'}</span>
              {currentTech?.employeeCode && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {currentTech.employeeCode}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400">{currentTech?.specialization || ''}</span>
          </div>
        </div>

        {/* Security / Immediate Revocation Warning */}
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px]">
            <strong className="font-semibold block text-amber-200">Perhatian Keamanan & Pencabutan Akses:</strong>
            Setelah pengalihan dikonfirmasi, teknisi sebelumnya akan <strong>segera kehilangan seluruh hak akses</strong> ke pesanan ini dan sumber daya properti terkait.
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Pilih Teknisi Pengganti (Status: AVAILABLE) <span className="text-amber-400">*</span>
            </label>

            {loading ? (
              <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                Memuat daftar teknisi pengganti...
              </div>
            ) : eligibleReplacementTechs.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                Tidak ada teknisi lain yang berstatus AVAILABLE saat ini.
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {eligibleReplacementTechs.map((t) => (
                  <label
                    key={t.technicianProfileId}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      selectedTechId === t.technicianProfileId
                        ? 'bg-amber-950/30 border-amber-500/80 ring-1 ring-amber-500/50'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="replacementTechSelect"
                        value={t.technicianProfileId}
                        checked={selectedTechId === t.technicianProfileId}
                        onChange={(e) => setSelectedTechId(e.target.value)}
                        className="text-amber-500 focus:ring-amber-500 h-4 w-4 bg-slate-900 border-slate-700"
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
                        <p className="text-[11px] text-slate-400">
                          {t.specialization || 'Umum'} {t.serviceArea ? `• ${t.serviceArea}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                      <Briefcase className="w-3 h-3" />
                      {t.activeAssignmentCount} tugas
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Alasan Pengalihan Tugas (Wajib diisi) <span className="text-amber-400">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Teknisi sebelumnya mendadak izin cuti sakit..."
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none"
            />
            <p className="text-[10px] text-slate-500 mt-0.5">
              Minimal 5 karakter. Alasan ini dicatat permanen dalam riwayat penugasan untuk audit internal.
            </p>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Instruksi Tambahan untuk Teknisi Pengganti (Opsional)
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Catatan khusus serah terima tugas..."
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none"
            />
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
              disabled={submitting || eligibleReplacementTechs.length === 0 || reason.trim().length < 5}
              className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Mengalihkan...
                </>
              ) : (
                'Konfirmasi Pengalihan'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
