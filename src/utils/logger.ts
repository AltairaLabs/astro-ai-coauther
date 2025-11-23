/**
 * Configurable Logger for AI Coauthor
 * Uses Astro's logger when available, falls back to console logging
 */



/**
 * Logger wrapper that uses Astro's logger when available
 * Falls back to simple console logging otherwise
 */
export class Logger {

  error(component: string, message: string, ...meta: any[]): void {
    const astroLogger = getAstroLogger();
    if (astroLogger) {
      // Include meta in the message if present, but sanitize sensitive data
      const fullMessage = meta.length > 0 
        ? `[${component}] ${message} ${meta.map(m => m instanceof Error ? m.message : this.sanitize(m)).join(' ')}`
        : `[${component}] ${message}`;
      astroLogger.error(fullMessage);
      // Also log stack trace for errors
      meta.forEach(m => {
        if (m instanceof Error && m.stack) {
          astroLogger.error(m.stack);
        }
      });
    } else {
      console.error(`[ai-coauthor:${component}]`, message, ...meta);
    }
  }

  private sanitize(data: any): string {
    if (typeof data !== 'object' || data === null) {
      return String(data);
    }
    // Redact sensitive fields
    const sanitized = { ...data };
    const sensitiveKeys = ['apiKey', 'api_key', 'token', 'password', 'secret', 'key'];
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    return JSON.stringify(sanitized);
  }

  warn(component: string, message: string, ...meta: any[]): void {
    const astroLogger = getAstroLogger();
    if (astroLogger) {
      const fullMessage = meta.length > 0 
        ? `[${component}] ${message} ${meta.map(m => this.sanitize(m)).join(' ')}`
        : `[${component}] ${message}`;
      astroLogger.warn(fullMessage);
    } else {
      console.warn(`[ai-coauthor:${component}]`, message, ...meta);
    }
  }

  info(component: string, message: string, ...meta: any[]): void {
    const astroLogger = getAstroLogger();
    if (astroLogger) {
      const fullMessage = meta.length > 0 
        ? `[${component}] ${message} ${meta.map(m => this.sanitize(m)).join(' ')}`
        : `[${component}] ${message}`;
      astroLogger.info(fullMessage);
    } else {
      console.log(`[ai-coauthor:${component}]`, message, ...meta);
    }
  }

  debug(component: string, message: string, ...meta: any[]): void {
    const astroLogger = getAstroLogger();
    if (astroLogger) {
      const fullMessage = meta.length > 0 
        ? `[${component}] ${message} ${meta.map(m => this.sanitize(m)).join(' ')}`
        : `[${component}] ${message}`;
      // Astro logger might not have debug - use info instead
      if (typeof astroLogger.debug === 'function') {
        astroLogger.debug(fullMessage);
      } else {
        astroLogger.info(`🔍 ${fullMessage}`);
      }
    } else if (process.env.NODE_ENV === 'development') {
      // Debug logs only in development
      console.debug(`[ai-coauthor:${component}]`, message, ...meta);
    }
  }

  // Convenience methods
  success(component: string, message: string, ...meta: any[]): void {
    this.info(component, `✓ ${message}`, ...meta);
  }

  start(component: string, message: string, ...meta: any[]): void {
    this.info(component, `▶ ${message}`, ...meta);
  }

  step(component: string, message: string, ...meta: any[]): void {
    this.info(component, `→ ${message}`, ...meta);
  }
}

// Singleton logger instance
let loggerInstance: Logger | null = null;

/**
 * Get logger instance
 * Uses Astro's logger when available, otherwise falls back to Winston
 */
export function getLogger(): Logger {
  loggerInstance ??= new Logger();
  return loggerInstance;
}

/**
 * Get Astro's logger if available
 */
function getAstroLogger(): any {
  return (globalThis as any).__ASTRO_COAUTHOR__?.logger;
}
