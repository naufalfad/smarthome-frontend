/**
 * PHASE 7: SUPER ADMIN COMMERCIAL SERVICE ORDERS MANAGEMENT
 *
 * Provides Super Admin with comprehensive order review, status filtering,
 * search across customer/property/package metadata, immutable package snapshot inspection,
 * complete status history audit trail, and concurrency-safe Confirm / Reject decisions.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Package,
  Home,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Eye,
  Check,
  X,
  FileText,
  User,
  Phone,
  Mail,
  Calendar,
  Layers,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Wrench,
  History,
  UserCheck,
  UserMinus,
  ClipboardCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { serviceOrderApi } from '../../services/service-order.api';
import { ServiceOrder, ServiceOrderStatus } from '../../types/service-order';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { AssignTechnicianModal } from '../../components/orders/AssignTechnicianModal';
import { ReassignTechnicianModal } from '../../components/orders/ReassignTechnicianModal';
import { AssignmentHistoryModal } from '../../components/orders/AssignmentHistoryModal';
import { TechnicianManagementModal } from '../../components/orders/TechnicianManagementModal';
import { AdminSurveyReviewModal } from '../../components/orders/AdminSurveyReviewModal';
import { AdminHandoverModal } from '../../components/orders/AdminHandoverModal';

export const AdminServiceOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Order for Detail Drawer / Modal
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Phase 8: Technician Assignment & Management State
  const [orderToAssign, setOrderToAssign] = useState<ServiceOrder | null>(null);
  const [orderToReassign, setOrderToReassign] = useState<ServiceOrder | null>(null);
  const [orderHistoryModalId, setOrderHistoryModalId] = useState<string | null>(null);
  const [orderHistoryModalNumber, setOrderHistoryModalNumber] = useState<string | null>(null);
  const [showTechManagement, setShowTechManagement] = useState<boolean>(false);

  // Phase 9: Field Survey Review State
  const [surveyReviewOrderId, setSurveyReviewOrderId] = useState<string | null>(null);
  const [surveyReviewOrderNumber, setSurveyReviewOrderNumber] = useState<string | null>(null);

  // Phase 11: Handover & Property Activation State
  const [orderToHandover, setOrderToHandover] = useState<ServiceOrder | null>(null);

  // Action Modals State
  const [orderToConfirm, setOrderToConfirm] = useState<ServiceOrder | null>(null);
  const [confirmAdminNotes, setConfirmAdminNotes] = useState<string>('');
  const [confirming, setConfirming] = useState<boolean>(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [orderToReject, setOrderToReject] = useState<ServiceOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectAdminNotes, setRejectAdminNotes] = useState<string>('');
  const [rejecting, setRejecting] = useState<boolean>(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const statusParam = statusFilter !== 'ALL' ? (statusFilter as ServiceOrderStatus) : undefined;
      const res = await serviceOrderApi.getAdminOrders({
        status: statusParam,
        search: searchQuery.trim() || undefined,
        limit: 100,
      });

      setOrders(res.items);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat daftar pesanan');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenDetail = async (orderId: string) => {
    try {
      setLoadingDetail(true);
      const detail = await serviceOrderApi.getAdminOrderById(orderId);
      setSelectedOrder(detail);
    } catch (err: any) {
      alert(err?.message || 'Gagal mengambil rincian pesanan');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!orderToConfirm) return;

    try {
      setConfirming(true);
      setConfirmError(null);

      await serviceOrderApi.confirmOrder(orderToConfirm.id, {
        adminNotes: confirmAdminNotes.trim() || undefined,
      });

      setOrderToConfirm(null);
      setConfirmAdminNotes('');
      if (selectedOrder?.id === orderToConfirm.id) {
        handleOpenDetail(orderToConfirm.id);
      }
      fetchOrders();
    } catch (err: any) {
      setConfirmError(err?.message || 'Gagal mengonfirmasi pesanan');
    } finally {
      setConfirming(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!orderToReject) return;

    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      setRejectError('Alasan penolakan pelanggan wajib diisi (minimal 5 karakter).');
      return;
    }

    try {
      setRejecting(true);
      setRejectError(null);

      await serviceOrderApi.rejectOrder(orderToReject.id, {
        rejectionReason: rejectionReason.trim(),
        adminNotes: rejectAdminNotes.trim() || undefined,
      });

      setOrderToReject(null);
      setRejectionReason('');
      setRejectAdminNotes('');
      if (selectedOrder?.id === orderToReject.id) {
        handleOpenDetail(orderToReject.id);
      }
      fetchOrders();
    } catch (err: any) {
      setRejectError(err?.message || 'Gagal menolak pesanan');
    } finally {
      setRejecting(false);
    }
  };

  const formatPrice = (price: string | number, currency = 'IDR') => {
    const num = Number(price);
    if (isNaN(num)) return `Rp ${price}`;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency || 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const metrics = useMemo(() => {
    const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
    const confirmedCount = orders.filter((o) => o.status === 'CONFIRMED').length;
    const rejectedCount = orders.filter((o) => o.status === 'REJECTED').length;
    const totalRevenue = orders
      .filter((o) => o.status === 'CONFIRMED')
      .reduce((acc, curr) => acc + Number(curr.packagePrice || 0), 0);

    return {
      total: orders.length,
      pendingCount,
      confirmedCount,
      rejectedCount,
      totalRevenue,
    };
  }, [orders]);

  const getStatusBadge = (status: ServiceOrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[11px] font-semibold">
            Menunggu Konfirmasi
          </Badge>
        );
      case 'CONFIRMED':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[11px] font-semibold">
            Dikonfirmasi
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[11px] font-semibold">
            Ditolak
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge className="bg-slate-700/50 text-slate-400 border-slate-700 text-[11px] font-semibold">
            Dibatalkan Pelanggan
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Manajemen Pesanan Layanan Komersial
            </h1>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px] uppercase font-bold">
              Phase 7 & 8
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tinjau pesanan komersial, tetapkan konfirmasi, dan kelola penugasan teknisi lapangan serta ketersediaan tim.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowTechManagement(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Kelola Ketersediaan Teknisi</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={loading}
            className="border-slate-700 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Segarkan</span>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Pesanan</span>
          <div className="text-2xl font-black text-white mt-1">{metrics.total}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Semua riwayat pesanan</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-amber-900/40">
          <span className="text-[10px] text-amber-400 uppercase font-semibold block">Menunggu Konfirmasi</span>
          <div className="text-2xl font-black text-amber-400 mt-1">{metrics.pendingCount}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Perlu verifikasi admin</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-emerald-900/40">
          <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Dikonfirmasi</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{metrics.confirmedCount}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Siap alur operasional</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Estimasi Omset Dikonfirmasi</span>
          <div className="text-lg font-black text-cyan-400 mt-1 truncate">
            {formatPrice(metrics.totalRevenue)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Dari pesanan disetujui</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {['ALL', 'PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-cyan-600 text-white shadow'
                  : 'bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === 'ALL'
                ? 'Semua Status'
                : st === 'PENDING'
                ? `Menunggu (${metrics.pendingCount})`
                : st === 'CONFIRMED'
                ? 'Dikonfirmasi'
                : st === 'REJECTED'
                ? 'Ditolak'
                : 'Dibatalkan'}
            </button>
          ))}
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no. pesanan, nama pelanggan, email, paket..."
            className="w-full h-9 pl-8 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="py-24 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Memuat data pesanan komersial...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-red-950/30 border border-red-800/50 text-center text-xs text-red-300">
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            className="mt-3 text-xs border-red-800 text-red-200"
          >
            Coba Lagi
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 p-8">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">Belum ada pesanan ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tidak ada pesanan yang sesuai dengan filter atau kata kunci pencarian yang dimasukkan.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">No. Pesanan</th>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4">Paket Layanan</th>
                  <th className="py-3.5 px-4">Lokasi Properti</th>
                  <th className="py-3.5 px-4">Teknisi Ditugaskan</th>
                  <th className="py-3.5 px-4">Tanggal Pengajuan</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((order) => {
                  const isPending = order.status === 'PENDING';
                  return (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Order Number */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-cyan-400">
                          {order.orderNumber}
                        </span>
                      </td>

                      {/* Customer & Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">
                          {order.contactName || order.customer?.fullName || '-'}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          {order.contactPhone && (
                            <span className="flex items-center gap-1 text-cyan-400 font-medium">
                              <Phone className="w-3 h-3 text-cyan-500" />
                              {order.contactPhone}
                            </span>
                          )}
                          {order.customer?.user?.email && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Mail className="w-3 h-3 text-slate-500" />
                              {order.customer.user.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Package Name & Price */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{order.packageName}</div>
                        <div className="text-emerald-400 font-semibold text-[11px]">
                          {formatPrice(order.packagePrice, order.currency)}
                        </div>
                      </td>

                      {/* Property Details */}
                      <td className="py-3.5 px-4 max-w-xs truncate">
                        <div className="font-medium text-slate-200">{order.propertyName}</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {order.propertyAddress}
                          {order.city ? `, ${order.city}` : ''}
                        </div>
                      </td>

                      {/* Assigned Technician */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {order.assignedTechnician ? (
                          <div className="space-y-0.5">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span>{order.assignedTechnician.name}</span>
                            </div>
                            {order.assignedTechnician.employeeCode && (
                              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 block w-max">
                                {order.assignedTechnician.employeeCode}
                              </span>
                            )}
                          </div>
                        ) : order.status === 'CONFIRMED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded-md">
                            Belum Ditugaskan
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">-</span>
                        )}
                      </td>

                      {/* Submission Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDetail(order.id)}
                            className="text-xs h-8 border-slate-700 hover:bg-slate-800 text-slate-300 flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Tinjau</span>
                          </Button>

                          {order.status === 'CONFIRMED' && (
                            <>
                              {!order.assignedTechnician ? (
                                <Button
                                  size="sm"
                                  onClick={() => setOrderToAssign(order)}
                                  className="text-xs h-8 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Tugaskan</span>
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setOrderToReassign(order)}
                                    className="text-xs h-8 border-amber-700/60 text-amber-300 hover:bg-amber-950/40 flex items-center gap-1"
                                  >
                                    <UserMinus className="w-3.5 h-3.5" />
                                    <span>Ganti</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSurveyReviewOrderId(order.id);
                                      setSurveyReviewOrderNumber(order.orderNumber);
                                    }}
                                    className="text-xs h-8 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1"
                                    title="Tinjau Hasil Survei Lapangan"
                                  >
                                    <ClipboardCheck className="w-3.5 h-3.5" />
                                    <span>Survei</span>
                                  </Button>
                                  {order.house && order.house.setupStatus !== 'ACTIVE' && (
                                    <Button
                                      size="sm"
                                      onClick={() => setOrderToHandover(order)}
                                      className="text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 shadow-xs"
                                      title="Handover & Aktivasi Properti"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>Handover</span>
                                    </Button>
                                  )}
                                  {order.house && order.house.setupStatus === 'ACTIVE' && (
                                    <Link
                                      to={`/client/${order.house.id}`}
                                      target="_blank"
                                      className="inline-flex items-center gap-1 text-xs h-8 px-2.5 rounded-md bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/40 font-semibold"
                                      title="Lihat Dashboard Monitoring Pelanggan"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      <span>Aktif</span>
                                    </Link>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setOrderHistoryModalId(order.id);
                                      setOrderHistoryModalNumber(order.orderNumber);
                                    }}
                                    className="text-xs h-8 text-slate-400 hover:text-white px-2"
                                    title="Riwayat Penugasan"
                                  >
                                    <History className="w-3.5 h-3.5" />
                                  </Button>
                                </>
                              )}
                            </>
                          )}

                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setOrderToConfirm(order);
                                  setConfirmAdminNotes('');
                                  setConfirmError(null);
                                }}
                                className="text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Konfirmasi</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setOrderToReject(order);
                                  setRejectionReason('');
                                  setRejectAdminNotes('');
                                  setRejectError(null);
                                }}
                                className="text-xs h-8 border-red-800 text-red-400 hover:bg-red-950/30 flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Tolak</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL ORDER DETAIL DRAWER / MODAL */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-black text-cyan-400">
                    {selectedOrder.orderNumber}
                  </span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <h3 className="text-xl font-bold text-white mt-1">{selectedOrder.packageName}</h3>
                <div className="text-emerald-400 font-extrabold text-sm">
                  {formatPrice(selectedOrder.packagePrice, selectedOrder.currency)}
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Bar inside Detail if PENDING */}
            {selectedOrder.status === 'PENDING' && (
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-center justify-between gap-4">
                <div className="text-xs text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Pesanan ini sedang menunggu keputusan konfirmasi dari administrator.</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => {
                      setOrderToConfirm(selectedOrder);
                      setConfirmAdminNotes('');
                      setConfirmError(null);
                    }}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Konfirmasi
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setOrderToReject(selectedOrder);
                      setRejectionReason('');
                      setRejectAdminNotes('');
                      setRejectError(null);
                    }}
                    className="text-xs border-red-800 text-red-400 hover:bg-red-950/30 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Tolak
                  </Button>
                </div>
              </div>
            )}

            {/* Customer & Contact Section */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Informasi Kontak Pemesan & Akun
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Kontak Pemesan (Snapshot)</span>
                  <span className="font-semibold text-white">
                    {selectedOrder.contactName || selectedOrder.customer?.fullName || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Telepon / WhatsApp Pemesan</span>
                  <span className="font-semibold text-cyan-400">
                    {selectedOrder.contactPhone || selectedOrder.customer?.phone || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Email Akun Pelanggan</span>
                  <span className="font-semibold text-white">
                    {selectedOrder.customer?.user?.email || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Property Scope Section */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5" />
                Spesifikasi Lokasi Properti
              </h4>
              <div className="grid grid-cols-2 gap-3 text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Nama Properti</span>
                  <span className="font-semibold text-white">{selectedOrder.propertyName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Tipe Properti</span>
                  <span className="font-semibold text-white">{selectedOrder.propertyType}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Alamat Pemasangan</span>
                <span className="text-slate-300 leading-relaxed">
                  {selectedOrder.propertyAddress}
                  {selectedOrder.city ? `, ${selectedOrder.city}` : ''}
                  {selectedOrder.postalCode ? ` ${selectedOrder.postalCode}` : ''}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Estimasi Luas</span>
                  <span>{selectedOrder.approximateAreaM2 ? `${selectedOrder.approximateAreaM2} m²` : 'Tidak dicantumkan'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Estimasi Ruangan</span>
                  <span>{selectedOrder.estimatedRooms ? `${selectedOrder.estimatedRooms} Ruang` : 'Tidak dicantumkan'}</span>
                </div>
              </div>

              {selectedOrder.customerNotes && (
                <div className="pt-2 border-t border-slate-800 text-slate-400">
                  <span className="text-[10px] text-slate-500 uppercase block">Catatan Pelanggan:</span>
                  <span>&ldquo;{selectedOrder.customerNotes}&rdquo;</span>
                </div>
              )}
            </div>

            {/* Decision & Internal Notes Details (if not pending) */}
            {selectedOrder.status === 'CONFIRMED' && (
              <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-800/40 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Pesanan Dikonfirmasi
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Dikonfirmasi Oleh:</span>
                    <span>{selectedOrder.confirmedByAdmin?.username || selectedOrder.confirmedByAdmin?.email || 'Super Admin'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Waktu Konfirmasi:</span>
                    <span>{selectedOrder.confirmedAt ? new Date(selectedOrder.confirmedAt).toLocaleString('id-ID') : '-'}</span>
                  </div>
                </div>
                {selectedOrder.adminNotes && (
                  <div className="pt-2 border-t border-emerald-900/40 text-[11px] text-slate-300">
                    <span className="text-slate-500 block font-semibold">Catatan Internal Admin:</span>
                    <span>{selectedOrder.adminNotes}</span>
                  </div>
                )}
              </div>
            )}

            {/* Phase 8: Technician Assignment Card in Drawer */}
            {selectedOrder.status === 'CONFIRMED' && (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Wrench className="w-4 h-4 text-cyan-400" />
                    <span>Penugasan Teknisi Lapangan</span>
                  </div>
                  {selectedOrder.assignedTechnician ? (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[10px]">
                      DITUGASKAN
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px]">
                      BELUM DITUGASKAN
                    </Badge>
                  )}
                </div>

                {selectedOrder.assignedTechnician ? (
                  <div className="space-y-2.5 pt-1 border-t border-slate-800/80">
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Nama Teknisi:</span>
                        <span className="font-bold text-white">{selectedOrder.assignedTechnician.name}</span>
                        {selectedOrder.assignedTechnician.employeeCode && (
                          <span className="font-mono text-[10px] text-slate-400 block">
                            ({selectedOrder.assignedTechnician.employeeCode})
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Spesialisasi & Area:</span>
                        <span>{selectedOrder.assignedTechnician.specialization || 'Umum'}</span>
                        {selectedOrder.assignedTechnician.serviceArea && (
                          <span className="text-slate-400 block text-[10px]">Area: {selectedOrder.assignedTechnician.serviceArea}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      <span className="text-slate-500 block text-[10px]">Waktu Penugasan:</span>
                      <span>{new Date(selectedOrder.assignedTechnician.assignedAt).toLocaleString('id-ID')}</span>
                    </div>

                    {selectedOrder.assignedTechnician.technicianInstructions && (
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Instruksi Khusus Teknisi:</span>
                        <span>{selectedOrder.assignedTechnician.technicianInstructions}</span>
                      </div>
                    )}

                    <div className="pt-2 flex items-center gap-2 border-t border-slate-800">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSurveyReviewOrderId(selectedOrder.id);
                          setSurveyReviewOrderNumber(selectedOrder.orderNumber);
                        }}
                        className="text-xs h-8 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        <span>Tinjau Survei Lapangan</span>
                      </Button>
                      {selectedOrder.house && selectedOrder.house.setupStatus !== 'ACTIVE' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setOrderToHandover(selectedOrder);
                          }}
                          className="text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Handover & Aktivasi</span>
                        </Button>
                      )}
                      {selectedOrder.house && selectedOrder.house.setupStatus === 'ACTIVE' && (
                        <Link
                          to={`/client/${selectedOrder.house.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 text-xs h-8 px-3 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/40 font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Client Dashboard</span>
                        </Link>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setOrderToReassign(selectedOrder);
                        }}
                        className="text-xs h-8 border-amber-700/60 text-amber-300 hover:bg-amber-950/40 flex items-center gap-1.5"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        <span>Ganti Teknisi</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setOrderHistoryModalId(selectedOrder.id);
                          setOrderHistoryModalNumber(selectedOrder.orderNumber);
                        }}
                        className="text-xs h-8 text-slate-400 hover:text-white flex items-center gap-1.5"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Riwayat Penugasan</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-1 border-t border-slate-800/80 space-y-2">
                    <p className="text-[11px] text-slate-400">
                      Pesanan telah dikonfirmasi dan siap untuk ditugaskan kepada teknisi lapangan.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        setOrderToAssign(selectedOrder);
                      }}
                      className="text-xs h-8 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Tugaskan Teknisi Sekarang</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {selectedOrder.status === 'REJECTED' && (
              <div className="p-4 rounded-xl bg-red-950/25 border border-red-800/40 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-red-400">
                  <XCircle className="w-4 h-4" />
                  Pesanan Ditolak
                </div>
                <div className="text-slate-300 text-[11px]">
                  <span className="text-slate-500 block font-semibold">Alasan Penolakan (Dilihat Pelanggan):</span>
                  <span className="text-red-200 font-medium">{selectedOrder.rejectionReason}</span>
                </div>
                {selectedOrder.adminNotes && (
                  <div className="pt-2 border-t border-red-900/40 text-[11px] text-slate-300">
                    <span className="text-slate-500 block font-semibold">Catatan Internal Admin:</span>
                    <span>{selectedOrder.adminNotes}</span>
                  </div>
                )}
              </div>
            )}

            {/* Package Snapshot & Inclusions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Inklusi Paket Terpilih (Snapshot Komersial)
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedOrder.packageSnapshot?.inclusions?.map((inc, i) => (
                  <div
                    key={inc.id || i}
                    className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-2.5 text-xs"
                  >
                    {inc.isIncluded ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold text-slate-200">
                        {inc.displayName}
                        {inc.quantity ? ` (${inc.quantity} Unit)` : ''}
                      </div>
                      {inc.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{inc.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status History Audit Trail */}
            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Riwayat Audit Perubahan Status
                </h4>
                <div className="space-y-2 text-xs">
                  {selectedOrder.statusHistory.map((item, i) => (
                    <div
                      key={item.id || i}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {item.previousStatus ? `${item.previousStatus} ➔ ` : ''}
                            {item.newStatus}
                          </span>
                          <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">
                            Aktor: {item.actorRole} ({item.actorUser?.username || item.actorUser?.email || '-'})
                          </Badge>
                        </div>
                        {item.reason && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.reason}</p>
                        )}
                        {item.notes && (
                          <p className="text-[11px] text-amber-300/80 mt-0.5">
                            Catatan Internal: {item.notes}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrder(null)}
                className="text-xs border-slate-700 text-slate-300"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM ORDER MODAL */}
      {/* ========================================================================= */}
      {orderToConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="w-10 h-10 rounded-full bg-emerald-950/60 border border-emerald-800 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Konfirmasi Pesanan Layanan</h3>
                <span className="font-mono text-xs text-slate-400">{orderToConfirm.orderNumber}</span>
              </div>
            </div>

            {confirmError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                {confirmError}
              </div>
            )}

            <p className="text-xs text-slate-300 leading-relaxed">
              Anda akan mengonfirmasi pesanan <strong>{orderToConfirm.packageName}</strong> untuk pelanggan{' '}
              <strong>{orderToConfirm.customer?.fullName || 'Pelanggan'}</strong>. Status pesanan akan berubah menjadi <strong>CONFIRMED</strong>.
            </p>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Catatan Internal Admin (Opsional)
              </label>
              <textarea
                rows={2}
                value={confirmAdminNotes}
                onChange={(e) => setConfirmAdminNotes(e.target.value)}
                placeholder="Catatan verifikasi atau instruksi persiapan tim..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={confirming}
                onClick={() => setOrderToConfirm(null)}
                className="text-xs border-slate-700 text-slate-300"
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={confirming}
                onClick={handleConfirmOrder}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                {confirming ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Mengonfirmasi...
                  </>
                ) : (
                  'Konfirmasi Pesanan'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REJECT ORDER MODAL */}
      {/* ========================================================================= */}
      {orderToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-800 flex items-center justify-center">
                <X className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Tolak Pengajuan Pesanan</h3>
                <span className="font-mono text-xs text-slate-400">{orderToReject.orderNumber}</span>
              </div>
            </div>

            {rejectError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                {rejectError}
              </div>
            )}

            <p className="text-xs text-slate-300 leading-relaxed">
              Pesanan yang ditolak akan menampilkan alasan penolakan secara transparan kepada pelanggan di portal pelanggan mereka.
            </p>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Alasan Penolakan (Dilihat Pelanggan) <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Lokasi berada di luar jangkauan area layanan kami saat ini..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Catatan Internal Admin (Opsional)
              </label>
              <textarea
                rows={2}
                value={rejectAdminNotes}
                onChange={(e) => setRejectAdminNotes(e.target.value)}
                placeholder="Catatan rahasia admin..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={rejecting}
                onClick={() => setOrderToReject(null)}
                className="text-xs border-slate-700 text-slate-300"
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={rejecting}
                onClick={handleRejectOrder}
                className="text-xs bg-red-600 hover:bg-red-500 text-white font-semibold"
              >
                {rejecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Menolak...
                  </>
                ) : (
                  'Tolak Pesanan'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 8: ASSIGN TECHNICIAN MODAL */}
      {/* ========================================================================= */}
      {orderToAssign && (
        <AssignTechnicianModal
          order={orderToAssign}
          onClose={() => setOrderToAssign(null)}
          onSuccess={() => {
            fetchOrders();
            if (selectedOrder?.id === orderToAssign.id) {
              handleOpenDetail(orderToAssign.id);
            }
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* PHASE 8: REASSIGN TECHNICIAN MODAL */}
      {/* ========================================================================= */}
      {orderToReassign && (
        <ReassignTechnicianModal
          order={orderToReassign}
          onClose={() => setOrderToReassign(null)}
          onSuccess={() => {
            fetchOrders();
            if (selectedOrder?.id === orderToReassign.id) {
              handleOpenDetail(orderToReassign.id);
            }
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* PHASE 8: ASSIGNMENT HISTORY MODAL */}
      {/* ========================================================================= */}
      {orderHistoryModalId && (
        <AssignmentHistoryModal
          orderId={orderHistoryModalId}
          orderNumber={orderHistoryModalNumber || undefined}
          onClose={() => {
            setOrderHistoryModalId(null);
            setOrderHistoryModalNumber(null);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* PHASE 8: TECHNICIAN AVAILABILITY MANAGEMENT MODAL */}
      {/* ========================================================================= */}
      <TechnicianManagementModal
        isOpen={showTechManagement}
        onClose={() => setShowTechManagement(false)}
        onAvailabilityChanged={() => {
          fetchOrders();
        }}
      />

      {/* ========================================================================= */}
      {/* PHASE 9: FIELD SURVEY REVIEW & VERIFICATION MODAL */}
      {/* ========================================================================= */}
      <AdminSurveyReviewModal
        isOpen={Boolean(surveyReviewOrderId)}
        onClose={() => {
          setSurveyReviewOrderId(null);
          setSurveyReviewOrderNumber(null);
        }}
        orderId={surveyReviewOrderId}
        orderNumber={surveyReviewOrderNumber}
        onSurveyVerified={() => {
          fetchOrders();
        }}
      />

      {/* ========================================================================= */}
      {/* PHASE 11: HANDOVER & PROPERTY ACTIVATION MODAL */}
      {/* ========================================================================= */}
      <AdminHandoverModal
        isOpen={Boolean(orderToHandover)}
        onClose={() => setOrderToHandover(null)}
        order={orderToHandover}
        onActivated={() => {
          fetchOrders();
          if (selectedOrder) {
            handleOpenDetail(selectedOrder.id);
          }
        }}
      />
    </div>
  );
};

export default AdminServiceOrdersPage;
