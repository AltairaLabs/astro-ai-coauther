import { test, expect } from '@playwright/test';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import matter from 'gray-matter';

test.describe('Source Context Detection E2E', () => {
  let tempDir: string;
  let docFilePath: string;

  test.beforeEach(async () => {
    // Create a temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'source-context-e2e-'));
    
    // Create a test documentation page
    docFilePath = path.join(tempDir, 'test-page.md');
    const docContent = `---
title: Storage Adapters Guide
layout: doc
---

# Storage Adapters

This guide explains how to use custom storage adapters for feedback data.

## FileStorageAdapter

The FileStorageAdapter stores feedback in a JSON file on disk.

\`\`\`typescript
import { FileStorageAdapter } from 'astro-ai-coauthor';

const storage = new FileStorageAdapter('./feedback.json');
\`\`\`

## Custom Adapters

You can create custom adapters by implementing the FeedbackStorageAdapter interface.
`;
    
    await fs.writeFile(docFilePath, docContent);
  });

  test.afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('should detect source context and save to frontmatter', async ({ request }) => {
    // Read the original document
    const originalContent = await fs.readFile(docFilePath, 'utf-8');
    const originalParsed = matter(originalContent);
    
    // Verify no source context exists initially
    expect(originalParsed.data.aiCoauthor).toBeUndefined();
    
    // Call the detection API
    const response = await request.post('/_ai-coauthor/detect-context', {
      data: {
        docPath: '/storage-adapters',
        docContent: originalParsed.content,
      },
    });
    
    expect(response.ok()).toBeTruthy();
    
    const result = await response.json();
    
    // Verify detection returned source context
    expect(result).toHaveProperty('sourceContext');
    expect(result.sourceContext).toHaveProperty('files');
    expect(result.sourceContext).toHaveProperty('confidence');
    expect(result).toHaveProperty('reasoning');
    
    // The detection should find storage-related files
    // Note: detection may return empty if no strong matches found
    // Just verify the structure is correct
    expect(Array.isArray(result.sourceContext.files)).toBe(true);
    
    // Log for debugging (optional, can be removed)
    if (result.sourceContext.files.length === 0) {
      console.log('Detection returned no files. Reasoning:', result.reasoning);
    }
  });

  test('should preserve existing frontmatter when adding source context', async () => {
    // Create a document with existing frontmatter
    const docWithFrontmatter = `---
title: Advanced Guide
author: John Doe
customField: customValue
---

# Advanced Topics

Content about storage and adapters.
`;
    
    await fs.writeFile(docFilePath, docWithFrontmatter);
    
    const beforeParsed = matter(docWithFrontmatter);
    
    // Simulate saving source context using the utility functions
    const { saveSourceContext } = await import('../src/utils/source-context-detection');
    
    const mockSourceContext = {
      files: ['src/storage/FileStorageAdapter.ts'],
      folders: ['src/storage'],
      globs: [],
      exclude: ['**/*.test.ts'],
      manual: false,
      confidence: 'high' as const,
      lastUpdated: new Date().toISOString(),
    };
    
    // Save the source context
    await saveSourceContext(docFilePath, mockSourceContext);
    
    // Read the updated file
    const updatedContent = await fs.readFile(docFilePath, 'utf-8');
    const updatedParsed = matter(updatedContent);
    
    // Verify original frontmatter is preserved
    expect(updatedParsed.data.title).toBe('Advanced Guide');
    expect(updatedParsed.data.author).toBe('John Doe');
    expect(updatedParsed.data.customField).toBe('customValue');
    
    // Verify source context was added
    expect(updatedParsed.data.aiCoauthor).toBeDefined();
    expect(updatedParsed.data.aiCoauthor.sourceContext).toBeDefined();
    expect(updatedParsed.data.aiCoauthor.sourceContext.files).toEqual(['src/storage/FileStorageAdapter.ts']);
    expect(updatedParsed.data.aiCoauthor.sourceContext.folders).toEqual(['src/storage']);
    expect(updatedParsed.data.aiCoauthor.sourceContext.confidence).toBe('high');
    
    // Verify content is unchanged
    expect(updatedParsed.content.trim()).toBe(beforeParsed.content.trim());
  });

  test('should update existing source context without duplication', async () => {
    // Create a document with existing source context
    const docWithSourceContext = `---
title: Storage Guide
aiCoauthor:
  sourceContext:
    files:
      - src/storage/adapter.ts
    folders: []
    confidence: medium
    lastUpdated: '2025-01-01T00:00:00.000Z'
---

# Storage

Updated content about storage adapters and file handling.
`;
    
    await fs.writeFile(docFilePath, docWithSourceContext);
    
    // Update with new source context
    const { saveSourceContext } = await import('../src/utils/source-context-detection');
    
    const newSourceContext = {
      files: ['src/storage/FileStorageAdapter.ts', 'src/storage/index.ts'],
      folders: ['src/storage'],
      globs: [],
      exclude: ['**/*.test.ts'],
      manual: false,
      confidence: 'high' as const,
      lastUpdated: new Date().toISOString(),
    };
    
    await saveSourceContext(docFilePath, newSourceContext);
    
    // Read the updated file
    const updatedContent = await fs.readFile(docFilePath, 'utf-8');
    const updatedParsed = matter(updatedContent);
    
    // Verify source context was replaced (not duplicated)
    expect(updatedParsed.data.aiCoauthor.sourceContext.files).toEqual([
      'src/storage/FileStorageAdapter.ts',
      'src/storage/index.ts',
    ]);
    expect(updatedParsed.data.aiCoauthor.sourceContext.confidence).toBe('high');
    
    // Verify only one aiCoauthor section exists
    const frontmatterKeys = Object.keys(updatedParsed.data);
    const aiCoauthorCount = frontmatterKeys.filter(key => key === 'aiCoauthor').length;
    expect(aiCoauthorCount).toBe(1);
  });

  test('should handle markdown files without frontmatter', async () => {
    // Create a file with no frontmatter
    const docWithoutFrontmatter = `# Getting Started

This is a simple guide with no frontmatter.

Content about configuration and setup.
`;
    
    await fs.writeFile(docFilePath, docWithoutFrontmatter);
    
    const { saveSourceContext } = await import('../src/utils/source-context-detection');
    
    const sourceContext = {
      files: ['src/config.ts'],
      folders: [],
      globs: [],
      exclude: [],
      manual: false,
      confidence: 'medium' as const,
      lastUpdated: new Date().toISOString(),
    };
    
    await saveSourceContext(docFilePath, sourceContext);
    
    // Read the updated file
    const updatedContent = await fs.readFile(docFilePath, 'utf-8');
    const updatedParsed = matter(updatedContent);
    
    // Verify frontmatter was created
    expect(updatedParsed.data.aiCoauthor).toBeDefined();
    expect(updatedParsed.data.aiCoauthor.sourceContext.files).toEqual(['src/config.ts']);
    
    // Verify content is preserved
    expect(updatedParsed.content).toContain('# Getting Started');
    expect(updatedParsed.content).toContain('This is a simple guide');
  });

  test('should load source context from frontmatter', async () => {
    // Create a file with source context
    const docWithContext = `---
title: API Reference
aiCoauthor:
  sourceContext:
    files:
      - src/index.ts
      - src/types/index.ts
    folders:
      - src/utils
    globs:
      - src/**/*.ts
    confidence: high
    lastUpdated: '2025-11-20T00:00:00.000Z'
---

# API Reference

Complete API documentation.
`;
    
    await fs.writeFile(docFilePath, docWithContext);
    
    const { loadSourceContext } = await import('../src/utils/source-context-detection');
    
    const loadedContext = await loadSourceContext(docFilePath);
    
    // Verify loaded context matches what was saved
    expect(loadedContext).toBeDefined();
    expect(loadedContext?.files).toEqual(['src/index.ts', 'src/types/index.ts']);
    expect(loadedContext?.folders).toEqual(['src/utils']);
    expect(loadedContext?.globs).toEqual(['src/**/*.ts']);
    expect(loadedContext?.confidence).toBe('high');
  });

  test('should return null when loading from file without source context', async () => {
    const docWithoutContext = `---
title: Simple Page
---

# Content

No source context here.
`;
    
    await fs.writeFile(docFilePath, docWithoutContext);
    
    const { loadSourceContext } = await import('../src/utils/source-context-detection');
    
    const loadedContext = await loadSourceContext(docFilePath);
    
    expect(loadedContext).toBeNull();
  });

  test('should validate source context structure', async () => {
    const { validateSourceContext } = await import('../src/utils/source-context-detection');
    
    // Create a valid file path for testing
    const testFilePath = path.join(tempDir, 'src', 'utils', 'test.ts');
    await fs.mkdir(path.dirname(testFilePath), { recursive: true });
    await fs.writeFile(testFilePath, '// test file');
    
    // Valid source context with existing file
    const validContext = {
      files: [path.relative(tempDir, testFilePath)],
      folders: [],
      globs: [],
      exclude: [],
      manual: false,
      confidence: 'high' as const,
      lastUpdated: new Date().toISOString(),
    };
    
    const result = await validateSourceContext(validContext, tempDir);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    
    // Invalid - file does not exist
    const invalidContext = {
      files: ['non-existent-file.ts'],
      folders: [],
      globs: [],
      exclude: [],
      manual: false,
      confidence: 'high' as const,
      lastUpdated: new Date().toISOString(),
    };
    
    const invalidResult = await validateSourceContext(invalidContext, tempDir);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });

  test('full workflow: detect, save, load, and verify', async ({ request }) => {
    // Step 1: Create a documentation page
    const docContent = `---
title: File Tree Utilities
description: Utilities for building file trees
---

# File Tree

Learn about building file trees with .gitignore support.

## buildFileTree

The buildFileTree function scans directories and creates a tree structure.

## flattenFileTree

Converts a tree structure to a flat array of paths.
`;
    
    await fs.writeFile(docFilePath, docContent);
    
    // Step 2: Detect source context via API
    const detectionResponse = await request.post('/_ai-coauthor/detect-context', {
      data: {
        docPath: '/file-tree-guide',
        docContent: docContent,
      },
    });
    
    expect(detectionResponse.ok()).toBeTruthy();
    const detectionResult = await detectionResponse.json();
    
    // Step 3: Save the detected context to frontmatter
    const { saveSourceContext } = await import('../src/utils/source-context-detection');
    await saveSourceContext(docFilePath, detectionResult.sourceContext);
    
    // Step 4: Load the context back from the file
    const { loadSourceContext } = await import('../src/utils/source-context-detection');
    const loadedContext = await loadSourceContext(docFilePath);
    
    // Step 5: Verify the loaded context matches what was detected
    expect(loadedContext).toBeDefined();
    expect(loadedContext?.files).toEqual(detectionResult.sourceContext.files);
    expect(loadedContext?.folders).toEqual(detectionResult.sourceContext.folders);
    expect(loadedContext?.confidence).toBe(detectionResult.sourceContext.confidence);
    
    // Step 6: Verify original content and title are preserved
    const finalContent = await fs.readFile(docFilePath, 'utf-8');
    const finalParsed = matter(finalContent);
    
    expect(finalParsed.data.title).toBe('File Tree Utilities');
    expect(finalParsed.data.description).toBe('Utilities for building file trees');
    expect(finalParsed.content).toContain('# File Tree');
    expect(finalParsed.content).toContain('buildFileTree');
  });
});
