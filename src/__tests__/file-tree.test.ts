/**
 * Tests for file tree utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  buildFileTree,
  flattenFileTree,
  getFilesMatching,
  pathExists,
} from '../utils/file-tree';

describe('File Tree Utilities', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'file-tree-test-'));
    
    // Create test directory structure
    await fs.mkdir(path.join(tempDir, 'src'));
    await fs.mkdir(path.join(tempDir, 'src/utils'));
    await fs.mkdir(path.join(tempDir, 'dist'));
    await fs.mkdir(path.join(tempDir, 'node_modules'));
    
    await fs.writeFile(path.join(tempDir, 'index.ts'), 'export {}');
    await fs.writeFile(path.join(tempDir, 'README.md'), '# Test');
    await fs.writeFile(path.join(tempDir, 'src/main.ts'), 'console.log()');
    await fs.writeFile(path.join(tempDir, 'src/types.ts'), 'export type {}');
    await fs.writeFile(path.join(tempDir, 'src/utils/helper.ts'), 'export {}');
    await fs.writeFile(path.join(tempDir, 'src/main.test.ts'), 'test()');
    await fs.writeFile(path.join(tempDir, 'dist/bundle.js'), 'console.log()');
    await fs.writeFile(path.join(tempDir, 'node_modules/dep.js'), 'module.exports = {}');
    
    // Create .gitignore
    await fs.writeFile(path.join(tempDir, '.gitignore'), 'node_modules\ndist\n*.log');
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('buildFileTree', () => {
    it('should build file tree excluding node_modules and dist', async () => {
      const tree = await buildFileTree(tempDir);
      const flatFiles = flattenFileTree(tree);

      expect(flatFiles).toContain('index.ts');
      expect(flatFiles).toContain('README.md');
      expect(flatFiles).toContain('src/main.ts');
      expect(flatFiles).not.toContain('node_modules/dep.js');
      expect(flatFiles).not.toContain('dist/bundle.js');
    });

    it('should exclude test files when pattern provided', async () => {
      const tree = await buildFileTree(tempDir, ['**/*.test.ts']);
      const flatFiles = flattenFileTree(tree);

      expect(flatFiles).toContain('src/main.ts');
      expect(flatFiles).not.toContain('src/main.test.ts');
    });

    it('should respect .gitignore patterns', async () => {
      const tree = await buildFileTree(tempDir, [], tempDir);
      const flatFiles = flattenFileTree(tree);

      expect(flatFiles).not.toContain('node_modules/dep.js');
      expect(flatFiles).not.toContain('dist/bundle.js');
    });

    it('should handle directory with subdirectories', async () => {
      const tree = await buildFileTree(tempDir);
      
      expect(tree.type).toBe('directory');
      expect(tree.children).toBeDefined();
      expect(tree.children!.length).toBeGreaterThan(0);
      
      const srcDir = tree.children!.find(c => c.name === 'src');
      expect(srcDir).toBeDefined();
      expect(srcDir!.type).toBe('directory');
    });

    it('should handle empty directory', async () => {
      const emptyDir = path.join(tempDir, 'empty');
      await fs.mkdir(emptyDir);

      const tree = await buildFileTree(emptyDir);

      expect(tree.type).toBe('directory');
      expect(tree.children).toEqual([]);
    });
  });

  describe('flattenFileTree', () => {
    it('should flatten tree to array of relative paths', async () => {
      const tree = await buildFileTree(tempDir);
      const flat = flattenFileTree(tree);

      expect(Array.isArray(flat)).toBe(true);
      expect(flat.length).toBeGreaterThan(0);
      expect(flat.every(f => typeof f === 'string')).toBe(true);
    });

    it('should include nested files with correct paths', async () => {
      const tree = await buildFileTree(tempDir);
      const flat = flattenFileTree(tree);

      expect(flat).toContain('src/utils/helper.ts');
    });

    it('should not include directories in flat list', async () => {
      const tree = await buildFileTree(tempDir);
      const flat = flattenFileTree(tree);

      expect(flat.every(f => !f.endsWith('/'))).toBe(true);
    });
  });

  describe('getFilesMatching', () => {
    it('should find files matching glob pattern', async () => {
      const matches = await getFilesMatching('**/*.ts', tempDir);

      expect(matches.length).toBeGreaterThan(0);
      expect(matches.some(m => m.includes('main.ts'))).toBe(true);
    });

    it('should find files with specific name', async () => {
      const matches = await getFilesMatching('**/helper.ts', tempDir);

      expect(matches.some(m => m.includes('helper.ts'))).toBe(true);
    });

    it('should return empty array for non-matching pattern', async () => {
      const matches = await getFilesMatching('**/*.xyz', tempDir);

      expect(matches).toEqual([]);
    });
  });

  describe('pathExists', () => {
    it('should return true for existing file', async () => {
      const exists = await pathExists(path.join(tempDir, 'index.ts'));

      expect(exists).toBe(true);
    });

    it('should return true for existing directory', async () => {
      const exists = await pathExists(path.join(tempDir, 'src'));

      expect(exists).toBe(true);
    });

    it('should return false for non-existent path', async () => {
      const exists = await pathExists(path.join(tempDir, 'nonexistent.ts'));

      expect(exists).toBe(false);
    });
  });
});
