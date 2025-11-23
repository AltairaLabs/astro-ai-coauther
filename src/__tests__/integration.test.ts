import { describe, it, expect, vi } from 'vitest';
import astroAICoauthor from '../index';

describe('Astro AI Coauthor Integration', () => {
  describe('Integration Configuration', () => {
    it('should export default function', () => {
      expect(typeof astroAICoauthor).toBe('function');
    });

    it('should return integration object with correct name', () => {
      const integration = astroAICoauthor();
      expect(integration.name).toBe('astro-ai-coauthor');
    });

    it('should have astro:config:setup hook', () => {
      const integration = astroAICoauthor();
      expect(integration.hooks).toBeDefined();
      expect(integration.hooks['astro:config:setup']).toBeDefined();
      expect(typeof integration.hooks['astro:config:setup']).toBe('function');
    });

    it('should have astro:build:done hook', () => {
      const integration = astroAICoauthor();
      expect(integration.hooks).toBeDefined();
      expect(integration.hooks['astro:build:done']).toBeDefined();
      expect(typeof integration.hooks['astro:build:done']).toBe('function');
    });
  });

  describe('Options Handling', () => {
    it('should use default options when none provided', () => {
      const integration = astroAICoauthor();
      expect(integration).toBeDefined();
    });

    it('should accept custom enableFeedbackWidget option', () => {
      const integration = astroAICoauthor({ enableFeedbackWidget: false });
      expect(integration).toBeDefined();
    });

    it('should accept custom storage option', () => {
      const mockStorage = {
        save: vi.fn(),
        loadAll: vi.fn(),
      };
      const integration = astroAICoauthor({ 
        storage: mockStorage
      });
      expect(integration).toBeDefined();
    });

    it('should accept custom enableMetadata option', () => {
      const integration = astroAICoauthor({ enableMetadata: false });
      expect(integration).toBeDefined();
    });

    it('should accept custom enableStaleDetection option', () => {
      const integration = astroAICoauthor({ enableStaleDetection: true });
      expect(integration).toBeDefined();
    });

    it('should accept all options together', () => {
      const mockStorage = {
        save: vi.fn(),
        loadAll: vi.fn(),
      };
      const integration = astroAICoauthor({
        enableFeedbackWidget: false,
        storage: mockStorage,
        enableMetadata: false,
        enableStaleDetection: true,
      });
      expect(integration).toBeDefined();
    });
  });

  describe('Script Injection', () => {
    it('should inject widget script in dev mode when enabled', () => {
      const integration = astroAICoauthor({ enableFeedbackWidget: true });
      const injectScript = vi.fn();
      const injectRoute = vi.fn();
      const updateConfig = vi.fn();
      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      integration.hooks['astro:config:setup']({
        command: 'dev',
        injectScript,
        injectRoute,
        updateConfig,
        logger,
      } as any);

      expect(injectScript).toHaveBeenCalledWith(
        'page',
        expect.stringContaining('feedback-widget.ts')
      );
    });

    it('should not inject widget script in build mode', () => {
      const integration = astroAICoauthor({ enableFeedbackWidget: true });
      const injectScript = vi.fn();
      const injectRoute = vi.fn();
      const updateConfig = vi.fn();
      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      integration.hooks['astro:config:setup']({
        command: 'build',
        injectScript,
        injectRoute,
        updateConfig,
        logger,
      } as any);

      expect(injectScript).not.toHaveBeenCalled();
    });

    it('should not inject widget script when disabled', () => {
      const integration = astroAICoauthor({ enableFeedbackWidget: false });
      const injectScript = vi.fn();
      const injectRoute = vi.fn();
      const updateConfig = vi.fn();
      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      integration.hooks['astro:config:setup']({
        command: 'dev',
        injectScript,
        injectRoute,
        updateConfig,
        logger,
      } as any);

      expect(injectScript).not.toHaveBeenCalled();
    });
  });

  describe('Route Injection', () => {
    it('should inject dashboard route when widget enabled', () => {
      const integration = astroAICoauthor({ enableFeedbackWidget: true });
      const injectScript = vi.fn();
      const injectRoute = vi.fn();
      const updateConfig = vi.fn();
      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      integration.hooks['astro:config:setup']({
        command: 'dev',
        injectScript,
        injectRoute,
        updateConfig,
        logger,
      } as any);

      expect(injectRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          pattern: '/_ai-coauthor/dashboard',
        })
      );
    });

    it('should inject feedback API route when widget enabled', () => {
      const integration = astroAICoauthor({ enableFeedbackWidget: true });
      const injectScript = vi.fn();
      const injectRoute = vi.fn();
      const updateConfig = vi.fn();
      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      integration.hooks['astro:config:setup']({
        command: 'dev',
        injectScript,
        injectRoute,
        updateConfig,
        logger,
      } as any);

      expect(injectRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          pattern: '/_ai-coauthor/feedback',
        })
      );
    });

    it('should not inject routes when widget disabled', () => {
      const integration = astroAICoauthor({ enableFeedbackWidget: false });
      const injectScript = vi.fn();
      const injectRoute = vi.fn();
      const updateConfig = vi.fn();
      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      integration.hooks['astro:config:setup']({
        command: 'dev',
        injectScript,
        injectRoute,
        updateConfig,
        logger,
      } as any);

      expect(injectRoute).not.toHaveBeenCalled();
    });

    it('should not inject routes in build mode', () => {
      const integration = astroAICoauthor({ enableFeedbackWidget: true });
      const injectScript = vi.fn();
      const injectRoute = vi.fn();
      const updateConfig = vi.fn();
      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      integration.hooks['astro:config:setup']({
        command: 'build',
        injectScript,
        injectRoute,
        updateConfig,
        logger,
      } as any);

      expect(injectRoute).not.toHaveBeenCalled();
      expect(updateConfig).not.toHaveBeenCalled();
    });
  });

  describe('Build Hook', () => {
    it('should execute build:done hook without errors', async () => {
      const integration = astroAICoauthor();
      
      await expect(
        integration.hooks['astro:build:done']({} as any)
      ).resolves.not.toThrow();
    });

    it('should handle build:done with all options enabled', async () => {
      const integration = astroAICoauthor({
        enableFeedbackWidget: true,
        enableMetadata: true,
        enableStaleDetection: true,
      });
      
      await expect(
        integration.hooks['astro:build:done']({} as any)
      ).resolves.not.toThrow();
    });
  });
});
