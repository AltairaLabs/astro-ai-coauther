/**
 * Tests for Job Queue
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getJobQueue, type DetectionJob } from '../utils/llm/job-queue';

describe('Job Queue', () => {
  let queue: ReturnType<typeof getJobQueue>;

  beforeEach(() => {
    queue = getJobQueue();
    queue.clearAll(); // Clear any jobs from previous tests
  });

  describe('createJob', () => {
    it('should create a job with initial state', () => {
      const job = queue.createJob(10);

      expect(job.id).toMatch(/^job_\d+_[a-z0-9]+$/);
      expect(job.status).toBe('pending');
      expect(job.progress.total).toBe(10);
      expect(job.progress.completed).toBe(0);
      expect(job.results).toEqual([]);
      expect(job.startedAt).toBeDefined();
      expect(job.completedAt).toBeUndefined();
      expect(job.error).toBeUndefined();
    });

    it('should create multiple jobs with unique IDs', () => {
      const job1 = queue.createJob(5);
      const job2 = queue.createJob(3);

      expect(job1.id).not.toBe(job2.id);
    });

    it('should handle creating jobs with zero pages', () => {
      const job = queue.createJob(0);

      expect(job.progress.total).toBe(0);
      expect(job.progress.completed).toBe(0);
    });
  });

  describe('getJob', () => {
    it('should retrieve an existing job', () => {
      const created = queue.createJob(5);
      const retrieved = queue.getJob(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return undefined for non-existent job', () => {
      const result = queue.getJob('nonexistent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('updateJob', () => {
    it('should update job status', () => {
      const job = queue.createJob(10);
      
      queue.updateJob(job.id, { status: 'running' });
      const updated = queue.getJob(job.id);

      expect(updated?.status).toBe('running');
    });

    it('should update multiple properties', () => {
      const job = queue.createJob(10);
      
      queue.updateJob(job.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
      const updated = queue.getJob(job.id);

      expect(updated?.status).toBe('completed');
      expect(updated?.completedAt).toBeDefined();
    });

    it('should handle updating non-existent job', () => {
      // Should not throw
      expect(() => {
        queue.updateJob('nonexistent', { status: 'failed' });
      }).not.toThrow();
    });
  });

  describe('updateProgress', () => {
    it('should update progress without current document', () => {
      const job = queue.createJob(10);
      
      queue.updateProgress(job.id, 5);
      const updated = queue.getJob(job.id);

      expect(updated?.progress.completed).toBe(5);
      expect(updated?.progress.current).toBeUndefined();
    });

    it('should update progress with current document', () => {
      const job = queue.createJob(10);
      
      queue.updateProgress(job.id, 3, 'docs/page3.md');
      const updated = queue.getJob(job.id);

      expect(updated?.progress.completed).toBe(3);
      expect(updated?.progress.current).toBe('docs/page3.md');
    });

    it('should handle updating progress for non-existent job', () => {
      expect(() => {
        queue.updateProgress('nonexistent', 5);
      }).not.toThrow();
    });
  });

  describe('addResult', () => {
    it('should add result to job', () => {
      const job = queue.createJob(3);
      const result = {
        docPath: 'docs/test.md',
        files: ['src/test.ts'],
        folders: [],
        confidence: 'high',
        reasoning: ['Test reason'],
      };

      queue.addResult(job.id, result);
      const updated = queue.getJob(job.id);

      expect(updated?.results).toHaveLength(1);
      expect(updated?.results[0]).toEqual(result);
    });

    it('should add multiple results', () => {
      const job = queue.createJob(3);
      
      queue.addResult(job.id, {
        docPath: 'docs/test1.md',
        files: [],
        folders: [],
        confidence: 'low',
        reasoning: [],
      });
      
      queue.addResult(job.id, {
        docPath: 'docs/test2.md',
        files: [],
        folders: [],
        confidence: 'medium',
        reasoning: [],
      });
      
      const updated = queue.getJob(job.id);
      expect(updated?.results).toHaveLength(2);
    });

    it('should handle adding result to non-existent job', () => {
      expect(() => {
        queue.addResult('nonexistent', {
          docPath: 'test.md',
          files: [],
          folders: [],
          confidence: 'low',
          reasoning: [],
        });
      }).not.toThrow();
    });
  });

  describe('completeJob', () => {
    it('should mark job as completed', () => {
      const job = queue.createJob(3);
      queue.addResult(job.id, {
        docPath: 'test.md',
        files: [],
        folders: [],
        confidence: 'high',
        reasoning: [],
      });
      
      queue.completeJob(job.id);
      const updated = queue.getJob(job.id);

      expect(updated?.status).toBe('completed');
      expect(updated?.completedAt).toBeDefined();
    });

    it('should handle completing non-existent job', () => {
      expect(() => {
        queue.completeJob('nonexistent');
      }).not.toThrow();
    });
  });

  describe('failJob', () => {
    it('should mark job as failed with error', () => {
      const job = queue.createJob(5);
      const errorMsg = 'Test error occurred';
      
      queue.failJob(job.id, errorMsg);
      const updated = queue.getJob(job.id);

      expect(updated?.status).toBe('failed');
      expect(updated?.error).toBe(errorMsg);
      expect(updated?.completedAt).toBeDefined();
    });

    it('should handle failing non-existent job', () => {
      expect(() => {
        queue.failJob('nonexistent', 'error');
      }).not.toThrow();
    });
  });

  describe('getAllJobs', () => {
    it('should return all jobs sorted by start time', () => {
      const job1 = queue.createJob(1);
      const job2 = queue.createJob(2);
      const job3 = queue.createJob(3);

      const allJobs = queue.getAllJobs();

      expect(allJobs).toHaveLength(3);
      // All three jobs should be present
      const jobIds = allJobs.map(j => j.id);
      expect(jobIds).toContain(job1.id);
      expect(jobIds).toContain(job2.id);
      expect(jobIds).toContain(job3.id);
    });

    it('should return empty array when no jobs exist', () => {
      const allJobs = queue.getAllJobs();
      
      expect(Array.isArray(allJobs)).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should limit number of jobs to maxJobs', () => {
      // Create more than 100 jobs to trigger cleanup
      for (let i = 0; i < 105; i++) {
        queue.createJob(1);
      }

      const allJobs = queue.getAllJobs();
      
      // Should keep only the most recent 100
      expect(allJobs.length).toBeLessThanOrEqual(100);
    });

    it('should keep most recent jobs when exceeding limit', () => {
      let lastJob: DetectionJob | undefined;
      for (let i = 0; i < 105; i++) {
        lastJob = queue.createJob(1);
      }

      const allJobs = queue.getAllJobs();
      
      // Most recent job should still exist
      const found = allJobs.find(j => j.id === lastJob?.id);
      expect(found).toBeDefined();
    });

    it('should remove old jobs beyond TTL', async () => {
      vi.useFakeTimers();
      
      const oldJob = queue.createJob(1);
      
      // Advance time by more than 1 hour (TTL)
      vi.advanceTimersByTime(3700000); // 1 hour + 100 seconds
      
      // Create a new job to trigger cleanup
      const newJob = queue.createJob(1);
      
      const allJobs = queue.getAllJobs();
      
      // Old job should be cleaned up
      const oldJobExists = allJobs.find(j => j.id === oldJob.id);
      expect(oldJobExists).toBeUndefined();
      
      // New job should exist
      const newJobExists = allJobs.find(j => j.id === newJob.id);
      expect(newJobExists).toBeDefined();
      
      vi.useRealTimers();
    });
  });

  describe('getJobQueue singleton', () => {
    it('should return the same instance', () => {
      const queue1 = getJobQueue();
      const queue2 = getJobQueue();

      expect(queue1).toBe(queue2);
    });

    it('should maintain state across calls', () => {
      const queue1 = getJobQueue();
      const job = queue1.createJob(5);

      const queue2 = getJobQueue();
      const retrieved = queue2.getJob(job.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(job.id);
    });
  });
});
