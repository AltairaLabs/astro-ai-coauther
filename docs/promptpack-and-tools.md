# PromptPack Integration & Filesystem Tools

## Overview

The LLM-powered source context detection now uses [PromptPack](https://promptpack.org/) for standardized prompt management and includes utilities for filesystem traversal and frontmatter manipulation.

## PromptPack Configuration

### Location

Prompts are stored as JSON files following the PromptPack v1.0 specification:

```
prompts/
└── source-context-detection.json
```

### PromptPack Schema

The `source-context-detection.json` file defines:

- **Template**: Combined system and user prompt
- **Variables**: Type-safe variable definitions with validation
- **Parameters**: LLM configuration (temperature, max_tokens)
- **Validators**: Response validation rules

### Editing Prompts

To modify the LLM behavior, edit `prompts/source-context-detection.json`:

```json
{
  "$schema": "https://promptpack.org/schema/v1.0/promptpack.schema.json",
  "id": "source-context-detection",
  "prompts": {
    "detect": {
      "system_template": "Your expert role and instructions...",
      "variables": [
        {
          "name": "docPath",
          "type": "string",
          "required": true,
          "description": "Path to the documentation file"
        }
      ],
      "parameters": {
        "temperature": 0.1,
        "max_tokens": 2000
      }
    }
  }
}
```

## Filesystem Traversal Tools

### File Tree Building

Build a complete file tree with .gitignore support:

```typescript
import { buildFileTree, flattenFileTree, extractFolders } from 'astro-ai-coauthor';

// Build tree from directory
const fileTree = await buildFileTree(
  './src',  // Directory to scan
  ['**/*.test.ts', '**/*.spec.ts'],  // Exclude patterns
  process.cwd()  // Project root for .gitignore
);

// Get flat list of all files
const allFiles = flattenFileTree(fileTree);
// => ['src/api.ts', 'src/utils/helpers.ts', ...]

// Get all folders
const allFolders = extractFolders(fileTree);
// => ['src', 'src/api', 'src/utils', ...]
```

### Searching Files

Use globby patterns to find specific files:

```typescript
import { globby } from 'globby';

// Find all markdown files in docs
const docFiles = await globby('**/*.{md,mdx}', {
  cwd: './docs',
  ignore: ['node_modules/**', 'dist/**'],
});

// Find TypeScript files matching pattern
const sourceFiles = await globby('src/**/*.ts', {
  ignore: ['**/*.test.ts', '**/*.spec.ts'],
});
```

## Frontmatter Manipulation Tools

### Reading Frontmatter

Extract frontmatter from documentation files:

```typescript
import { readDocumentationPage, readSourceContext } from 'astro-ai-coauthor';

// Read entire page with frontmatter
const page = await readDocumentationPage('docs/api.md');
console.log(page.frontmatter);  // All frontmatter data
console.log(page.content);      // Markdown content

// Read just the source context
const sourceContext = await readSourceContext('docs/api.md', 'aiCoauthor');
if (sourceContext) {
  console.log(sourceContext.files);     // ['src/api.ts']
  console.log(sourceContext.confidence); // 'high'
}
```

### Writing Frontmatter

Update source context in frontmatter:

```typescript
import { updateSourceContext, saveSourceContext } from 'astro-ai-coauthor';

// Prepare source context
const sourceContext = {
  files: ['src/api/users.ts', 'src/types/user.ts'],
  folders: ['src/api'],
  globs: [],
  exclude: ['**/*.test.ts'],
  manual: false,
  confidence: 'high',
  lastUpdated: new Date().toISOString(),
};

// Save to documentation file
await saveSourceContext('docs/api/users.md', sourceContext);

// Or use the lower-level API
await updateSourceContext('docs/api/users.md', sourceContext, 'aiCoauthor');
```

### Removing Frontmatter

Clean up AI Coauthor data:

```typescript
import { removeAICoauthorData, removeAllSourceContexts } from 'astro-ai-coauthor';

// Remove from a single file
await removeAICoauthorData('docs/api.md', 'aiCoauthor');

// Remove from all files in a directory
const cleanedCount = await removeAllSourceContexts('./docs', 'aiCoauthor');
console.log(`Cleaned ${cleanedCount} files`);
```

## Batch Processing Pattern

Process all documentation files with source context detection:

```typescript
import {
  detectAllSourceContexts,
  saveSourceContext,
} from 'astro-ai-coauthor';

// Detect for all documentation files
const results = await detectAllSourceContexts(
  './docs',
  process.cwd(),
  {
    llmProvider: {
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4-turbo-preview',
    }
  }
);

// Save results to frontmatter
for (const [docPath, result] of results.entries()) {
  const fullPath = path.join('./docs', docPath);
  await saveSourceContext(fullPath, result.sourceContext);
  
  console.log(`${docPath}: ${result.confidence} confidence`);
  console.log(`  Files: ${result.sourceContext.files.join(', ')}`);
  console.log(`  Reasoning: ${result.reasoning[0]}`);
}
```

## Custom Traversal Script

Example script for custom processing:

```typescript
#!/usr/bin/env node
import { globby } from 'globby';
import path from 'node:path';
import {
  detectSourceContext,
  saveSourceContext,
  readDocumentationPage,
} from 'astro-ai-coauthor';

async function processDocumentation() {
  // Find all markdown files
  const docFiles = await globby('docs/**/*.{md,mdx}', {
    ignore: ['node_modules/**', 'dist/**'],
  });

  console.log(`Found ${docFiles.length} documentation files`);

  // Process each file
  for (const docFile of docFiles) {
    console.log(`\nProcessing: ${docFile}`);
    
    // Read the file
    const page = await readDocumentationPage(docFile);
    
    // Detect source context
    const result = await detectSourceContext(
      docFile,
      page.content,
      process.cwd(),
      {
        llmProvider: {
          type: 'openai',
          apiKey: process.env.OPENAI_API_KEY,
          model: 'gpt-4-turbo-preview',
        }
      }
    );

    // Save if high confidence
    if (result.confidence === 'high') {
      await saveSourceContext(docFile, result.sourceContext);
      console.log(`  ✓ Saved with high confidence`);
      console.log(`    Files: ${result.sourceContext.files.slice(0, 3).join(', ')}`);
    } else {
      console.log(`  ⚠ ${result.confidence} confidence - review manually`);
      console.log(`    Suggested: ${result.sourceContext.files.slice(0, 3).join(', ')}`);
    }
  }
}

processDocumentation().catch(console.error);
```

## Validation Tools

Validate source context references:

```typescript
import { validateSourceContext } from 'astro-ai-coauthor';

const sourceContext = {
  files: ['src/api.ts', 'src/missing.ts'],
  folders: ['src', 'src/nonexistent'],
  globs: [],
  exclude: [],
  manual: false,
};

const validation = await validateSourceContext(sourceContext, process.cwd());

if (!validation.valid) {
  console.error('Validation errors:');
  validation.errors.forEach(error => console.error(`  - ${error}`));
}
```

## File Tree Utilities

Additional utilities for working with file trees:

```typescript
import { buildFileTree, pathExists } from 'astro-ai-coauthor';

// Check if path exists
const exists = await pathExists('./src/api.ts');

// Get directory files
const files = await getDirectoryFiles('./src');
// => ['api.ts', 'index.ts', ...]

// Build filtered tree
const fileTree = await buildFileTree(
  './src',
  ['**/*.test.ts'],  // Exclude tests
  process.cwd()
);

// Recursive traversal
function printTree(node, indent = '') {
  console.log(indent + node.name);
  if (node.children) {
    node.children.forEach(child => printTree(child, indent + '  '));
  }
}

printTree(fileTree);
```

## Best Practices

### 1. Use Batch Processing for Initial Setup

```typescript
// One-time setup: detect and save all contexts
const results = await detectAllSourceContexts('./docs', process.cwd(), config);
for (const [path, result] of results) {
  if (result.confidence !== 'low') {
    await saveSourceContext(path, result.sourceContext);
  }
}
```

### 2. Incremental Updates

```typescript
// Update only changed files
const changedFiles = await getChangedDocFiles();
for (const file of changedFiles) {
  const content = await readDocumentationPage(file);
  const result = await detectSourceContext(file, content.content, cwd, config);
  await saveSourceContext(file, result.sourceContext);
}
```

### 3. Review Before Committing

```typescript
// Generate review report
const results = await detectAllSourceContexts('./docs', cwd, config);
for (const [path, result] of results) {
  if (result.confidence === 'low' || result.reasoning.includes('Error')) {
    console.warn(`⚠️ Review needed: ${path}`);
    console.warn(`   Confidence: ${result.confidence}`);
    console.warn(`   Reasoning: ${result.reasoning[0]}`);
  }
}
```

### 4. Validation Pipeline

```typescript
// Validate all source contexts before deployment
const docFiles = await globby('docs/**/*.md');
for (const file of docFiles) {
  const context = await readSourceContext(file);
  if (context) {
    const validation = await validateSourceContext(context, process.cwd());
    if (!validation.valid) {
      throw new Error(`Invalid context in ${file}: ${validation.errors.join(', ')}`);
    }
  }
}
```

## Integration with CI/CD

Example GitHub Actions workflow:

```yaml
name: Update Source Context

on:
  push:
    paths:
      - 'docs/**'
      - 'src/**'

jobs:
  update-context:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Update source contexts
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          node scripts/update-contexts.js
      
      - name: Commit changes
        run: |
          git config user.name "Bot"
          git config user.email "bot@example.com"
          git add docs/
          git diff --quiet && git diff --staged --quiet || \
            git commit -m "chore: update source context mappings"
          git push
```

## API Reference

See [API Documentation](./api.md) for complete API details.
