import React, { useState, useEffect } from 'react';
import { History, X, Loader2, CheckCircle2, XCircle, User, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { serviceOrderApi } from '../../services/service-order.api';
import { ServiceOrderAssignmentItem } from '../../types/service-order';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface AssignmentHistoryModalProps {
  orderId: string | null;
  orderNumber?: string;
  onClose: () => void;
}

export const AssignmentHistoryModal: React.FC<AssignmentHistoryModalProps> = ({
  orderId,
  orderNumber,
  onClose,
}) => {
  const [history, setHistory] = useState<ServiceOrderAssignmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await serviceOrderApi.getOrderAssignmentHistory(orderId);
        setHistory(list);
      } catch (err: any) {
        setError(err?.message || 'Gagal mengambil riwayat penugasan');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [orderId]);

  if (!orderId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Riwayat Penugasan Teknisi</h3>
              <p className="text-xs text-slate-400 font-mono">{orderNumber || orderId}</p>
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

        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span>Memuat riwayat penugasan...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Belum ada riwayat penugasan teknisi untuk pesanan ini.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item, idx) => {
                const isActive = item.status === 'ACTIVE';
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition-all ${
                      isActive
                        ? 'bg-slate-950/70 border-cyan-800/60'
                        : 'bg-slate-950/30 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-mono text-[10px]">
                            AKTIF
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-800 text-slate-400 border border-slate-700 font-mono text-[10px]">
                            DIALIHKAN (REVOKED)
                          </Badge>
                        )}
                        <span className="font-bold text-white text-xs">{item.technician.name}</span>
                        {item.technician.employeeCode && (
                          <span className="font-mono text-[10px] text-slate-400">
                            ({item.technician.employeeCode})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        #{history.length - idx}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-900">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Ditugaskan:</span>
                        <span className="text-slate-300">
                          {new Date(item.assignedAt).toLocaleString('id-ID')}
                        </span>
                        <span className="text-slate-500 block text-[10px] mt-0.5">
                          oleh: {item.assignedBy.name}
                        </span>
                      </div>
                      {item.revokedAt && (
                        <div>
                          <span className="text-amber-500/80 block text-[10px]">Dicabut:</span>
                          <span className="text-slate-300">
                            {new Date(item.revokedAt).toLocaleString('id-ID')}
                          </span>
                          {item.revokedBy && (
                            <span className="text-slate-500 block text-[10px] mt-0.5">
                              oleh: {item.revokedBy.name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {item.reassignmentReason && (
                      <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-800/30 text-[11px] text-amber-300">
                        <strong className="block text-[10px] text-amber-400 uppercase font-semibold">
                          Alasan Pengalihan:
                        </strong>
                        {item.reassignmentReason}
                      </div>
                    )}

                    {item.technicianInstructions && (
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                        <strong className="block text-[10px] text-slate-500 uppercase font-semibold">
                          Instruksi Tugas:
                        </strong>
                        {item.technicianInstructions}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end border-t border-slate-800">
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
