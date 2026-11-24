/**
 * PHASE 2 FRONTEND ROLE-AWARE ROUTE PROTECTION TEST SUITE
 *
 * Tests `frontend/src/utils/route-access.ts` across all three platform roles:
 * SUPER_ADMIN, TECHNICIAN, and CUSTOMER.
 */

import {
  evaluateRouteAccess,
  getDefaultRouteForRole,
  resolvePostLoginRoute,
} from '../src/utils/route-access.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${desc}`);
    failed++;
  }
}

console.log('===================================================================');
console.log('🧭 PHASE 2: THREE-ROLE FRONTEND ROUTE GUARD TESTS');
console.log('===================================================================\n');

// 1. Unauthenticated redirects
{
  const adminUnauth = evaluateRouteAccess({
    isAuthenticated: false,
    role: null,
    allowedRoles: ['SUPER_ADMIN'],
    pathname: '/floor-plan',
  });
  assert(!adminUnauth.allow && adminUnauth.redirectTo === '/login' && adminUnauth.preserveFrom === true,
    'Unauthenticated access to /floor-plan redirects to /login preserving admin return path');

  const clientUnauth = evaluateRouteAccess({
    isAuthenticated: false,
    role: null,
    allowedRoles: ['SUPER_ADMIN', 'CUSTOMER'],
    pathname: '/client',
  });
  assert(!clientUnauth.allow && clientUnauth.redirectTo === '/login' && clientUnauth.preserveFrom === false,
    'Unauthenticated access to /client redirects to /login WITHOUT hijacking future Super Admin login');

  const techUnauth = evaluateRouteAccess({
    isAuthenticated: false,
    role: null,
    allowedRoles: ['SUPER_ADMIN', 'TECHNICIAN'],
    pathname: '/technician',
  });
  assert(!techUnauth.allow && techUnauth.redirectTo === '/login' && techUnauth.preserveFrom === false,
    'Unauthenticated access to /technician redirects to /login cleanly');
}

// 2. CUSTOMER boundaries
{
  const custToAdmin = evaluateRouteAccess({
    isAuthenticated: true,
    role: 'CUSTOMER',
    allowedRoles: ['SUPER_ADMIN'],
    pathname: '/floor-plan',
    houseId: 'house-123',
  });
  assert(!custToAdmin.allow && custToAdmin.redirectTo === '/client/house-123',
    'CUSTOMER cannot access Super Admin /floor-plan route');

  const custToTech = evaluateRouteAccess({
    isAuthenticated: true,
    role: 'CUSTOMER',
    allowedRoles: ['SUPER_ADMIN', 'TECHNICIAN'],
    pathname: '/technician',
    houseId: null,
  });
  assert(!custToTech.allow && custToTech.redirectTo === '/client',
    'CUSTOMER cannot access Technician /technician route');

  const custToClient = evaluateRouteAccess({
    isAuthenticated: true,
    role: 'CUSTOMER',
    allowedRoles: ['SUPER_ADMIN', 'CUSTOMER'],
    pathname: '/client',
    houseId: null,
  });
  assert(custToClient.allow, 'CUSTOMER is permitted on /client portal route');
}

// 3. TECHNICIAN boundaries
{
  const techToAdmin = evaluateRouteAccess({
    isAuthenticated: true,
    role: 'TECHNICIAN',
    allowedRoles: ['SUPER_ADMIN'],
    pathname: '/floor-plan',
  });
  assert(!techToAdmin.allow && techToAdmin.redirectTo === '/technician',
    'TECHNICIAN cannot access Super Admin-only /floor-plan route');

  const techToClient = evaluateRouteAccess({
    isAuthenticated: true,
    role: 'TECHNICIAN',
    allowedRoles: ['SUPER_ADMIN', 'CUSTOMER'],
    pathname: '/client',
  });
  assert(!techToClient.allow && techToClient.redirectTo === '/technician',
    'TECHNICIAN cannot access Customer-only /client route');

  const techToTech = evaluateRouteAccess({
    isAuthenticated: true,
    role: 'TECHNICIAN',
    allowedRoles: ['SUPER_ADMIN', 'TECHNICIAN'],
    pathname: '/technician',
  });
  assert(techToTech.allow, 'TECHNICIAN is permitted on /technician route');
}

// 4. SUPER_ADMIN boundaries
{
  for (const [pathname, allowedRoles] of [
    ['/floor-plan', ['SUPER_ADMIN']],
    ['/models', ['SUPER_ADMIN']],
    ['/technician', ['SUPER_ADMIN', 'TECHNICIAN']],
    ['/client', ['SUPER_ADMIN', 'CUSTOMER']],
  ] as const) {
    const decision = evaluateRouteAccess({
      isAuthenticated: true,
      role: 'SUPER_ADMIN',
      allowedRoles: [...allowedRoles],
      pathname,
    });
    assert(decision.allow, `SUPER_ADMIN is permitted on ${pathname}`);
  }
}

// 5. Post-login routing guarantees (zero cross-role hijacking)
{
  assert(getDefaultRouteForRole('SUPER_ADMIN') === '/floor-plan', 'Default route for SUPER_ADMIN is /floor-plan');
  assert(getDefaultRouteForRole('TECHNICIAN') === '/technician', 'Default route for TECHNICIAN is /technician');
  assert(getDefaultRouteForRole('CUSTOMER', null) === '/client', 'Default route for CUSTOMER (no house) is /client');
  assert(getDefaultRouteForRole('CUSTOMER', 'h-1') === '/client/h-1', 'Default route for CUSTOMER (with house) is /client/h-1');

  assert(
    resolvePostLoginRoute('SUPER_ADMIN', '/client/h-1') === '/floor-plan',
    'SUPER_ADMIN login is NEVER hijacked by prior /client path'
  );
  assert(
    resolvePostLoginRoute('SUPER_ADMIN', '/technician') === '/floor-plan',
    'SUPER_ADMIN login is NEVER hijacked by prior /technician path'
  );
  assert(
    resolvePostLoginRoute('SUPER_ADMIN', '/models') === '/models',
    'SUPER_ADMIN login honors legitimate prior admin path (/models)'
  );
  assert(
    resolvePostLoginRoute('CUSTOMER', '/floor-plan', null) === '/client',
    'CUSTOMER login always routes strictly to /client'
  );
  assert(
    resolvePostLoginRoute('TECHNICIAN', '/floor-plan') === '/technician',
    'TECHNICIAN login always routes strictly to /technician'
  );
}

console.log('\n===================================================================');
console.log(`📊 FRONTEND ROLE ROUTE GUARD TESTS: ${passed} PASSED, ${failed} FAILED`);
console.log('===================================================================\n');

if (failed > 0) {
  process.exit(1);
}
