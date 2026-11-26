import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Grid2X2,
  Cpu,
  MonitorPlay,
  Box,
  Crosshair,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  History,
  LogOut,
  ShieldCheck,
  Package,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { NavItem } from '../../types/navigation';
import { Badge } from '../ui/badge';
import { useAuth } from '../../context/AuthContext';

// Primary 2D Floor Plan Workspace Navigation Items
export const primaryNavigationItems: NavItem[] = [
  {
    name: 'Overview',
    href: '/',
    icon: LayoutDashboard,
    description: 'System metrics and workflow progression',
  },
  {
    name: 'Paket Layanan',
    href: '/packages',
    icon: Package,
    badge: 'Katalog',
    description: 'Katalog produk & inklusi komersial',
  },
  {
    name: 'Pesanan Layanan',
    href: '/admin/orders',
    icon: ShoppingBag,
    badge: 'Pesanan',
    description: 'Manajemen & konfirmasi pesanan pelanggan',
  },
  {
    name: 'Master Data 3D',
    href: '/master-data-3d',
    icon: Box,
    badge: '3D Assets',
    description: 'Master data IoT & addons interior digital twin 3D',
  },
  {
    name: '2D Floor Plan',
    href: '/floor-plan',
    icon: Map,
    badge: '2D Studio',
    description: 'Interactive 2D floor plan editor workspace',
  },
  {
    name: 'Room Management',
    href: '/rooms',
    icon: Grid2X2,
    description: 'Spatial zones and floor boundaries',
  },
  {
    name: 'Device Configuration',
    href: '/devices',
    icon: Cpu,
    description: 'IoT telemetry & hardware binding',
  },
  {
    name: 'Dashboard Preview',
    href: '/preview',
    icon: MonitorPlay,
    badge: 'Live',
    description: 'End-user interactive simulation',
  },
  {
    name: 'Client Portal',
    href: '/client',
    icon: LayoutDashboard,
    badge: 'Portal',
    description: 'Read-only client monitoring dashboard',
  },
];

// Frozen / Legacy 3D Navigation Items
export const legacy3DNavigationItems: NavItem[] = [
  {
    name: '3D Model Library',
    href: '/models',
    icon: Box,
    badge: 'Legacy 3D',
    description: 'Frozen Phase 1-4 GLB 3D Dollhouse models',
  },
  {
    name: '3D Object Mapping',
    href: '/mapping',
    icon: Crosshair,
    badge: '3D',
    description: 'Legacy 3D spatial node selector',
  },
];

// Combined navigation items for breadcrumbs and lookup
export const navigationItems: NavItem[] = [
  ...primaryNavigationItems,
  ...legacy3DNavigationItems,
];

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true, state: {} });
  };
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-slate-200/80 bg-white shadow-[4px_0_24px_-4px_rgba(112,118,150,0.06)] transition-all duration-300 ease-in-out',
          // Desktop width
          collapsed ? 'lg:w-20' : 'lg:w-64',
          // Mobile visibility
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-20 px-4 border-b border-slate-100">
          <NavLink
            to="/"
            onClick={onCloseMobile}
            className="flex items-center gap-3 overflow-hidden group"
          >
            {/* Purple Icon with 4-point Sparkle Star */}
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-[#8B5CF6] text-white shrink-0 shadow-md shadow-purple-500/25 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 fill-white" />
            </div>

            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col min-w-0 animate-in fade-in duration-200">
                <span className="font-extrabold text-sm text-[#181829] tracking-tight truncate flex items-center gap-1">
                  SmartHome <span className="text-[#8B5CF6]">2D</span>
                </span>
                <span className="text-[10px] text-[#71758E] font-medium tracking-wider uppercase">
                  Floor Plan Studio
                </span>
              </div>
            )}
          </NavLink>

          {/* Desktop collapse toggle button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {/* Section 1: 2D Smart Home Workspace (Primary) */}
          <div className="space-y-1">
            <div
              className={cn(
                'px-3 mb-2 text-[10px] font-bold tracking-wider text-[#71758E] uppercase font-mono',
                collapsed && !mobileOpen && 'hidden'
              )}
            >
              2D Workspace
            </div>

            {primaryNavigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onCloseMobile}
                  title={collapsed && !mobileOpen ? item.name : undefined}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all duration-200',
                      isActive
                        ? 'bg-[#181824] text-white shadow-md shadow-slate-900/10'
                        : 'text-[#71758E] hover:text-[#181829] hover:bg-slate-100/70'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive
                            ? 'text-white'
                            : 'text-[#71758E] group-hover:text-[#181829]'
                        )}
                      />

                      {(!collapsed || mobileOpen) && (
                        <span className="truncate flex-1 font-semibold text-xs tracking-tight">
                          {item.name}
                        </span>
                      )}

                      {(!collapsed || mobileOpen) && item.badge && (
                        <Badge
                          variant={isActive ? 'purple' : 'slate'}
                          className={cn(
                            'text-[9px] py-0 px-1.5 shrink-0 font-semibold',
                            isActive && 'bg-purple-500/20 text-purple-200 border-transparent'
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Section 2: Legacy 3D Studio (Frozen / Deprecated) */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <div
              className={cn(
                'px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono flex items-center gap-1.5',
                collapsed && !mobileOpen && 'hidden'
              )}
            >
              <History className="w-3 h-3 text-slate-400" />
              <span>Legacy 3D Studio</span>
            </div>

            {legacy3DNavigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onCloseMobile}
                  title={collapsed && !mobileOpen ? item.name : undefined}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-medium transition-all duration-200',
                      isActive
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100/60'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive
                            ? 'text-white'
                            : 'text-slate-400 group-hover:text-slate-600'
                        )}
                      />

                      {(!collapsed || mobileOpen) && (
                        <span className="truncate flex-1 text-xs">
                          {item.name}
                        </span>
                      )}

                      {(!collapsed || mobileOpen) && item.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Phase Indicator / Footer in Sidebar */}
        {(!collapsed || mobileOpen) && (
          <div className="p-3.5 m-3 rounded-2xl border border-purple-100 bg-purple-50/60 text-xs shadow-xs">
            <div className="flex items-center gap-1.5 text-[#7C3AED] font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span className="text-[11px]">Phase 1 — 2D Transition</span>
            </div>
            <p className="text-[10px] text-[#71758E] leading-relaxed">
              2D Floor Plan Workspace active. 3D Dollhouse features preserved as Legacy Studio.
            </p>
          </div>
        )}

        {/* User Profile Card & Logout */}
        <div className="p-3 border-t border-slate-100 mt-auto bg-slate-50/50">
          {(!collapsed || mobileOpen) ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white border border-slate-100 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#181829] truncate">{user?.name || 'Super Admin'}</p>
                  <p className="text-[10px] text-[#71758E] truncate">
                    {user?.email || (user?.username ? `@${user.username}` : '@admin')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Keluar / Logout"
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleLogout}
                title="Keluar / Logout"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
