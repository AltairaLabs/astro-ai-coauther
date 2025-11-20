# E2E Testing Guide

This project uses [Playwright](https://playwright.dev/) for end-to-end testing to ensure the UI and user interactions work correctly.

## Why E2E Tests?

E2E tests complement unit tests by:
- **Testing real user interactions** (button clicks, form submissions)
- **Validating the entire stack** (frontend + backend integration)
- **Catching UI issues** that unit tests miss (like broken event handlers)
- **Verifying downloads** and file exports work correctly

## Running E2E Tests

### Locally

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with UI mode (interactive debugging)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/dashboard.spec.ts

# Run specific test by name
npx playwright test -g "should trigger JSON export"
```

### In CI/CD

E2E tests run automatically in GitHub Actions on:
- Every push to `main`
- Every pull request

See `.github/workflows/e2e.yml` for the CI configuration.

## Test Structure

### Test Files

Tests are located in the `e2e/` directory:

```
e2e/
  └── dashboard.spec.ts    # Dashboard and widget E2E tests
```

### Test Categories

**Dashboard Tests**
- Page loading and rendering
- Export button visibility
- Export downloads (JSON, CSV, Markdown)
- Statistics display
- Empty state handling

**Feedback Widget Tests**
- Widget button visibility
- Panel open/close interaction
- Form validation
- Feedback submission
- Success/error messages

**API Tests**
- Export endpoint responses
- Analytics endpoint
- Tasks endpoint
- Content-Type headers
- Download headers

## Writing New E2E Tests

### Basic Test Example

```typescript
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  // Navigate to page
  await page.goto('/your-page');
  
  // Interact with elements
  await page.getByRole('button', { name: 'Click Me' }).click();
  
  // Assert expectations
  await expect(page.getByText('Success!')).toBeVisible();
});
```

### Testing Downloads

```typescript
test('should download file', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download');
  
  await page.getByRole('button', { name: 'Download' }).click();
  
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('file.json');
});
```

### Testing API Endpoints

```typescript
test('should return correct data', async ({ request }) => {
  const response = await request.get('/api/endpoint');
  
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('application/json');
  
  const data = await response.json();
  expect(data).toHaveProperty('key');
});
```

## Configuration

Playwright configuration is in `playwright.config.ts`:

- **Browser**: Chromium (for CI compatibility)
- **Base URL**: `http://localhost:4321`
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Web Server**: Automatically starts `playground` dev server

## Debugging Failed Tests

### View Test Reports

After a test run:

```bash
npx playwright show-report
```

### View Screenshots

Failed tests automatically capture screenshots in:
```
test-results/
  └── <test-name>/
      └── test-failed-1.png
```

### Run in Debug Mode

```bash
npx playwright test --debug
```

This opens the Playwright Inspector for step-by-step debugging.

### Run in UI Mode

```bash
npm run test:e2e:ui
```

Interactive UI for exploring and debugging tests.

## CI/CD Integration

### GitHub Actions Workflow

The E2E workflow (`.github/workflows/e2e.yml`) runs:

1. Checkout code
2. Install dependencies (root + playground)
3. Build the integration
4. Install Playwright browsers
5. Run E2E tests
6. Upload screenshots/reports on failure

### Artifacts on Failure

When tests fail in CI, screenshots and reports are uploaded as artifacts for debugging.

## Best Practices

### Do's ✅

- Test user-facing features and critical paths
- Use semantic locators (`getByRole`, `getByText`)
- Wait for elements to be visible before interacting
- Test both happy paths and error cases
- Keep tests independent (no shared state)

### Don'ts ❌

- Don't rely on CSS selectors that might change
- Don't add arbitrary `wait()` calls (use `waitFor` instead)
- Don't test internal implementation details
- Don't make tests dependent on each other
- Don't duplicate what unit tests already cover

## Coverage

### What E2E Tests Cover

- ✅ **UI rendering** (Astro components)
- ✅ **User interactions** (clicks, form submissions)
- ✅ **Client-side JavaScript** (inline scripts, event handlers)
- ✅ **API integration** (endpoints returning data)
- ✅ **Downloads** (file exports)

### What Unit Tests Cover

- ✅ **Business logic** (utility functions)
- ✅ **Data transformations** (export formats, analytics)
- ✅ **API handlers** (request/response logic)
- ✅ **Storage adapters** (file operations)
- ✅ **Edge cases** (error handling, validation)

## Test Metrics

Current E2E test count: **16 tests**

- Dashboard tests: 7
- Feedback widget tests: 4
- API tests: 5

Combined with unit tests: **101 total tests** (85 unit + 16 E2E)

## Troubleshooting

### Port Already in Use

If you see "Port 4321 is in use":

```bash
# Kill existing process
lsof -ti:4321 | xargs kill -9

# Or use a different port in playwright.config.ts
```

### Timeout Errors

If tests timeout:

1. Increase timeout in `playwright.config.ts`
2. Check if dev server is slow to start
3. Verify network requests aren't hanging

### Flaky Tests

If tests are inconsistent:

1. Add explicit `waitFor` conditions
2. Check for race conditions
3. Ensure proper cleanup between tests
4. Use `test.describe.serial()` if order matters

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [CI Configuration Guide](https://playwright.dev/docs/ci)
- [Debugging Guide](https://playwright.dev/docs/debug)
