/**
 * PHASE 6: SUPER ADMIN SERVICE PACKAGE MANAGEMENT PAGE
 * Comprehensive catalog administration: CRUD, structured inclusions,
 * status transitions (Activate, Deactivate, Archive), and pricing configuration.
 */

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Edit2,
  Archive,
  Power,
  PowerOff,
  Layers,
  Cpu,
  Box,
  Clock,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  X,
  Trash2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { servicePackageApi } from '../../services/service-package.api';
import { catalogSync } from '../../services/catalog-sync';
import {
  ServicePackage,
  ServicePackageInclusion,
  PackageStatus,
  ServiceInclusionCategory,
  CreatePackagePayload,
  UpdatePackagePayload,
} from '../../types/service-package';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

const INCLUSION_CATEGORIES: { value: ServiceInclusionCategory; label: string }[] = [
  { value: 'PROPERTY_SURVEY', label: 'Survei Properti & Tata Ruang' },
  { value: 'FLOOR_PLAN_2D', label: 'Denah 2D Interaktif' },
  { value: 'IOT_DEVICE_INSTALLATION', label: 'Instalasi Perangkat Keras IoT Fisik' },
  { value: 'IOT_DEVICE_CONFIGURATION', label: 'Konfigurasi Protokol IoT' },
  { value: 'AUTOMATION_CONFIGURATION', label: 'Konfigurasi Skenario Otomasi' },
  { value: 'SMART_HOME_DASHBOARD', label: 'Portal Dashboard Smart Home' },
  { value: 'THREE_D_MODEL', label: 'Model Virtual 3D GLB Dollhouse' },
  { value: 'GLB_ASSET_PREPARATION', label: 'Persiapan & Binding Spasial 3D' },
  { value: 'TRAINING_AND_HANDOVER', label: 'Pelatihan & Serah Terima' },
  { value: 'OTHER', label: 'Lainnya (Kustom)' },
];

