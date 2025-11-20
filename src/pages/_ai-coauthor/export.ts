import type { APIContext } from 'astro';
import { exportFeedback, generateAnalytics, generateTasks } from '../../utils/export.js';
import type { ExportOptions } from '../../utils/export.js';

// Force this endpoint to be server-rendered
export const prerender = false;

export async function GET({ url }: APIContext): Promise<Response> {
  const storage = (globalThis as any).__ASTRO_COAUTHOR__.storage;

  try {
    const searchParams = url.searchParams;
    const action = searchParams.get('action') || 'export';

    // Load all feedback entries
    const entries = await storage.loadAll();

    if (action === 'analytics') {
      return handleAnalytics(entries);
    }

    if (action === 'tasks') {
      return handleTasks(entries);
    }

    if (action === 'export') {
      return handleExport(entries, searchParams);
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[astro-ai-coauthor] Export error:', error?.message);
    return new Response(
      JSON.stringify({ error: 'Failed to export feedback' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

function handleAnalytics(entries: any[]): Response {
  const analytics = generateAnalytics(entries);
  return new Response(JSON.stringify(analytics), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function handleTasks(entries: any[]): Response {
  const tasks = generateTasks(entries);
  return new Response(JSON.stringify({ tasks }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function handleExport(entries: any[], searchParams: URLSearchParams): Response {
  const format = (searchParams.get('format') || 'json') as 'json' | 'csv' | 'markdown';
  const filterByPage = searchParams.get('page') || undefined;
  const filterByCategory = searchParams.get('category') || undefined;
  
  const minRating = searchParams.get('minRating');
  const maxRating = searchParams.get('maxRating');
  const filterByRating = minRating || maxRating ? {
    min: minRating ? Number.parseInt(minRating, 10) : undefined,
    max: maxRating ? Number.parseInt(maxRating, 10) : undefined,
  } : undefined;

  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const dateRange = startDate || endDate ? {
    start: startDate ? new Date(startDate) : undefined,
    end: endDate ? new Date(endDate) : undefined,
  } : undefined;

  const options: ExportOptions = {
    format,
    filterByPage,
    filterByCategory,
    filterByRating,
    dateRange,
  };

  const exportedData = exportFeedback(entries, options);
  const { contentType, filename } = getFileDetails(format);

  return new Response(exportedData, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function getFileDetails(format: string): { contentType: string; filename: string } {
  switch (format) {
    case 'csv':
      return { contentType: 'text/csv', filename: 'feedback-export.csv' };
    case 'markdown':
      return { contentType: 'text/markdown', filename: 'feedback-export.md' };
    default:
      return { contentType: 'application/json', filename: 'feedback-export.json' };
  }
}
