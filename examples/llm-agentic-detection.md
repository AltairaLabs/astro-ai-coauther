# Using Agentic LLM for Source Context Detection

This example shows how to use the new agentic LLM implementation for automatic source context detection.

## Configuration

Add LLM configuration to your Astro config:

```javascript
// astro.config.mjs
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

## Programmatic Usage

### Basic Usage

```typescript
import { detectSourceContext } from 'astro-ai-coauthor';

// Detect source context for a documentation page
const result = await detectSourceContext(
  'docs/api/users.md',           // Path to the doc file
  docContent,                     // The markdown content
  process.cwd(),                  // Project root
  {
    projectRoot: './src',         // Where your source code lives
    llmProvider: {
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4-turbo-preview',
      temperature: 0.1,
      cacheResults: true,         // Cache results to reduce costs
    },
    fallbackToRules: true,        // Fall back to rule-based if LLM fails
  }
);

console.log('Detected files:', result.sourceContext.files);
console.log('Detected folders:', result.sourceContext.folders);
console.log('Confidence:', result.sourceContext.confidence);
console.log('Reasoning:', result.reasoning);
```

### How the Agent Works

The agentic implementation uses LangGraph's ReAct agent with filesystem browsing tools:

1. **Agent receives** the documentation content and exploration instructions
2. **Agent explores** the codebase using available tools:
   - `list_source_files` - Lists all source files (with optional filtering)
   - `list_folders` - Gets folder structure
   - `read_file` - Reads file contents to verify relevance
   - `find_files` - Searches for files by name pattern
   - `list_folder_contents` - Browses directory contents

3. **Agent builds context** through multiple tool interactions
4. **Agent returns** final analysis with detailed reasoning

### Example: Documentation for User API

```typescript
const docContent = `
# User API

The User API provides endpoints for managing users in the system.

## Endpoints

- \`GET /api/users\` - List all users
- \`POST /api/users\` - Create a new user
- \`GET /api/users/:id\` - Get a specific user
- \`PUT /api/users/:id\` - Update a user
- \`DELETE /api/users/:id\` - Delete a user

## Types

All endpoints use the \`User\` type defined in our type system.
`;

const result = await detectSourceContext(
  'docs/api/users.md',
  docContent,
  process.cwd(),
  {
    llmProvider: {
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4-turbo-preview',
    }
  }
);

// The agent will:
// 1. Use find_files to search for "*user*" files
// 2. Read file previews to verify they contain API endpoints
// 3. Check for type definitions
// 4. Return relevant files with high confidence

// Example output:
// {
//   sourceContext: {
//     files: [
//       'src/api/users.ts',
//       'src/types/user.ts',
//       'src/api/routes/users.ts'
//     ],
//     folders: ['src/api'],
//     confidence: 'high'
//   },
//   reasoning: [
//     'Found user API implementation in src/api/users.ts',
//     'User type definition found in src/types/user.ts',
//     'Route handlers match documented endpoints'
//   ]
// }
```

### Model Options

#### OpenAI (Recommended)

```typescript
{
  llmProvider: {
    type: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4-turbo-preview',  // Best quality
    // or 'gpt-3.5-turbo'            // Cheaper, faster
    temperature: 0.1,                // Low temperature for consistency
    maxTokens: 4000,                 // Enough for agent interactions
    cacheResults: true,              // Recommended to reduce costs
    cacheTTL: 3600,                  // Cache for 1 hour
  }
}
```

**Cost Estimates:**
- GPT-4 Turbo: ~$0.02-0.05 per page (first run)
- GPT-3.5 Turbo: ~$0.001-0.003 per page (first run)
- With caching: Nearly free for subsequent runs within TTL

#### Anthropic (Coming Soon)

```typescript
{
  llmProvider: {
    type: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-opus-20240229',
  }
}
```

#### Local Models (Coming Soon)

```typescript
{
  llmProvider: {
    type: 'local',
    modelPath: './models/mistral-7b',
    endpoint: 'http://localhost:11434',  // Ollama
  }
}
```

### Batch Processing

Process multiple documentation pages efficiently:

```typescript
import { detectAllSourceContexts } from 'astro-ai-coauthor';

const results = await detectAllSourceContexts(
  process.cwd(),
  {
    docsPattern: 'docs/**/*.md',
    projectRoot: './src',
    llmProvider: {
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-3.5-turbo',  // Cheaper for batch processing
      cacheResults: true,
    },
  }
);