export const AdminPackagesPage: React.FC = () => {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<PackageStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [packageToArchive, setPackageToArchive] = useState<ServicePackage | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    shortDescription: string;
    description: string;
    price: string;
    estimatedDuration: string;
    displayOrder: number;
    hasPhysicalIot: boolean;
    hasThreeD: boolean;
    maxRooms: string;
    maxDevices: string;
    includedAutomations: string;
    inclusions: Omit<ServicePackageInclusion, 'id' | 'packageId'>[];
  }>({
    name: '',
    code: '',
    shortDescription: '',
    description: '',
    price: '',
    estimatedDuration: '',
    displayOrder: 0,
    hasPhysicalIot: false,
    hasThreeD: false,
    maxRooms: '',
    maxDevices: '',
    includedAutomations: '',
    inclusions: [],
  });

  const loadPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await servicePackageApi.getAdminPackages({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchQuery || undefined,
      });
      setPackages(data);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat daftar paket layanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPackages();
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setFormData({
      name: '',
      code: '',
      shortDescription: '',
      description: '',
      price: '',
      estimatedDuration: '3-5 Hari Kerja',
      displayOrder: packages.length + 1,
      hasPhysicalIot: false,
      hasThreeD: false,
      maxRooms: '8',
      maxDevices: '10',
      includedAutomations: '5',
      inclusions: [
        {
          category: 'PROPERTY_SURVEY',
          displayName: 'Survei Hunian & Layout Digital',
          description: 'Pengukuran dimensi ruangan dan dokumentasi titik survei.',
          isIncluded: true,
          displayOrder: 1,
        },
        {
          category: 'FLOOR_PLAN_2D',
          displayName: 'Pemetaan Denah 2D Interaktif',
          description: 'Digitalisasi denah akurat multi-lantai berformat SVG.',
          isIncluded: true,
          displayOrder: 2,
        },
        {
          category: 'SMART_HOME_DASHBOARD',
          displayName: 'Akses Portal Dashboard Hunian',
          description: 'Akses portal web untuk pemantauan properti real-time.',
          isIncluded: true,
          displayOrder: 3,
        },
        {
          category: 'TRAINING_AND_HANDOVER',
          displayName: 'Panduan Operasional & Serah Terima',
          description: 'Verifikasi kesiapan dan penyerahan akun penghuni.',
          isIncluded: true,
          displayOrder: 4,
        },
      ],
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (pkg: ServicePackage) => {
    setIsEditing(true);
    setSelectedPackage(pkg);
    setFormData({
      name: pkg.name,
      code: pkg.code,
      shortDescription: pkg.shortDescription,
      description: pkg.description,
      price: String(pkg.price),
      estimatedDuration: pkg.estimatedDuration || '',
      displayOrder: pkg.displayOrder,
      hasPhysicalIot: pkg.hasPhysicalIot,
      hasThreeD: pkg.hasThreeD,
      maxRooms: pkg.maxRooms !== null && pkg.maxRooms !== undefined ? String(pkg.maxRooms) : '',
      maxDevices: pkg.maxDevices !== null && pkg.maxDevices !== undefined ? String(pkg.maxDevices) : '',
      includedAutomations:
        pkg.includedAutomations !== null && pkg.includedAutomations !== undefined
          ? String(pkg.includedAutomations)
          : '',
      inclusions:
        pkg.inclusions?.map((inc, i) => ({
          category: inc.category,
          displayName: inc.displayName,
          description: inc.description || '',
          isIncluded: inc.isIncluded,
          quantity: inc.quantity || null,
          displayOrder: inc.displayOrder ?? i + 1,
        })) || [],
    });
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const payload: CreatePackagePayload = {
        name: formData.name.trim(),
        code: formData.code.trim().toLowerCase(),
        shortDescription: formData.shortDescription.trim(),
        description: formData.description.trim() || formData.shortDescription.trim(),
        price: formData.price.trim(),
        estimatedDuration: formData.estimatedDuration.trim() || null,
        displayOrder: Number(formData.displayOrder) || 0,
        hasPhysicalIot: formData.hasPhysicalIot,
        hasThreeD: formData.hasThreeD,
        maxRooms: formData.maxRooms ? Number(formData.maxRooms) : null,
        maxDevices: formData.maxDevices ? Number(formData.maxDevices) : null,
        includedAutomations: formData.includedAutomations ? Number(formData.includedAutomations) : null,
        inclusions: formData.inclusions.map((inc, i) => ({
          category: inc.category,
          displayName: inc.displayName.trim(),
          description: inc.description?.trim() || null,
          isIncluded: inc.isIncluded,
          quantity: inc.quantity ? Number(inc.quantity) : null,
          displayOrder: i + 1,
        })),
      };

      if (isEditing && selectedPackage) {
        await servicePackageApi.updatePackage(selectedPackage.id, payload as UpdatePackagePayload);
        setSuccessMessage(`Paket '${payload.name}' berhasil diperbarui.`);
      } else {
        await servicePackageApi.createPackage(payload);
        setSuccessMessage(`Paket '${payload.name}' berhasil dibuat.`);
      }

      catalogSync.notifyCatalogUpdated();
      setIsFormModalOpen(false);
      loadPackages();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan paket layanan');
    }
  };

  const handleActivate = async (pkg: ServicePackage) => {
    try {
      setError(null);
      await servicePackageApi.activatePackage(pkg.id);
      catalogSync.notifyCatalogUpdated();
      setSuccessMessage(`Paket '${pkg.name}' berhasil diaktifkan.`);
      loadPackages();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Gagal mengaktifkan paket');
    }
  };

  const handleDeactivate = async (pkg: ServicePackage) => {
    try {
      setError(null);
      await servicePackageApi.deactivatePackage(pkg.id);
      catalogSync.notifyCatalogUpdated();
      setSuccessMessage(`Paket '${pkg.name}' dinonaktifkan.`);
      loadPackages();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Gagal menonaktifkan paket');
    }
  };

  const handleArchive = async () => {
    if (!packageToArchive) return;
    try {
      setError(null);
      await servicePackageApi.archivePackage(packageToArchive.id);
      catalogSync.notifyCatalogUpdated();
      setSuccessMessage(`Paket '${packageToArchive.name}' berhasil diarsipkan.`);
      setPackageToArchive(null);
      loadPackages();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Gagal mengarsipkan paket');
    }
  };

  // Inclusions handlers in form
  const addInclusionRow = () => {
    setFormData((prev) => ({
      ...prev,
      inclusions: [
        ...prev.inclusions,
        {
          category: 'OTHER',
          displayName: '',
          description: '',
          isIncluded: true,
          quantity: null,
          displayOrder: prev.inclusions.length + 1,
        },
      ],
    }));
  };

  const updateInclusionRow = (index: number, patch: Partial<ServicePackageInclusion>) => {
    setFormData((prev) => {
      const next = [...prev.inclusions];
      next[index] = { ...next[index], ...patch };
      return { ...prev, inclusions: next };
    });
  };

  const removeInclusionRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      inclusions: prev.inclusions.filter((_, i) => i !== index),
    }));
  };

  // Status badge styling
  const renderStatusBadge = (status: PackageStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">ACTIVE</Badge>;
      case 'DRAFT':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40">DRAFT</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/40">INACTIVE</Badge>;
      case 'ARCHIVED':
        return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/40">ARCHIVED</Badge>;
    }
  };

  // Stats counters
  const totalCount = packages.length;
  const activeCount = packages.filter((p) => p.status === 'ACTIVE').length;
  const draftCount = packages.filter((p) => p.status === 'DRAFT').length;
  const inactiveCount = packages.filter((p) => p.status === 'INACTIVE' || p.status === 'ARCHIVED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100">Katalog Paket Layanan</h1>
            <Badge variant="outline" className="text-xs bg-cyan-950/60 text-cyan-400 border-cyan-800">
              Phase 6 Commercial
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Kelola definisi produk komersial, struktur inklusi layanan, cakupan IoT, dan penetapan harga untuk pesanan pelanggan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={loadPackages}
            disabled={loading}
            className="border-slate-700 hover:bg-slate-800 text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </Button>
          <Button onClick={openCreateModal} className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium">
            <Plus className="w-4 h-4 mr-2" />
            Buat Paket Baru
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-400">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-400">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Paket</span>
            <Package className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{totalCount}</div>
          <p className="text-xs text-slate-500 mt-1">Seluruh paket terdaftar</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Aktif (Tayang)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{activeCount}</div>
          <p className="text-xs text-slate-500 mt-1">Dapat dibeli oleh Customer</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Draft / Persiapan</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{draftCount}</div>
          <p className="text-xs text-slate-500 mt-1">Belum dipublikasikan</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Nonaktif / Arsip</span>
            <Archive className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-400">{inactiveCount}</div>
          <p className="text-xs text-slate-500 mt-1">Tidak tayang di katalog</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/40 p-3 rounded-lg border border-slate-800">
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
          {(['ALL', 'ACTIVE', 'DRAFT', 'INACTIVE', 'ARCHIVED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${statusFilter === st
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
            >
              {st === 'ALL' ? 'Semua Status' : st}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama atau kode paket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="border-slate-700 text-xs text-slate-300">
            Cari
          </Button>
        </form>
      </div>

      {/* Packages Grid / Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-sm">Memuat katalog paket layanan...</p>
        </div>
      ) : packages.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/20 p-8">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">Belum ada paket layanan ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Tidak ada paket yang sesuai dengan kriteria filter saat ini.'
              : 'Klik tombol "Buat Paket Baru" untuk mulai mendefinisikan produk paket komersial pertama.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-xl border p-5 transition-all bg-slate-900/70 hover:bg-slate-900 flex flex-col justify-between ${pkg.status === 'ACTIVE'
                  ? 'border-slate-800 hover:border-emerald-500/40 shadow-sm'
                  : pkg.status === 'ARCHIVED'
                    ? 'border-slate-800/50 opacity-75'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-100">{pkg.name}</h3>
                      {renderStatusBadge(pkg.status)}
                    </div>
                    <code className="text-xs text-cyan-400 font-mono mt-0.5 inline-block">{pkg.code}</code>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-emerald-400">{pkg.formattedPrice || `Rp ${pkg.price}`}</div>
                    {pkg.estimatedDuration && (
                      <span className="text-xs text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {pkg.estimatedDuration}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 mt-2">{pkg.shortDescription}</p>

                {/* Scope Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2 py-0.5 ${pkg.hasPhysicalIot
                        ? 'bg-cyan-950/40 text-cyan-400 border-cyan-800'
                        : 'bg-slate-800/40 text-slate-400 border-slate-700'
                      }`}
                  >
                    <Cpu className="w-3 h-3 mr-1" />
                    {pkg.hasPhysicalIot ? 'IoT Fisik Termasuk' : 'Digital Twin Saja (Non-IoT)'}
                  </Badge>

                  {pkg.hasThreeD && (
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-purple-950/40 text-purple-400 border-purple-800">
                      <Box className="w-3 h-3 mr-1" />
                      3D GLB Model
                    </Badge>
                  )}

                  {pkg.maxRooms && (
                    <span className="text-[11px] text-slate-400">
                      Max Ruangan: <strong className="text-slate-200">{pkg.maxRooms}</strong>
                    </span>
                  )}

                  {pkg.maxDevices && pkg.maxDevices > 0 && (
                    <span className="text-[11px] text-slate-400">
                      Max Perangkat: <strong className="text-slate-200">{pkg.maxDevices}</strong>
                    </span>
                  )}
                </div>

                {/* Inclusions summary preview */}
                {pkg.inclusions && pkg.inclusions.length > 0 && (
                  <div className="mt-3 space-y-1 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Layanan Termasuk ({pkg.inclusions.filter((i) => i.isIncluded).length})
                    </span>
                    <ul className="text-xs space-y-1 mt-1">
                      {pkg.inclusions.slice(0, 3).map((inc) => (
                        <li key={inc.id || inc.displayName} className="flex items-center gap-1.5 text-slate-300">
                          {inc.isIncluded ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          )}
                          <span className={inc.isIncluded ? '' : 'line-through text-slate-500'}>
                            {inc.displayName}
                            {inc.quantity ? ` (${inc.quantity})` : ''}
                          </span>
                        </li>
                      ))}
                      {pkg.inclusions.length > 3 && (
                        <li className="text-[11px] text-slate-500 pl-5">
                          +{pkg.inclusions.length - 3} layanan lainnya...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setIsDetailModalOpen(true);
                    }}
                    className="h-8 px-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Rincian
                  </Button>

                  {pkg.status !== 'ARCHIVED' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditModal(pkg)}
                      className="h-8 px-2.5 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Ubah
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {pkg.status === 'ACTIVE' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeactivate(pkg)}
                      className="h-8 px-2.5 text-xs border-amber-600/40 text-amber-400 hover:bg-amber-950/30"
                    >
                      <PowerOff className="w-3.5 h-3.5 mr-1" />
                      Nonaktifkan
                    </Button>
                  ) : pkg.status === 'DRAFT' || pkg.status === 'INACTIVE' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleActivate(pkg)}
                      className="h-8 px-2.5 text-xs border-emerald-600/40 text-emerald-400 hover:bg-emerald-950/30"
                    >
                      <Power className="w-3.5 h-3.5 mr-1" />
                      Aktifkan
                    </Button>
                  ) : null}

                  {pkg.status !== 'ARCHIVED' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPackageToArchive(pkg)}
                      className="h-8 px-2 text-xs text-rose-400 hover:bg-rose-950/30"
                      title="Arsipkan paket ini"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAIL MODAL */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-100">{selectedPackage.name}</h2>
                  {renderStatusBadge(selectedPackage.status)}
                </div>
                <code className="text-xs text-cyan-400 font-mono mt-0.5 inline-block">{selectedPackage.code}</code>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-400 block">Harga Paket</span>
                  <span className="text-base font-bold text-emerald-400">{selectedPackage.formattedPrice}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Estimasi Pengerjaan</span>
                  <span className="text-sm font-semibold text-slate-200">
                    {selectedPackage.estimatedDuration || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Jenis Layanan</span>
                  <span className="text-sm font-semibold text-cyan-400">
                    {selectedPackage.hasPhysicalIot ? 'IoT Smart Home' : 'Digital Twin Saja'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Deskripsi Lengkap</h4>
                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-slate-950/30 p-3 rounded-lg border border-slate-800/40">
                  {selectedPackage.description}
                </p>
              </div>

              {/* Inclusions Detail */}
              <div>
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
                  Rincian Inklusi Layanan ({selectedPackage.inclusions?.length || 0})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedPackage.inclusions && selectedPackage.inclusions.length > 0 ? (
                    selectedPackage.inclusions.map((inc, i) => (
                      <div
                        key={inc.id || i}
                        className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-3"
                      >
                        {inc.isIncluded ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold ${inc.isIncluded ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                              {inc.displayName}
                            </span>
                            <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">
                              {inc.category}
                            </Badge>
                          </div>
                          {inc.description && <p className="text-[11px] text-slate-400 mt-0.5">{inc.description}</p>}
                          {inc.quantity && (
                            <span className="text-[10px] text-cyan-400 font-mono mt-1 inline-block">
                              Kuota: {inc.quantity} unit
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">Tidak ada data inklusi spesifik.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDetailModalOpen(false)}
                className="border-slate-700 text-slate-300"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE / EDIT FORM MODAL */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  {isEditing ? `Ubah Paket: ${selectedPackage?.name}` : 'Buat Paket Layanan Komersial Baru'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tentukan spesifikasi produk, harga, durasi pengerjaan, dan daftar fitur yang disertakan.
                </p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Row 1: Name and Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nama Paket <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Smart Living Essential 2D"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Kode Unik (Slug) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. smart-living-essential-2d"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Row 2: Price and Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Harga (IDR) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g. 2500000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  {formData.price && (
                    <span className="text-[10px] text-emerald-400 font-medium mt-1 block">
                      Preview: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(formData.price) || 0)}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Estimasi Durasi</label>
                  <input
                    type="text"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                    placeholder="e.g. 3-5 Hari Kerja"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Urutan Tampil (Display Order)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Row 3: Descriptions */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Deskripsi Singkat (Kartu) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Ringkasan 1-2 kalimat untuk kartu browsing pelanggan"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Deskripsi Lengkap</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Uraian komprehensif lingkup layanan, tahapan teknisi, dan nilai tambah..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              {/* Scope & Limits */}
              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block">
                  Cakupan Fitur & Batasan Operasional
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasPhysicalIot}
                      onChange={(e) => setFormData({ ...formData, hasPhysicalIot: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span>Termasuk Instalasi Perangkat Keras IoT Fisik</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasThreeD}
                      onChange={(e) => setFormData({ ...formData, hasThreeD: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-purple-500 focus:ring-0"
                    />
                    <span>Termasuk Digital Twin 3D GLB Virtual Model</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Maks. Ruangan (Kosongkan jika tak terbatas)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxRooms}
                      onChange={(e) => setFormData({ ...formData, maxRooms: e.target.value })}
                      placeholder="e.g. 8"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Maks. Perangkat IoT (Kosongkan jika tak terbatas)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxDevices}
                      onChange={(e) => setFormData({ ...formData, maxDevices: e.target.value })}
                      placeholder="e.g. 15"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Jumlah Otomasi Disertakan</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.includedAutomations}
                      onChange={(e) => setFormData({ ...formData, includedAutomations: e.target.value })}
                      placeholder="e.g. 5"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Inclusions Builder */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Daftar Inklusi Layanan ({formData.inclusions.length})
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addInclusionRow}
                    className="h-7 text-xs border-slate-700 text-cyan-400 hover:bg-slate-800"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Tambah Inklusi
                  </Button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {formData.inclusions.map((inc, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-2"
                    >
                      <div className="w-full sm:w-1/3">
                        <select
                          value={inc.category}
                          onChange={(e) =>
                            updateInclusionRow(index, {
                              category: e.target.value as ServiceInclusionCategory,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-[11px] text-slate-300"
                        >
                          {INCLUSION_CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full sm:w-1/2">
                        <input
                          type="text"
                          required
                          value={inc.displayName}
                          onChange={(e) => updateInclusionRow(index, { displayName: e.target.value })}
                          placeholder="Nama item inklusi..."
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200"
                        />
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={inc.isIncluded}
                            onChange={(e) => updateInclusionRow(index, { isIncluded: e.target.checked })}
                            className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                          />
                          <span>Termasuk</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => removeInclusionRow(index)}
                          className="text-rose-400 hover:text-rose-300 p-1 rounded"
                          title="Hapus baris inklusi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormModalOpen(false)}
                  className="border-slate-700 text-slate-300"
                >
                  Batal
                </Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium">
                  {isEditing ? 'Simpan Perubahan' : 'Buat Paket Sekarang'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ARCHIVE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {packageToArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <ShieldAlert className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-slate-100">Arsipkan Paket Layanan?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Anda akan mengarsipkan paket <strong className="text-white">{packageToArchive.name}</strong> ({packageToArchive.code}).
            </p>
            <p className="text-xs text-slate-400 mt-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              Paket yang diarsipkan tidak akan muncul pada katalog pelanggan, dan statusnya tidak dapat diubah kembali demi menjaga integritas pesanan historis.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPackageToArchive(null)}
                className="border-slate-700 text-slate-300 text-xs"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleArchive}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium"
              >
                Ya, Arsipkan Paket
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
