/**
 * Tests for source context detection
 */

import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import { detectSourceContext } from '../utils/source-context-detection';
import { buildFileTree, flattenFileTree } from '../utils/file-tree';

describe('Source Context Detection', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const sourceRoot = path.resolve(projectRoot, 'src');
  
  it('should build file tree from src directory', async () => {
    const fileTree = await buildFileTree(sourceRoot, ['**/*.test.ts', '**/*.spec.ts'], projectRoot);
    const flatFiles = flattenFileTree(fileTree);
    
    console.log('File tree root:', fileTree.name);
    console.log('Total files found:', flatFiles.length);
    console.log('Sample files:', flatFiles.slice(0, 10));
    
    expect(fileTree.name).toBe('src');
    expect(flatFiles.length).toBeGreaterThan(0);
    expect(flatFiles).toContain('index.ts');
  });
  
  it('should detect source context for a demo page', async () => {
    const docPath = 'docs/storage-adapters.md';
    const docContent = `
---
title: Storage Adapters
---

# Storage Adapters

This guide explains how to use storage adapters for feedback data.

## FileStorageAdapter

The FileStorageAdapter stores feedback in a JSON file.

## FeedbackStorageAdapter

You can implement custom storage adapters using the FeedbackStorageAdapter interface.
    `;
    
    const result = await detectSourceContext(
      docPath,
      docContent,
      projectRoot,
      {
        projectRoot: sourceRoot,
        excludePatterns: ['**/*.test.ts', '**/*.spec.ts'],
      }
    );
    
    console.log('Detection result:', JSON.stringify(result, null, 2));
    console.log('Files found:', result.sourceContext.files.length);
    console.log('Folders found:', result.sourceContext.folders.length);
    console.log('Reasoning:', result.reasoning);
    
    // Should find storage-related files via keyword matching
    expect(result.sourceContext.files.length).toBeGreaterThan(0);
    // Verify it found storage adapters
    const hasStorageFile = result.sourceContext.files.some(f => f.includes('storage'));
    expect(hasStorageFile).toBe(true);
  });
  
  it('should extract keywords from content', async () => {
    const { extractKeywords } = await import('../utils/pattern-matcher');
    
    const content = `
      # Source Context Detection
      
      This uses pattern matching and file tree analysis.
      We also have storage adapters and feedback widgets.
    `;
    
    const keywords = extractKeywords(content, 'Source Context Detection');
    
    console.log('Extracted keywords:', keywords);
    
    expect(keywords).toContain('source');
    expect(keywords).toContain('context');
    expect(keywords).toContain('detection');
  });
  
  it('should match keywords to actual files', async () => {
    const { extractKeywords, matchKeywordsToFiles } = await import('../utils/pattern-matcher');
    const fileTree = await buildFileTree(sourceRoot, ['**/*.test.ts'], projectRoot);
    const allFiles = flattenFileTree(fileTree);
    
    const content = 'This page documents the storage adapters and file tree utilities';
    const keywords = extractKeywords(content, 'Storage Documentation');
    
    console.log('Keywords:', keywords);
    console.log('Available files:', allFiles.slice(0, 20));
    
    const matches = matchKeywordsToFiles(keywords, allFiles);
    
    console.log('Keyword matches:', matches);
    
    expect(matches.length).toBeGreaterThan(0);
  });
});
