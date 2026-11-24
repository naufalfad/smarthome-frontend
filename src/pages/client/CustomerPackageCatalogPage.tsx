/**
 * PHASE 6: CUSTOMER SERVICE PACKAGE CATALOG & COMPARISON PAGE
 * Commercial catalog browsing, feature transparency, inclusions checklist,
 * and side-by-side package comparison for registered customers.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  XCircle,
  Cpu,
  Box,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Layers,
  ShieldCheck,
  RefreshCw,
  Info,
  SlidersHorizontal,
  Home,
  Check,
  X,
  HelpCircle,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { servicePackageApi } from '../../services/service-package.api';
import { catalogSync } from '../../services/catalog-sync';
import { ServicePackage, ServicePackageInclusion } from '../../types/service-package';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { CustomerOrderModal } from '../../components/orders/CustomerOrderModal';

export const CustomerPackageCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // View state: 'grid' or 'comparison'
  const [viewMode, setViewMode] = useState<'grid' | 'comparison'>('grid');

  // Selected package for detailed inspection modal
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);

  // Package selected for order submission modal
  const [orderModalPackage, setOrderModalPackage] = useState<ServicePackage | null>(null);

  // Dynamic extraction of distinct inclusion features from active database records
  const distinctInclusionItems = React.useMemo(() => {
    const map = new Map<string, { displayName: string; category: string }>();
    packages.forEach((pkg) => {
      pkg.inclusions?.forEach((inc) => {
        if (!map.has(inc.displayName)) {
          map.set(inc.displayName, {
            displayName: inc.displayName,
            category: inc.category,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [packages]);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await servicePackageApi.getCatalogPackages();
      setPackages(data);
      setSelectedPackage((prev) => (prev ? (data.find((p) => p.id === prev.id) || null) : null));
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat katalog paket layanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();

    // 1. Cross-tab and application-wide sync event listener
    const unsubscribe = catalogSync.subscribe(() => {
      loadCatalog();
    });

    // 2. Refetch when window / tab regains focus
    const handleFocus = () => {
      loadCatalog();
    };
    window.addEventListener('focus', handleFocus);

    // 3. Refetch when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadCatalog();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/client"
              className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-sm tracking-wide text-slate-100">Katalog Paket Smart Home</span>
            </div>
            <div className="h-4 w-px bg-slate-800 hidden md:block" />
            <Link
              to="/orders"
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-950/30 border border-emerald-800/40 px-2.5 py-1 rounded-lg"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Pesanan Saya</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Login sebagai: <strong className="text-slate-200">{user?.name || user?.username}</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadCatalog}
              disabled={loading}
              className="border-slate-700 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-1.5"
              title="Segarkan data katalog langsung dari server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">Segarkan Data</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              className="border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
            >
              Keluar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-cyan-950/20 via-slate-950 to-slate-950 border-b border-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Turnkey Smart Home Digitalization & Management</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Pilih Paket Layanan Smart Home Hunian Anda
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Dari digital twin denah 2D non-IoT hingga model virtual 3D dengan ekosistem perangkat pintar lengkap.
            Teknisi kami melakukan survei, konfigurasi, dan serah terima hunian siap pakai untuk Anda.
          </p>

          {/* View Mode Toggle */}
          <div className="pt-4 flex items-center justify-center">
            <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 inline-flex items-center gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                Pilihan Paket
              </button>
              <button
                onClick={() => setViewMode('comparison')}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === 'comparison'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Matriks Komparasi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Important Roadmap Notice */}
        <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 flex items-start gap-3.5">
          <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-cyan-300 font-semibold block mb-0.5">Informasi Layanan Komersial</strong>
            Seluruh paket di bawah ini merupakan produk resmi layanan Smart Home. Pelanggan dapat meninjau rincian inklusi
            dan membandingkan cakupan layanan. Alur pemesanan resmi (Service Order) akan diaktifkan pada fase rilis berikutnya.
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium flex items-center justify-between">
            <span>{error}</span>
            <Button size="sm" variant="ghost" onClick={loadCatalog} className="text-xs text-rose-300">
              Coba Lagi
            </Button>
          </div>
        )}

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
            <p className="text-sm">Memuat katalog paket layanan...</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="py-20 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">Belum ada paket aktif saat ini</h3>
            <p className="text-xs text-slate-500 mt-1">
              Katalog paket sedang dalam pembaruan oleh administrator. Silakan periksa kembali nanti.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* ========================================================================= */
          /* CARD GRID VIEW */
          /* ========================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg, idx) => {
              const isPopular = pkg.code.includes('essential');
              return (
                <div
                  key={pkg.id}
                  className={`relative rounded-2xl border p-6 flex flex-col justify-between transition-all bg-slate-900/80 backdrop-blur-sm ${
                    isPopular
                      ? 'border-cyan-500/50 shadow-xl shadow-cyan-950/20 ring-1 ring-cyan-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-cyan-500 text-slate-950 font-bold px-3 py-0.5 text-[10px] uppercase tracking-wider shadow">
                        Paling Populer
                      </Badge>
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold text-white tracking-tight">{pkg.name}</h3>
                    </div>

                    <p className="text-xs text-slate-400 min-h-[36px] line-clamp-2 leading-relaxed">
                      {pkg.shortDescription}
                    </p>

                    {/* Price Tag */}
                    <div className="my-5 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                        Biaya Layanan Turnkey
                      </span>
                      <div className="text-2xl font-black text-emerald-400 tracking-tight mt-0.5">
                        {pkg.formattedPrice || `Rp ${pkg.price}`}
                      </div>
                      {pkg.estimatedDuration && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Estimasi Pengerjaan: {pkg.estimatedDuration}</span>
                        </div>
                      )}
                    </div>

                    {/* Feature Highlights Badges */}
                    <div className="space-y-2 mb-5">
                      <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-cyan-400" />
                          Denah Digital Twin 2D
                        </span>
                        {pkg.inclusions?.some((i) => i.category === 'FLOOR_PLAN_2D' && i.isIncluded) ? (
                          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px]">
                            Disertakan
                          </Badge>
                        ) : (
                          <span className="text-slate-500 text-xs">Tidak Termasuk</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Cpu className="w-4 h-4 text-cyan-400" />
                          Instalasi IoT Fisik
                        </span>
                        {pkg.hasPhysicalIot ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                            Disertakan
                          </Badge>
                        ) : (
                          <span className="text-slate-500 text-xs">Digital Saja</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Box className="w-4 h-4 text-purple-400" />
                          Model Virtual 3D GLB
                        </span>
                        {pkg.hasThreeD ? (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px]">
                            3D Fotorealistik
                          </Badge>
                        ) : (
                          <span className="text-slate-500 text-xs">-</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs py-1.5">
                        <span className="text-slate-400">Kapasitas Ruangan</span>
                        <span className="font-semibold text-slate-200">
                          {pkg.maxRooms ? `Hingga ${pkg.maxRooms} Ruang` : 'Fleksibel'}
                        </span>
                      </div>
                    </div>

                    {/* Inclusions List */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                        Layanan Termasuk
                      </span>
                      {pkg.inclusions && pkg.inclusions.length > 0 ? (
                        <ul className="space-y-2 text-xs">
                          {pkg.inclusions.map((inc, i) => (
                            <li key={inc.id || i} className="flex items-start gap-2">
                              {inc.isIncluded ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                              )}
                              <span className={inc.isIncluded ? 'text-slate-300' : 'text-slate-500 line-through'}>
                                {inc.displayName}
                                {inc.quantity ? ` (${inc.quantity} Unit)` : ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 text-xs italic">Belum ada rincian inklusi khusus.</p>
                      )}
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="mt-8 pt-4 border-t border-slate-800 flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedPackage(pkg)}
                      className="w-1/2 font-semibold text-xs h-10 border-slate-700 hover:bg-slate-800 text-slate-200"
                    >
                      Rincian
                    </Button>
                    <Button
                      onClick={() => setOrderModalPackage(pkg)}
                      className={`w-1/2 font-bold text-xs h-10 shadow-md ${
                        isPopular
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/30'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/30'
                      }`}
                    >
                      Pesan
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ========================================================================= */
          /* COMPARISON MATRIX VIEW */
          /* ========================================================================= */
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80">
                    <th className="py-4 px-6 text-slate-400 font-semibold uppercase tracking-wider text-[11px] w-1/4">
                      Fitur & Spesifikasi
                    </th>
                    {packages.map((pkg) => (
                      <th key={pkg.id} className="py-4 px-6 text-center">
                        <span className="text-sm font-bold text-white block">{pkg.name}</span>
                        <span className="text-emerald-400 font-extrabold text-base block mt-1">
                          {pkg.formattedPrice || `Rp ${pkg.price}`}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {/* Section 1 Header */}
                  <tr className="bg-slate-950/90">
                    <td
                      colSpan={packages.length + 1}
                      className="py-2.5 px-6 font-bold uppercase tracking-wider text-[10px] text-cyan-400"
                    >
                      Spesifikasi Dasar & Kapasitas Teknis
                    </td>
                  </tr>

                  {/* Estimasi Durasi */}
                  <tr>
                    <td className="py-3.5 px-6 font-medium text-slate-300 bg-slate-900/30">Estimasi Durasi</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="py-3.5 px-6 text-center text-slate-200">
                        {pkg.estimatedDuration || '-'}
                      </td>
                    ))}
                  </tr>

                  {/* Instalasi IoT Fisik */}
                  <tr>
                    <td className="py-3.5 px-6 font-medium text-slate-300 bg-slate-900/30">Instalasi Perangkat Keras IoT Fisik</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="py-3.5 px-6 text-center">
                        {pkg.hasPhysicalIot ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]">
                            Disertakan
                          </Badge>
                        ) : (
                          <span className="text-slate-500 font-medium">Digital Saja</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Model Virtual 3D GLB */}
                  <tr>
                    <td className="py-3.5 px-6 font-medium text-slate-300 bg-slate-900/30">Digital Twin 3D GLB Fotorealistik</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="py-3.5 px-6 text-center">
                        {pkg.hasThreeD ? (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/40 text-[10px]">
                            Disertakan
                          </Badge>
                        ) : (
                          <X className="w-5 h-5 text-slate-600 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Batas Ruangan */}
                  <tr>
                    <td className="py-3.5 px-6 font-medium text-slate-300 bg-slate-900/30">Kapasitas Maksimal Ruangan</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="py-3.5 px-6 text-center text-slate-200">
                        {pkg.maxRooms ? `${pkg.maxRooms} Ruang` : 'Fleksibel'}
                      </td>
                    ))}
                  </tr>

                  {/* Batas Perangkat IoT */}
                  <tr>
                    <td className="py-3.5 px-6 font-medium text-slate-300 bg-slate-900/30">Kapasitas Titik Perangkat IoT</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="py-3.5 px-6 text-center text-slate-200">
                        {pkg.maxDevices ? `${pkg.maxDevices} Titik` : '-'}
                      </td>
                    ))}
                  </tr>

                  {/* Kuota Otomasi */}
                  <tr>
                    <td className="py-3.5 px-6 font-medium text-slate-300 bg-slate-900/30">Skenario Otomasi Disertakan</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="py-3.5 px-6 text-center text-slate-200">
                        {pkg.includedAutomations ? `${pkg.includedAutomations} Skenario` : '-'}
                      </td>
                    ))}
                  </tr>

                  {/* Section 2 Header: Dynamic Database Inclusions */}
                  <tr className="bg-slate-950/90">
                    <td
                      colSpan={packages.length + 1}
                      className="py-2.5 px-6 font-bold uppercase tracking-wider text-[10px] text-cyan-400"
                    >
                      Cakupan Layanan & Inklusi Resmi (Single Source of Truth)
                    </td>
                  </tr>

                  {distinctInclusionItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={packages.length + 1}
                        className="py-4 px-6 text-center text-slate-500 italic bg-slate-900/20"
                      >
                        Belum ada rincian inklusi khusus yang terdaftar pada paket aktif saat ini.
                      </td>
                    </tr>
                  ) : (
                    distinctInclusionItems.map((item) => (
                      <tr key={item.displayName}>
                        <td className="py-3.5 px-6 font-medium text-slate-300 bg-slate-900/30">
                          {item.displayName}
                        </td>
                        {packages.map((pkg) => {
                          const inc = pkg.inclusions?.find((i) => i.displayName === item.displayName);
                          return (
                            <td key={pkg.id} className="py-3.5 px-6 text-center">
                              {inc ? (
                                inc.isIncluded ? (
                                  <div className="flex flex-col items-center justify-center gap-0.5">
                                    <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                                    {inc.quantity ? (
                                      <span className="text-[10px] text-cyan-400 font-semibold">
                                        {inc.quantity} Unit
                                      </span>
                                    ) : null}
                                  </div>
                                ) : (
                                  <X className="w-5 h-5 text-slate-600 mx-auto" />
                                )
                              ) : (
                                <span className="text-slate-600 font-mono text-xs">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}

                  {/* Action Row */}
                  <tr>
                    <td className="py-4 px-6 bg-slate-900/50"></td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="py-4 px-6 text-center">
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPackage(pkg)}
                            className="w-1/2 text-xs border-slate-700 hover:bg-slate-800 text-slate-300"
                          >
                            Detail
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setOrderModalPackage(pkg)}
                            className="w-1/2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                          >
                            Pesan
                          </Button>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* PACKAGE DETAIL INSPECTION MODAL */}
      {/* ========================================================================= */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">{selectedPackage.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-black text-emerald-400">{selectedPackage.formattedPrice}</span>
                  {selectedPackage.estimatedDuration && (
                    <span className="text-xs text-slate-400">({selectedPackage.estimatedDuration})</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedPackage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <h4 className="text-xs uppercase font-bold text-cyan-400 tracking-wider mb-1">
                  Tentang Paket Layanan Ini
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 whitespace-pre-line">
                  {selectedPackage.description}
                </p>
              </div>

              {/* Technical Specifications Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Kapasitas Ruangan</span>
                  <span className="text-xs font-bold text-slate-200 mt-0.5 block">
                    {selectedPackage.maxRooms ? `${selectedPackage.maxRooms} Ruang` : 'Fleksibel'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Titik Perangkat IoT</span>
                  <span className="text-xs font-bold text-slate-200 mt-0.5 block">
                    {selectedPackage.maxDevices ? `${selectedPackage.maxDevices} Titik` : '-'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Skenario Otomasi</span>
                  <span className="text-xs font-bold text-slate-200 mt-0.5 block">
                    {selectedPackage.includedAutomations ? `${selectedPackage.includedAutomations} Skenario` : '-'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Instalasi IoT Fisik</span>
                  <span className="text-xs font-bold text-emerald-400 mt-0.5 block">
                    {selectedPackage.hasPhysicalIot ? 'Disertakan' : 'Digital Saja'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Digital Twin 3D</span>
                  <span className="text-xs font-bold text-purple-400 mt-0.5 block">
                    {selectedPackage.hasThreeD ? '3D GLB Fotorealistik' : 'Tidak Termasuk'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Kode Paket</span>
                  <span className="text-xs font-mono text-cyan-400 mt-0.5 block truncate">
                    {selectedPackage.code}
                  </span>
                </div>
              </div>

              {/* Inclusions Breakdown */}
              <div>
                <h4 className="text-xs uppercase font-bold text-cyan-400 tracking-wider mb-2">
                  Daftar Inklusi & Cakupan Layanan
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {selectedPackage.inclusions?.map((inc, idx) => (
                    <div
                      key={inc.id || idx}
                      className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-3"
                    >
                      {inc.isIncluded ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${inc.isIncluded ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                            {inc.displayName}
                          </span>
                          {inc.quantity && (
                            <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-800">
                              {inc.quantity} Unit
                            </Badge>
                          )}
                        </div>
                        {inc.description && <p className="text-[11px] text-slate-400 mt-0.5">{inc.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Flow Roadmap Callout */}
              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-xs text-slate-300 leading-relaxed">
                <span className="font-semibold text-cyan-300 block mb-1">Bagaimana alur setelah pemesanan?</span>
                Pada rilis berikutnya, setelah Anda memesan paket ini, properti baru akan didaftarkan otomatis dalam status DRAFT.
                Super Admin akan mengonfirmasi pesanan, menugaskan teknisi primer, dan teknisi akan menjadwalkan survei ke lokasi Anda.
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedPackage(null)}
                className="border-slate-700 text-slate-300 text-xs"
              >
                Tutup
              </Button>
              <Button
                onClick={() => {
                  const pkg = selectedPackage;
                  setSelectedPackage(null);
                  setOrderModalPackage(pkg);
                }}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 px-4 flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
              >
                <span>Pesan Paket Ini Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Order Intake Modal */}
      <CustomerOrderModal
        isOpen={!!orderModalPackage}
        onClose={() => setOrderModalPackage(null)}
        packageItem={orderModalPackage}
      />
    </div>
  );
};
