# AI Coauthor Playground

This playground demonstrates the `astro-ai-coauthor` integration with a realistic example: a **Task Manager** library with its documentation site.

## Structure

```
playground/
├── code/              # Sample application code
│   ├── src/
│   │   ├── task-manager.ts    # Main TaskManager class
│   │   ├── types.ts           # TypeScript interfaces and enums
│   │   └── index.ts           # Public API exports
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
└── docs/              # Documentation site (Astro)
    ├── src/
    │   └── pages/
    │       ├── index.astro           # Home page
    │       ├── getting-started.astro # Installation & quick start
    │       ├── api.astro             # API reference
    │       └── source-context-demo.astro  # AI detection demo
    ├── astro.config.mjs
    ├── package.json
    └── tsconfig.json
```

## What This Demonstrates

This playground shows how `astro-ai-coauthor` can be used in a real-world scenario:

1. **Separate Code & Docs**: The `code/` folder contains a sample TypeScript library, while `docs/` contains the Astro documentation site
2. **Source Context Detection**: The AI integration automatically links documentation pages to relevant source code files
3. **Feedback Collection**: Users can provide feedback on documentation through the integrated widget
4. **LLM-Powered Analysis**: Uses OpenAI to intelligently map documentation to source code

## Running the Playground

### Setup

```bash
# From the playground root
cd docs
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

The site will be available at `http://localhost:4321`

### Configuration

The `docs/astro.config.mjs` file is configured to:

- Point to the `code/src` directory for source context detection
- Enable LLM-powered source mapping with OpenAI
- Store feedback in a local JSON file
- Enable debug logging

To use LLM features, copy `.env.example` to `.env` and add your OpenAI API key:

```bash
OPENAI_API_KEY=your-api-key-here
```

## Testing Features

1. **Visit the documentation**: Navigate through the getting started guide and API reference
2. **Try the feedback widget**: Click the 💬 button on any page to submit feedback
3. **View source mapping**: Check the source context detection demo page
4. **See the dashboard**: Visit `/_ai-coauthor/dashboard` to see all collected feedback

## About the Sample Code

The Task Manager library is a simple but complete example that includes:

- ✅ TypeScript classes and interfaces
- ✅ Enums for task status and priority
- ✅ CRUD operations for task management
- ✅ Filtering and search capabilities
- ✅ Statistics and analytics
- ✅ Comprehensive JSDoc comments

This provides a realistic codebase for the AI to analyze and map to documentation.

## How It Works

When you visit a documentation page:

1. The `astro-ai-coauthor` integration reads the page content
2. It uses an LLM (OpenAI) with a ReAct agent to:
   - Explore the source code structure
   - Read relevant files
   - Identify which source files are related to the documentation
3. The mapping is cached and displayed in the UI
4. Users can provide feedback, which is stored with the source context metadata

This demonstrates the core value proposition: automatically maintaining the connection between documentation and code as both evolve.
