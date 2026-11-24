/**
 * PHASE 7: CUSTOMER SERVICE ORDERS PAGE
 *
 * Displays Customer's submitted service orders, status badges, detailed immutable
 * package snapshot, status history audit trail, rejection reasons, and self-service
 * order cancellation strictly while status === 'PENDING'.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag,
  Package,
  Home,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Search,
  Eye,
  Ban,
  FileText,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  X,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { serviceOrderApi } from '../../services/service-order.api';
import { ServiceOrder, ServiceOrderStatus } from '../../types/service-order';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

export const CustomerOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Cancel Dialog
  const [orderToCancel, setOrderToCancel] = useState<ServiceOrder | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const statusParam = statusFilter !== 'ALL' ? (statusFilter as ServiceOrderStatus) : undefined;
      const res = await serviceOrderApi.getMyOrders({
        status: statusParam,
        search: searchQuery.trim() || undefined,
        limit: 50,
      });

      setOrders(res.items);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat riwayat pesanan');
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
      const detail = await serviceOrderApi.getMyOrderById(orderId);
      setSelectedOrder(detail);
    } catch (err: any) {
      alert(err?.message || 'Gagal memuat detail pesanan');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;

    try {
      setCancelling(true);
      setCancelError(null);

      await serviceOrderApi.cancelMyOrder(orderToCancel.id, {
        cancellationReason: cancelReason.trim() || undefined,
      });

      setOrderToCancel(null);
      setCancelReason('');
      if (selectedOrder?.id === orderToCancel.id) {
        setSelectedOrder(null);
      }
      fetchOrders();
    } catch (err: any) {
      setCancelError(err?.message || 'Gagal membatalkan pesanan');
    } finally {
      setCancelling(false);
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
            Dibatalkan
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali ke Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-sm tracking-wide text-slate-100">Riwayat Pesanan Layanan</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/catalog/packages">
              <Button
                size="sm"
                className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Pesan Paket Baru</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              disabled={loading}
              className="border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
              title="Segarkan riwayat pesanan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner Overview */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-slate-800 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Pesanan Smart Home Anda</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Pantau status peninjauan dan konfirmasi pesanan layanan turnkey Anda. Super Admin akan meninjau kelayakan teknis sebelum penjadwalan survei dan penugasan teknisi.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Pesanan</span>
              <span className="text-base font-bold text-white">{orders.length} Permintaan</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {['ALL', 'PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {st === 'ALL'
                  ? 'Semua Status'
                  : st === 'PENDING'
                  ? 'Menunggu'
                  : st === 'CONFIRMED'
                  ? 'Dikonfirmasi'
                  : st === 'REJECTED'
                  ? 'Ditolak'
                  : 'Dibatalkan'}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no. pesanan / paket / properti..."
              className="w-full h-9 pl-8 pr-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Orders List / Empty State */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Memuat riwayat pesanan layanan...</p>
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
          <div className="py-20 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8">
            <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">Belum ada pesanan ditemukan</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {statusFilter !== 'ALL' || searchQuery
                ? 'Tidak ada pesanan yang sesuai dengan filter atau kata kunci pencarian Anda.'
                : 'Anda belum memiliki riwayat pengajuan pesanan. Mulai dengan memilih paket layanan dari katalog kami.'}
            </p>
            <Link to="/catalog/packages" className="inline-block mt-4">
              <Button size="sm" className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
                Buka Katalog Layanan
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isPending = order.status === 'PENDING';
              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm p-5 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left Column: Number, Package, and Property */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-sm font-black text-cyan-400 tracking-wider">
                        {order.orderNumber}
                      </span>
                      {getStatusBadge(order.status)}
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="font-bold text-white text-sm">{order.packageName}</span>
                      <span className="text-emerald-400 font-extrabold text-sm">
                        {formatPrice(order.packagePrice, order.currency)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Home className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="font-medium text-slate-300">{order.propertyName}</span>
                      <span className="text-slate-600">•</span>
                      <span className="truncate max-w-md">{order.propertyAddress}</span>
                    </div>

                    {/* Assigned Technician Badge (Phase 8 projection) */}
                    {order.assignedTechnician && (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-xs text-cyan-300 max-w-fit">
                        <Wrench className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span>
                          Teknisi Ditugaskan: <strong className="text-white font-semibold">{order.assignedTechnician.name}</strong>
                          {order.assignedTechnician.employeeCode ? ` (${order.assignedTechnician.employeeCode})` : ''}
                        </span>
                      </div>
                    )}

                    {/* Rejection notice banner if REJECTED */}
                    {order.status === 'REJECTED' && order.rejectionReason && (
                      <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/40 text-xs text-red-300 flex items-start gap-2 max-w-2xl">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold block">Alasan Penolakan:</strong>
                          <span>{order.rejectionReason}</span>
                        </div>
                      </div>
                    )}

                    {/* Cancellation reason banner if CANCELLED */}
                    {order.status === 'CANCELLED' && order.cancellationReason && (
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
                        Alasan pembatalan: {order.cancellationReason}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDetail(order.id)}
                      className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200 flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Rincian</span>
                    </Button>

                    {isPending && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setOrderToCancel(order);
                          setCancelReason('');
                          setCancelError(null);
                        }}
                        className="text-xs border-red-800/60 text-red-400 hover:bg-red-950/30 flex items-center gap-1.5"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Batalkan</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* ORDER DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-cyan-400">
                    {selectedOrder.orderNumber}
                  </span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{selectedOrder.packageName}</h3>
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

            {/* Rejection / Cancellation Alerts */}
            {selectedOrder.status === 'REJECTED' && selectedOrder.rejectionReason && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-red-200">
                  <XCircle className="w-4 h-4 text-red-400" />
                  Alasan Penolakan oleh Super Admin
                </div>
                <p className="leading-relaxed pl-5">{selectedOrder.rejectionReason}</p>
              </div>
            )}

            {selectedOrder.status === 'CANCELLED' && selectedOrder.cancellationReason && (
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-slate-400">Keterangan Pembatalan:</div>
                <p>{selectedOrder.cancellationReason}</p>
              </div>
            )}

            {/* Assigned Technician Info (Phase 8 projection) */}
            {selectedOrder.assignedTechnician && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                  Teknisi Lapangan Ditugaskan
                </h4>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-cyan-900/50 text-xs space-y-2.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Nama Teknisi</span>
                      <span className="font-bold text-white">{selectedOrder.assignedTechnician.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">ID / Kode Teknisi</span>
                      <span className="font-mono text-cyan-400 font-semibold">{selectedOrder.assignedTechnician.employeeCode || '-'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Spesialisasi</span>
                      <span className="text-slate-300">{selectedOrder.assignedTechnician.specialization || 'Smart Home Field Specialist'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Tanggal Penugasan</span>
                      <span className="text-slate-300">
                        {new Date(selectedOrder.assignedTechnician.assignedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-cyan-950/40 text-[11px] text-cyan-200 border border-cyan-800/30">
                    Teknisi resmi kami akan berkoordinasi dan menghubungi Anda sesuai kontak yang terdaftar untuk pelaksanaan survei dan instalasi teknis.
                  </div>
                </div>
              </div>
            )}

            {/* Property Details */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Lokasi & Spesifikasi Properti
              </h4>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
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

                {(selectedOrder.contactName || selectedOrder.contactPhone) && (
                  <div className="grid grid-cols-2 gap-3 pt-1 text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Kontak Pemesan</span>
                      <span className="font-semibold text-white">{selectedOrder.contactName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Telepon / WhatsApp</span>
                      <span className="font-semibold text-cyan-400">{selectedOrder.contactPhone || '-'}</span>
                    </div>
                  </div>
                )}

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
                    <span className="text-[10px] text-slate-500 uppercase block">Luas Bangunan</span>
                    <span>{selectedOrder.approximateAreaM2 ? `${selectedOrder.approximateAreaM2} m²` : 'Tidak dicantumkan'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Perkiraan Ruangan</span>
                    <span>{selectedOrder.estimatedRooms ? `${selectedOrder.estimatedRooms} Ruang` : 'Tidak dicantumkan'}</span>
                  </div>
                </div>

                {selectedOrder.customerNotes && (
                  <div className="pt-2 border-t border-slate-800/80 text-slate-400">
                    <span className="text-[10px] text-slate-500 uppercase block">Catatan Anda:</span>
                    <span>&ldquo;{selectedOrder.customerNotes}&rdquo;</span>
                  </div>
                )}
              </div>
            </div>

            {/* Package Snapshot & Inclusions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Rincian Inklusi Layanan (Snapshot Saat Pemesanan)
                </h4>
                <span className="text-[10px] text-slate-500">
                  Snapshot: {new Date(selectedOrder.packageSnapshot?.capturedAt || selectedOrder.createdAt).toLocaleDateString('id-ID')}
                </span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {selectedOrder.packageSnapshot?.inclusions?.map((inc, i) => (
                  <div
                    key={inc.id || i}
                    className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-start gap-2.5 text-xs"
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
                  Riwayat Perubahan Status (Audit Trail)
                </h4>
                <div className="space-y-2 text-xs">
                  {selectedOrder.statusHistory.map((item, i) => (
                    <div
                      key={item.id || i}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">
                            {item.previousStatus ? `${item.previousStatus} ➔ ` : ''}
                            {item.newStatus}
                          </span>
                          <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">
                            Oleh: {item.actorRole}
                          </Badge>
                        </div>
                        {item.reason && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.reason}</p>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                {selectedOrder.status === 'PENDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setOrderToCancel(selectedOrder);
                      setCancelReason('');
                      setCancelError(null);
                    }}
                    className="text-xs border-red-800 text-red-400 hover:bg-red-950/30"
                  >
                    <Ban className="w-3.5 h-3.5 mr-1" />
                    Batalkan Pesanan Ini
                  </Button>
                )}
              </div>
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
      {/* CANCELLATION CONFIRMATION DIALOG */}
      {/* ========================================================================= */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-800 flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Konfirmasi Pembatalan Pesanan</h3>
                <span className="text-xs font-mono text-slate-400">{orderToCancel.orderNumber}</span>
              </div>
            </div>

            {cancelError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                {cancelError}
              </div>
            )}

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin membatalkan pesanan ini? Pesanan yang dibatalkan tidak dapat diaktifkan kembali.
            </p>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Alasan Pembatalan (Opsional)
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Contoh: Mengubah rencana hunian, ingin memilih paket yang berbeda."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={cancelling}
                onClick={() => setOrderToCancel(null)}
                className="text-xs border-slate-700 text-slate-300"
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="text-xs bg-red-600 hover:bg-red-500 text-white font-semibold"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Membatalkan...
                  </>
                ) : (
                  'Ya, Batalkan Pesanan'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrdersPage;
