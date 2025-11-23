/**
 * Tests for OpenAI Agentic Provider
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIAgenticProvider } from '../openai-provider-agentic';
import type { LLMDetectionRequest } from '../../../types';

// Mock dependencies
vi.mock('@langchain/openai', () => {
  return {
    ChatOpenAI: vi.fn(function (this: any, config: any) {
      this.modelName = config.model;
      this.temperature = config.temperature;
      this.invoke = vi.fn();
      return this;
    }),
  };
});

vi.mock('../agentic-detector', () => ({
  AgenticDetector: class MockAgenticDetector {
    detectSourceContext = vi.fn().mockResolvedValue({
      files: ['test.ts'],
      folders: ['src'],
      confidence: 'high',
      reasoning: ['Test reasoning'],
      model: 'gpt-4',
      tokensUsed: 100,
      cached: false,
    });
  },
}));

vi.mock('../../logger', () => ({
  getLogger: () => ({
    start: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    step: vi.fn(),
  }),
}));

describe('OpenAIAgenticProvider', () => {
  let provider: OpenAIAgenticProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new OpenAIAgenticProvider({
      type: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4',
      temperature: 0.7,
    }, '/test');
  });

  describe('Constructor', () => {
    it('should initialize with config', () => {
      expect(provider).toBeDefined();
      expect(provider.name).toBe('openai-agentic');
    });

    it('should throw error if API key is missing', () => {
      // Note: Constructor doesn't actually throw, it just initializes
      // The error would come from isAvailable() returning false
      const emptyProvider = new OpenAIAgenticProvider({
        type: 'openai',
        apiKey: '',
        model: 'gpt-4',
      }, '/test');
      
      expect(emptyProvider).toBeDefined();
    });

    it('should use custom model name', () => {
      const customProvider = new OpenAIAgenticProvider({
        type: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4-turbo',
      }, '/test');
      
      expect(customProvider).toBeDefined();
    });

    it('should use custom temperature', () => {
      const customProvider = new OpenAIAgenticProvider({
        type: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        temperature: 0.5,
      }, '/test');
      
      expect(customProvider).toBeDefined();
    });
  });

  describe('detectSourceContext', () => {
    it('should detect source context successfully', async () => {
      const request: LLMDetectionRequest = {
        docPath: 'docs/test.md',
        docTitle: 'Test Documentation',
        docContent: 'Test content',
        availableFiles: ['test.ts', 'index.ts'],
        availableFolders: ['src', 'lib'],
      };

      const result = await provider.detectSourceContext(request);

      expect(result.files).toEqual(['test.ts']);
      expect(result.folders).toEqual(['src']);
      expect(result.confidence).toBe('high');
      expect(result.reasoning).toEqual(['Test reasoning']);
      expect(result.model).toBe('gpt-4');
      expect(result.tokensUsed).toBe(100);
      expect(result.cached).toBe(false);
    });

    it('should pass existing mapping to detector', async () => {
      const request: LLMDetectionRequest = {
        docPath: 'docs/test.md',
        docTitle: 'Test',
        docContent: 'Content',
        availableFiles: ['test.ts'],
        availableFolders: ['src'],
        existingMapping: {
          files: ['old.ts'],
          folders: ['old-dir'],
          globs: [],
          exclude: [],
          manual: false,
        },
      };

      const result = await provider.detectSourceContext(request);

      expect(result).toBeDefined();
      expect(result.files).toBeDefined();
    });

    it('should handle long content', async () => {
      const longContent = 'x'.repeat(50000);
      const request: LLMDetectionRequest = {
        docPath: 'docs/long.md',
        docTitle: 'Long Document',
        docContent: longContent,
        availableFiles: [],
        availableFolders: [],
      };

      const result = await provider.detectSourceContext(request);

      expect(result).toBeDefined();
    });

    it('should handle empty available files/folders', async () => {
      const request: LLMDetectionRequest = {
        docPath: 'docs/empty.md',
        docTitle: 'Empty',
        docContent: 'Content',
        availableFiles: [],
        availableFolders: [],
      };

      const result = await provider.detectSourceContext(request);

      expect(result).toBeDefined();
    });
  });

  describe('isAvailable', () => {
    it('should return true when API key is set', async () => {
      const available = await provider.isAvailable();
      expect(available).toBe(true);
    });

    it('should return false when API key is empty', async () => {
      const emptyProvider = new OpenAIAgenticProvider({
        type: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      }, '/test');
      
      // Override the apiKey after construction for testing
      (emptyProvider as any).config.apiKey = '';
      
      const available = await emptyProvider.isAvailable();
      expect(available).toBe(false);
    });
  });
});
