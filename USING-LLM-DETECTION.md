# Using LLM Source Context Detection

## Quick Setup

1. **Install the integration** (already done if you're using astro-ai-coauthor)

2. **Configure in astro.config.mjs**:

```javascript
import { defineConfig } from 'astro/config';
import astroAICoauthor from 'astro-ai-coauthor';

export default defineConfig({
  integrations: [
    astroAICoauthor({
      enableFeedbackWidget: true,
      
      // Add LLM configuration
      llmProvider: {
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4-turbo-preview',  // or 'gpt-3.5-turbo'
        cacheResults: true,
      },
      
      sourceRoot: './src',     // Where your code is
      docsRoot: 'src/pages',   // Where your docs are
    }),
  ],
});
```

3. **Set environment variable**:

```bash
# Add to .env
OPENAI_API_KEY=sk-...
```

## Using the Widget

1. **Start dev server**: `npm run dev`

2. **Open any documentation page**

3. **Click the feedback widget** (bottom right)

4. **Click "🔍 Detect" button** in the Source Context section

5. The agent will:
   - Explore your codebase using filesystem tools
   - Read relevant files
   - Analyze which source files match the documentation
   - Show results with confidence level and reasoning

6. **Click "💾 Save"** to store the mapping in frontmatter

## Using the Dashboard

1. **Navigate to**: `http://localhost:4321/_ai-coauthor/dashboard`

2. **Find the "🤖 AI Source Context Detection" section** (green box at top)

3. **Click "🔍 Detect All Pages"**

4. The system will:
   - Find all documentation pages
   - Run the agentic LLM on each page
   - Show results for all pages with confidence levels

5. Review the results and save mappings as needed

## Cost Estimation

- **GPT-4 Turbo**: ~$0.02-0.05 per page (first detection)
- **GPT-3.5 Turbo**: ~$0.001-0.003 per page (first detection)
- **With caching**: Nearly free for subsequent detections within TTL

## How It Works

The agentic implementation:

1. **Receives** documentation content and instructions
2. **Explores** codebase using tools:
   - `list_source_files` - Lists all files
   - `list_folders` - Gets folder structure
   - `read_file` - Reads file contents
   - `find_files` - Searches by name
   - `list_folder_contents` - Browses directories
3. **Analyzes** and builds context through multiple tool interactions
4. **Returns** results with confidence and detailed reasoning

## Without LLM (Fallback)

If you don't configure `llmProvider`, the system falls back to rule-based detection:
- Pattern matching (file/folder names in docs)
- Keyword matching
- Convention-based detection

## Examples

See:
- `/examples/llm-agentic-detection.md` - Detailed API documentation
- `/examples/astro-config-llm.mjs` - Configuration example
