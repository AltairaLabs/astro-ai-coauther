import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies using vi.hoisted to avoid hoisting issues
const mocks = vi.hoisted(() => ({
  mockGlobby: vi.fn(),
  mockQueue: {
    createJob: vi.fn(),
    updateJob: vi.fn(),
    updateProgress: vi.fn(),
    addResult: vi.fn(),
    completeJob: vi.fn(),
    failJob: vi.fn(),
  },
  mockReadDocumentationPage: vi.fn(),
  mockDetectSourceContext: vi.fn(),
}));

vi.mock('globby', () => ({
  globby: mocks.mockGlobby,
}));

vi.mock('../../utils/llm/job-queue', () => ({
  getJobQueue: () => mocks.mockQueue,
}));

vi.mock('../../utils/frontmatter', () => ({
  readDocumentationPage: mocks.mockReadDocumentationPage,
}));

vi.mock('../../utils/source-context-detection', () => ({
  detectSourceContext: mocks.mockDetectSourceContext,
}));

// Import after mocks
import { POST, GET } from '../pages/_ai-coauthor/detect-all-contexts';

const { mockGlobby, mockQueue, mockReadDocumentationPage } = mocks;

describe('Detect All Contexts Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset global config
    (globalThis as any).__ASTRO_COAUTHOR__ = undefined;
    // Reset env vars
    delete process.env.ASTRO_PROJECT_ROOT;
    delete process.env.DOCS_ROOT;
    delete process.env.SOURCE_ROOT;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('GET handler', () => {
    it('should return API status', async () => {
      const response = await GET({} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toContain('Batch source context detection');
      expect(data.methods).toEqual(['POST']);
      expect(data.endpoint).toBe('/_ai-coauthor/detect-all-contexts');
    });
  });

  describe('POST handler', () => {
    it('should start a detection job and return job ID', async () => {
      mockGlobby.mockResolvedValue(['docs/page1.md', 'docs/page2.md']);

      const response = await POST({} as any);
      const data = await response.json();

      expect(response.status).toBe(202); // Accepted
      expect(data.success).toBe(true);
      expect(data.jobId).toBeTruthy();
      expect(typeof data.jobId).toBe('string');
      expect(data.status).toBe('started');
      expect(data.totalPages).toBe(2);
    });

    it('should use default configuration when no global config', async () => {
      mockGlobby.mockResolvedValue(['page.md']);

      const response = await POST({} as any);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.totalPages).toBe(1);
      expect(mockGlobby).toHaveBeenCalledWith(
        '**/*.{md,mdx,astro}',
        expect.objectContaining({
          cwd: expect.stringContaining('docs'),
          ignore: expect.arrayContaining(['node_modules/**']),
        })
      );
    });

    it('should use global config when available', async () => {
      (globalThis as any).__ASTRO_COAUTHOR__ = {
        docsRoot: 'custom-docs',
        sourceRoot: 'custom-src',
        llmProvider: { type: 'openai', apiKey: 'test-key' },
      };

      mockGlobby.mockResolvedValue(['page.md']);

      const response = await POST({} as any);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.totalPages).toBe(1);
      expect(mockGlobby).toHaveBeenCalledWith(
        '**/*.{md,mdx,astro}',
        expect.objectContaining({
          cwd: expect.stringContaining('custom-docs'),
        })
      );
    });

    it('should use environment variables when set', async () => {
      process.env.ASTRO_PROJECT_ROOT = '/test-project';
      process.env.DOCS_ROOT = 'my-docs';
      process.env.SOURCE_ROOT = 'my-src';

      mockGlobby.mockResolvedValue(['page.md']);

      const response = await POST({} as any);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.totalPages).toBe(1);
      expect(mockGlobby).toHaveBeenCalledWith(
        '**/*.{md,mdx,astro}',
        expect.objectContaining({
          cwd: expect.stringContaining('my-docs'),
        })
      );
    });

    it('should handle globby errors', async () => {
      mockGlobby.mockRejectedValue(new Error('Glob error'));

      const response = await POST({} as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Glob error');
    });



    it('should return immediately without waiting for processing', async () => {
      mockGlobby.mockResolvedValue(['page1.md']);
      mockQueue.createJob.mockReturnValue({ id: 'job-1' });
      
      const startTime = Date.now();
      const response = await POST({} as any);
      const endTime = Date.now();

      // Should return quickly (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      expect(response.status).toBe(202);
    });

    it('should not block on background processing errors', async () => {
      mockGlobby.mockResolvedValue(['page1.md']);
      mockQueue.createJob.mockReturnValue({ id: 'job-1' });
      mockReadDocumentationPage.mockRejectedValue(new Error('Read error'));

      // Should not throw even if background processing will fail
      const response = await POST({} as any);
      
      expect(response.status).toBe(202);
    });

    it('should create job with correct count for multiple files', async () => {
      mockGlobby.mockResolvedValue(['page1.md', 'page2.md', 'page3.md']);

      const response = await POST({} as any);
      const data = await response.json();

      expect(data.totalPages).toBe(3);
    });

    it('should return job status information', async () => {
      mockGlobby.mockResolvedValue(['page1.md', 'page2.md']);

      const response = await POST({} as any);
      const data = await response.json();

      expect(data).toMatchObject({
        success: true,
        jobId: expect.any(String),
        status: 'started',
        totalPages: 2,
      });
    });

    it('should accept LLM provider configuration', async () => {
      const llmProvider = { type: 'openai', apiKey: 'test-key' };
      (globalThis as any).__ASTRO_COAUTHOR__ = { llmProvider };

      mockGlobby.mockResolvedValue(['page1.md']);

      const response = await POST({} as any);
      const data = await response.json();
      
      expect(response.status).toBe(202);
      expect(data.totalPages).toBe(1);
    });
  });
});
