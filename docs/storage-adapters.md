# Custom Storage Adapters

The integration uses a clean dependency injection pattern for storage, allowing you to implement custom storage backends.

## Storage Interface

```typescript
interface FeedbackStorageEntry {
  id?: string;
  timestamp: number;
  page: string;
  highlight?: string;
  notes?: string;
  category?: string;
  [key: string]: any; // Allow custom fields
}

interface FeedbackStorageAdapter {
  save(entry: FeedbackStorageEntry): Promise<void>;
  loadAll(): Promise<FeedbackStorageEntry[]>;
  clear?(): Promise<void>; // Optional
}
```

## Implementing a Custom Adapter

Create a custom adapter by implementing the `FeedbackStorageAdapter` interface:

```typescript
import type { FeedbackStorageAdapter, FeedbackStorageEntry } from 'astro-ai-coauthor';

class MyCustomStorageAdapter implements FeedbackStorageAdapter {
  async save(entry: FeedbackStorageEntry): Promise<void> {
    // Your custom save logic
    await fetch('https://api.example.com/feedback', {
      method: 'POST',
      body: JSON.stringify(entry)
    });
  }

  async loadAll(): Promise<FeedbackStorageEntry[]> {
    // Your custom load logic
    const response = await fetch('https://api.example.com/feedback');
    return response.json();
  }

  async clear(): Promise<void> {
    // Optional: clear all feedback
    await fetch('https://api.example.com/feedback', {
      method: 'DELETE'
    });
  }
}
```

Then use it in your configuration:

```javascript
import astroAICoauthor from 'astro-ai-coauthor';
import { MyCustomStorageAdapter } from './my-storage';

export default defineConfig({
  integrations: [
    astroAICoauthor({
      storage: new MyCustomStorageAdapter()
    }),
  ],
});
```

## Example: GitHub Issues Adapter

Store feedback as GitHub issues:

```typescript
import type { FeedbackStorageAdapter, FeedbackStorageEntry } from 'astro-ai-coauthor';
import { Octokit } from '@octokit/rest';

class GitHubIssuesAdapter implements FeedbackStorageAdapter {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
  }

  async save(entry: FeedbackStorageEntry): Promise<void> {
    await this.octokit.issues.create({
      owner: this.owner,
      repo: this.repo,
      title: `Feedback: ${entry.page}`,
      body: `
**Page**: ${entry.page}
**Category**: ${entry.category || 'general'}
**Notes**: ${entry.notes || 'No notes'}
**Timestamp**: ${new Date(entry.timestamp).toISOString()}
      `.trim(),
      labels: ['documentation', 'feedback']
    });
  }

  async loadAll(): Promise<FeedbackStorageEntry[]> {
    const { data: issues } = await this.octokit.issues.listForRepo({
      owner: this.owner,
      repo: this.repo,
      labels: 'feedback',
      state: 'all'
    });

    return issues.map(issue => ({
      id: issue.id.toString(),
      page: this.extractPage(issue.body || ''),
      timestamp: new Date(issue.created_at).getTime(),
      notes: issue.body || '',
      category: 'general'
    }));
  }

  private extractPage(body: string): string {
    const match = body.match(/\*\*Page\*\*:\s*(.+)/);
    return match ? match[1] : 'unknown';
  }
}

// Usage:
export default defineConfig({
  integrations: [
    astroAICoauthor({
      storage: new GitHubIssuesAdapter(
        process.env.GITHUB_TOKEN,
        'myorg',
        'myrepo'
      )
    }),
  ],
});
```

## Example: Cloudflare KV Adapter

Store feedback in Cloudflare KV:

```typescript
import type { FeedbackStorageAdapter, FeedbackStorageEntry } from 'astro-ai-coauthor';

class CloudflareKVAdapter implements FeedbackStorageAdapter {
  private kvNamespace: KVNamespace;
  private key: string;

  constructor(kvNamespace: KVNamespace, key: string = 'feedback') {
    this.kvNamespace = kvNamespace;
    this.key = key;
  }

  async save(entry: FeedbackStorageEntry): Promise<void> {
    const entries = await this.loadAll();
    entries.push(entry);
    await this.kvNamespace.put(this.key, JSON.stringify(entries));
  }

  async loadAll(): Promise<FeedbackStorageEntry[]> {
    const data = await this.kvNamespace.get(this.key);
    return data ? JSON.parse(data) : [];
  }

  async clear(): Promise<void> {
    await this.kvNamespace.put(this.key, JSON.stringify([]));
  }
}

// Usage in Cloudflare Pages:
export default defineConfig({
  integrations: [
    astroAICoauthor({
      storage: new CloudflareKVAdapter(env.MY_KV_NAMESPACE)
    }),
  ],
});
```

## Example: Database Adapter

Store feedback in a database (PostgreSQL, MySQL, etc.):

```typescript
import type { FeedbackStorageAdapter, FeedbackStorageEntry } from 'astro-ai-coauthor';
import { sql } from 'your-db-library';

class DatabaseAdapter implements FeedbackStorageAdapter {
  async save(entry: FeedbackStorageEntry): Promise<void> {
    await sql`
      INSERT INTO feedback (page, timestamp, notes, category, rating)
      VALUES (${entry.page}, ${entry.timestamp}, ${entry.notes}, ${entry.category}, ${entry.rating})
    `;
  }

  async loadAll(): Promise<FeedbackStorageEntry[]> {
    const rows = await sql`
      SELECT * FROM feedback ORDER BY timestamp DESC
    `;
    return rows;
  }

  async clear(): Promise<void> {
    await sql`DELETE FROM feedback`;
  }
}
```