// Process results
for (const result of results) {
  console.log(`Page: ${result.docPath}`);
  console.log(`Files: ${result.sourceContext.files.join(', ')}`);
  console.log(`Confidence: ${result.confidence}`);
  console.log('---');
}
```

### Saving Results to Frontmatter

Automatically save detection results to page frontmatter:

```typescript
import { saveSourceContext } from 'astro-ai-coauthor';

const result = await detectSourceContext(/* ... */);

// Save to frontmatter under aiCoauthor namespace
await saveSourceContext(
  'docs/api/users.md',
  result.sourceContext
);
```

This adds to your markdown file:

```markdown
---
title: User API
aiCoauthor:
  sourceContext:
    files:
      - src/api/users.ts
      - src/types/user.ts
    folders:
      - src/api
    confidence: high
    lastUpdated: 2025-11-21T10:00:00.000Z
---

# User API
...
```

### Using the Cache

The LLM cache is global and shared across all requests:

```typescript
import { LLMCache } from 'astro-ai-coauthor';

// Get global cache instance
const cache = LLMCache.getGlobalCache();

// Check cache stats
const stats = cache.getStats();
console.log(`Cache hits: ${stats.hits}`);
console.log(`Cache misses: ${stats.misses}`);
console.log(`Hit rate: ${stats.hitRate.toFixed(2)}%`);

// Manual cleanup of expired entries
const removed = cache.cleanup();
console.log(`Removed ${removed} expired entries`);

// Clear entire cache
cache.clear();
```

### Fallback to Rule-Based Detection

If the LLM fails or returns low confidence, the system can fall back to rule-based detection:

```typescript
const result = await detectSourceContext(
  docPath,
  docContent,
  projectRoot,
  {
    llmProvider: { /* ... */ },
    fallbackToRules: true,  // Enable fallback
    confidenceThreshold: 0.6,
  }
);

// If LLM returns low confidence, automatically falls back to:
// - Pattern matching (file/folder names in doc)
// - Keyword matching
// - Convention-based detection
```

### Non-Agentic Mode

If you prefer the simpler request/response model without agent exploration:

```typescript
import { createLLMProvider } from 'astro-ai-coauthor';

const provider = createLLMProvider(
  {
    type: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
  },
  process.cwd(),
  false  // useAgentic = false
);

// This uses the original implementation that receives
// pre-generated file/folder lists instead of exploring
const result = await provider.detectSourceContext(request);
```

## API Endpoints

The integration automatically adds API endpoints in dev mode:

### Detect Context

```bash
POST /_ai-coauthor/detect-context
Content-Type: application/json

{
  "docPath": "docs/api/users.md",
  "docContent": "# User API\n...",
  "projectRoot": "./src"
}
```

### Save Context

```bash
POST /_ai-coauthor/save-context
Content-Type: application/json

{
  "docPath": "docs/api/users.md",
  "sourceContext": {
    "files": ["src/api/users.ts"],
    "folders": ["src/api"],
    "confidence": "high"
  }
}
```

## Environment Variables

```bash
# Required for OpenAI
OPENAI_API_KEY=sk-...

# Optional: Custom cache TTL (seconds)
LLM_CACHE_TTL=3600

# Optional: Disable caching
LLM_CACHE_ENABLED=false
```

## Best Practices

1. **Use caching** - Dramatically reduces costs for repeated runs
2. **Start with GPT-3.5** - Cheaper and often sufficient
3. **Enable fallback** - Ensures detection always works
4. **Batch similar pages** - Better for cache utilization
5. **Monitor costs** - Use `estimateCost()` to track spending
6. **Review reasoning** - Agent provides explanations for decisions

## Troubleshooting

### High Costs

- Use GPT-3.5 instead of GPT-4
- Enable caching (`cacheResults: true`)
- Increase cache TTL
- Reduce `maxTokens` parameter

### Low Quality Results

- Upgrade to GPT-4 for better reasoning
- Lower temperature (0.1 or less)
- Ensure documentation has clear file/folder references
- Check agent's reasoning output for insights

### Agent Timeout

- Reduce `maxTokens` to speed up responses
- Use simpler model (GPT-3.5)
- Consider non-agentic mode for simple cases

## Advanced: Custom Tools

You can extend the agent with custom tools:

```typescript
import { createFilesystemTools } from 'astro-ai-coauthor/llm/tools';
import { DynamicStructuredTool } from '@langchain/core/tools';

const customTools = [
  ...createFilesystemTools(projectRoot),
  new DynamicStructuredTool({
    name: 'search_git_history',
    description: 'Search git history for file changes',
    schema: z.object({
      pattern: z.string()
    }),
    func: async ({ pattern }) => {
      // Your custom tool implementation
    }
  })
];

// Use with custom provider implementation
```
