/**
 * Logger Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getLogger } from '../logger';

describe('Logger', () => {
  let consoleSpies: any;

  beforeEach(() => {
    // Clear global state
    (globalThis as any).__ASTRO_COAUTHOR__ = {};
    
    // Spy on console methods
    consoleSpies = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    // Restore console methods
    Object.values(consoleSpies).forEach((spy: any) => spy.mockRestore());
  });

  describe('without Astro logger', () => {
    it('should use console.log for info', () => {
      const logger = getLogger();
      logger.info('test-component', 'Test message');
      
      expect(consoleSpies.log).toHaveBeenCalledWith(
        '[ai-coauthor:test-component]',
        'Test message'
      );
    });

    it('should use console.warn for warn', () => {
      const logger = getLogger();
      logger.warn('test-component', 'Warning message');
      
      expect(consoleSpies.warn).toHaveBeenCalledWith(
        '[ai-coauthor:test-component]',
        'Warning message'
      );
    });

    it('should use console.error for error', () => {
      const logger = getLogger();
      logger.error('test-component', 'Error message');
      
      expect(consoleSpies.error).toHaveBeenCalledWith(
        '[ai-coauthor:test-component]',
        'Error message'
      );
    });
  });

  describe('with Astro logger', () => {
    it('should use Astro logger when available', () => {
      const mockAstroLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      (globalThis as any).__ASTRO_COAUTHOR__.logger = mockAstroLogger;

      const logger = getLogger();
      logger.info('test-component', 'Test message');
      logger.warn('test-component', 'Warning message');
      logger.error('test-component', 'Error message');
      logger.debug('test-component', 'Debug message');

      expect(mockAstroLogger.info).toHaveBeenCalledWith('[test-component] Test message');
      expect(mockAstroLogger.warn).toHaveBeenCalledWith('[test-component] Warning message');
      expect(mockAstroLogger.error).toHaveBeenCalledWith('[test-component] Error message');
      expect(mockAstroLogger.debug).toHaveBeenCalledWith('[test-component] Debug message');
    });

    it('should fall back to info for debug if Astro logger lacks debug method', () => {
      const mockAstroLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        // No debug method
      };

      (globalThis as any).__ASTRO_COAUTHOR__.logger = mockAstroLogger;

      const logger = getLogger();
      logger.debug('test-component', 'Debug message');

      expect(mockAstroLogger.info).toHaveBeenCalledWith('🔍 [test-component] Debug message');
    });

    it('should support convenience methods', () => {
      const mockAstroLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      (globalThis as any).__ASTRO_COAUTHOR__.logger = mockAstroLogger;

      const logger = getLogger();
      logger.success('test-component', 'Success');
      logger.start('test-component', 'Starting');
      logger.step('test-component', 'Next step');

      expect(mockAstroLogger.info).toHaveBeenCalledWith('[test-component] ✓ Success');
      expect(mockAstroLogger.info).toHaveBeenCalledWith('[test-component] ▶ Starting');
      expect(mockAstroLogger.info).toHaveBeenCalledWith('[test-component] → Next step');
    });
  });

  describe('singleton behavior', () => {
    it('should return the same logger instance', () => {
      const logger1 = getLogger();
      const logger2 = getLogger();
      
      expect(logger1).toBe(logger2);
    });
  });
});
