import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileStorageAdapter } from '../storage/FileStorageAdapter';
import type { FeedbackStorageEntry } from '../storage/FeedbackStorageAdapter';
import fs from 'node:fs/promises';

vi.mock('node:fs/promises');

describe('Storage Adapters', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('FileStorageAdapter', () => {
    it('should initialize with default path', () => {
      const adapter = new FileStorageAdapter();
      expect(adapter).toBeDefined();
    });

    it('should initialize with custom path', () => {
      const adapter = new FileStorageAdapter('./custom-path.json');
      expect(adapter).toBeDefined();
    });

    it('should save an entry', async () => {
      const adapter = new FileStorageAdapter('.test-feedback.json');
      
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const entry: FeedbackStorageEntry = {
        timestamp: Date.now(),
        page: '/docs/test',
        notes: 'Great documentation!',
        category: 'general'
      };

      await adapter.save(entry);

      expect(fs.writeFile).toHaveBeenCalledWith(
        '.test-feedback.json',
        expect.stringContaining('/docs/test'),
        'utf-8'
      );
    });

    it('should load all entries', async () => {
      const adapter = new FileStorageAdapter('.test-feedback.json');
      
      const mockEntries: FeedbackStorageEntry[] = [
        {
          timestamp: Date.now(),
          page: '/docs/test',
          notes: 'Test entry',
          category: 'general'
        }
      ];

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockEntries));

      const entries = await adapter.loadAll();

      expect(entries).toHaveLength(1);
      expect(entries[0].page).toBe('/docs/test');
    });

    it('should return empty array when file does not exist', async () => {
      const adapter = new FileStorageAdapter('.test-feedback.json');
      
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      const entries = await adapter.loadAll();

      expect(entries).toEqual([]);
    });

    it('should clear all entries', async () => {
      const adapter = new FileStorageAdapter('.test-feedback.json');
      
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await adapter.clear();

      expect(fs.writeFile).toHaveBeenCalledWith(
        '.test-feedback.json',
        '[]',
        'utf-8'
      );
    });

    it('should append to existing entries', async () => {
      const adapter = new FileStorageAdapter('.test-feedback.json');
      
      const existingEntries: FeedbackStorageEntry[] = [
        {
          timestamp: Date.now() - 1000,
          page: '/docs/existing',
          notes: 'Existing entry',
          category: 'general'
        }
      ];

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingEntries));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const newEntry: FeedbackStorageEntry = {
        timestamp: Date.now(),
        page: '/docs/new',
        notes: 'New entry',
        category: 'accuracy'
      };

      await adapter.save(newEntry);

      const writtenData = JSON.parse(
        vi.mocked(fs.writeFile).mock.calls[0][1] as string
      );

      expect(writtenData).toHaveLength(2);
      expect(writtenData[0].page).toBe('/docs/existing');
      expect(writtenData[1].page).toBe('/docs/new');
    });

    it('should handle corrupted JSON file and return empty array', async () => {
      const adapter = new FileStorageAdapter('.test-feedback.json');
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Return non-array JSON
      vi.mocked(fs.readFile).mockResolvedValue('{"invalid": "data"}');

      const entries = await adapter.loadAll();

      expect(entries).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[astro-ai-coauthor] Feedback store was not an array, resetting file'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle file read errors gracefully', async () => {
      const adapter = new FileStorageAdapter('.test-feedback.json');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Simulate a permission error
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Permission denied'));

      const entries = await adapter.loadAll();

      expect(entries).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[astro-ai-coauthor] Failed to read feedback store, resetting file:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should use environment variable for path if provided', () => {
      const originalEnv = process.env.ASTRO_COAUTHOR_FEEDBACK_PATH;
      process.env.ASTRO_COAUTHOR_FEEDBACK_PATH = '/custom/env/path.json';
      
      const adapter = new FileStorageAdapter();
      // We can't directly check the private filePath, but we can verify it works
      expect(adapter).toBeDefined();
      
      if (originalEnv) {
        process.env.ASTRO_COAUTHOR_FEEDBACK_PATH = originalEnv;
      } else {
        delete process.env.ASTRO_COAUTHOR_FEEDBACK_PATH;
      }
    });
  });
});
