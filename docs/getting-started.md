# Getting Started

Get up and running with Astro AI Coauthor in minutes.

## Installation

Install the package using npm:

```bash
npm install astro-ai-coauthor
```

## Basic Configuration

Add the integration to your `astro.config.mjs`:

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

## Start Development Server

Start your Astro development server:

```bash
npm run dev
```

## Using the Feedback Widget

Once your development server is running:

1. Navigate to any page in your documentation
2. Look for the feedback widget (💬) in the bottom-right corner
3. Click to open the feedback panel
4. Rate the page (1-5 stars)
5. Select a category (clarity, accuracy, completeness, etc.)
6. Add notes or highlight text for specific feedback
7. Submit your feedback

## View the Dashboard

Access your feedback dashboard at:

```text
http://localhost:4321/_ai-coauthor/dashboard
```

The dashboard shows:

- Summary statistics (total feedback, average rating, pages with feedback)
- Page performance table with status indicators
- Feedback trends over time
- Category breakdown visualization
- Prioritized action items
- Export options (JSON, CSV, Markdown)

## Next Steps

- [Explore Configuration Options](/astro-ai-coauther/configuration)
- [Learn About Features](/astro-ai-coauther/features)
- [API Reference](/astro-ai-coauther/api)
