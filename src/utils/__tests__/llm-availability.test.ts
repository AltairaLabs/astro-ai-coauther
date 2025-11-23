/**
 * LLM Provider Availability Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isLLMAvailable } from '../llm/provider-factory';
import type { OpenAIConfig } from '../../types';

describe('LLM Provider Availability', () => {
  beforeEach(() => {
    // Clear global state
    (globalThis as any).__ASTRO_COAUTHOR__ = {
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      },
    };
  });

  describe('isLLMAvailable', () => {
    it('should return false when config is undefined', async () => {
      const available = await isLLMAvailable(undefined);
      expect(available).toBe(false);
    });

    it('should return false when API key is missing', async () => {
      const config: OpenAIConfig = {
        type: 'openai',
        apiKey: '',
        model: 'gpt-4',
      };

      const available = await isLLMAvailable(config, '/test/root');
      expect(available).toBe(false);
    });

    it('should return true when API key is present', async () => {
      const config: OpenAIConfig = {
        type: 'openai',
        apiKey: 'sk-test-key-12345',
        model: 'gpt-4',
      };

      const available = await isLLMAvailable(config, '/test/root');
      expect(available).toBe(true);
    });

    it('should return true for long API keys', async () => {
      const config: OpenAIConfig = {
        type: 'openai',
        apiKey: 'sk-svcacct-' + 'x'.repeat(150),
        model: 'gpt-4',
      };

      const available = await isLLMAvailable(config, '/test/root');
      expect(available).toBe(true);
    });

    it('should handle provider creation errors gracefully', async () => {
      const config: any = {
        type: 'invalid-provider',
        apiKey: 'test-key',
      };

      const available = await isLLMAvailable(config, '/test/root');
      expect(available).toBe(false);
    });
  });
});
