/**
 * Tests for LLM Cache
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LLMCache } from '../cache';
import type { LLMDetectionRequest, LLMDetectionResponse } from '../../../types';

describe('LLMCache', () => {
  let cache: LLMCache;
  let mockRequest: LLMDetectionRequest;
  let mockResponse: LLMDetectionResponse;

  beforeEach(() => {
    vi.clearAllMocks();
    cache = new LLMCache(3600); // 1 hour TTL
    
    mockRequest = {
      docPath: 'docs/test.md',
      docTitle: 'Test Doc',
      docContent: 'Test content',
      availableFiles: ['test.ts'],
      availableFolders: ['src'],
    };
    
    mockResponse = {
      files: ['test.ts'],
      folders: ['src'],
      confidence: 'high',
      reasoning: ['Found test file'],
      model: 'gpt-4',
      tokensUsed: 100,
      cached: false,
    };
  });

  describe('Constructor', () => {
    it('should initialize with default TTL', () => {
      const defaultCache = new LLMCache();
      expect(defaultCache).toBeDefined();
    });

    it('should initialize with custom TTL', () => {
      const customCache = new LLMCache(7200);
      expect(customCache).toBeDefined();
    });
  });

  describe('get and set', () => {
    it('should store and retrieve cache entries', () => {
      cache.set(mockRequest, mockResponse);
      const result = cache.get(mockRequest);
      
      expect(result).toBeDefined();
      expect(result?.files).toEqual(['test.ts']);
      expect(result?.cached).toBe(true);
    });

    it('should return null for cache miss', () => {
      const result = cache.get(mockRequest);
      expect(result).toBeNull();
    });

    it('should handle different requests independently', () => {
      cache.set(mockRequest, mockResponse);
      
      const differentRequest: LLMDetectionRequest = {
        ...mockRequest,
        docPath: 'docs/other.md',
      };
      
      const result = cache.get(differentRequest);
      expect(result).toBeNull();
    });

    it('should mark cached responses with cached flag', () => {
      cache.set(mockRequest, mockResponse);
      const result = cache.get(mockRequest);
      
      expect(result?.cached).toBe(true);
    });

    it('should handle requests with existing mapping', () => {
      const requestWithMapping: LLMDetectionRequest = {
        ...mockRequest,
        existingMapping: {
          files: ['old.ts'],
          folders: ['old-dir'],
          globs: [],
          exclude: [],
          manual: false,
        },
      };
      
      cache.set(requestWithMapping, mockResponse);
      const result = cache.get(requestWithMapping);
      
      expect(result).toBeDefined();
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      cache.set(mockRequest, mockResponse);
      expect(cache.get(mockRequest)).toBeDefined();
      
      cache.clear();
      expect(cache.get(mockRequest)).toBeNull();
    });

    it('should allow setting after clear', () => {
      cache.set(mockRequest, mockResponse);
      cache.clear();
      
      cache.set(mockRequest, mockResponse);
      const result = cache.get(mockRequest);
      
      expect(result).toBeDefined();
    });
  });

  describe('has (via get)', () => {
    it('should return value for cached entries', () => {
      cache.set(mockRequest, mockResponse);
      expect(cache.get(mockRequest)).not.toBeNull();
    });

    it('should return null for non-cached entries', () => {
      expect(cache.get(mockRequest)).toBeNull();
    });

    it('should return null after clear', () => {
      cache.set(mockRequest, mockResponse);
      cache.clear();
      expect(cache.get(mockRequest)).toBeNull();
    });
  });

  describe('size', () => {
    it('should return 0 for empty cache', () => {
      expect(cache.size()).toBe(0);
    });

    it('should return correct size after adding entries', () => {
      cache.set(mockRequest, mockResponse);
      expect(cache.size()).toBe(1);
      
      const anotherRequest: LLMDetectionRequest = {
        ...mockRequest,
        docPath: 'docs/another.md',
      };
      cache.set(anotherRequest, mockResponse);
      expect(cache.size()).toBe(2);
    });

    it('should return 0 after clear', () => {
      cache.set(mockRequest, mockResponse);
      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe('TTL expiration', () => {
    it('should not return expired entries', () => {
      const shortTTLCache = new LLMCache(0.001); // 1ms TTL
      shortTTLCache.set(mockRequest, mockResponse);
      
      // Wait for TTL to expire
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const result = shortTTLCache.get(mockRequest);
          expect(result).toBeNull();
          resolve();
        }, 10);
      });
    });

    it('should include expired entries in size before cleanup', () => {
      const shortTTLCache = new LLMCache(0.001);
      shortTTLCache.set(mockRequest, mockResponse);
      
      // Size should still be 1 immediately
      expect(shortTTLCache.size()).toBe(1);
    });
  });

  describe('Cache key generation', () => {
    it('should differentiate based on docPath', () => {
      cache.set(mockRequest, mockResponse);
      
      const modifiedRequest: LLMDetectionRequest = {
        ...mockRequest,
        docPath: 'docs/different.md',
      };
      
      expect(cache.get(modifiedRequest)).toBeNull();
    });

    it('should differentiate based on docContent', () => {
      cache.set(mockRequest, mockResponse);
      
      const modifiedRequest: LLMDetectionRequest = {
        ...mockRequest,
        docContent: 'Different content',
      };
      
      expect(cache.get(modifiedRequest)).toBeNull();
    });

    it('should differentiate based on availableFiles count', () => {
      cache.set(mockRequest, mockResponse);
      
      const modifiedRequest: LLMDetectionRequest = {
        ...mockRequest,
        availableFiles: ['different.ts', 'another.ts'], // Different count
      };
      
      expect(cache.get(modifiedRequest)).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      cache.set(mockRequest, mockResponse);
      
      const stats = cache.getStats();
      
      expect(stats.size).toBe(1);
      expect(stats.entries).toBe(1);
      expect(stats.expired).toBe(0);
    });

    it('should track multiple entries', () => {
      cache.set(mockRequest, mockResponse);
      
      const otherRequest: LLMDetectionRequest = {
        ...mockRequest,
        docPath: 'docs/other.md',
      };
      cache.set(otherRequest, mockResponse);
      
      const stats = cache.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.entries).toBe(2);
      expect(stats.expired).toBe(0);
    });

    it('should count expired entries', () => {
      const shortTTLCache = new LLMCache(0.001); // 1ms TTL
      shortTTLCache.set(mockRequest, mockResponse);
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const stats = shortTTLCache.getStats();
          expect(stats.expired).toBeGreaterThan(0);
          resolve();
        }, 10);
      });
    });
  });
});
