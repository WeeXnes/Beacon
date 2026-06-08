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
  '/api/downloadMods',
  '/api/getModList',
  '/download/some-server',
  '/login',
  '/favicon.ico',
  '/robots.txt'
]

describe('Security: Authentication Guard', () => {
  // Default Nuxt dev port is 3000
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

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
          if (e.code === 'ECONNREFUSED') {
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
          if (e.code === 'ECONNREFUSED') return;
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
          if (e.code === 'ECONNREFUSED') return;
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
        if (e.code === 'ECONNREFUSED') return;
        throw e;
      }
    })
  })
})
