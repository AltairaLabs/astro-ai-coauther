/**
 * Batch Source Context Detection API Endpoint
 * Starts a background job for detecting source context across all documentation pages
 */

import type { APIRoute } from 'astro';
import type {} from '../../global.d.js';
import { detectSourceContext } from '../../utils/source-context-detection';
import { readDocumentationPage } from '../../utils/frontmatter';
import { globby } from 'globby';
import * as path from 'node:path';
import { getJobQueue } from '../../utils/llm/job-queue';
import { getLogger } from '../../utils/logger';

const logger = getLogger();

// Force this endpoint to be server-rendered
export const prerender = false;

export const POST: APIRoute = async () => {
  logger.start('detect-all', 'Starting batch detection request');
  try {
    // Get configuration from global context
    const globalConfig = globalThis.__ASTRO_COAUTHOR__;
    const projectRoot = process.env.ASTRO_PROJECT_ROOT || process.cwd();
    logger.debug('detect-all', 'Project root set.');
    
    // Get docs root from config
    const docsRoot = path.resolve(
      projectRoot,
      globalConfig?.docsRoot || process.env.DOCS_ROOT || 'docs'
    );
    logger.debug('detect-all', 'Docs root set.');
    
    // Get source root from config
    const sourceRoot = path.resolve(
      projectRoot, 
      globalConfig?.sourceRoot || process.env.SOURCE_ROOT || 'src'
    );
    logger.debug('detect-all', 'Source root set.');
    
    // Get LLM provider config if available
    const llmProvider = globalConfig?.llmProvider;
    logger.info('detect-all', `LLM provider: ${llmProvider ? llmProvider.type : 'none (using fallback)'}`);
    
    // Find all documentation files
    logger.info('detect-all', 'Scanning for documentation files...');
    const docFiles = await globby('**/*.{md,mdx,astro}', {
      cwd: docsRoot,
      ignore: ['node_modules/**', 'dist/**', 'coverage/**', '.astro/**'],
    });
    logger.info('detect-all', `Found ${docFiles.length} documentation files`);
    
    // Create job
    const queue = getJobQueue();
    const job = queue.createJob(docFiles.length);
    
    // Start background processing (don't await)
    logger.info('detect-all', `Starting background processing for job ${job.id}`);
    processDetectionJob(
      job.id,
      docFiles,
      docsRoot,
      projectRoot,
      sourceRoot,
      llmProvider
    ).catch(error => {
      logger.error('detect-all', `Background job ${job.id} error:`, error);
      queue.failJob(job.id, error instanceof Error ? error.message : 'Unknown error');
    });
    
    // Return job ID immediately
    logger.success('detect-all', `Returning job ${job.id} to client`);
    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        status: 'started',
        totalPages: docFiles.length,
      }),
      { 
        status: 202, // Accepted
        headers: { 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error: unknown) {
    logger.error('detect-all', 'Failed to start detection job:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Process detection job in background
 */
async function processDetectionJob(
  jobId: string,
  docFiles: string[],
  docsRoot: string,
  projectRoot: string,
  sourceRoot: string,
  llmProvider: any
): Promise<void> {
  logger.start(`detect-all:${jobId}`, `Background processing started for ${docFiles.length} files`);
  const queue = getJobQueue();
  queue.updateJob(jobId, { status: 'running' });
  
  let completed = 0;
  const startTime = Date.now();
  
  for (const docFile of docFiles) {
    try {
      logger.step(`detect-all:${jobId}`, `Processing (${completed + 1}/${docFiles.length}): ${docFile}`);
      const fullPath = path.join(docsRoot, docFile);
      const page = await readDocumentationPage(fullPath);
      
      queue.updateProgress(jobId, completed, docFile);
      
      const fileStartTime = Date.now();
      const result = await detectSourceContext(
        docFile,
        page.content,
        projectRoot,
        {
          projectRoot: sourceRoot,
          llmProvider,
          excludePatterns: [
            '**/*.test.ts',
            '**/*.spec.ts',
            '**/node_modules/**',
            '**/dist/**',
            '**/.astro/**',
          ],
        }
      );
      const fileDuration = Date.now() - fileStartTime;
      
      logger.success(
        `detect-all:${jobId}`,
        `${docFile} complete in ${fileDuration}ms - ` +
        `${result.sourceContext.files.length} files, ${result.sourceContext.folders.length} folders, ` +
        `confidence: ${result.confidence}`
      );
      
      queue.addResult(jobId, {
        docPath: docFile,
        files: result.sourceContext.files,
        folders: result.sourceContext.folders,
        confidence: result.confidence,
        reasoning: result.reasoning,
      });
      
      completed++;
      queue.updateProgress(jobId, completed);
      
    } catch (error) {
      logger.error(`detect-all:${jobId}`, `Error processing ${docFile}:`, error);
      // Continue with next file even if one fails
      completed++;
      queue.updateProgress(jobId, completed);
    }
  }
  
  const totalDuration = Date.now() - startTime;
  const avgDuration = Math.round(totalDuration / docFiles.length);
  logger.success(
    `detect-all:${jobId}`,
    `Completed all ${docFiles.length} files in ${Math.round(totalDuration / 1000)}s ` +
    `(avg: ${avgDuration}ms/file)`
  );
  queue.completeJob(jobId);
}

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ 
      status: 'Batch source context detection API is running',
      methods: ['POST'],
      endpoint: '/_ai-coauthor/detect-all-contexts'
    }),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
};
