import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { RefreshCw } from 'lucide-react';
import { evaluateRouteAccess } from '../../utils/route-access';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, isLoading, user, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-600">Memverifikasi sesi autentikasi...</p>
      </div>
    );
  }

  const decision = evaluateRouteAccess({
    isAuthenticated,
    role,
    allowedRoles,
    pathname: location.pathname,
    houseId: user?.houseId,
  });

  if (!decision.allow) {
    return (
      <Navigate
        to={decision.redirectTo!}
        state={decision.preserveFrom ? { from: location } : {}}
        replace
      />
    );
  }

  return <>{children}</>;
};
