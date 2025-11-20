# Testing

This project uses a comprehensive testing strategy:
- **[Vitest](https://vitest.dev/)** for unit testing
- **[Playwright](https://playwright.dev/)** for end-to-end testing

See also: [E2E Testing Guide](./docs/e2e-testing.md) for detailed E2E testing documentation.

## Coverage Requirements

- **Statements**: 80%+ ✅ (Achieved: 100%)
- **Branches**: 80%+ ✅ (Achieved: 88.23%)
- **Functions**: 80%+ ✅ (Achieved: 100%)
- **Lines**: 80%+ ✅ (Achieved: 100%)

## Test Suites

### Unit Tests (85 tests)

**1. Integration Tests** (`integration.test.ts`)
- Integration configuration and options
- Hook registration and lifecycle
- Script/route injection
- Build process handling

**2. Feedback API Tests** (`feedback-endpoint.test.ts`)
- POST/GET endpoint functionality
- Data validation and error handling
- Storage adapter integration

**3. Storage Tests** (`storage.test.ts`)
- File storage adapter operations
- Data persistence and retrieval
- Error scenarios

**4. Feedback Widget Tests** (`feedback-widget.test.ts`)
- Widget rendering and interactions
- Form validation
- API submission

**5. Export Tests** (`export.test.ts`) - NEW in v0.0.3
- Export to JSON, CSV, Markdown
- Filtering and data transformation
- Analytics generation
- Task generation

### E2E Tests (16 tests) - NEW in v0.0.3

**Dashboard Tests** (7 tests)
- Page loading and rendering
- Export button functionality
- Download verification
- Statistics display

**Feedback Widget Tests** (4 tests)
- Widget interactions
- Form submission
- Validation errors

**API Tests** (5 tests)
- Export endpoints
- Analytics endpoint
- Content-Type validation

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run playground integration tests
npm run test:playground
```

### E2E Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

### Run All Tests

```bash
# Run both unit and E2E tests
npm run test:all
```

## Test Structure

Tests are located in `src/__tests__/` and follow the naming convention `*.test.ts`.

### Mocking

The test suite mocks Node.js file system operations:
- `node:fs/promises` (readFile, writeFile)
- `node:fs` (existsSync)

This ensures tests run quickly without actual file I/O.

### Excluded from Coverage

The following files are excluded from coverage reporting:
- Client-side code (`src/client/**`) - requires browser environment
- Astro pages (`src/pages/**`) - tested via playground integration
- Test files themselves

## CI/CD Integration

The `prepublishOnly` script runs the full test suite:
```bash
npm run build && npm run test && npm run test:playground
```

This ensures all code is tested before publishing to npm.

## Writing New Tests

When adding new functionality:

1. Create a test file in `src/__tests__/`
2. Use descriptive `describe` blocks for test organization
3. Mock external dependencies (file system, network, etc.)
4. Test both success and error scenarios
5. Verify coverage meets 80%+ threshold

Example:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { myFunction } from '../my-module';

describe('My Module', () => {
  it('should do something', () => {
    const result = myFunction();
    expect(result).toBe('expected');
  });
  
  it('should handle errors', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

## Debugging Tests

To debug a specific test:

```bash
# Run a specific test file
npx vitest run src/__tests__/integration.test.ts

# Run tests matching a pattern
npx vitest run -t "Integration Configuration"

# Run with verbose output
npx vitest run --reporter=verbose
```
