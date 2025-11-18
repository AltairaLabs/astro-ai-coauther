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
  });
});
