---
title: 'Getting Started Tutorial'
description: 'Step-by-step tutorial for integrating AI Coauthor'
aiCoauthor:
  sourceContext:
    files: []
    folders: []
    globs: []
    exclude:
      - '**/*.test.ts'
      - '**/*.spec.ts'
      - '**/node_modules/**'
      - '**/dist/**'
      - '**/.astro/**'
    manual: false
    confidence: 'low'
    lastUpdated: '2025-11-23T12:37:11.207Z'
---

# Getting Started Tutorial

This tutorial walks you through setting up and using the AI Coauthor integration.

## Prerequisites

Before starting, ensure you have:

- Node.js 18+ installed
- An existing Astro project
- Basic familiarity with Astro

## Step 1: Installation

Install the integration via npm:

```bash
npm install astro-ai-coauthor
```

## Step 2: Configure Integration

Add the integration to your `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import aiCoauthor from 'astro-ai-coauthor';

export default defineConfig({
  integrations: [
    aiCoauthor()
  ]
});
```

## Step 3: Add Widget to Layout

The widget is automatically injected, but you can customize its behavior:

```astro
---
import { FeedbackWidget } from 'astro-ai-coauthor/client';
---

<html>
  <body>
    <slot />
    <FeedbackWidget position="bottom-right" />
  </body>
</html>
```

## Step 4: Test Feedback Collection

1. Start your dev server: `npm run dev`
2. Navigate to any page
3. Click the feedback button in the bottom-right
4. Submit test feedback
5. Check the `feedback-data` directory for stored feedback

## Step 5: Source Context Detection

Try the source context detection feature:

1. Open a documentation page
2. Click the "Detect Source" button in the widget
3. Review the detected source files
4. Click "Save" to persist the mapping

## Next Steps

- Read the [Configuration Guide](/configuration) for advanced options
- Check the [API Reference](/api-reference) for programmatic usage
- Explore [Storage Adapters](/storage-adapters) for custom backends

## Troubleshooting

### Widget not appearing

Ensure the integration is properly configured in `astro.config.mjs`.

### Feedback not saving

Check file permissions on the `feedback-data` directory.

### Source detection not working

Verify your project structure follows standard conventions.
