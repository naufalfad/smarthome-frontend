import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { AdminLayout } from '../components/layout/AdminLayout';
import { OverviewPage } from '../pages/overview/OverviewPage';
import { FloorPlanWorkspacePage } from '../pages/floor-plan/FloorPlanWorkspacePage';
import { ModelLibraryPage } from '../pages/model-library/ModelLibraryPage';
import { ModelDetailPage } from '../pages/model-library/ModelDetailPage';
import { RoomManagementPage } from '../pages/room-management/RoomManagementPage';
import { ObjectMappingPage } from '../pages/object-mapping/ObjectMappingPage';
import { DeviceConfigurationPage } from '../pages/device-configuration/DeviceConfigurationPage';
import { DashboardPreviewPage } from '../pages/dashboard-preview/DashboardPreviewPage';
import { ClientDashboardPage } from '../pages/client/ClientDashboardPage';
import { CustomerPackageCatalogPage } from '../pages/client/CustomerPackageCatalogPage';
import { CustomerOrdersPage } from '../pages/client/CustomerOrdersPage';
import { AdminServiceOrdersPage } from '../pages/admin/AdminServiceOrdersPage';
import { TechnicianWorkspacePage } from '../pages/technician/TechnicianWorkspacePage';
import { AdminPackagesPage } from '../pages/packages/AdminPackagesPage';

export const AppRoutes: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* Technician Workspace (Restricted to TECHNICIAN and SUPER_ADMIN) */}
        <Route
          path="technician"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TECHNICIAN']}>
              <TechnicianWorkspacePage />
            </ProtectedRoute>
          }
        />

        {/* Customer Portal Dashboard (Restricted to CUSTOMER and SUPER_ADMIN) */}
        <Route
          path="client"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'CUSTOMER']}>
              <ClientDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="client/:houseId"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'CUSTOMER']}>
              <ClientDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Commercial Service Package Catalog (Restricted strictly to CUSTOMER role only) */}
        <Route
          path="catalog"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <CustomerPackageCatalogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="catalog/packages"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <CustomerPackageCatalogPage />
            </ProtectedRoute>
          }
        />

        {/* Customer Service Order History (Restricted strictly to CUSTOMER role only) */}
        <Route
          path="orders"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <CustomerOrdersPage />
            </ProtectedRoute>
          }
        />

        {/* 2D Interactive Floor Plan CAD Workspace (Accessible by SUPER_ADMIN and TECHNICIAN) */}
        <Route
          path="floor-plan"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TECHNICIAN']}>
              <FloorPlanWorkspacePage />
            </ProtectedRoute>
          }
        />

        {/* Super Admin Configuration Studio (Restricted to SUPER_ADMIN role only) */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Default route: Overview */}
          <Route index element={<OverviewPage />} />

          {/* Commercial Package Catalog Management (Phase 6) */}
          <Route path="packages" element={<AdminPackagesPage />} />

          {/* Commercial Service Orders Management Console (Phase 7) */}
          <Route path="admin/orders" element={<AdminServiceOrdersPage />} />

          {/* Frozen Legacy 3D Studio (Preserved) */}
          <Route path="models" element={<ModelLibraryPage />} />
          <Route path="models/:id" element={<ModelDetailPage />} />

          {/* Foundations */}
          <Route path="rooms" element={<RoomManagementPage />} />
          <Route path="mapping" element={<ObjectMappingPage />} />
          <Route path="devices" element={<DeviceConfigurationPage />} />
          <Route path="preview" element={<DashboardPreviewPage />} />

          {/* Fallback to Overview */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
};
