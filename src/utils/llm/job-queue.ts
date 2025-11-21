/**
 * Simple in-memory job queue for batch detection operations
 */

import { getLogger } from '../logger';

const logger = getLogger();

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface DetectionJob {
  id: string;
  status: JobStatus;
  progress: {
    total: number;
    completed: number;
    current?: string;
  };
  results: Array<{
    docPath: string;
    files: string[];
    folders: string[];
    confidence: string;
    reasoning: string[];
  }>;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

class JobQueue {
  private readonly jobs: Map<string, DetectionJob> = new Map();
  private readonly maxJobs = 100; // Keep last 100 jobs
  private readonly jobTTL = 3600000; // 1 hour

  createJob(totalPages: number): DetectionJob {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const job: DetectionJob = {
      id,
      status: 'pending',
      progress: {
        total: totalPages,
        completed: 0,
      },
      results: [],
      startedAt: new Date().toISOString(),
    };

    logger.info('job-queue', `Created job ${id} for ${totalPages} pages`);
    this.jobs.set(id, job);
    this.cleanup();
    return job;
  }

  getJob(id: string): DetectionJob | undefined {
    const job = this.jobs.get(id);
    if (!job) {
      logger.warn('job-queue', `Job ${id} not found`);
    }
    return job;
  }

  updateJob(id: string, updates: Partial<DetectionJob>): void {
    const job = this.jobs.get(id);
    if (job) {
      if (updates.status && updates.status !== job.status) {
        logger.debug('job-queue', `Job ${id} status: ${job.status} → ${updates.status}`);
      }
      Object.assign(job, updates);
      this.jobs.set(id, job);
    } else {
      logger.warn('job-queue', `Cannot update job ${id} - not found`);
    }
  }

  updateProgress(id: string, completed: number, current?: string): void {
    const job = this.jobs.get(id);
    if (job) {
      job.progress.completed = completed;
      if (current) {
        job.progress.current = current;
      }
      const percent = Math.round((completed / job.progress.total) * 100);
      const currentSuffix = current ? ` - ${current}` : '';
      logger.debug('job-queue', `Job ${id} progress: ${completed}/${job.progress.total} (${percent}%)${currentSuffix}`);
      this.jobs.set(id, job);
    }
  }

  addResult(id: string, result: DetectionJob['results'][0]): void {
    const job = this.jobs.get(id);
    if (job) {
      job.results.push(result);
      this.jobs.set(id, job);
    }
  }

  completeJob(id: string): void {
    const job = this.jobs.get(id);
    if (job) {
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      const duration = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();
      logger.success('job-queue', `Job ${id} completed in ${Math.round(duration / 1000)}s - ${job.results.length} results`);
      this.jobs.set(id, job);
    }
  }

  failJob(id: string, error: string): void {
    const job = this.jobs.get(id);
    if (job) {
      job.status = 'failed';
      job.error = error;
      job.completedAt = new Date().toISOString();
      logger.error('job-queue', `Job ${id} failed: ${error}`);
      this.jobs.set(id, job);
    }
  }

  private cleanup(): void {
    // Remove old jobs
    const now = Date.now();
    let removedCount = 0;
    for (const [id, job] of this.jobs.entries()) {
      const jobTime = new Date(job.startedAt).getTime();
      if (now - jobTime > this.jobTTL) {
        this.jobs.delete(id);
        removedCount++;
      }
    }

    // Keep only max jobs
    if (this.jobs.size > this.maxJobs) {
      const sorted = Array.from(this.jobs.entries())
        .sort(([, a], [, b]) => 
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );
      
      const excessJobs = this.jobs.size - this.maxJobs;
      this.jobs.clear();
      sorted.slice(0, this.maxJobs).forEach(([id, job]) => {
        this.jobs.set(id, job);
      });
      removedCount += excessJobs;
    }
    
    if (removedCount > 0) {
      logger.debug('job-queue', `Cleaned up ${removedCount} old/excess jobs (current: ${this.jobs.size})`);
    }
  }

  getAllJobs(): DetectionJob[] {
    return Array.from(this.jobs.values())
      .sort((a, b) => 
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
  }
}

// Global singleton instance
let globalQueue: JobQueue | undefined;

export function getJobQueue(): JobQueue {
  globalQueue ??= new JobQueue();
  return globalQueue;
}
