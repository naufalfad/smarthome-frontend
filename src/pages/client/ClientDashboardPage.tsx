/**
 * PHASE 8: USER DASHBOARD & SMART HOME EXPERIENCE
 * Comprehensive customer monitoring, environmental telemetry, 2D floor plan,
 * room monitoring, device control, automation status, and activity timeline.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Layers,
  DoorClosed,
  Zap,
  Clock,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  User,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  Package,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../services/dashboard.api';
import { floorPlanApi } from '../../services/floor-plan.api';
import {
  HouseOverviewData,
  DashboardFloor,
  DashboardRoom,
  DashboardActivityItem,
  DashboardAutomationSummary,
} from '../../types/dashboard';
import { IoTDevice } from '../../types/device';
import { House } from '../../types/floor-plan';
import { HouseOverviewSection } from '../../components/dashboard/HouseOverviewSection';
import { InteractiveFloorPlanSection } from '../../components/dashboard/InteractiveFloorPlanSection';
import { RoomMonitoringSection } from '../../components/dashboard/RoomMonitoringSection';
import { AutomationOverviewSection } from '../../components/dashboard/AutomationOverviewSection';
import { ActivityTimelineSection } from '../../components/dashboard/ActivityTimelineSection';
import { DeviceControlModal } from '../../components/floor-plan/DeviceControlModal';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export const ClientDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const { houseId: paramHouseId } = useParams<{ houseId?: string }>();
  const [houseId, setHouseId] = useState<string>(paramHouseId || '');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true, state: {} });
  };

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'floorplan' | 'rooms' | 'automation' | 'activity'>('overview');

  // Data States
  const [overview, setOverview] = useState<HouseOverviewData | null>(null);
  const [floors, setFloors] = useState<DashboardFloor[]>([]);
  const [activeFloorId, setActiveFloorId] = useState<string>('');
  const [rooms, setRooms] = useState<DashboardRoom[]>([]);
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [activities, setActivities] = useState<DashboardActivityItem[]>([]);
  const [automationSummary, setAutomationSummary] = useState<DashboardAutomationSummary | null>(null);

  // UI States
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
  const [availableHouses, setAvailableHouses] = useState<House[]>([]);

  // 1. Initial Load & House ID resolution (CustomerProfile 1:N aware; never silently picks 1 of N)
  const loadInitialData = async (targetHouseId?: string) => {
    try {
      setLoading(true);
      setError(null);

      let resolvedHouseId = targetHouseId || paramHouseId || '';
      if (!resolvedHouseId) {
        if (role === 'CUSTOMER' && user?.customerProfile?.id) {
          const ownedHouses = await floorPlanApi.getHouses({
            customerId: user.customerProfile.id,
          });
          setAvailableHouses(ownedHouses);

          if (ownedHouses.length === 1) {
            resolvedHouseId = ownedHouses[0].id;
            setHouseId(resolvedHouseId);
          } else {
            // 0 properties (empty state) OR multiple properties (explicit user selection required)
            setOverview(null);
            setLoading(false);
            return;
          }
        } else {
          const houses = await floorPlanApi.getHouses();
          setAvailableHouses(houses);
          if (houses.length > 0) {
            resolvedHouseId = houses[0].id;
            setHouseId(resolvedHouseId);
          } else {
            setOverview(null);
            setLoading(false);
            return;
          }
        }
      } else {
        setHouseId(resolvedHouseId);
      }

      // Parallel fetch all dashboard dimensions
      const [ov, fls, rms, devs, acts, autos] = await Promise.all([
        dashboardApi.getOverview(resolvedHouseId),
        dashboardApi.getFloors(resolvedHouseId),
        dashboardApi.getRooms(resolvedHouseId),
        dashboardApi.getDevices(resolvedHouseId),
        dashboardApi.getActivities(resolvedHouseId, 30),
        dashboardApi.getAutomationSummary(resolvedHouseId),
      ]);

      setOverview(ov);
      setFloors(fls);
      if (fls.length > 0 && !activeFloorId) {
        setActiveFloorId(fls[0].id);
      }
      setRooms(rms);
      setDevices(devs);
      setActivities(acts);
      setAutomationSummary(autos);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data User Dashboard');
    } finally {
      setLoading(false);
    }
  };

  // 2. Background Refresh (Every 5 seconds)
  const refreshLiveTelemetry = async () => {
    if (!houseId) return;
    try {
      setRefreshing(true);
      const [ov, rms, devs, acts, autos] = await Promise.all([
        dashboardApi.getOverview(houseId),
        dashboardApi.getRooms(houseId, activeFloorId || undefined),
        dashboardApi.getDevices(houseId, activeFloorId || undefined),
        dashboardApi.getActivities(houseId, 30),
        dashboardApi.getAutomationSummary(houseId),
      ]);

      setOverview(ov);
      setRooms(rms);
      setDevices(devs);
      setActivities(acts);
      setAutomationSummary(autos);

      // Keep selected device modal synchronized with fresh state
      setSelectedDevice((curr) => {
        if (!curr) return null;
        return devs.find((d) => d.id === curr.id) || curr;
      });
    } catch (e) {
      // Tolerate silent background polling failure
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInitialData(paramHouseId);
  }, [paramHouseId]);

  useEffect(() => {
    if (!houseId) return;
    const interval = setInterval(refreshLiveTelemetry, 5000);
    return () => clearInterval(interval);
  }, [houseId, activeFloorId]);

  // 3. Device Control Action Handler (Phase 6 & 8 command pipeline)
  const handleDeviceControl = async (
    deviceId: string,
    action: string,
    payload?: any
  ) => {
    try {
      await dashboardApi.controlDevice(deviceId, action, payload);
      // Immediately refresh live telemetry
      await refreshLiveTelemetry();
    } catch (err: any) {
      throw err; // Forward error to DeviceControlModal for visual feedback
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-10 h-10 text-purple-600 animate-spin mb-4" />
        <h2 className="text-base font-extrabold text-[#181829]">Memuat Smart Home User Dashboard...</h2>
        <p className="text-xs text-[#71758E] mt-1">Mengambil telemetri sensor, denah lantai, dan status otomasi</p>
      </div>
    );
  }

  // Empty State or Multi-Property Selection State (when no error occurred)
  if (!error && !overview) {
    const hasMultiple = availableHouses.length > 1;
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {role === 'SUPER_ADMIN' && (
              <Link
                to="/floor-plan"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                title="Kembali ke Studio Super Admin"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            )}
            <div>
              <h1 className="text-base font-extrabold text-[#181829]">Portal Properti Smart Home</h1>
              <p className="text-xs text-[#71758E]">
                {user?.name} ({user?.email || (user?.username ? `@${user.username}` : 'Customer')})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {role === 'CUSTOMER' && (
              <>
                <Link
                  to="/catalog"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-colors"
                >
                  <Package className="w-4 h-4 text-purple-600" />
                  <span className="hidden sm:inline">Katalog Paket</span>
                </Link>
                <Link
                  to="/orders"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Pesanan Saya</span>
                </Link>
              </>
            )}
            {role === 'SUPER_ADMIN' && (
              <Link
                to="/packages"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-colors"
              >
                <Package className="w-4 h-4 text-purple-600" />
                <span className="hidden sm:inline">Kelola Paket</span>
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          {hasMultiple ? (
            <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
              <div>
                <h2 className="text-lg font-extrabold text-[#181829]">Pilih Properti Anda</h2>
                <p className="text-xs text-[#71758E] mt-1">
                  Akun Anda memiliki {availableHouses.length} properti terdaftar. Pilih salah satu untuk membuka dashboard pemantauan.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableHouses.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => navigate(`/client/${h.id}`)}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/40 text-left transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-extrabold text-[#181829] truncate">{h.name}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        {h.setupStatus || 'DRAFT'}
                      </span>
                    </div>
                    {h.address && (
                      <p className="text-[11px] text-[#71758E] truncate">{h.address}</p>
                    )}
                    <p className="text-[10px] text-slate-500">
                      {h.floors?.length || 0} lantai • {h.hasPhysicalIot === false ? 'Tanpa IoT Fisik' : 'Smart IoT'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xs space-y-3">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
                <Home className="w-8 h-8" />
              </div>
              <h2 className="text-base font-extrabold text-[#181829]">Belum Ada Properti Terdaftar</h2>
              <p className="text-xs text-[#71758E] leading-relaxed">
                Akun Customer Anda sudah aktif, namun belum terhubung ke properti mana pun. Properti akan tersedia di sini setelah didaftarkan dan diaktifkan oleh tim layanan.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                {role === 'CUSTOMER' && (
                  <Link to="/catalog">
                    <Button variant="purple" size="sm" className="text-xs flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" />
                      <span>Lihat Katalog Paket</span>
                    </Button>
                  </Link>
                )}
                {role === 'SUPER_ADMIN' && (
                  <>
                    <Link to="/packages">
                      <Button variant="purple" size="sm" className="text-xs flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" />
                        <span>Kelola Paket Layanan</span>
                      </Button>
                    </Link>
                    <Link to="/floor-plan">
                      <Button variant="secondary" size="sm" className="text-xs">
                        Kembali ke Studio
                      </Button>
                    </Link>
                  </>
                )}
                <Button variant="secondary" size="sm" onClick={() => loadInitialData()} className="text-xs">
                  Muat Ulang
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Dedicated In-Progress / Configuring Screen for Customer
  const isConfiguringOrPending =
    error &&
    (error.includes('belum berstatus ACTIVE') ||
      error.includes('CONFIGURING') ||
      error.includes('READY_FOR_HANDOVER') ||
      error.includes('serah terima selesai'));

  if (isConfiguringOrPending) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center animate-pulse">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              Properti Sedang Dikonfigurasi
            </span>
            <h2 className="text-lg font-extrabold text-[#181829] pt-1">
              Instalasi & Komisioning Sedang Berjalan
            </h2>
            <p className="text-xs text-[#71758E] leading-relaxed">
              Tim teknisi lapangan kami sedang melakukan kalibrasi denah lantai, penempatan perangkat IoT, dan uji coba sistem. Dashboard interaktif dan kontrol perangkat akan otomatis aktif setelah proses serah terima (Handover) diselesaikan oleh administrator.
            </p>
          </div>
          <div className="pt-3 flex flex-wrap justify-center gap-2">
            <Link to="/orders">
              <Button variant="purple" size="sm" className="text-xs flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Lihat Status Pesanan</span>
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => loadInitialData(houseId)} className="text-xs">
              Periksa Kembali
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !overview) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-base font-extrabold text-[#181829]">Gagal Memuat Dashboard</h2>
        <p className="text-xs text-[#71758E] mt-1 max-w-sm">{error || 'Data rumah tidak ditemukan'}</p>
        <div className="mt-6 flex gap-3">
          {role === 'SUPER_ADMIN' && (
            <Link to="/floor-plan">
              <Button variant="secondary" size="sm" className="text-xs">
                Kembali ke Studio Admin
              </Button>
            </Link>
          )}
          <Button variant="purple" size="sm" onClick={() => loadInitialData(houseId)} className="text-xs">
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  const house = overview.houseSummary;
  const unassignedDevices = devices.filter((d) => !d.roomId && (!d.floorId || d.floorId === activeFloorId));

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#181829] flex flex-col pb-16 md:pb-6">
      {/* Top Navbar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-2xs">
        <div className="flex items-center gap-3">
          {role === 'SUPER_ADMIN' && (
            <Link
              to="/floor-plan"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Kembali ke Mode Studio Super Admin"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-[#181829] flex items-center gap-2">
                <span>{house.name}</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                {house.publishStatus}
              </span>
            </div>
            <p className="text-xs text-[#71758E] mt-0.5 flex items-center gap-2">
              {house.clientName && (
                <span className="flex items-center gap-1 text-purple-700 font-medium">
                  <User className="w-3 h-3" /> Pemilik: {house.clientName}
                </span>
              )}
              <span>•</span>
              <span>Smart Home Experience</span>
            </p>
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {[
            { id: 'overview', label: 'Ringkasan', icon: Home },
            { id: 'floorplan', label: 'Denah 2D', icon: Layers },
            { id: 'rooms', label: 'Ruangan', icon: DoorClosed },
            { id: 'automation', label: 'Otomasi', icon: Zap },
            { id: 'activity', label: 'Aktivitas', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-[#71758E] hover:text-[#181829] hover:bg-white/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Controls: Simulation Status, Catalog Link, Refresh Button & User Profile / Logout */}
        <div className="flex items-center gap-2">
          {role === 'CUSTOMER' && (
            <>
              <Link
                to="/catalog"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition-colors"
                title="Lihat Katalog Paket Layanan"
              >
                <Package className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Katalog Paket</span>
              </Link>
              <Link
                to="/orders"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold transition-colors"
                title="Lihat Riwayat Pesanan Saya"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Pesanan Saya</span>
              </Link>
            </>
          )}
          {role === 'SUPER_ADMIN' && (
            <Link
              to="/packages"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition-colors"
              title="Kelola Paket Layanan (Admin)"
            >
              <Package className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">Kelola Paket</span>
            </Link>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">SIMULATION ENGINE ACTIVE</span>
            <span className="sm:hidden">SIMULATION</span>
          </div>

          <button
            onClick={refreshLiveTelemetry}
            disabled={refreshing}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs disabled:opacity-50"
            title="Refresh telemetri sekarang"
          >
            <RefreshCw className={`w-4 h-4 text-purple-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* User Profile Badge & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-[11px] font-bold text-[#181829] leading-tight truncate max-w-[140px]">
                {user?.name || (role === 'SUPER_ADMIN' ? 'Super Admin' : 'Customer')}
              </span>
              <span className="text-[9px] font-mono text-purple-600 font-bold uppercase">
                {role === 'SUPER_ADMIN' ? '👑 Super Admin' : '👤 Customer'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'overview' && (
          <HouseOverviewSection
            data={overview}
            onSelectDevice={(dev) => setSelectedDevice(dev)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            floors={floors}
            activeFloorId={activeFloorId}
            onSelectFloor={setActiveFloorId}
            devices={devices}
            rooms={rooms}
          />
        )}

        {activeTab === 'floorplan' && (
          <InteractiveFloorPlanSection
            floors={floors}
            activeFloorId={activeFloorId}
            onSelectFloor={setActiveFloorId}
            devices={devices}
            rooms={rooms}
            onSelectDevice={(dev) => setSelectedDevice(dev)}
          />
        )}

        {activeTab === 'rooms' && (
          <RoomMonitoringSection
            rooms={rooms}
            floors={floors}
            activeFloorId={activeFloorId}
            onSelectFloor={setActiveFloorId}
            unassignedDevices={unassignedDevices}
            onSelectDevice={(dev) => setSelectedDevice(dev)}
          />
        )}

        {activeTab === 'automation' && (
          <AutomationOverviewSection
            summary={automationSummary}
            loading={refreshing}
            onRefresh={refreshLiveTelemetry}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityTimelineSection
            activities={activities}
            loading={refreshing}
            onRefresh={refreshLiveTelemetry}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around py-2 px-3 shadow-lg">
        {[
          { id: 'overview', label: 'Ringkasan', icon: Home },
          { id: 'floorplan', label: 'Denah', icon: Layers },
          { id: 'rooms', label: 'Ruang', icon: DoorClosed },
          { id: 'automation', label: 'Otomasi', icon: Zap },
          { id: 'activity', label: 'Aktivitas', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
                isActive ? 'text-purple-600' : 'text-[#71758E]'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-purple-100 text-purple-600' : ''
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Device Control Modal */}
      <DeviceControlModal
        device={selectedDevice}
        isOpen={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
        onControlDevice={handleDeviceControl}
      />
    </div>
  );
};
