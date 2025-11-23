import type { APIContext } from 'astro';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

// Force this endpoint to be server-rendered, not prerendered
export const prerender = false;

export async function POST({ request }: APIContext): Promise<Response> {
  const storage = globalThis.__ASTRO_COAUTHOR__.storage;

  try {
    const contentType = request.headers.get('content-type') || '';
    let body: Record<string, any> = {};

    // Parse JSON body
    if (contentType.includes('application/json')) {
      const rawBody = await request.text();
      if (rawBody.trim()) {
        try {
          body = JSON.parse(rawBody);
        } catch (parseError: any) {
          logger.error('feedback', 'Invalid JSON in request body', parseError);
          return new Response(
            JSON.stringify({ error: 'Invalid JSON payload' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Extract and validate page
    const page = body.page || body.pageUrl || new URL(request.headers.get('referer') || request.url).pathname;
    if (!page) {
      return new Response(
        JSON.stringify({ error: 'Invalid feedback data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract and validate rating
    const rating = body.rating === null || body.rating === undefined ? null : Number(body.rating);
    if (rating === null || Number.isNaN(rating)) {
      return new Response(
        JSON.stringify({ error: 'Rating is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build feedback entry
    const entry = {
      ...body,
      page,
      timestamp: Date.now(),
      rating,
      notes: body.notes ?? body.comment ?? '',
      category: body.category ?? 'general',
    };

    await storage.save(entry);

    return new Response(
      JSON.stringify({ success: true, message: 'Feedback saved' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    logger.error('feedback', 'Failed to save feedback', error);
    return new Response(
      JSON.stringify({ error: 'Failed to save feedback' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(): Promise<Response> {
  const storage = globalThis.__ASTRO_COAUTHOR__.storage;

  try {
    const entries = await storage.loadAll();
    
    return new Response(
      JSON.stringify({
        version: '1.0.0',
        entries,
        lastUpdated: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    logger.error('feedback', 'Failed to retrieve feedback', error);
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve feedback' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
