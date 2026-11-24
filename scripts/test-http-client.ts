/**
 * PHASE 1 FRONTEND SHARED HTTP CLIENT BEHAVIORAL TEST SUITE
 *
 * Tests `frontend/src/services/http-client.ts` under mocked browser globals (localStorage, fetch, FormData):
 * 1. Private requests automatically inject `Authorization: Bearer <token>`
 * 2. Public requests (`skipAuth: true`) omit Authorization header & ignore 401 session clearing
 * 3. HTTP 401 on private requests clears storage and invokes `onUnauthorized` ONCE (anti-loop guard)
 * 4. HTTP 403 on private requests invokes `onForbidden` and PRESERVES stored token
 * 5. Network failures (`TypeError: Failed to fetch`) PRESERVE stored token
 * 6. FormData multipart requests keep Authorization header and DO NOT force `Content-Type: application/json`
 */

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

// Setup minimal browser-like localStorage mock BEFORE importing http-client
const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => {
    store.set(k, String(v));
  },
  removeItem: (k: string) => {
    store.delete(k);
  },
  clear: () => store.clear(),
};

const { httpClient, tokenStorage, HttpError } = await import(
  '../src/services/http-client.ts'
);

async function runFrontendTransportTests() {
  console.log('===================================================================');
  console.log('🌐 PHASE 1: FRONTEND SHARED AUTHENTICATED HTTP CLIENT TESTS');
  console.log('===================================================================\n');

  const originalFetch = globalThis.fetch;

  try {
    // 1. Bearer header injection on private requests
    {
      tokenStorage.setToken('test-jwt-token-123');
      let capturedHeaders: Record<string, string> = {};
      (globalThis as any).fetch = async (_url: string, init: any) => {
        capturedHeaders = init?.headers || {};
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { ok: true } }),
        };
      };

      const data = await httpClient.get('/houses');
      assert(data?.ok === true, 'httpClient.get unwraps standard ApiResponse data');
      assert(
        capturedHeaders['Authorization'] === 'Bearer test-jwt-token-123',
        'Private request automatically attaches Authorization: Bearer <token>'
      );
      assert(
        capturedHeaders['Content-Type'] === 'application/json',
        'JSON request sets Content-Type: application/json'
      );
    }

    // 2. Public request (skipAuth: true) omits Authorization & does not wipe token on 401
    {
      tokenStorage.setToken('keep-me-on-public-401');
      let unauthCalled = 0;
      httpClient.setOnUnauthorized(() => unauthCalled++);

      let capturedHeaders: Record<string, string> = {};
      (globalThis as any).fetch = async (_url: string, init: any) => {
        capturedHeaders = init?.headers || {};
        return {
          ok: false,
          status: 401,
          json: async () => ({ success: false, message: 'Invalid login' }),
        };
      };

      let threw401 = false;
      try {
        await httpClient.post('/auth/login', { username: 'a', password: 'b' }, 'Login failed', {
          skipAuth: true,
        });
      } catch (err) {
        threw401 = err instanceof HttpError && err.status === 401;
      }

      assert(!('Authorization' in capturedHeaders), 'Public request (skipAuth: true) omits Authorization header');
      assert(threw401, 'Failed public login throws typed HttpError(401)');
      assert(unauthCalled === 0, '401 on public login does NOT trigger global onUnauthorized redirect');
      assert(
        tokenStorage.getToken() === 'keep-me-on-public-401',
        '401 on skipAuth request does NOT wipe unrelated storage'
      );
    }

    // 3. FormData multipart omits Content-Type while preserving Bearer token
    {
      tokenStorage.setToken('upload-token-xyz');
      let capturedHeaders: Record<string, string> = {};
      (globalThis as any).fetch = async (_url: string, init: any) => {
        capturedHeaders = init?.headers || {};
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { uploaded: true } }),
        };
      };

      const fd = new FormData();
      fd.append('image', new Blob(['fake'], { type: 'image/png' }), 'plan.png');
      const res = await httpClient.post('/floor-plans/123/background', fd);
      assert(res?.uploaded === true, 'FormData multipart upload succeeds');
      assert(
        capturedHeaders['Authorization'] === 'Bearer upload-token-xyz',
        'FormData upload attaches Authorization: Bearer token'
      );
      assert(
        !('Content-Type' in capturedHeaders),
        'FormData upload omits manual Content-Type so browser sets multipart boundary'
      );
    }

    // 4. HTTP 403 Forbidden preserves token and invokes onForbidden
    {
      tokenStorage.setToken('valid-resident-token');
      let forbiddenMsg = '';
      httpClient.setOnForbidden((m) => (forbiddenMsg = m));
      (globalThis as any).fetch = async () => ({
        ok: false,
        status: 403,
        json: async () => ({ success: false, message: 'Akses dilarang untuk peran ini' }),
      });

      let status = 0;
      try {
        await httpClient.get('/admin-only');
      } catch (err) {
        if (err instanceof HttpError) status = err.status;
      }

      assert(status === 403, 'HTTP 403 throws typed HttpError(403)');
      assert(forbiddenMsg.includes('dilarang'), 'HTTP 403 invokes onForbidden callback');
      assert(
        tokenStorage.getToken() === 'valid-resident-token',
        'HTTP 403 NEVER clears stored authentication token'
      );
    }

    // 5. Network failure preserves token
    {
      tokenStorage.setToken('stable-token-network-test');
      let unauthCalled = 0;
      httpClient.setOnUnauthorized(() => unauthCalled++);
      (globalThis as any).fetch = async () => {
        throw new TypeError('Failed to fetch');
      };

      let threwNetwork = false;
      try {
        await httpClient.get('/dashboard/overview');
      } catch (err) {
        threwNetwork = err instanceof TypeError;
      }

      assert(threwNetwork, 'Network failure propagates error cleanly');
      assert(unauthCalled === 0, 'Network failure does NOT invoke onUnauthorized');
      assert(
        tokenStorage.getToken() === 'stable-token-network-test',
        'Network failure NEVER clears stored authentication token'
      );
    }

    // 6. Concurrent HTTP 401 triggers onUnauthorized ONCE (anti-infinite-loop guard)
    {
      httpClient.resetUnauthorizedGuard();
      tokenStorage.setToken('expired-token-999');
      let unauthCount = 0;
      httpClient.setOnUnauthorized(() => unauthCount++);
      (globalThis as any).fetch = async () => ({
        ok: false,
        status: 401,
        json: async () => ({ success: false, message: 'Token expired' }),
      });

      await Promise.allSettled([
        httpClient.get('/dashboard/overview'),
        httpClient.get('/dashboard/floors'),
        httpClient.get('/dashboard/devices'),
      ]);

      assert(unauthCount === 1, `Concurrent 401s invoke onUnauthorized exactly once (got ${unauthCount})`);
      assert(tokenStorage.getToken() === null, 'HTTP 401 on private request clears stored token');
    }
  } finally {
    globalThis.fetch = originalFetch;
    httpClient.setOnUnauthorized(null);
    httpClient.setOnForbidden(null);
  }

  console.log('\n===================================================================');
  console.log(`📊 FRONTEND TRANSPORT TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFrontendTransportTests().catch((err) => {
  console.error('Unhandled frontend transport test error:', err);
  process.exit(1);
});
