import React, { useState, useEffect } from 'react';
import {
  X,
  Home,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Loader2,
  User,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ServiceOrder } from '../../types/service-order';
import { serviceOrderApi } from '../../services/service-order.api';
import { floorPlanApi } from '../../services/floor-plan.api';
import { Link } from 'react-router-dom';

interface AdminHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  onActivated: () => void;
}

export const AdminHandoverModal: React.FC<AdminHandoverModalProps> = ({
  isOpen,
  onClose,
  order,
  onActivated,
}) => {
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [activating, setActivating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  // Live quota / device count info
  const [deviceQuota, setDeviceQuota] = useState<{
    currentDevices: number;
    maxDevices: number | null;
  } | null>(null);
  const [loadingQuota, setLoadingQuota] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !order?.houseId) {
      setSuccessResult(null);
      setError(null);
      setAdminNotes('');
      setDeviceQuota(null);
      return;
    }

    const fetchQuota = async () => {
      try {
        setLoadingQuota(true);
        const q = await floorPlanApi.getHouseQuota(order.houseId!);
        setDeviceQuota(q);
      } catch (e) {
        console.warn('Failed to load quota for handover modal:', e);
      } finally {
        setLoadingQuota(false);
      }
    };

    fetchQuota();
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const handleActivate = async () => {
    try {
      setActivating(true);
      setError(null);

      const result = await serviceOrderApi.activateOrder(order.id, {
        adminNotes: adminNotes.trim() || undefined,
      });

      setSuccessResult(result);
      onActivated();
    } catch (err: any) {
      setError(err?.message || 'Gagal melakukan aktivasi properti.');
    } finally {
      setActivating(false);
    }
  };

  const house = order.house;
  const houseId = order.houseId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Handover & Aktivasi Properti
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Pesanan #{order.orderNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-300">
          {successResult ? (
            <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Properti Berhasil Diaktivasi!
                </h3>
                <p className="text-xs text-emerald-300/80 leading-relaxed max-w-md mx-auto">
                  Status properti kini berstatus <span className="font-bold text-white">ACTIVE</span>, seluruh penugasan teknisi berstatus <span className="font-bold text-white">COMPLETED</span>, dan pelanggan telah memperoleh hak akses kontrol penuh.
                </p>
              </div>

              {houseId && (
                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <Link
                    to={`/client/${houseId}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Lihat Client Dashboard</span>
                  </Link>
                  <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
                    Tutup
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              {/* Order & Property Summary Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-purple-400" />
                    <span>Informasi Properti</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-extrabold text-white truncate">
                      {house?.name || order.propertyName}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {order.propertyAddress}
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Status Saat Ini:</span>
                      <Badge className="bg-amber-950/40 text-amber-300 border-amber-800/60 text-[10px] font-bold">
                        {house?.setupStatus || 'CONFIGURING'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>Pelanggan & Paket</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-extrabold text-white truncate">
                      {order.contactName || (order.customer as any)?.fullName || 'Pelanggan'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      Paket: <span className="text-white font-medium">{order.packageName}</span>
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Perangkat Terpasang:</span>
                      <span className="font-bold text-white">
                        {loadingQuota ? (
                          <Loader2 className="w-3 h-3 animate-spin inline" />
                        ) : (
                          `${deviceQuota?.currentDevices ?? 0} ${
                            deviceQuota?.maxDevices ? `/ ${deviceQuota.maxDevices}` : ''
                          }`
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Handover Conditions Checklist */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/40 space-y-2.5">
                <div className="text-[11px] font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Daftar Prasyarat Serah Terima (Handover)</span>
                </div>
                <div className="space-y-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Survei lapangan telah diverifikasi oleh Super Admin</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Denah lantai 2D dan poligon ruangan telah dimodelkan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {deviceQuota && deviceQuota.currentDevices > 0 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span>
                      Minimal 1 perangkat IoT virtual telah ditempatkan & dikomisioning ({deviceQuota?.currentDevices ?? 0} perangkat terpasang)
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Handover Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Catatan Berita Acara Serah Terima (Opsional):
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Misal: Seluruh sensor dan saklar telah dikomisioning, edukasi aplikasi telah disampaikan kepada pelanggan."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-hidden focus:border-purple-500 text-xs transition-colors"
                />
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-[11px] text-purple-300/90 leading-relaxed">
                Tindakan aktivasi ini bersifat final. Properti akan langsung terbuka bagi pelanggan di portal client, dan tugas teknisi yang bertugas akan ditandai selesai (COMPLETED).
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!successResult && (
          <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-end gap-2.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={activating}
              className="text-xs text-slate-400 hover:text-white"
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleActivate}
              disabled={activating || (deviceQuota !== null && deviceQuota.currentDevices === 0)}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/40"
            >
              {activating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengaktivasi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Aktivasi & Serah Terima</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
