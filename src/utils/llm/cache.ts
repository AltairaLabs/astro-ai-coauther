/**
 * LLM Result Cache
 * Simple in-memory cache for LLM detection results to reduce API costs
 */

import type { LLMCacheEntry, LLMDetectionRequest, LLMDetectionResponse } from '../../types';

/**
 * Simple in-memory cache for LLM results
 */
export class LLMCache {
  private readonly cache: Map<string, LLMCacheEntry> = new Map();
  private readonly defaultTTL: number;

  constructor(defaultTTL: number = 3600) {
    this.defaultTTL = defaultTTL; // Default 1 hour
  }

  /**
   * Generate cache key from request
   */
  private getCacheKey(request: LLMDetectionRequest): string {
    // Create a stable key based on request properties
    const keyData = {
      path: request.docPath,
      title: request.docTitle,
      // Use a hash of content to avoid huge keys
      contentHash: this.simpleHash(request.docContent),
      filesCount: request.availableFiles.length,
      foldersCount: request.availableFolders.length,
    };
    return JSON.stringify(keyData);
  }

  /**
   * Simple string hash function
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.codePointAt(i) ?? 0;
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: LLMCacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) > (entry.ttl * 1000);
  }

  /**
   * Get cached result
   */
  get(request: LLMDetectionRequest): LLMDetectionResponse | null {
    const key = this.getCacheKey(request);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    // Mark as cached
    return {
      ...entry.response,
      cached: true,
    };
  }

  /**
   * Set cache entry
   */
  set(
    request: LLMDetectionRequest,
    response: LLMDetectionResponse,
    ttl?: number
  ): void {
    const key = this.getCacheKey(request);
    const entry: LLMCacheEntry = {
      request,
      response,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    this.cache.set(key, entry);
  }

  /**
   * Clear expired entries
   */
  cleanup(): number {
    let removed = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        removed++;
      }
    }
    return removed;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    entries: number;
    expired: number;
  } {
    let expired = 0;
    for (const entry of this.cache.values()) {
      if (this.isExpired(entry)) {
        expired++;
      }
    }

    return {
      size: this.cache.size,
      entries: this.cache.size - expired,
      expired,
    };
  }
}

/**
 * Global cache instance
 */
let globalCache: LLMCache | null = null;

/**
 * Get or create global cache instance
 */
export function getGlobalCache(ttl?: number): LLMCache {
  globalCache ??= new LLMCache(ttl);
  return globalCache;
}

/**
 * Clear global cache
 */
export function clearGlobalCache(): void {
  if (globalCache) {
    globalCache.clear();
  }
}
