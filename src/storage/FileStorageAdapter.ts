import fs from 'node:fs/promises';
import { FeedbackStorageAdapter, FeedbackStorageEntry } from './FeedbackStorageAdapter';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

export class FileStorageAdapter implements FeedbackStorageAdapter {
  private readonly filePath: string;

  constructor(filePath?: string) {
    // Allow consumers to provide a path via env var or constructor
    this.filePath = filePath || process.env.ASTRO_COAUTHOR_FEEDBACK_PATH || '.astro-doc-feedback.json';
  }

  async save(entry: FeedbackStorageEntry): Promise<void> {
    const entries = await this.loadAll();
    entries.push(entry);
    await fs.writeFile(this.filePath, JSON.stringify(entries, null, 2), 'utf-8');
  }

  async loadAll(): Promise<FeedbackStorageEntry[]> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(content);

      if (Array.isArray(parsed)) {
        return parsed;
      }

      logger.warn('storage', 'Feedback store was not an array, resetting file');
      return [];
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        // File doesn't exist yet, return empty array
        return [];
      }

      logger.error('storage', 'Failed to read feedback store, resetting file', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify([], null, 2), 'utf-8');
  }
}
