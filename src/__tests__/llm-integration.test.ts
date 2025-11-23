/**
 * Tests for LLM-powered source context detection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LLMCache } from '../utils/llm/cache';
import type { LLMDetectionRequest, LLMDetectionResponse } from '../types';

describe('LLM Cache', () => {
  let cache: LLMCache;

  beforeEach(() => {
    cache = new LLMCache(3600); // 1 hour TTL
  });

  it('should cache and retrieve results', () => {
    const request: LLMDetectionRequest = {
      docPath: 'docs/test.md',
      docContent: 'Test content',
      docTitle: 'Test Doc',
      availableFiles: ['src/test.ts'],
      availableFolders: ['src'],
    };

    const response: LLMDetectionResponse = {
      files: ['src/test.ts'],
      folders: ['src'],
      confidence: 'high',
      reasoning: ['Test reasoning'],
      model: 'gpt-4',
    };

    cache.set(request, response);
    const cached = cache.get(request);

    expect(cached).toBeDefined();
    expect(cached?.files).toEqual(['src/test.ts']);
    expect(cached?.cached).toBe(true);
  });

  it('should return null for non-existent cache entry', () => {
    const request: LLMDetectionRequest = {
      docPath: 'docs/other.md',
      docContent: 'Other content',
      docTitle: 'Other Doc',
      availableFiles: [],
      availableFolders: [],
    };

    const cached = cache.get(request);
    expect(cached).toBeNull();
  });

  it('should respect TTL and expire entries', async () => {
    const shortTTL = new LLMCache(1); // 1 second TTL
    
    const request: LLMDetectionRequest = {
      docPath: 'docs/test.md',
      docContent: 'Test content',
      docTitle: 'Test Doc',
      availableFiles: ['src/test.ts'],
      availableFolders: ['src'],
    };

    const response: LLMDetectionResponse = {
      files: ['src/test.ts'],
      folders: ['src'],
      confidence: 'high',
      reasoning: ['Test reasoning'],
      model: 'gpt-4',
    };

    shortTTL.set(request, response);
    
    // Should be cached immediately
    let cached = shortTTL.get(request);
    expect(cached).toBeDefined();

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Should be expired
    cached = shortTTL.get(request);
    expect(cached).toBeNull();
  });

  it('should clear all cache entries', () => {
    const request1: LLMDetectionRequest = {
      docPath: 'docs/test1.md',
      docContent: 'Test content 1',
      docTitle: 'Test Doc 1',
      availableFiles: [],
      availableFolders: [],
    };

    const request2: LLMDetectionRequest = {
      docPath: 'docs/test2.md',
      docContent: 'Test content 2',
      docTitle: 'Test Doc 2',
      availableFiles: [],
      availableFolders: [],
    };

    const response: LLMDetectionResponse = {
      files: [],
      folders: [],
      confidence: 'low',
      reasoning: [],
      model: 'gpt-4',
    };

    cache.set(request1, response);
    cache.set(request2, response);
    expect(cache.size()).toBe(2);

    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it('should cleanup expired entries', async () => {
    const shortTTL = new LLMCache(1);
    
    const request: LLMDetectionRequest = {
      docPath: 'docs/test.md',
      docContent: 'Test content',
      docTitle: 'Test Doc',
      availableFiles: [],
      availableFolders: [],
    };

    const response: LLMDetectionResponse = {
      files: [],
      folders: [],
      confidence: 'low',
      reasoning: [],
      model: 'gpt-4',
    };

    shortTTL.set(request, response);
    expect(shortTTL.size()).toBe(1);

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1100));

    const removed = shortTTL.cleanup();
    expect(removed).toBe(1);
    expect(shortTTL.size()).toBe(0);
  });
});
