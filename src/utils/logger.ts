/**
 * Configurable Logger for AI Coauthor using Winston
 * Respects logging level from integration config
 */

import winston from 'winston';
import type { LoggingConfig } from '../global';

// Map our log levels to winston levels
const LOG_LEVEL_MAP: Record<string, string> = {
  none: 'silent',
  error: 'error',
  warn: 'warn',
  info: 'info',
  debug: 'debug',
};

/**
 * Create Winston logger with custom format
 */
function createWinstonLogger(config: LoggingConfig): winston.Logger {
  const prefix = config.prefix || 'ai-coauthor';
  const level = LOG_LEVEL_MAP[config.level] || 'info';

  return winston.createLogger({
    level,
    silent: config.level === 'none',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ level, message, timestamp, component }) => {
        const comp = component ? `:${component}` : '';
        return `[${timestamp}] [${prefix}${comp}] ${level.toUpperCase()}: ${message}`;
      })
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, component }) => {
            const comp = component ? `:${component}` : '';
            let emoji = '';
            if (level.includes('error')) {
              emoji = '✗';
            } else if (level.includes('warn')) {
              emoji = '⚠';
            } else if (level.includes('info')) {
              emoji = '→';
            }
            return `[${prefix}${comp}] ${emoji} ${message}`;
          })
        ),
      }),
    ],
  });
}

/**
 * Logger wrapper that uses Astro's logger when available
 * Falls back to simple console logging otherwise
 */
export class Logger {

  error(component: string, message: string, ...meta: any[]): void {
    const astroLogger = getAstroLogger();
    if (astroLogger) {
      // Include meta in the message if present
      const fullMessage = meta.length > 0 
        ? `[${component}] ${message} ${meta.map(m => m instanceof Error ? m.message : JSON.stringify(m)).join(' ')}`
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

  warn(component: string, message: string, ...meta: any[]): void {
    const astroLogger = getAstroLogger();
    if (astroLogger) {
      astroLogger.warn(`[${component}] ${message}`);
    } else {
      console.warn(`[ai-coauthor:${component}]`, message, ...meta);
    }
  }

  info(component: string, message: string, ...meta: any[]): void {
    const astroLogger = getAstroLogger();
    if (astroLogger) {
      astroLogger.info(`[${component}] ${message}`);
    } else {
      console.log(`[ai-coauthor:${component}]`, message, ...meta);
    }
  }

  debug(component: string, message: string, ...meta: any[]): void {
    const astroLogger = getAstroLogger();
    if (astroLogger) {
      // Astro logger might not have debug - use info instead
      if (typeof astroLogger.debug === 'function') {
        astroLogger.debug(`[${component}] ${message}`);
      } else {
        astroLogger.info(`[${component}] 🔍 ${message}`);
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
