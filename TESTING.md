# Testing

This project uses [Vitest](https://vitest.dev/) for unit testing with comprehensive coverage requirements.

## Coverage Requirements

- **Statements**: 80%+ ✅ (Achieved: 100%)
- **Branches**: 80%+ ✅ (Achieved: 88.23%)
- **Functions**: 80%+ ✅ (Achieved: 100%)
- **Lines**: 80%+ ✅ (Achieved: 100%)

## Test Suites

### 1. Integration Tests (`integration.test.ts`)
Tests the main Astro integration functionality:
- Integration configuration and options
- Hook registration (`astro:config:setup`, `astro:build:done`)
- Script injection in development mode
- Route injection for feedback API and dashboard
- Build process handling

**Coverage**: 19 tests covering all integration scenarios

### 2. Feedback API Tests (`feedback-api.test.ts`)
Tests the API route endpoints:
- POST endpoint for saving feedback
- GET endpoint for retrieving feedback
- Validation of feedback data
- File system operations
- Error handling (read/write failures, JSON parsing)

**Coverage**: 11 tests covering all API scenarios

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run playground integration tests
npm run test:playground
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
