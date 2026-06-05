import { consola } from 'consola';

/**
 * Standardized logging utility for Beacon
 * Pattern: [COMPONENT] [ACTION] [STATUS] MESSAGE
 */

export const logger = {
    info: (comp: string, msg: string) => consola.info(`[${comp.toUpperCase()}] ℹ️ ${msg}`),
    success: (comp: string, msg: string) => consola.success(`[${comp.toUpperCase()}] ✅ ${msg}`),
    warn: (comp: string, msg: string) => consola.warn(`[${comp.toUpperCase()}] ⚠️ ${msg}`),
    error: (comp: string, msg: string, err?: any) => consola.error(`[${comp.toUpperCase()}] ❌ ${msg}`, err ? err : ''),
    start: (comp: string, msg: string) => consola.start(`[${comp.toUpperCase()}] 🚀 ${msg}`),
    debug: (comp: string, msg: string) => consola.debug(`[${comp.toUpperCase()}] 🛠️ ${msg}`)
};
