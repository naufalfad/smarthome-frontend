/**
 * PHASE 8: TECHNICIAN WORKSPACE DASHBOARD
 *
 * Dedicated workspace for authenticated field technicians to view active assignments,
 * customer contact snapshots, property location specs, package inclusion snapshots
 * (commercial prices omitted), and dispatch instructions from Super Admin.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Wrench,
  LogOut,
  ArrowLeft,
  Briefcase,
  Home,
  MapPin,
  Phone,
  User,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  X,
  Info,
  ShieldCheck,
  Package,
  ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { technicianApi } from '../../services/technician.api';
import { TechnicianWorkAssignment } from '../../types/service-order';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { TechnicianSurveyModal } from '../../components/orders/TechnicianSurveyModal';

export const TechnicianWorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  const [assignments, setAssignments] = useState<TechnicianWorkAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected assignment for deep-dive modal
  const [selectedAssignment, setSelectedAssignment] = useState<TechnicianWorkAssignment | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Phase 9: Field survey modal state
  const [surveyAssignment, setSurveyAssignment] = useState<TechnicianWorkAssignment | null>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await technicianApi.getMyAssignments();
      setAssignments(data);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat daftar penugasan kerja aktif');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true, state: {} });
  };

  const handleOpenDetail = async (item: TechnicianWorkAssignment) => {
    try {
      setLoadingDetail(true);
      setSelectedAssignment(item);
      const detail = await technicianApi.getMyAssignmentDetail(item.assignmentId);
      setSelectedAssignment(detail);
    } catch (err: any) {
      // Fallback to currently selected item if detail fetch fails
      console.error('Failed to load full detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#181829] flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          {role === 'SUPER_ADMIN' && (
            <Link
              to="/floor-plan"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Kembali ke Super Admin Studio"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-200">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                Ruang Kerja Teknisi
              </h1>
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                Field Specialist
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {user?.name} ({user?.email || (user?.username ? `@${user.username}` : 'Teknisi')})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAssignments}
            disabled={loading}
            className="text-xs border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            Segarkan
          </Button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Workspace Banner & Summary Metric */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Akun Teknisi Resmi Terverifikasi</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Daftar Penugasan Layanan Aktif
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Berikut adalah pesanan smart home yang telah dikonfirmasi dan ditugaskan kepada Anda oleh Super Admin.
              Tinjau spesifikasi paket, lokasi properti, dan instruksi khusus sebelum melaksanakan koordinasi lapangan.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 self-start md:self-auto">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Tugas Aktif
              </div>
              <div className="text-2xl font-black text-slate-900">
                {assignments.length}{' '}
                <span className="text-xs font-medium text-slate-500">Penugasan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <Button size="sm" variant="outline" onClick={fetchAssignments} className="text-xs border-rose-300">
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Assignment Cards Grid */}
        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium text-slate-500">Memuat penugasan kerja teknisi...</p>
          </div>
        ) : assignments.length === 0 ? (
          /* Clean Empty State */
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto space-y-4 my-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Briefcase className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-800">
                Belum Ada Penugasan Kerja Aktif
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Saat ini tidak ada pesanan layanan yang ditugaskan kepada Anda. Pesanan baru akan muncul di sini secara otomatis setelah Super Admin melakukan proses dispatch penugasan.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {assignments.map((item) => {
              const order = item.serviceOrder;
              return (
                <div
                  key={item.assignmentId}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 p-5 shadow-xs transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    {/* Header: Order Number & Assignment Time */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-indigo-600">
                            {order.orderNumber}
                          </span>
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                            Penugasan Aktif
                          </Badge>
                          {order.fieldSurvey?.status === 'VERIFIED' && order.houseId && (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Survei Terverifikasi
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                          {order.packageName}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                          Ditugaskan
                        </span>
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(item.assignedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Customer & Contact Snapshot */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <User className="w-3 h-3" />
                        <span>Data Pelanggan & Kontak</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-slate-800">
                          {order.customerName}
                          {order.contactName && order.contactName !== order.customerName && (
                            <span className="text-slate-500 font-normal"> (PIC: {order.contactName})</span>
                          )}
                        </span>
                        {order.contactPhone && (
                          <a
                            href={`tel:${order.contactPhone}`}
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{order.contactPhone}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Property Specs Snapshot */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <Home className="w-3 h-3" />
                        <span>Lokasi & Properti</span>
                      </div>
                      <div className="font-semibold text-slate-800">
                        {order.propertyName} <span className="text-slate-400 font-normal">({order.propertyType})</span>
                      </div>
                      <div className="text-slate-600 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span>
                          {order.propertyAddress}
                          {order.city ? `, ${order.city}` : ''}
                          {order.postalCode ? ` ${order.postalCode}` : ''}
                        </span>
                      </div>
                      {(order.approximateAreaM2 || order.estimatedRooms) && (
                        <div className="text-[11px] text-slate-500 pl-4">
                          {order.approximateAreaM2 ? `Luas: ${order.approximateAreaM2} m² • ` : ''}
                          {order.estimatedRooms ? `${order.estimatedRooms} Ruang` : ''}
                        </div>
                      )}
                    </div>

                    {/* Technician Instructions from Admin */}
                    {item.technicianInstructions && (
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                        <div className="font-bold flex items-center gap-1 text-[11px] text-amber-800">
                          <Info className="w-3.5 h-3.5 text-amber-700" />
                          <span>Instruksi Super Admin:</span>
                        </div>
                        <p className="leading-relaxed pl-4">{item.technicianInstructions}</p>
                      </div>
                    )}

                    {/* Customer Notes */}
                    {order.customerNotes && (
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-[11px] text-slate-600 italic">
                        &ldquo;Catatan Pelanggan: {order.customerNotes}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500">
                      {order.packageSnapshot?.inclusions?.length || 0} Inklusi Layanan
                    </div>
                    <div className="flex items-center gap-2">
                      {order.fieldSurvey?.status === 'VERIFIED' && order.houseId ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/floor-plan?houseId=${order.houseId}`)}
                            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold h-8 shadow-xs"
                          >
                            <Layers className="w-3.5 h-3.5 mr-1" />
                            Konfigurasi Denah 2D
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSurveyAssignment(item)}
                            className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold h-8"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            Lihat Survei
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setSurveyAssignment(item)}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5 mr-1" />
                          Survei Lapangan
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDetail(item)}
                        className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 font-bold h-8"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Rincian
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ======================================================================= */}
      {/* ASSIGNMENT DETAIL MODAL (No Commercial Price Exposed) */}
      {/* ======================================================================= */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-indigo-600">
                    {selectedAssignment.serviceOrder.orderNumber}
                  </span>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold">
                    Penugasan Aktif
                  </Badge>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {selectedAssignment.serviceOrder.packageName}
                </h3>
                <p className="text-xs text-slate-500">
                  Kode Paket: <span className="font-mono font-bold">{selectedAssignment.serviceOrder.packageCode}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dispatch Instructions Card */}
            {selectedAssignment.technicianInstructions && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800 text-sm">
                  <Info className="w-4 h-4 text-amber-700" />
                  Instruksi Khusus untuk Teknisi
                </div>
                <p className="leading-relaxed pl-5 whitespace-pre-wrap">
                  {selectedAssignment.technicianInstructions}
                </p>
              </div>
            )}

            {/* Customer & Contact Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                Data Pelanggan & Kontak Lapangan
              </h4>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 text-xs space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Nama Akun Pelanggan</span>
                    <span className="font-bold text-slate-900">{selectedAssignment.serviceOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Kontak Lapangan (PIC)</span>
                    <span className="font-bold text-slate-900">{selectedAssignment.serviceOrder.contactName || '-'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Nomor Telepon / WhatsApp</span>
                    <span className="font-mono font-bold text-indigo-700 text-sm">
                      {selectedAssignment.serviceOrder.contactPhone || '-'}
                    </span>
                  </div>
                  {selectedAssignment.serviceOrder.contactPhone && (
                    <a
                      href={`https://wa.me/${selectedAssignment.serviceOrder.contactPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Hubungi Pelanggan
                    </a>
                  )}
                </div>

                {selectedAssignment.serviceOrder.customerNotes && (
                  <div className="pt-2 border-t border-slate-200/60 text-slate-600">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Catatan Tambahan Pelanggan:</span>
                    <p className="italic">&ldquo;{selectedAssignment.serviceOrder.customerNotes}&rdquo;</p>
                  </div>
                )}
              </div>
            </div>

            {/* Property Specification Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-indigo-600" />
                Spesifikasi Lokasi Properti
              </h4>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 text-xs space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Nama Properti</span>
                    <span className="font-bold text-slate-900">{selectedAssignment.serviceOrder.propertyName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Tipe Properti</span>
                    <span className="font-bold text-slate-900">{selectedAssignment.serviceOrder.propertyType}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Alamat Pemasangan</span>
                  <span className="text-slate-700 leading-relaxed font-medium">
                    {selectedAssignment.serviceOrder.propertyAddress}
                    {selectedAssignment.serviceOrder.city ? `, ${selectedAssignment.serviceOrder.city}` : ''}
                    {selectedAssignment.serviceOrder.postalCode ? ` ${selectedAssignment.serviceOrder.postalCode}` : ''}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Estimasi Luas</span>
                    <span className="font-semibold text-slate-800">
                      {selectedAssignment.serviceOrder.approximateAreaM2
                        ? `${selectedAssignment.serviceOrder.approximateAreaM2} m²`
                        : 'Tidak dicantumkan'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Estimasi Ruangan</span>
                    <span className="font-semibold text-slate-800">
                      {selectedAssignment.serviceOrder.estimatedRooms
                        ? `${selectedAssignment.serviceOrder.estimatedRooms} Ruang`
                        : 'Tidak dicantumkan'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Package Snapshot & Inclusions (OMIT COMMERCIAL PRICE) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-indigo-600" />
                Daftar Inklusi & Cakupan Layanan Teknis
              </h4>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {selectedAssignment.serviceOrder.packageSnapshot?.inclusions?.map((inc, i) => (
                  <div
                    key={inc.id || i}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs"
                  >
                    {inc.isIncluded ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-slate-800">
                        {inc.displayName}
                        {inc.quantity ? ` (${inc.quantity} Unit)` : ''}
                      </div>
                      {inc.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{inc.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Penugasan resmi aktif: {new Date(selectedAssignment.assignedAt).toLocaleString('id-ID')}
              </span>
              <div className="flex items-center gap-2">
                {selectedAssignment.serviceOrder.fieldSurvey?.status === 'VERIFIED' && selectedAssignment.serviceOrder.houseId ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => {
                        const hId = selectedAssignment.serviceOrder.houseId;
                        setSelectedAssignment(null);
                        navigate(`/floor-plan?houseId=${hId}`);
                      }}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold h-8 shadow-xs"
                    >
                      <Layers className="w-3.5 h-3.5 mr-1" />
                      Konfigurasi Denah 2D
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const a = selectedAssignment;
                        setSelectedAssignment(null);
                        setSurveyAssignment(a);
                      }}
                      className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold h-8"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Lihat Formulir Survei
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      const a = selectedAssignment;
                      setSelectedAssignment(null);
                      setSurveyAssignment(a);
                    }}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 mr-1" />
                    Buka Formulir Survei
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAssignment(null)}
                  className="text-xs border-slate-200 font-bold h-8"
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* PHASE 9: FIELD SURVEY FORM MODAL */}
      {/* ======================================================================= */}
      {surveyAssignment && (
        <TechnicianSurveyModal
          isOpen={Boolean(surveyAssignment)}
          onClose={() => setSurveyAssignment(null)}
          assignment={surveyAssignment}
          onSurveySubmitted={() => {
            fetchAssignments();
          }}
        />
      )}
    </div>
  );
};

