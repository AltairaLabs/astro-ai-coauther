# Basic Astro Usage Example

This guide demonstrates how to integrate and use `astro-ai-coauthor` in a basic Astro project.

---

## Setup

### Step 1: Install the Integration

```bash
npm install astro-ai-coauthor
```

### Step 2: Configure Astro

Add the integration to your `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import astroAICoauthor from 'astro-ai-coauthor';

export default defineConfig({
  integrations: [
    astroAICoauthor({
      enableFeedbackWidget: true,
      feedbackStorePath: '.local-doc-feedback.json',
      enableMetadata: true,
      enableStaleDetection: false,
    }),
  ],
});
```

### Step 3: Create Documentation Pages

Create a simple documentation page at `src/pages/docs/index.astro`:

```astro
---
const title = "Getting Started";
const description = "Learn how to use our amazing product";
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
</head>
<body>
  <h1>{title}</h1>
  <p>{description}</p>

  <h2>Installation</h2>
  <pre><code>npm install amazing-product</code></pre>

  <h2>Basic Usage</h2>
  <pre><code>
import { amazingFunction } from 'amazing-product';

const result = amazingFunction();
console.log(result);
  </code></pre>

  <h2>Next Steps</h2>
  <ul>
    <li><a href="/docs/api">API Reference</a></li>
    <li><a href="/docs/guides">Guides</a></li>
    <li><a href="/docs/examples">Examples</a></li>
  </ul>
</body>
</html>
```

---

## Using the Feedback Widget

### In Development Mode

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:4321/docs`

3. Look for the floating 💬 button in the bottom-right corner

4. Click it to open the feedback panel

5. Submit feedback:
   - Select a rating (1-5)
   - Choose a category
   - Add optional comments
   - Click "Submit Feedback"

### Feedback Categories

- **General**: Overall page feedback
- **Accuracy**: Technical correctness issues
- **Clarity**: Content is confusing or unclear
- **Completeness**: Missing information or examples
- **Outdated**: Content needs updating

---

## Viewing Feedback

### Option 1: Feedback Dashboard

Navigate to the built-in dashboard:

```
http://localhost:4321/_ai-coauthor/dashboard
```

The dashboard shows:
- Total feedback count
- Average rating across all pages
- Number of pages with feedback
- Detailed feedback entries grouped by page

### Option 2: Raw JSON File

Check the `.local-doc-feedback.json` file in your project root:

```json
{
  "version": "1.0.0",
  "entries": [
    {
      "pageUrl": "/docs",
      "timestamp": "2025-11-18T10:30:00.000Z",
      "rating": 4,
      "comment": "Great intro, but could use more examples",
      "category": "completeness"
    }
  ],
  "lastUpdated": "2025-11-18T10:30:00.000Z"
}
```

---

## Production Considerations

### Excluding Feedback Data from Git

The `.gitignore` already includes `.local-doc-feedback.json`, so feedback data won't be committed to your repository.

### Widget Behavior in Production

By default, the feedback widget only appears in **development mode** (`npm run dev`). It will not appear in production builds.

If you want to enable it in production (not recommended for public sites):

```javascript
astroAICoauthor({
  enableFeedbackWidget: true,
  // Note: This would appear for all users in production
})
```

---

## Advanced Configuration

### Custom Storage Location

Store feedback in a different location:

```javascript
astroAICoauthor({
  feedbackStorePath: './data/doc-feedback.json',
})
```

### Disable Metadata Tracking

If you only want the feedback widget without metadata:

```javascript
astroAICoauthor({
  enableFeedbackWidget: true,
  enableMetadata: false,
})
```

### Prepare for Stale Detection (Coming Soon)

Enable stale detection when it's available:

```javascript
astroAICoauthor({
  enableStaleDetection: true, // Future feature
})
```

---

## Tips & Best Practices

### 1. Review Feedback Regularly

Make it a habit to check the dashboard or JSON file regularly:

```bash
# Quick view in terminal
cat .local-doc-feedback.json | jq '.entries[] | {page: .pageUrl, rating: .rating}'
```

### 2. Use Categories for Organization

Encourage team members to use specific categories to help prioritize improvements:
- Low ratings + "accuracy" = urgent fix needed
- "completeness" = add more examples
- "outdated" = needs content update

### 3. Integrate with Your Workflow

Consider adding a script to your `package.json`:

```json
{
  "scripts": {
    "feedback:view": "cat .local-doc-feedback.json | jq",
    "feedback:clear": "rm .local-doc-feedback.json"
  }
}
```

### 4. Export Feedback for Analysis

Use the JSON data for further analysis:

```javascript
// analyze-feedback.js
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('.local-doc-feedback.json', 'utf-8'));

const avgByPage = {};
data.entries.forEach(entry => {
  if (!avgByPage[entry.pageUrl]) {
    avgByPage[entry.pageUrl] = { sum: 0, count: 0 };
  }
  avgByPage[entry.pageUrl].sum += entry.rating;
  avgByPage[entry.pageUrl].count += 1;
});

Object.entries(avgByPage).forEach(([page, stats]) => {
  const avg = (stats.sum / stats.count).toFixed(2);
  console.log(`${page}: ${avg}/5 (${stats.count} reviews)`);
});
```

---

## Troubleshooting

### Widget Not Appearing

1. Confirm you're in development mode (`npm run dev`)
2. Check the browser console for errors
3. Verify the integration is properly configured in `astro.config.mjs`

### Feedback Not Saving

1. Check file permissions in your project directory
2. Look for errors in the terminal where your dev server is running
3. Verify the `feedbackStorePath` is writable

### Dashboard Shows No Data

1. Submit some feedback first using the widget
2. Check that `.local-doc-feedback.json` exists and has entries
3. Try refreshing the dashboard page

---

## Next Steps

- Explore the [API Documentation](../README.md#configuration-options)
- Check out the [Roadmap](../README.md#roadmap) for upcoming features
- Contribute feedback and ideas on [GitHub](https://github.com/altairalabs/astro-ai-coauthor)

---

**Happy documenting!** 📚✨
