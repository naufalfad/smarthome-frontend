import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Layers,
  Upload,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Ruler,
  Maximize2,
  Trash2,
  Sparkles,
  RefreshCw,
  Cpu,
  Armchair,
  Eye,
  Sliders,
  Filter,
} from 'lucide-react';
import {
  catalog3dApi,
  CreateDeviceCatalogPayload,
  CreateObjectCatalogPayload,
} from '../../services/catalog-3d.api';
import { DeviceCatalogItem } from '../../types/device';
import { ObjectCatalogItem } from '../../types/floor-plan';
import { CatalogCard3DPreview } from '../../components/master-3d/CatalogCard3DPreview';
import { Model3DInspectorModal } from '../../components/master-3d/Model3DInspectorModal';
import { CreateMasterItemModal } from '../../components/master-3d/CreateMasterItemModal';

export const MasterData3DPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DEVICES' | 'FURNITURE'>('DEVICES');
  const [deviceItems, setDeviceItems] = useState<DeviceCatalogItem[]>([]);
  const [furnitureItems, setFurnitureItems] = useState<ObjectCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);

  // Modals state
  const [inspectorItem, setInspectorItem] = useState<{
    type: 'DEVICE' | 'OBJECT';
    data: any;
  } | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load catalogs on mount
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [devs, furns] = await Promise.all([
        catalog3dApi.getDeviceCatalog(),
        catalog3dApi.getObjectCatalog(),
      ]);
      setDeviceItems(devs);
      setFurnitureItems(furns);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Gagal memuat katalog master 3D.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered lists
  const filteredDevices = useMemo(() => {
    return deviceItems.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.deviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [deviceItems, searchQuery, selectedCategory]);

  const filteredFurniture = useMemo(() => {
    return furnitureItems.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [furnitureItems, searchQuery, selectedCategory]);

  // Categories list based on active tab
  const categoryOptions = useMemo(() => {
    if (activeTab === 'DEVICES') {
      const set = new Set(deviceItems.map((d) => d.category));
      return Array.from(set);
    } else {
      const set = new Set(furnitureItems.map((f) => f.category));
      return Array.from(set);
    }
  }, [activeTab, deviceItems, furnitureItems]);

  // Statistics
  const totalGlbCount = useMemo(() => {
    const dev3d = deviceItems.filter((d) => !!d.modelGlbPath).length;
    const furn3d = furnitureItems.filter((f) => !!f.modelGlbPath).length;
    return dev3d + furn3d;
  }, [deviceItems, furnitureItems]);

  const totalItemCount = deviceItems.length + furnitureItems.length;
  const coveragePercent = totalItemCount > 0 ? Math.round((totalGlbCount / totalItemCount) * 100) : 0;

  // Handlers
  const handleQuickUploadGlb = async (id: string, type: 'DEVICE' | 'OBJECT', file: File) => {
    try {
      if (type === 'DEVICE') {
        const updated = await catalog3dApi.uploadDevice3dModel(id, file);
        setDeviceItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      } else {
        const updated = await catalog3dApi.uploadObject3dModel(id, file);
        setFurnitureItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      }
      setNotification({
        type: 'success',
        message: `Model 3D '${file.name}' berhasil diunggah!`,
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Gagal mengunggah berkas model 3D.',
      });
    }
  };

  const handleSaveMetadata = async (
    id: string,
    metadata: {
      placementTarget: string;
      defaultElevation: number;
      dimensionLength: number;
      dimensionWidth: number;
      dimensionHeight: number;
    }
  ) => {
    if (!inspectorItem) return;
    if (inspectorItem.type === 'DEVICE') {
      const updated = await catalog3dApi.updateDeviceCatalogItem(id, metadata);
      setDeviceItems((prev) => prev.map((d) => (d.id === id ? updated : d)));
      setInspectorItem({ type: 'DEVICE', data: updated });
    } else {
      const updated = await catalog3dApi.updateObjectCatalogItem(id, metadata);
      setFurnitureItems((prev) => prev.map((f) => (f.id === id ? updated : f)));
      setInspectorItem({ type: 'OBJECT', data: updated });
    }
    setNotification({
      type: 'success',
      message: 'Konfigurasi metrik 3D berhasil disimpan!',
    });
  };

  const handleDeleteItem = async (id: string, type: 'DEVICE' | 'OBJECT', name: string) => {
    if (!window.confirm(`Yakin ingin menghapus master data '${name}'?`)) return;

    try {
      if (type === 'DEVICE') {
        await catalog3dApi.deleteDeviceCatalogItem(id);
        setDeviceItems((prev) => prev.filter((d) => d.id !== id));
      } else {
        await catalog3dApi.deleteObjectCatalogItem(id);
        setFurnitureItems((prev) => prev.filter((f) => f.id !== id));
      }
      setNotification({
        type: 'success',
        message: `Master item '${name}' berhasil dihapus/dinonaktifkan.`,
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Gagal menghapus item.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Phase 12 • Digital Twin 3D Master
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Box className="w-7 h-7 text-indigo-400" />
            Master Data Objek & Perangkat 3D
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Pusat manajemen aset 3D digital twin: unggah model biner <code>.glb</code>, konfigurasikan dimensi nyata
            (P × L × T), target penempatan (Lantai/Dinding/Plafon), dan elevasi spasial untuk seluruh properti customer.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            title="Muat Ulang Data"
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Master Item</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">{deviceItems.length}</div>
            <div className="text-[11px] text-slate-400">Master Perangkat IoT</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
            <Armchair className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">{furnitureItems.length}</div>
            <div className="text-[11px] text-slate-400">Master Addons Furnitur</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">{totalGlbCount} File</div>
            <div className="text-[11px] text-slate-400">Model .GLB Tersedia</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">{coveragePercent}%</div>
            <div className="text-[11px] text-slate-400">Kesiapan Aset 3D</div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        {/* Dual Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start">
          <button
            onClick={() => {
              setActiveTab('DEVICES');
              setSelectedCategory('ALL');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'DEVICES'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Perangkat IoT ({deviceItems.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('FURNITURE');
              setSelectedCategory('ALL');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'FURNITURE'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Armchair className="w-3.5 h-3.5" />
            <span>Addons & Furnitur ({furnitureItems.length})</span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2.5 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Cari nama, tipe, atau kategori...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">Semua Kategori</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid Content */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-xs">Memuat katalog master data 3D...</p>
        </div>
      ) : activeTab === 'DEVICES' ? (
        filteredDevices.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
            <Box className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-400">Tidak ada perangkat yang sesuai filter.</p>
            <p className="text-xs mt-1">Gunakan tombol "Tambah Master Item" untuk mendaftarkan perangkat baru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDevices.map((dev) => {
              const streamUrl = dev.modelGlbPath ? catalog3dApi.getDevice3dModelUrl(dev.id) : null;
              const hasGlb = !!dev.modelGlbPath;

              return (
                <div
                  key={dev.id}
                  className="bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl overflow-hidden shadow-lg transition-all flex flex-col group p-2.5"
                >
                  {/* High Performance 3D CAD Preview with On-Demand Live Canvas */}
                  <CatalogCard3DPreview
                    id={dev.id}
                    name={dev.name}
                    category={dev.category}
                    type="DEVICE"
                    modelUrl={streamUrl}
                    dimensions={{
                      length: dev.dimensionLength ?? 0.12,
                      width: dev.dimensionWidth ?? 0.12,
                      height: dev.dimensionHeight ?? 0.04,
                    }}
                    color={dev.color || '#6366F1'}
                    placementTarget={dev.placementTarget || 'WALL'}
                    isActive3D={activePreviewId === dev.id}
                    onToggleActive3D={() =>
                      setActivePreviewId((current) => (current === dev.id ? null : dev.id))
                    }
                    onOpenInspector={() => {
                      setActivePreviewId(null);
                      setInspectorItem({ type: 'DEVICE', data: dev });
                    }}
                    className="h-44"
                  />

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
                          {dev.category}
                        </span>
                        {hasGlb ? (
                          <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> .GLB Ready
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400/90 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Fallback Box
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {dev.name}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-500 line-clamp-1">
                        Type: {dev.deviceType}
                      </p>
                    </div>

                    {/* Dimension & Elevation Badges */}
                    <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-400">
                      <div className="bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                        Dim: {(dev.dimensionLength ?? 0.12).toFixed(2)}x{(dev.dimensionWidth ?? 0.12).toFixed(2)}x{(dev.dimensionHeight ?? 0.04).toFixed(2)}m
                      </div>
                      <div className="bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                        Elevasi: +{(dev.defaultElevation ?? 1.2).toFixed(2)}m
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                      <label className="flex-1 px-2.5 py-1.5 rounded-xl border border-dashed border-indigo-500/30 hover:border-indigo-400 bg-indigo-950/20 hover:bg-indigo-900/30 text-indigo-300 text-[11px] font-medium cursor-pointer text-center transition-all flex items-center justify-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>{hasGlb ? 'Ganti .GLB' : 'Upload .GLB'}</span>
                        <input
                          type="file"
                          accept=".glb"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleQuickUploadGlb(dev.id, 'DEVICE', file);
                          }}
                        />
                      </label>

                      <button
                        onClick={() => setInspectorItem({ type: 'DEVICE', data: dev })}
                        title="Atur Dimensi & Elevasi"
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteItem(dev.id, 'DEVICE', dev.name)}
                        title="Hapus Master Item"
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : filteredFurniture.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
          <Armchair className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-400">Tidak ada furnitur yang sesuai filter.</p>
          <p className="text-xs mt-1">Gunakan tombol "Tambah Master Item" untuk mendaftarkan furnitur baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFurniture.map((furn) => {
            const streamUrl = furn.modelGlbPath ? catalog3dApi.getObject3dModelUrl(furn.id) : null;
            const hasGlb = !!furn.modelGlbPath;

            return (
              <div
                key={furn.id}
                className="bg-slate-900/90 border border-slate-800/80 hover:border-violet-500/40 rounded-2xl overflow-hidden shadow-lg transition-all flex flex-col group p-2.5"
              >
                {/* High Performance 3D CAD Preview with On-Demand Live Canvas */}
                <CatalogCard3DPreview
                  id={furn.id}
                  name={furn.name}
                  category={furn.category}
                  type="OBJECT"
                  modelUrl={streamUrl}
                  dimensions={{
                    length: furn.dimensionLength ?? 1.0,
                    width: furn.dimensionWidth ?? 1.0,
                    height: furn.dimensionHeight ?? 0.8,
                  }}
                  color="#8B5CF6"
                  placementTarget={furn.placementTarget || 'FLOOR'}
                  svgContent={furn.svgContent}
                  isActive3D={activePreviewId === furn.id}
                  onToggleActive3D={() =>
                    setActivePreviewId((current) => (current === furn.id ? null : furn.id))
                  }
                  onOpenInspector={() => {
                    setActivePreviewId(null);
                    setInspectorItem({ type: 'OBJECT', data: furn });
                  }}
                  className="h-44"
                />

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-violet-950/60 text-violet-400 border border-violet-800/40">
                        {furn.category}
                      </span>
                      {hasGlb ? (
                        <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> .GLB Ready
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400/90 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Fallback Box
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
                      {furn.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {furn.description || 'Tidak ada deskripsi tambahan'}
                    </p>
                  </div>

                  {/* Dimension & Elevation Badges */}
                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-400">
                    <div className="bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                      Dim: {(furn.dimensionLength ?? 1.0).toFixed(2)}x{(furn.dimensionWidth ?? 1.0).toFixed(2)}x{(furn.dimensionHeight ?? 0.8).toFixed(2)}m
                    </div>
                    <div className="bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                      Target: {furn.placementTarget || 'FLOOR'}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                    <label className="flex-1 px-2.5 py-1.5 rounded-xl border border-dashed border-violet-500/30 hover:border-violet-400 bg-violet-950/20 hover:bg-violet-900/30 text-violet-300 text-[11px] font-medium cursor-pointer text-center transition-all flex items-center justify-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>{hasGlb ? 'Ganti .GLB' : 'Upload .GLB'}</span>
                      <input
                        type="file"
                        accept=".glb"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleQuickUploadGlb(furn.id, 'OBJECT', file);
                        }}
                      />
                    </label>

                    <button
                      onClick={() => setInspectorItem({ type: 'OBJECT', data: furn })}
                      title="Atur Dimensi & Elevasi"
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteItem(furn.id, 'OBJECT', furn.name)}
                      title="Hapus Master Item"
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspector Modal */}
      {inspectorItem && (
        <Model3DInspectorModal
          isOpen={true}
          onClose={() => setInspectorItem(null)}
          type={inspectorItem.type}
          item={inspectorItem.data}
          onUploadGlb={(id, file) => handleQuickUploadGlb(id, inspectorItem.type, file)}
          onSaveMetadata={handleSaveMetadata}
          modelStreamUrl={
            inspectorItem.data.modelGlbPath
              ? inspectorItem.type === 'DEVICE'
                ? catalog3dApi.getDevice3dModelUrl(inspectorItem.data.id)
                : catalog3dApi.getObject3dModelUrl(inspectorItem.data.id)
              : null
          }
        />
      )}

      {/* Create Modal */}
      <CreateMasterItemModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        type={activeTab === 'DEVICES' ? 'DEVICE' : 'OBJECT'}
        onCreateDevice={async (payload: CreateDeviceCatalogPayload) => {
          const created = await catalog3dApi.createDeviceCatalogItem(payload);
          setDeviceItems((prev) => [created, ...prev]);
          setNotification({
            type: 'success',
            message: `Perangkat IoT '${created.name}' berhasil ditambahkan ke master data!`,
          });
        }}
        onCreateObject={async (payload: CreateObjectCatalogPayload) => {
          const created = await catalog3dApi.createObjectCatalogItem(payload);
          setFurnitureItems((prev) => [created, ...prev]);
          setNotification({
            type: 'success',
            message: `Addon furnitur '${created.name}' berhasil ditambahkan ke master data!`,
          });
        }}
      />
    </div>
  );
};
