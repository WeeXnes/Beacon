import { describe, it, expect } from 'vitest'

/**
 * Security Verification Suite for Beacon
 * This test ensures that the "Deny-by-Default" policy in server/middleware/auth.ts
 * is working correctly for all management endpoints.
 */

// All endpoints that REQUIRE authentication
const protectedEndpoints = [
  // Server Management
  '/api/getServers',
  '/api/addServer',
  '/api/deleteServer',
  '/api/startServer',
  '/api/stopServer',
  '/api/sendCommand',
  '/api/getServerStats',
  '/api/getSystemStats',
  
  // Backup & Files
  '/api/getBackups',
  '/api/createBackup',
  '/api/deleteBackup',
  '/api/restoreBackup',
  '/api/listFiles',
  '/api/readFile',
  '/api/writeFile',
  '/api/deleteFile',
  
  // Configuration
  '/api/getProperties',
  '/api/setProperties',
  '/api/setServers',
  '/api/getVersions',
  '/api/installVersion',
  '/api/installContent',
  '/api/searchContent',
  
  // System Settings
  '/api/getJavaVersions',
  '/api/setJavaVersions',
  '/api/setPassword',
  '/api/discoverJavaVersions',
  
  // Velocity Proxy
  '/api/getProxyMapping',
  '/api/setProxyMapping',

  // System status
  '/api/status'
]

// All endpoints that are EXPLICITLY PUBLIC
const publicEndpoints = [
  '/api/login',
  '/api/onboardingStatus',
  '/api/setup',
  '/api/downloadMods',
  '/api/getModList',
  '/download/some-server',
  '/login',
  '/setup',
  '/favicon.ico',
  '/robots.txt'
]

describe('Security: Authentication Guard', () => {
  // Default Nuxt dev port is 3000
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

  const isConnectionError = (e: any): boolean => {
    return e.code === 'ECONNREFUSED' || 
           e.cause?.code === 'ECONNREFUSED' || 
           e.message?.includes('fetch failed') || 
           e.message?.includes('ECONNREFUSED');
  }

  describe('Protected Endpoints (Must return 401)', () => {
    protectedEndpoints.forEach((endpoint) => {
      it(`blocks unauthorized access to ${endpoint}`, async () => {
        try {
          const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: endpoint.includes('set') || endpoint.includes('start') || endpoint.includes('stop') || endpoint.includes('add') || endpoint.includes('delete') || endpoint.includes('Command') || endpoint.includes('write') || endpoint.includes('restore') || endpoint.includes('create') ? 'POST' : 'GET',
            headers: { 'Accept': 'application/json' }
          })
          
          // Should be 401 (Unauthorized)
          expect(response.status).toBe(401)
        } catch (e: any) {
          // If server is not running, we skip but log a warning
          if (isConnectionError(e)) {
            console.warn(`Test server not reachable at ${BASE_URL}. Start the server to run integration tests.`);
            return;
          }
          throw e;
        }
      })

      it(`rejects invalid tokens for ${endpoint}`, async () => {
        try {
          const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: endpoint.includes('set') || endpoint.includes('start') || endpoint.includes('stop') || endpoint.includes('add') || endpoint.includes('delete') || endpoint.includes('Command') || endpoint.includes('write') || endpoint.includes('restore') || endpoint.includes('create') ? 'POST' : 'GET',
            headers: { 
              'Accept': 'application/json',
              'Authorization': 'Bearer invalid.jwt.token' 
            }
          })
          expect(response.status).toBe(401)
        } catch (e: any) {
          if (isConnectionError(e)) return;
          throw e;
        }
      })
    })
  })

  describe('Public Endpoints (Must be accessible)', () => {
    publicEndpoints.forEach((endpoint) => {
      it(`allows public access to ${endpoint}`, async () => {
        try {
          const response = await fetch(`${BASE_URL}${endpoint}`)
          // We don't check for 200 because some might return 404 or 405 (wrong method),
          // but they MUST NOT return 401
          expect(response.status).not.toBe(401)
        } catch (e: any) {
          if (isConnectionError(e)) return;
          throw e;
        }
      })
    })
  })

  describe('Deny-by-Default Policy', () => {
    it('blocks a completely random/unknown API path', async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/some/hidden/admin/path`, {
          headers: { 'Accept': 'application/json' }
        })
        expect(response.status).toBe(401)
      } catch (e: any) {
        if (isConnectionError(e)) return;
        throw e;
      }
    })
  })

  describe('Onboarding Endpoints Integration', () => {
    it('returns onboarding status info', async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/onboardingStatus`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('onboarded');
        expect(typeof data.onboarded).toBe('boolean');
      } catch (e: any) {
        if (isConnectionError(e)) return;
        throw e;
      }
    });

    it('rejects GET requests on setup endpoint with 405', async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/setup`, { method: 'GET' });
        expect(response.status).toBe(405);
      } catch (e: any) {
        if (isConnectionError(e)) return;
        throw e;
      }
    });

    it('returns 403 or 400 for POST /api/setup based on state', async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/setup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'short' })
        });
        // If already onboarded, it returns 403 Forbidden.
        // If not onboarded, it returns 400 Bad Request because the password is too short.
        expect([400, 403]).toContain(response.status);
      } catch (e: any) {
        if (isConnectionError(e)) return;
        throw e;
      }
    });
  });
})
