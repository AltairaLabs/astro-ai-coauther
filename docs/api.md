# API Reference

Complete API documentation for Astro AI Coauthor.

## Integration API

### astroAICoauthor(options)

The main integration function.

**Parameters:**

- `options` (object):
  - `enableFeedbackWidget` (boolean, default: `true`): Enable feedback widget in dev mode
  - `enableMetadata` (boolean, default: `false`): Enable metadata tracking
  - `storageAdapter` (FeedbackStorageAdapter, default: `FileStorageAdapter`): Storage backend

**Returns:** `AstroIntegration`

**Example:**

```javascript
import astroAICoauthor from 'astro-ai-coauthor';

export default defineConfig({
  integrations: [
    astroAICoauthor({
      enableFeedbackWidget: true,
      enableMetadata: true,
    }),
  ],
});
```

## Storage API

### FileStorageAdapter

Default file-based storage adapter.

**Constructor:**

```typescript
new FileStorageAdapter(options?: {
  filePath?: string;
})
```

**Parameters:**

- `filePath` (string, default: `'.local-doc-feedback.json'`): Path to feedback file

**Methods:**

- `save(entry: FeedbackStorageEntry): Promise<void>`: Save a feedback entry
- `load(): Promise<FeedbackStorageEntry[]>`: Load all feedback entries
- `clear(): Promise<void>`: Clear all feedback

**Example:**

```javascript
import { FileStorageAdapter } from 'astro-ai-coauthor';

const storage = new FileStorageAdapter({
  filePath: './data/feedback.json',
});
```

### FeedbackStorageAdapter Interface

Base interface for custom storage adapters.

```typescript
interface FeedbackStorageAdapter {
  save(entry: FeedbackStorageEntry): Promise<void>;
  load(): Promise<FeedbackStorageEntry[]>;
  clear(): Promise<void>;
}
```

## Export API

### exportFeedback(entries, options)

Export feedback data in various formats.

**Parameters:**

- `entries` (FeedbackStorageEntry[]): Feedback entries to export
- `options` (ExportOptions):
  - `format` ('json' | 'csv' | 'markdown'): Export format
  - `filterByPage` (string, optional): Filter by page path
  - `filterByCategory` (string, optional): Filter by category
  - `filterByRating` (object, optional): Filter by rating range with min and max properties
  - `filterByDate` (object, optional): Filter by date range with start and end properties

**Returns:** `string`

**Example:**

```javascript
import { exportFeedback } from 'astro-ai-coauthor';

const json = exportFeedback(entries, {
  format: 'json',
  filterByPage: '/docs/getting-started',
});

const csv = exportFeedback(entries, {
  format: 'csv',
  filterByRating: { min: 1, max: 3 },
});
```

### generateAnalytics(entries)

Generate analytics data from feedback entries.

**Parameters:**

- `entries` (FeedbackStorageEntry[]): Feedback entries to analyze

**Returns:** `AnalyticsData`

```typescript
interface AnalyticsData {
  totalFeedback: number;
  averageRating: number;
  categoryBreakdown: Record<string, number>;
  pageBreakdown: Record<string, {
    count: number;
    avgRating: number;
  }>;
  trendData: Array<{
    date: string;
    count: number;
    avgRating: number;
  }>;
}
```

**Example:**

```javascript
import { generateAnalytics } from 'astro-ai-coauthor';

const analytics = generateAnalytics(entries);
console.log(`Average rating: ${analytics.averageRating}`);
console.log(`Total feedback: ${analytics.totalFeedback}`);
```

### generateTasks(entries)

Generate prioritized tasks from feedback.

**Parameters:**

- `entries` (FeedbackStorageEntry[]): Feedback entries to analyze

**Returns:** `FeedbackTask[]`

```typescript
interface FeedbackTask {
  priority: 'high' | 'medium' | 'low';
  page: string;
  issue: string;
  feedbackCount: number;
  averageRating: number;
  categories: string[];
}
```

**Example:**

```javascript
import { generateTasks } from 'astro-ai-coauthor';

const tasks = generateTasks(entries);
const highPriority = tasks.filter(t => t.priority === 'high');
```

## Type Definitions

### FeedbackStorageEntry

```typescript
interface FeedbackStorageEntry {
  id: string;
  timestamp: number;
  page: string;
  rating?: number;
  category?: string;
  notes?: string;
  highlight?: string;
}
```

### ExportOptions

```typescript
interface ExportOptions {
  format: 'json' | 'csv' | 'markdown';
  filterByPage?: string;
  filterByCategory?: string;
  filterByRating?: {
    min?: number;
    max?: number;
  };
  filterByDate?: {
    start?: Date;
    end?: Date;
  };
}
```

## API Endpoints

When the integration is active, the following endpoints are available:

### GET `/_ai-coauthor/dashboard`

The feedback dashboard interface.

### POST `/_ai-coauthor/api/feedback`

Submit feedback.

**Request Body:**

```json
{
  "page": "/docs/getting-started",
  "rating": 5,
  "category": "clarity",
  "notes": "Very helpful!",
  "highlight": "optional highlighted text"
}
```

**Response:**

```json
{
  "success": true,
  "id": "unique-id"
}
```

### GET `/_ai-coauthor/api/feedback`

Retrieve all feedback.

**Response:**

```json
{
  "entries": [...]
}
```

### GET `/_ai-coauthor/api/export`

Export feedback.

**Query Parameters:**

- `format`: 'json' | 'csv' | 'markdown'
- `page`: Filter by page
- `category`: Filter by category
- `minRating`, `maxRating`: Filter by rating
- `startDate`, `endDate`: Filter by date

### GET `/_ai-coauthor/api/analytics`

Get analytics data.

**Response:**

```json
{
  "totalFeedback": 42,
  "averageRating": 4.2,
  "categoryBreakdown": {...},
  "pageBreakdown": {...},
  "trendData": [...]
}
```

### GET `/_ai-coauthor/api/tasks`

Get generated tasks.

**Response:**

```json
{
  "tasks": [
    {
      "priority": "high",
      "page": "/docs/api",
      "issue": "Low rating (2.3/5) - accuracy",
      "feedbackCount": 5,
      "averageRating": 2.3,
      "categories": ["accuracy", "outdated"]
    }
  ]
}
```
