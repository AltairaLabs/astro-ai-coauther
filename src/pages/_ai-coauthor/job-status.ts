/**
 * Job Status API Endpoint
 * Check the status of batch detection jobs
 */

import type { APIRoute } from 'astro';
import { getJobQueue } from '../../utils/llm/job-queue';

// Force this endpoint to be server-rendered
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const jobId = url.searchParams.get('jobId');
    const queue = getJobQueue();
    
    // Get specific job
    if (jobId) {
      const job = queue.getJob(jobId);
      
      if (!job) {
        return new Response(
          JSON.stringify({ 
            error: 'Job not found',
            jobId,
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify(job),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Get all jobs
    const allJobs = queue.getAllJobs();
    
    return new Response(
      JSON.stringify({
        jobs: allJobs,
        count: allJobs.length,
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
