import { UserRole } from '../types/auth';

export interface RouteAccessInput {
  isAuthenticated: boolean;
  role: UserRole | null;
  allowedRoles?: UserRole[];
  pathname: string;
  houseId?: string | null;
}

export interface RouteAccessDecision {
  allow: boolean;
  redirectTo?: string;
  preserveFrom?: boolean;
}

/**
 * Returns the canonical home route for each of the three commercial roles.
 */
export function getDefaultRouteForRole(role: UserRole, houseId?: string | null): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/floor-plan';
    case 'TECHNICIAN':
      return '/technician';
    case 'CUSTOMER':
    default:
      return houseId ? `/client/${houseId}` : '/client';
  }
}

/**
 * Resolves post-login destination safely so one role's route never hijacks another role.
 */
export function resolvePostLoginRoute(
  role: UserRole,
  fromPath?: string | null,
  houseId?: string | null
): string {
  const isAuthPage = !fromPath || fromPath.startsWith('/login') || fromPath.startsWith('/register');

  if (role === 'SUPER_ADMIN') {
    const isAdminRoute =
      !isAuthPage &&
      !fromPath!.startsWith('/client') &&
      !fromPath!.startsWith('/technician');
    return isAdminRoute ? fromPath! : getDefaultRouteForRole('SUPER_ADMIN');
  }

  if (role === 'TECHNICIAN') {
    const isTechRoute = !isAuthPage && fromPath!.startsWith('/technician');
    return isTechRoute ? fromPath! : getDefaultRouteForRole('TECHNICIAN');
  }

  // CUSTOMER always routes to customer portal
  return getDefaultRouteForRole('CUSTOMER', houseId);
}

/**
 * Pure role-aware route guard evaluator for the three initial platform roles:
 * SUPER_ADMIN, TECHNICIAN, and CUSTOMER.
 */
export function evaluateRouteAccess(input: RouteAccessInput): RouteAccessDecision {
  const { isAuthenticated, role, allowedRoles, pathname, houseId } = input;

  if (!isAuthenticated || !role) {
    // Only preserve `from` for Super Admin routes so customer/technician paths never hijack Super Admin login
    const isPortalRoute =
      pathname.startsWith('/client') || pathname.startsWith('/technician');
    return {
      allow: false,
      redirectTo: '/login',
      preserveFrom: !isPortalRoute,
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return {
      allow: false,
      redirectTo: getDefaultRouteForRole(role, houseId),
      preserveFrom: false,
    };
  }

  return { allow: true };
}
