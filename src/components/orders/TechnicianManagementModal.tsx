import React, { useState, useEffect } from 'react';
import { Wrench, X, Loader2, AlertCircle, CheckCircle2, User, Briefcase, RefreshCw } from 'lucide-react';
import { serviceOrderApi } from '../../services/service-order.api';
import { TechnicianSummaryDTO, TechnicianAvailabilityStatus } from '../../types/service-order';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface TechnicianManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAvailabilityChanged?: () => void;
}

export const TechnicianManagementModal: React.FC<TechnicianManagementModalProps> = ({
  isOpen,
  onClose,
  onAvailabilityChanged,
}) => {
  const [technicians, setTechnicians] = useState<TechnicianSummaryDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await serviceOrderApi.listTechnicians();
      setTechnicians(list);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat daftar teknisi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTechnicians();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStatusChange = async (
    technicianProfileId: string,
    newStatus: TechnicianAvailabilityStatus
  ) => {
    try {
      setUpdatingId(technicianProfileId);
      setError(null);
      setSuccessMessage(null);
      await serviceOrderApi.updateTechnicianAvailability(technicianProfileId, newStatus);
      setSuccessMessage('Status ketersediaan teknisi berhasil diperbarui.');
      // Refresh local state
      await fetchTechnicians();
      if (onAvailabilityChanged) {
        onAvailabilityChanged();
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memperbarui status ketersediaan');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: TechnicianAvailabilityStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]">AVAILABLE (Siap Tugas)</Badge>;
      case 'BUSY':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px]">BUSY (Sibuk)</Badge>;
      case 'ON_LEAVE':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/40 text-[10px]">ON LEAVE (Cuti)</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/40 text-[10px]">INACTIVE (Nonaktif)</Badge>;
      default:
        return <Badge className="bg-slate-800 text-slate-400 text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Kelola Ketersediaan Teknisi</h3>
              <p className="text-xs text-slate-400">
                Atur status ketersediaan operasional teknisi untuk penugasan pesanan baru
              </p>
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

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          <strong className="text-slate-300 block mb-0.5">Aturan Ketersediaan Operasional:</strong>
          Hanya teknisi dengan status <span className="text-emerald-400 font-bold">AVAILABLE</span> dan akun aktif yang dapat menerima penugasan baru. Mengubah status teknisi menjadi BUSY, ON_LEAVE, atau INACTIVE <span className="text-white">tidak mencabut penugasan yang sedang berjalan</span>.
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span>Memuat data teknisi...</span>
            </div>
          ) : technicians.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Tidak ada akun teknisi yang terdaftar pada sistem.
            </div>
          ) : (
            <div className="space-y-3">
              {technicians.map((t) => {
                const isUpdating = updatingId === t.technicianProfileId;
                return (
                  <div
                    key={t.technicianProfileId}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{t.name}</span>
                        {t.employeeCode && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {t.employeeCode}
                          </span>
                        )}
                        {getStatusBadge(t.availabilityStatus)}
                        {t.isActive ? (
                          <span className="text-[10px] text-emerald-400 font-semibold">• Akun Aktif</span>
                        ) : (
                          <span className="text-[10px] text-rose-400 font-semibold">• Akun Terkunci</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3 flex-wrap">
                        <span>Bidang: {t.specialization || 'Umum'}</span>
                        {t.serviceArea && <span>Area: {t.serviceArea}</span>}
                        {t.phone && <span>Telp: {t.phone}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:self-center shrink-0">
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
                          <Briefcase className="w-3 h-3" />
                          {t.activeAssignmentCount} tugas aktif
                        </span>
                      </div>

                      <div className="relative">
                        <select
                          disabled={isUpdating}
                          value={t.availabilityStatus}
                          onChange={(e) =>
                            handleStatusChange(
                              t.technicianProfileId,
                              e.target.value as TechnicianAvailabilityStatus
                            )
                          }
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer disabled:opacity-50"
                        >
                          <option value="AVAILABLE">AVAILABLE (Siap Tugas)</option>
                          <option value="BUSY">BUSY (Sibuk)</option>
                          <option value="ON_LEAVE">ON_LEAVE (Cuti)</option>
                          <option value="INACTIVE">INACTIVE (Nonaktif)</option>
                        </select>
                        {isUpdating && (
                          <div className="absolute inset-0 bg-slate-900/80 rounded-lg flex items-center justify-center">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={fetchTechnicians}
            className="text-xs text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs border-slate-700 text-slate-300"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
};
