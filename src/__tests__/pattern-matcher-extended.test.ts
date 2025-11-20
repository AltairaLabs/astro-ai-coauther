/**
 * Enhanced tests for pattern matcher utility functions
 */

import { describe, it, expect } from 'vitest';
import { ContextMatcher, extractKeywords, matchKeywordsToFiles } from '../utils/pattern-matcher';
import type { MatchRule } from '../types';

describe('Pattern Matcher - Enhanced', () => {
  describe('ContextMatcher', () => {
    it('should create matcher with default rules', () => {
      const matcher = new ContextMatcher();
      expect(matcher).toBeDefined();
    });

    it('should create matcher with custom rules', () => {
      const customRule: MatchRule = {
        docPattern: /custom/i,
        sourcePatterns: ['src/custom.ts'],
        confidence: 0.9,
      };

      const matcher = new ContextMatcher([customRule]);
      expect(matcher).toBeDefined();
    });

    it('should add rule dynamically', () => {
      const matcher = new ContextMatcher();
      const customRule: MatchRule = {
        docPattern: /dynamic/i,
        sourcePatterns: ['src/dynamic.ts'],
        confidence: 0.8,
      };

      matcher.addRule(customRule);
      expect(matcher).toBeDefined();
    });
  });

  describe('extractKeywords', () => {
    it('should extract keywords from title', () => {
      // extractKeywords(content, title)
      const keywords = extractKeywords('', 'Source Context Detection');
      
      expect(keywords).toContain('source');
      expect(keywords).toContain('context');
      expect(keywords).toContain('detection');
    });

    it('should filter out short words', () => {
      const keywords = extractKeywords('', 'The Documentation and Tutorial');
      
      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('and');
      expect(keywords).toContain('documentation');
      expect(keywords).toContain('tutorial');
    });

    it('should extract from headings', () => {
      const content = `
## Storage Adapter
## Configuration Options
`;
      const keywords = extractKeywords(content, '');
      
      expect(keywords).toContain('storage');
      expect(keywords).toContain('adapter');
      expect(keywords).toContain('configuration');
      expect(keywords).toContain('options');
    });

    it('should extract from import statements', () => {
      const content = `
import { FeedbackWidget } from './client/feedback-widget';
import { FileStorageAdapter } from './storage/FileStorageAdapter';
`;
      const keywords = extractKeywords(content, '');
      
      // Import paths are added, not the imported names
      expect(keywords).toContain('./client/feedback-widget');
      expect(keywords).toContain('./storage/FileStorageAdapter');
    });

    it('should not extract external package imports', () => {
      const content = `
import { describe, it, expect } from 'vitest';
import { FileStorageAdapter } from './storage/FileStorageAdapter';
`;
      const keywords = extractKeywords(content, '');
      
      expect(keywords).not.toContain('vitest');
      expect(keywords).toContain('./storage/FileStorageAdapter');
    });

    it('should strip markdown formatting from headings', () => {
      const content = `
## **Bold Heading** with *italic*
## Regular Text and \`code\`
`;
      const keywords = extractKeywords(content, '');
      
      expect(keywords).toContain('bold');
      expect(keywords).toContain('heading');
      expect(keywords).toContain('italic');
      expect(keywords).toContain('regular');
      expect(keywords).toContain('text');
      expect(keywords).toContain('code');
    });

    it('should handle empty content', () => {
      const keywords = extractKeywords('', '');
      
      expect(Array.isArray(keywords)).toBe(true);
      expect(keywords.length).toBe(0);
    });

    it('should convert to lowercase', () => {
      const keywords = extractKeywords('', 'FileStorage ADAPTER Config');
      
      keywords.forEach(keyword => {
        expect(keyword).toBe(keyword.toLowerCase());
      });
    });

    it('should remove duplicates', () => {
      const keywords = extractKeywords('', 'storage storage adapter adapter');
      
      const uniqueKeywords = new Set(keywords);
      expect(keywords.length).toBe(uniqueKeywords.size);
    });
  });

  describe('matchKeywordsToFiles', () => {
    it('should match keywords to file paths', () => {
      const keywords = ['storage', 'adapter'];
      const files = ['src/storage/adapter.ts', 'src/storage/FileStorage.ts', 'src/utils/helper.ts'];
      
      const matches = matchKeywordsToFiles(keywords, files);
      
      expect(matches.length).toBeGreaterThan(0);
      const storageMatch = matches.find(m => m.file.includes('storage'));
      expect(storageMatch).toBeDefined();
    });

    it('should calculate confidence based on match count', () => {
      const keywords = ['storage', 'adapter'];
      const files = ['src/storage/adapter.ts', 'src/config.ts'];
      
      const matches = matchKeywordsToFiles(keywords, files);
      
      const storageAdapterMatch = matches.find(m => m.file === 'src/storage/adapter.ts');
      const configMatch = matches.find(m => m.file === 'src/config.ts');
      
      // storage/adapter.ts matches both keywords, config.ts matches none
      if (storageAdapterMatch && configMatch) {
        expect(storageAdapterMatch.confidence).toBeGreaterThan(configMatch.confidence);
      } else {
        // Only storage/adapter.ts should match
        expect(storageAdapterMatch).toBeDefined();
        expect(configMatch).toBeUndefined();
      }
    });

    it('should match case-insensitively', () => {
      const keywords = ['storage'];
      const files = ['src/STORAGE/Adapter.ts', 'src/utils/helper.ts'];
      
      const matches = matchKeywordsToFiles(keywords, files);
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].file).toBe('src/STORAGE/Adapter.ts');
    });

    it('should sort by confidence descending', () => {
      const keywords = ['storage', 'adapter', 'file'];
      const files = [
        'src/utils/helper.ts',           // 0 matches
        'src/storage/adapter.ts',        // 2 matches
        'src/storage/FileStorage.ts',    // 2 matches
      ];
      
      const matches = matchKeywordsToFiles(keywords, files);
      
      // Results should be sorted by confidence (descending)
      for (let i = 0; i < matches.length - 1; i++) {
        expect(matches[i].confidence).toBeGreaterThanOrEqual(matches[i + 1].confidence);
      }
    });

    it('should match against file name only', () => {
      const keywords = ['adapter'];
      const files = ['src/storage/adapter.ts', 'src/config/settings.ts'];
      
      const matches = matchKeywordsToFiles(keywords, files);
      
      const adapterMatch = matches.find(m => m.file.includes('adapter'));
      expect(adapterMatch).toBeDefined();
      expect(adapterMatch?.matchedKeywords).toContain('adapter');
    });

    it('should return empty array when no matches', () => {
      const keywords = ['nonexistent'];
      const files = ['src/index.ts', 'src/config.ts'];
      
      const matches = matchKeywordsToFiles(keywords, files);
      
      expect(matches.length).toBe(0);
    });

    it('should handle empty keywords', () => {
      const keywords: string[] = [];
      const files = ['src/index.ts', 'src/config.ts'];
      
      const matches = matchKeywordsToFiles(keywords, files);
      
      expect(matches.length).toBe(0);
    });

    it('should handle empty files list', () => {
      const keywords = ['storage'];
      const files: string[] = [];
      
      const matches = matchKeywordsToFiles(keywords, files);
      
      expect(matches.length).toBe(0);
    });

    it('should include matched keywords in result', () => {
      const keywords = ['storage', 'adapter'];
      const files = ['src/storage/adapter.ts'];
      
      const matches = matchKeywordsToFiles(keywords, files);
      
      expect(matches[0].matchedKeywords).toEqual(['storage', 'adapter']);
    });

    it('should calculate confidence as ratio of matched keywords', () => {
      const keywords = ['storage', 'adapter', 'file'];
      const files = ['src/storage/adapter.ts']; // matches 2 out of 3
      
      const matches = matchKeywordsToFiles(keywords, files);
      
      const expectedConfidence = 2 / 3;
      expect(matches[0].confidence).toBeCloseTo(expectedConfidence, 2);
    });
  });
});
