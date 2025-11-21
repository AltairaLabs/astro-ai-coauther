/**
 * Tests for LLM filesystem browsing tools
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createFilesystemTools } from '../utils/llm/tools';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';

describe('Filesystem Tools', () => {
  let testDir: string;
  let tools: ReturnType<typeof createFilesystemTools>;

  beforeAll(async () => {
    // Create a temporary test directory structure
    testDir = path.join(os.tmpdir(), `llm-tools-test-${Date.now()}`);
    
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'src', 'api'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'src', 'types'), { recursive: true });
    
    // Create some test files
    await fs.writeFile(path.join(testDir, 'src', 'index.ts'), 'export * from "./api";\n');
    await fs.writeFile(path.join(testDir, 'src', 'api', 'users.ts'), '// User API\n');
    await fs.writeFile(path.join(testDir, 'src', 'api', 'posts.ts'), '// Posts API\n');
    await fs.writeFile(path.join(testDir, 'src', 'types', 'user.ts'), 'export interface User {}\n');
    await fs.writeFile(path.join(testDir, 'README.md'), '# Test Project\n');
    
    tools = createFilesystemTools(testDir);
  });

  describe('list_source_files tool', () => {
    it('should list all source files', async () => {
      const tool = tools.find(t => t.name === 'list_source_files')!;
      expect(tool).toBeDefined();

      const result = await (tool as any).invoke({});
      const parsed = JSON.parse(result);

      expect(parsed.files).toBeInstanceOf(Array);
      expect(parsed.files.length).toBeGreaterThan(0);
      expect(parsed.files).toContain('src/index.ts');
      expect(parsed.files).toContain('src/api/users.ts');
    });

    it('should filter files by pattern', async () => {
      const tool = tools.find(t => t.name === 'list_source_files')!;
      
      const result = await (tool as any).invoke({ pattern: 'src/api/**/*.ts' });
      const parsed = JSON.parse(result);

      expect(parsed.files).toContain('src/api/users.ts');
      expect(parsed.files).toContain('src/api/posts.ts');
      expect(parsed.files).not.toContain('src/index.ts');
    });
  });

  describe('list_folders tool', () => {
    it('should list all folders', async () => {
      const tool = tools.find(t => t.name === 'list_folders')!;
      expect(tool).toBeDefined();

      const result = await (tool as any).invoke({});
      const parsed = JSON.parse(result);

      expect(parsed.folders).toBeInstanceOf(Array);
      expect(parsed.folders).toContain('src');
      expect(parsed.folders).toContain('src/api');
      expect(parsed.folders).toContain('src/types');
    });

    it('should limit folder depth', async () => {
      const tool = tools.find(t => t.name === 'list_folders')!;
      
      const result = await (tool as any).invoke({ depth: 1 });
      const parsed = JSON.parse(result);

      expect(parsed.folders).toContain('src');
      expect(parsed.folders).not.toContain('src/api');
    });
  });

  describe('read_file tool', () => {
    it('should read full file content', async () => {
      const tool = tools.find(t => t.name === 'read_file')!;
      expect(tool).toBeDefined();

      const result = await (tool as any).invoke({ 
        file_path: 'src/api/users.ts'
      });
      const parsed = JSON.parse(result);

      expect(parsed.content).toContain('// User API');
      expect(parsed.preview).toBe(false);
    });

    it('should read file preview', async () => {
      const tool = tools.find(t => t.name === 'read_file')!;
      
      const result = await (tool as any).invoke({ 
        file_path: 'src/api/users.ts',
        lines: 1 
      });
      const parsed = JSON.parse(result);

      expect(parsed.preview).toBe(true);
      expect(parsed.lines_shown).toBe(1);
      expect(parsed.content).toBeTruthy();
    });

    it('should handle missing files', async () => {
      const tool = tools.find(t => t.name === 'read_file')!;
      
      const result = await (tool as any).invoke({ 
        file_path: 'nonexistent.ts'
      });
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
    });
  });

  describe('find_files tool', () => {
    it('should find files by pattern', async () => {
      const tool = tools.find(t => t.name === 'find_files')!;
      expect(tool).toBeDefined();

      const result = await (tool as any).invoke({ name_pattern: '*user*' });
      const parsed = JSON.parse(result);

      expect(parsed.matches).toContain('src/api/users.ts');
      expect(parsed.matches).toContain('src/types/user.ts');
    });

    it('should support wildcards', async () => {
      const tool = tools.find(t => t.name === 'find_files')!;
      
      const result = await (tool as any).invoke({ name_pattern: '*.md' });
      const parsed = JSON.parse(result);

      expect(parsed.matches).toContain('README.md');
    });
  });

  describe('list_folder_contents tool', () => {
    it('should list folder contents', async () => {
      const tool = tools.find(t => t.name === 'list_folder_contents')!;
      expect(tool).toBeDefined();

      const result = await (tool as any).invoke({ folder_path: 'src/api' });
      const parsed = JSON.parse(result);

      expect(parsed.files).toContain('users.ts');
      expect(parsed.files).toContain('posts.ts');
      expect(parsed.folders).toEqual([]);
    });

    it('should list both files and folders', async () => {
      const tool = tools.find(t => t.name === 'list_folder_contents')!;
      
      const result = await (tool as any).invoke({ folder_path: 'src' });
      const parsed = JSON.parse(result);

      expect(parsed.files).toContain('index.ts');
      expect(parsed.folders).toContain('api');
      expect(parsed.folders).toContain('types');
    });

    it('should handle missing folders', async () => {
      const tool = tools.find(t => t.name === 'list_folder_contents')!;
      
      const result = await (tool as any).invoke({ folder_path: 'nonexistent' });
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
    });
  });
});
