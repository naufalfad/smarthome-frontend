import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, ChevronRight, Layers, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { ApiStatusBadge } from '../common/ApiStatusBadge';
import { navigationItems } from './Sidebar';

export interface HeaderProps {
  onOpenMobileSidebar: () => void;
  collapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileSidebar,
  collapsed,
}) => {
  const location = useLocation();

  const currentNav =
    navigationItems.find((item) => item.href === location.pathname) || {
      name: 'Overview',
      description: 'System metrics and workflow progression',
    };

  const workspaceName =
    import.meta.env.VITE_WORKSPACE_NAME || 'Residential Twin v1.0';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-4 sm:px-8 bg-[#E7E8F3]/90 backdrop-blur-md border-b border-slate-200/80">
      {/* Left section: Hamburger button + Breadcrumbs + Current Page Title */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col min-w-0">
          {/* Breadcrumb row */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#71758E] font-medium">
            <span>Workspace</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#8B5CF6] font-semibold truncate">
              {currentNav.name}
            </span>
          </div>

          {/* Current Page Title */}
          <h2 className="text-base sm:text-lg font-extrabold text-[#181829] tracking-tight truncate hidden sm:block">
            {currentNav.name}
          </h2>
        </div>
      </div>

      {/* Right section: Workspace Info + API Health + Admin Profile Placeholder */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Workspace Pill */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/80 bg-white shadow-xs text-xs">
          <Layers className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span className="text-[#71758E]">Space:</span>
          <span className="text-[#181829] font-bold">{workspaceName}</span>
        </div>

        {/* Live Backend API Status Badge */}
        <ApiStatusBadge />

        <div className="h-6 w-px bg-slate-300/80 hidden sm:block" />

        {/* Admin profile placeholder (Visual only, no authentication system) */}
        <div className="flex items-center gap-3 pl-1">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#A78BFA] p-[2px] shadow-sm">
              <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center text-xs font-bold text-[#7C3AED]">
                AD
              </div>
            </div>
            {/* Online green indicator badge (like the green dot in the reference image) */}
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#10B981] ring-2 ring-white" />
          </div>

          <div className="hidden lg:flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#181829]">
                Administrator
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#8B5CF6]" />
            </div>
            <span className="text-[10px] text-[#71758E] font-medium">
              admin@smarthome3d.local
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
