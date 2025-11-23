---
title: 'Configuration Guide'
description: 'Learn how to configure the AI Coauthor integration'
aiCoauthor:
  sourceContext:
    files:
      - types.ts
    folders: []
    globs: []
    exclude:
      - '**/*.test.ts'
      - '**/*.spec.ts'
      - '**/node_modules/**'
      - '**/dist/**'
      - '**/.astro/**'
    manual: false
    confidence: 'high'
    lastUpdated: '2025-11-23T14:08:59.959Z'
---

# Configuration Guide

This guide covers all configuration options for the AI Coauthor integration.

## Basic Configuration

Add the integration to your `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import aiCoauthor from 'astro-ai-coauthor';

export default defineConfig({
  integrations: [
    aiCoauthor({
      // Configuration options
      storageAdapter: 'file',
      feedbackEndpoint: '/_ai-coauthor/feedback',
    })
  ]
});
```

## Storage Options

The integration supports multiple storage adapters:

- **File Storage**: Stores feedback in local JSON files
- **Memory Storage**: In-memory storage for testing
- **Custom Adapters**: Implement your own storage backend

## Widget Configuration

Customize the feedback widget appearance and behavior:

```javascript
aiCoauthor({
  widget: {
    position: 'bottom-right',
    theme: 'auto',
    showOnAllPages: true
  }
})
```

## API Endpoints

The integration automatically creates these endpoints:

- `POST /_ai-coauthor/feedback` - Submit feedback
- `POST /_ai-coauthor/detect-context` - Detect source context
- `POST /_ai-coauthor/save-context` - Save source context

## Environment Variables

Optional environment variables:

```bash
AI_COAUTHOR_STORAGE_PATH=./feedback-data
AI_COAUTHOR_LOG_LEVEL=info
```
