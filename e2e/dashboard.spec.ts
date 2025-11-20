import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard before each test
    await page.goto('/_ai-coauthor/dashboard');
  });

  test('should load the dashboard page', async ({ page }) => {
    // Check that the dashboard title is present
    await expect(page.locator('h1')).toContainText('Feedback Dashboard');
    
    // Check that summary stats are visible
    await expect(page.locator('.stat-card').first()).toBeVisible();
  });

  test('should display export buttons', async ({ page }) => {
    // Check that all three export buttons exist
    const exportButtons = page.locator('button').filter({ hasText: /Export (JSON|CSV|Markdown)/ });
    await expect(exportButtons).toHaveCount(3);
    
    // Verify each button is visible
    await expect(page.getByRole('button', { name: 'Export JSON' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export Markdown' })).toBeVisible();
  });

  test('should trigger JSON export download', async ({ page }) => {
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click the Export JSON button
    await page.getByRole('button', { name: 'Export JSON' }).click();
    
    // Wait for download to start
    const download = await downloadPromise;
    
    // Verify the download has the correct filename
    expect(download.suggestedFilename()).toBe('feedback-export.json');
  });

  test('should trigger CSV export download', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    
    await page.getByRole('button', { name: 'Export CSV' }).click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('feedback-export.csv');
  });

  test('should trigger Markdown export download', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    
    await page.getByRole('button', { name: 'Export Markdown' }).click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('feedback-export.md');
  });

  test('should display empty state when no feedback', async ({ page }) => {
    // Check if empty state is visible (when there's no feedback)
    const emptyState = page.locator('.empty-state');
    
    // Either empty state is shown, or feedback list is shown
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasFeedback = await page.locator('.page-section').count() > 0;
    
    // One of them should be true
    expect(hasEmptyState || hasFeedback).toBeTruthy();
  });

  test('should display statistics correctly', async ({ page }) => {
    // Check that stat cards are present
    const statCards = page.locator('.stat-card');
    await expect(statCards).toHaveCount(4); // Total Feedback, Avg Rating, Pages, Categories
    
    // Verify stat labels (using .first() to handle multiple matches)
    await expect(page.locator('.stat-label', { hasText: 'Total Feedback' })).toBeVisible();
    await expect(page.locator('.stat-label', { hasText: 'Average Rating' })).toBeVisible();
    await expect(page.locator('.stat-label', { hasText: 'Pages with Feedback' })).toBeVisible();
    await expect(page.locator('.stat-label', { hasText: 'Categories' })).toBeVisible();
  });
});

test.describe('Feedback Widget E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display feedback widget button', async ({ page }) => {
    // Check that the feedback widget toggle button is visible
    const widgetButton = page.locator('#ai-coauthor-toggle');
    await expect(widgetButton).toBeVisible();
    
    // Verify it has the emoji
    await expect(widgetButton).toContainText('💬');
  });

  test('should open feedback panel when clicked', async ({ page }) => {
    const widgetButton = page.locator('#ai-coauthor-toggle');
    const panel = page.locator('#ai-coauthor-panel');
    
    // Panel should be hidden initially
    await expect(panel).toBeHidden();
    
    // Click to open
    await widgetButton.click();
    
    // Panel should now be visible
    await expect(panel).toBeVisible();
    
    // Check panel contains expected elements
    await expect(page.getByText('Doc Feedback')).toBeVisible();
    await expect(page.getByText('How helpful is this page?')).toBeVisible();
  });

  test('should submit feedback successfully', async ({ page }) => {
    // Open the widget
    await page.locator('#ai-coauthor-toggle').click();
    
    // Wait for panel to be visible
    await expect(page.locator('#ai-coauthor-panel')).toBeVisible();
    
    // Select a rating (click on a rating button)
    const ratingButtons = page.locator('.rating-btn');
    await ratingButtons.nth(4).click(); // Click 5-star rating
    
    // Select a category
    await page.locator('#ai-coauthor-category').selectOption('clarity');
    
    // Add a comment
    await page.locator('#ai-coauthor-comment').fill('Great documentation!');
    
    // Submit the feedback
    await page.locator('#ai-coauthor-submit').click();
    
    // Wait for success message
    await expect(page.locator('#ai-coauthor-status')).toContainText('Feedback submitted!');
  });

  test('should show validation error when no rating selected', async ({ page }) => {
    await page.locator('#ai-coauthor-toggle').click();
    await expect(page.locator('#ai-coauthor-panel')).toBeVisible();
    
    // Try to submit without selecting a rating
    await page.locator('#ai-coauthor-submit').click();
    
    // Should show error message
    await expect(page.locator('#ai-coauthor-status')).toContainText('Please select a rating');
  });
});

test.describe('Export API E2E Tests', () => {
  test('should return JSON export', async ({ request }) => {
    const response = await request.get('/_ai-coauthor/export?action=export&format=json');
    
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('application/json');
    
    const data = await response.json();
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('entries');
  });

  test('should return analytics data', async ({ request }) => {
    const response = await request.get('/_ai-coauthor/export?action=analytics');
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('totalFeedback');
    expect(data).toHaveProperty('averageRating');
    expect(data).toHaveProperty('categoryBreakdown');
    expect(data).toHaveProperty('pageBreakdown');
  });

  test('should return tasks data', async ({ request }) => {
    const response = await request.get('/_ai-coauthor/export?action=tasks');
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('tasks');
    expect(Array.isArray(data.tasks)).toBeTruthy();
  });

  test('should return CSV with correct content type', async ({ request }) => {
    const response = await request.get('/_ai-coauthor/export?action=export&format=csv');
    
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('text/csv');
    expect(response.headers()['content-disposition']).toContain('feedback-export.csv');
  });

  test('should return Markdown with correct content type', async ({ request }) => {
    const response = await request.get('/_ai-coauthor/export?action=export&format=markdown');
    
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('text/markdown');
    expect(response.headers()['content-disposition']).toContain('feedback-export.md');
  });
});
