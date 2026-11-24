import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '../../lib/utils';

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#E7E8F3] text-[#181829] flex flex-col antialiased selection:bg-purple-200 selection:text-purple-900">
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          'flex flex-col flex-1 transition-all duration-300 ease-in-out min-h-screen',
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
      >
        {/* Top Header */}
        <Header
          collapsed={collapsed}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="py-5 px-6 border-t border-slate-200/80 text-center text-xs text-[#71758E]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>3D Smart Home Monitoring Platform — Admin Workspace</span>
            <span className="font-mono text-[11px] text-[#71758E]">
              Phase 1: Project Foundation & Architecture
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
