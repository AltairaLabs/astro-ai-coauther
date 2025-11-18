import type { MiddlewareHandler } from 'astro';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

interface FeedbackEntry {
  pageUrl: string;
  timestamp: string;
  rating: number;
  comment: string;
  category: string;
}

interface FeedbackStore {
  version: string;
  entries: FeedbackEntry[];
  lastUpdated: string;
}

/**
 * Middleware to handle feedback submission endpoints
 * 
 * Captures feedback from the client widget and stores it locally
 * in a JSON file for review and analysis.
 */
export function createFeedbackMiddleware(
  feedbackStorePath: string = '.local-doc-feedback.json'
): MiddlewareHandler {
  return async ({ request, url }, next) => {
    // Only handle feedback endpoint
    if (url.pathname === '/_ai-coauthor/feedback' && request.method === 'POST') {
      try {
        // Parse feedback data
        const feedback = await request.json() as FeedbackEntry;

        // Validate feedback
        if (!feedback.rating || !feedback.pageUrl) {
          return new Response(
            JSON.stringify({ error: 'Invalid feedback data' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        // Load existing feedback store
        let feedbackStore: FeedbackStore;
        
        if (existsSync(feedbackStorePath)) {
          const fileContent = await readFile(feedbackStorePath, 'utf-8');
          feedbackStore = JSON.parse(fileContent);
        } else {
          feedbackStore = {
            version: '1.0.0',
            entries: [],
            lastUpdated: new Date().toISOString(),
          };
        }

        // Add new feedback entry
        feedbackStore.entries.push({
          ...feedback,
          timestamp: new Date().toISOString(),
        });
        feedbackStore.lastUpdated = new Date().toISOString();

        // Save updated feedback store
        await writeFile(
          feedbackStorePath,
          JSON.stringify(feedbackStore, null, 2),
          'utf-8'
        );

        return new Response(
          JSON.stringify({ success: true, message: 'Feedback saved' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to save feedback' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Handle GET request to retrieve feedback data (for dashboard)
    if (url.pathname === '/_ai-coauthor/feedback' && request.method === 'GET') {
      try {
        if (existsSync(feedbackStorePath)) {
          const fileContent = await readFile(feedbackStorePath, 'utf-8');
          const feedbackStore: FeedbackStore = JSON.parse(fileContent);

          return new Response(JSON.stringify(feedbackStore), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } else {
          return new Response(
            JSON.stringify({
              version: '1.0.0',
              entries: [],
              lastUpdated: new Date().toISOString(),
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to retrieve feedback' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Pass through other requests
    return next();
  };
}
