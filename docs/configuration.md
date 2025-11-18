# Configuration Guide

## ⚙️ Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableFeedbackWidget` | `boolean` | `true` | Show feedback widget in dev mode |
| `storage` | `FeedbackStorageAdapter` | `FileStorageAdapter` | Custom storage adapter for feedback |
| `enableMetadata` | `boolean` | `true` | Track documentation metadata |
| `enableStaleDetection` | `boolean` | `false` | Enable stale doc detection (coming soon) |

## Basic Configuration

```javascript
import { defineConfig } from 'astro/config';
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

## Custom File Path

```javascript
import astroAICoauthor, { FileStorageAdapter } from 'astro-ai-coauthor';

export default defineConfig({
  integrations: [
    astroAICoauthor({
      storage: new FileStorageAdapter('./docs/.feedback.json'),
    }),
  ],
});
```

## Environment Variables

You can configure the feedback storage path using an environment variable:

```bash
ASTRO_COAUTHOR_FEEDBACK_PATH=./custom-path.json
```

The integration will automatically pick this up if no `storage` option is provided.
