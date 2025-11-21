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
 * Logger wrapper that provides component-scoped logging
 */
export class Logger {
  private readonly logger: winston.Logger;

  constructor(config?: LoggingConfig) {
    const logConfig = config || {
      level: 'info',
      prefix: 'ai-coauthor',
    };
    this.logger = createWinstonLogger(logConfig);
  }

  error(component: string, message: string, ...meta: any[]): void {
    this.logger.error(message, { component, ...meta });
  }

  warn(component: string, message: string, ...meta: any[]): void {
    this.logger.warn(message, { component, ...meta });
  }

  info(component: string, message: string, ...meta: any[]): void {
    this.logger.info(message, { component, ...meta });
  }

  debug(component: string, message: string, ...meta: any[]): void {
    this.logger.debug(message, { component, ...meta });
  }

  // Convenience methods
  success(component: string, message: string, ...meta: any[]): void {
    this.logger.info(`✓ ${message}`, { component, ...meta });
  }

  start(component: string, message: string, ...meta: any[]): void {
    this.logger.info(`▶ ${message}`, { component, ...meta });
  }

  step(component: string, message: string, ...meta: any[]): void {
    this.logger.info(`→ ${message}`, { component, ...meta });
  }
}

/**
 * Get logger instance with current global config
 */
export function getLogger(): Logger {
  const config = (globalThis as any).__ASTRO_COAUTHOR__?.logging || {
    level: 'info',
    prefix: 'ai-coauthor',
  };
  
  // Always create a fresh logger with current config
  // (config can change between requests in dev mode)
  return new Logger(config);
}
