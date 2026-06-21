import { describe, it, expect } from 'vitest';
import * as path from 'path';

// logic test for path traversal validation
const checkSafePath = (baseDir: string, targetPath: string): boolean => {
  const relativePath = path.relative(baseDir, targetPath);
  return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
};

// logic test for server name validation
const isValidServerName = (name: string): boolean => {
  return /^[a-zA-Z0-9_-]+$/.test(name);
};

// logic test for password strength
const isValidPassword = (password: string): boolean => {
  return !!(password && password.length >= 8);
};

// logic test for proxy mapping validation
const isValidProxyConfig = (baseDomain: string, subdomain: string, address: string): boolean => {
  const isBaseDomainValid = !baseDomain || /^[a-zA-Z0-9.-]+$/.test(baseDomain);
  const isSubdomainValid = /^[a-zA-Z0-9_-]+$/.test(subdomain) || subdomain === '@';
  const isAddressValid = /^[a-zA-Z0-9.-]+:\d+$/.test(address);
  return isBaseDomainValid && isSubdomainValid && isAddressValid;
};

// logic test for safe Java binary path (RCE prevention)
const isSafeJavaPath = (javaPath: string, dataDir: string, serversDir: string, backupsDir: string): boolean => {
  if (!path.isAbsolute(javaPath)) return false;
  
  const pathsToCheck = [dataDir, serversDir, backupsDir];
  for (const p of pathsToCheck) {
      const resolved = path.resolve(p);
      const rel = path.relative(resolved, javaPath);
      if (!rel.startsWith('..') && !path.isAbsolute(rel)) {
          return false; // Path is inside user-writable directory
      }
  }
  return true;
};



describe('Security Hardening Logic Tests', () => {

  describe('Path Traversal Prevention', () => {
    const baseDir = '/home/user/.mcservermanager/servers/my-server';

    it('blocks classic directory traversal (../)', () => {
      const target = path.resolve(baseDir, '../../another-directory/secret.txt');
      expect(checkSafePath(baseDir, target)).toBe(false);
    });

    it('blocks absolute paths outside directory', () => {
      const target = '/etc/passwd';
      expect(checkSafePath(baseDir, target)).toBe(false);
    });

    it('blocks directory prefix-matching traversal vulnerability', () => {
      // Base: /home/user/.../my-server
      // Target: /home/user/.../my-server-other
      // Prefix startsWith check fails here because my-server-other starts with my-server.
      // But path.relative correctly identifies it as outside.
      const target = '/home/user/.mcservermanager/servers/my-server-other';
      expect(checkSafePath(baseDir, target)).toBe(false);
    });

    it('allows nested safe files and directories', () => {
      const target = path.resolve(baseDir, 'logs/latest.log');
      expect(checkSafePath(baseDir, target)).toBe(true);
      
      const target2 = path.resolve(baseDir, 'world/region/r.0.0.mca');
      expect(checkSafePath(baseDir, target2)).toBe(true);
    });
  });

  describe('Server Name Sanitization', () => {
    it('accepts clean alphanumeric, dash, and underscore names', () => {
      expect(isValidServerName('survival-1')).toBe(true);
      expect(isValidServerName('lobby_server')).toBe(true);
      expect(isValidServerName('Vanilla120')).toBe(true);
    });

    it('rejects names with spaces, directory traversal, or shell metacharacters', () => {
      expect(isValidServerName('my server')).toBe(false);
      expect(isValidServerName('../../etc')).toBe(false);
      expect(isValidServerName('server;rm -rf /')).toBe(false);
      expect(isValidServerName('lobby&disown')).toBe(false);
      expect(isValidServerName('server.jar')).toBe(false); // No dots allowed
    });
  });

  describe('Access Key Strengths', () => {
    it('allows passwords at or above 8 characters', () => {
      expect(isValidPassword('strongPassword123')).toBe(true);
      expect(isValidPassword('12345678')).toBe(true);
    });

    it('rejects passwords below 8 characters or empty passwords', () => {
      expect(isValidPassword('weak')).toBe(false);
      expect(isValidPassword('')).toBe(false);
    });
  });

  describe('Proxy Configuration Security', () => {
    it('validates correct proxy mapping parameters', () => {
      expect(isValidProxyConfig('weexnes.dev', 'lobby', '127.0.0.1:25565')).toBe(true);
      expect(isValidProxyConfig('example.com', '@', 'localhost:25566')).toBe(true);
    });

    it('rejects injection or invalid characters in proxy configurations', () => {
      // TOML break injection attempt in subdomain
      expect(isValidProxyConfig('example.com', 'lobby\n[hack]', '127.0.0.1:25565')).toBe(false);
      // Malformed port or host injection
      expect(isValidProxyConfig('example.com', 'lobby', '127.0.0.1:25565\nport=80')).toBe(false);
      // Malformed base domain
      expect(isValidProxyConfig('example.com;inject', 'lobby', '127.0.0.1:25565')).toBe(false);
    });
  });

  describe('Java Path RCE Prevention', () => {
    const dataDir = '/home/user/.mcservermanager';
    const serversDir = '/home/user/.mcservermanager/servers';
    const backupsDir = '/home/user/.mcservermanager/backups';

    it('allows system binaries', () => {
      expect(isSafeJavaPath('/usr/bin/java', dataDir, serversDir, backupsDir)).toBe(true);
      expect(isSafeJavaPath('/opt/java/bin/java', dataDir, serversDir, backupsDir)).toBe(true);
    });

    it('blocks relative paths', () => {
      expect(isSafeJavaPath('java', dataDir, serversDir, backupsDir)).toBe(false);
      expect(isSafeJavaPath('./bin/java', dataDir, serversDir, backupsDir)).toBe(false);
    });

    it('blocks binaries residing inside server writable directories', () => {
      // Attempting to upload a script to server and execute it as java
      const exploitPath = '/home/user/.mcservermanager/servers/survival/malicious.sh';
      expect(isSafeJavaPath(exploitPath, dataDir, serversDir, backupsDir)).toBe(false);
    });
  });


});
