# Development Guide

## 🧪 Development & Testing

This project includes a playground for testing the integration during development.

## Clone and Setup

```bash
# Clone the repository
git clone https://github.com/altairalabs/astro-ai-coauthor.git
cd astro-ai-coauthor

# Install dependencies
npm install

# Build the integration
npm run build
```

## Testing with the Playground

The `/playground` directory contains a test Astro site:

```bash
# Install playground dependencies
cd playground
npm install

# Start the playground dev server
npm run dev
```

Then visit:
- **`http://localhost:4321/`** - Playground home
- **`http://localhost:4321/demo`** - Demo page with sample documentation
- **`http://localhost:4321/_ai-coauthor/dashboard`** - View collected feedback

The playground imports the integration from `../dist/index.js`, so make sure to rebuild the main package (`npm run build` in the root) after making changes.

## Development Workflow

1. Make changes to the integration source in `/src`
2. Run `npm run build` (or `npm run dev` for watch mode)
3. Test changes in the playground
4. Submit feedback using the widget
5. View results in the dashboard

## Running Tests

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Linting

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

## Project Structure

```
astro-ai-coauthor/
├── src/
│   ├── index.ts                    # Main integration entry point
│   ├── storage/                    # Storage adapters
│   │   ├── FeedbackStorageAdapter.ts
│   │   ├── FileStorageAdapter.ts
│   │   └── index.ts
│   ├── virtual/                    # Virtual API endpoints
│   │   └── feedback-endpoint.ts
│   ├── client/
│   │   └── feedback-widget.ts      # Feedback widget UI
│   ├── pages/
│   │   └── _ai-coauthor/
│   │       └── dashboard.astro     # Dashboard page
│   └── __tests__/                  # Test files
│       ├── integration.test.ts
│       ├── storage.test.ts
│       └── feedback-endpoint.test.ts
├── playground/                      # Test site
├── docs/                           # Documentation
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions CI
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .eslintrc.json
└── sonar-project.properties
```

## Debugging

See [DEBUGGING.md](../DEBUGGING.md) for detailed debugging instructions.

## Contributing

Contributions are welcome! Please test your changes using the playground before submitting a PR.

### Before Submitting a PR

1. Run tests: `npm test`
2. Run linter: `npm run lint`
3. Test in playground: `cd playground && npm run dev`
4. Update documentation if needed
