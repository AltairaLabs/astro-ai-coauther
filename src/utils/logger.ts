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
      const sanitizedMessage = this.sanitizeString(message);
      const fullMessage = meta.length > 0 
        ? `[${component}] ${sanitizedMessage} ${meta.map(m => m instanceof Error ? this.sanitizeString(m.message) : this.sanitize(m)).join(' ')}`
        : `[${component}] ${sanitizedMessage}`;
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
    if (typeof data === 'string') {
      // Sanitize string data that might contain sensitive information
      return this.sanitizeString(data);
    }
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

  private sanitizeString(str: string): string {
    // Redact potential API keys and tokens in strings
    return str
      .replaceAll(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED-API-KEY]')
      .replaceAll(/api[_-]?key["']?\s*[:=]\s*["']?[a-zA-Z0-9]{20,}/gi, 'apiKey: [REDACTED]')
      .replaceAll(/token["']?\s*[:=]\s*["']?[a-zA-Z0-9]{20,}/gi, 'token: [REDACTED]')
      .replaceAll(/password["']?\s*[:=]\s*["']?[^\s"',}]{6,}/gi, 'password: [REDACTED]');
  }

  warn(component: string, message: string, ...meta: any[]): void {
    const astroLogger = getAstroLogger();
    if (astroLogger) {
      const sanitizedMessage = this.sanitizeString(message);
      const fullMessage = meta.length > 0 
        ? `[${component}] ${sanitizedMessage} ${meta.map(m => this.sanitize(m)).join(' ')}`
        : `[${component}] ${sanitizedMessage}`;
      astroLogger.warn(fullMessage);
    } else {
      console.warn(`[ai-coauthor:${component}]`, message, ...meta);
    }
  }

  info(component: string, message: string, ...meta: any[]): void {
    const astroLogger = getAstroLogger();
    if (astroLogger) {
      const sanitizedMessage = this.sanitizeString(message);
      const fullMessage = meta.length > 0 
        ? `[${component}] ${sanitizedMessage} ${meta.map(m => this.sanitize(m)).join(' ')}`
        : `[${component}] ${sanitizedMessage}`;
      astroLogger.info(fullMessage);
    } else {
      console.log(`[ai-coauthor:${component}]`, message, ...meta);
    }
  }

  debug(component: string, message: string, ...meta: any[]): void {
    const astroLogger = getAstroLogger();
    if (astroLogger) {
      const sanitizedMessage = this.sanitizeString(message);
      const fullMessage = meta.length > 0 
        ? `[${component}] ${sanitizedMessage} ${meta.map(m => this.sanitize(m)).join(' ')}`
        : `[${component}] ${sanitizedMessage}`;
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
  return globalThis.__ASTRO_COAUTHOR__?.logger;
}
