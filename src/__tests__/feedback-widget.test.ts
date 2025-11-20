/**
 * Tests for the Feedback Widget Core
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { FeedbackWidget } from '../client/feedback-widget-core';

describe('Feedback Widget', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window & typeof globalThis;
  let widget: FeedbackWidget;

  beforeEach(() => {
    // Create a new JSDOM instance
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost:3000/docs/test-page',
    });
    
    document = dom.window.document;
    window = dom.window as any;
    
    // Mock fetch globally for the widget to use
    (globalThis as any).fetch = vi.fn();
    
    // Create widget instance
    widget = new FeedbackWidget(document, window);
    widget.createWidget();
  });

  afterEach(() => {
    dom.window.close();
    vi.restoreAllMocks();
  });

  it('should create widget elements in the DOM', () => {
    
    const widget = document.getElementById('ai-coauthor-widget');
    expect(widget).toBeTruthy();
    
    const toggleBtn = document.getElementById('ai-coauthor-toggle');
    expect(toggleBtn).toBeTruthy();
    expect(toggleBtn?.textContent?.trim()).toBe('💬');
    
    const panel = document.getElementById('ai-coauthor-panel');
    expect(panel).toBeTruthy();
    expect(panel?.style.display).toBe('none');
  });

  it('should toggle panel visibility when clicking toggle button', () => {
    
    const toggleBtn = document.getElementById('ai-coauthor-toggle');
    const panel = document.getElementById('ai-coauthor-panel');
    
    expect(panel?.style.display).toBe('none');
    
    // Click to show
    toggleBtn?.click();
    expect(panel?.style.display).toBe('block');
    
    // Click to hide
    toggleBtn?.click();
    expect(panel?.style.display).toBe('none');
  });

  it('should select rating when clicking rating button', () => {
    
    const ratingBtns = document.querySelectorAll('.rating-btn');
    expect(ratingBtns.length).toBe(5);
    
    const btn3 = ratingBtns[2] as HTMLElement;
    btn3.click();
    
    expect(btn3.classList.contains('selected')).toBe(true);
    
    // Only one should be selected
    let selectedCount = 0;
    for (const btn of ratingBtns) {
      if (btn.classList.contains('selected')) selectedCount++;
    }
    expect(selectedCount).toBe(1);
  });

  it('should update category when selecting from dropdown', () => {
    
    const categorySelect = document.getElementById('ai-coauthor-category') as HTMLSelectElement;
    expect(categorySelect).toBeTruthy();
    
    categorySelect.value = 'accuracy';
    categorySelect.dispatchEvent(new window.Event('change'));
    
    expect(categorySelect.value).toBe('accuracy');
  });

  it('should update comment when typing in textarea', () => {
    
    const commentTextarea = document.getElementById('ai-coauthor-comment') as HTMLTextAreaElement;
    expect(commentTextarea).toBeTruthy();
    
    commentTextarea.value = 'Test comment';
    commentTextarea.dispatchEvent(new window.Event('input'));
    
    expect(commentTextarea.value).toBe('Test comment');
  });

  it('should show warning when submitting without rating', () => {
    
    const submitBtn = document.getElementById('ai-coauthor-submit');
    const statusEl = document.getElementById('ai-coauthor-status');
    
    submitBtn?.click();
    
    expect(statusEl?.textContent).toContain('Please select a rating');
    expect(statusEl?.style.color).toBe('rgb(220, 38, 38)');
    expect(statusEl?.style.display).toBe('block');
  });

  it('should have submit button that can be clicked', () => {
    
    // Select rating first
    const ratingBtns = document.querySelectorAll('.rating-btn');
    const btn5 = ratingBtns[4] as HTMLElement;
    btn5.click();
    expect(btn5.classList.contains('selected')).toBe(true);
    
    // Set category
    const categorySelect = document.getElementById('ai-coauthor-category') as HTMLSelectElement;
    categorySelect.value = 'clarity';
    categorySelect.dispatchEvent(new window.Event('change'));
    expect(categorySelect.value).toBe('clarity');
    
    // Set comment
    const commentTextarea = document.getElementById('ai-coauthor-comment') as HTMLTextAreaElement;
    commentTextarea.value = 'Great docs!';
    commentTextarea.dispatchEvent(new window.Event('input'));
    expect(commentTextarea.value).toBe('Great docs!');
    
    // Submit button exists and can be clicked
    const submitBtn = document.getElementById('ai-coauthor-submit');
    expect(submitBtn).toBeTruthy();
    expect(submitBtn?.textContent).toContain('Submit Feedback');
  });

  it('should have status element for displaying messages', () => {
    
    const statusEl = document.getElementById('ai-coauthor-status');
    expect(statusEl).toBeTruthy();
    expect(statusEl?.style.display).toBe('none'); // Initially hidden
  });

  it('should have correct panel structure with all form elements', () => {
    
    const panel = document.getElementById('ai-coauthor-panel');
    expect(panel).toBeTruthy();
    
    // Check all form elements exist
    expect(document.getElementById('ai-coauthor-rating')).toBeTruthy();
    expect(document.getElementById('ai-coauthor-category')).toBeTruthy();
    expect(document.getElementById('ai-coauthor-comment')).toBeTruthy();
    expect(document.getElementById('ai-coauthor-submit')).toBeTruthy();
    expect(document.getElementById('ai-coauthor-status')).toBeTruthy();
  });

  it('should allow multiple ratings to be selected sequentially', () => {
    
    const ratingBtns = document.querySelectorAll('.rating-btn');
    
    // Click through all ratings
    for (let i = 0; i < ratingBtns.length; i++) {
      (ratingBtns[i] as HTMLElement).click();
      expect(ratingBtns[i].classList.contains('selected')).toBe(true);
      
      // Check others are not selected
      for (let j = 0; j < ratingBtns.length; j++) {
        if (i !== j) {
          expect(ratingBtns[j].classList.contains('selected')).toBe(false);
        }
      }
    }
  });

  it('should initialize widget immediately when document is already loaded', () => {
    
    // Widget should be created immediately since readyState is 'complete'
    const widget = document.getElementById('ai-coauthor-widget');
    expect(widget).toBeTruthy();
    
    const toggleBtn = document.getElementById('ai-coauthor-toggle');
    expect(toggleBtn).toBeTruthy();
  });

  it('should have all rating buttons with correct data attributes', () => {
    
    const ratingBtns = document.querySelectorAll('.rating-btn');
    expect(ratingBtns.length).toBe(5);
    
    const ratings = Array.from(ratingBtns).map(btn => 
      (btn as HTMLElement).dataset.rating
    );
    
    expect(ratings).toEqual(['1', '2', '3', '4', '5']);
  });

  it('should have all category options available', () => {
    
    const categorySelect = document.getElementById('ai-coauthor-category') as HTMLSelectElement;
    const options = Array.from(categorySelect.options).map(opt => opt.value);
    
    expect(options).toContain('general');
    expect(options).toContain('accuracy');
    expect(options).toContain('clarity');
    expect(options).toContain('completeness');
    expect(options).toContain('outdated');
  });

  it('should deselect previous rating when selecting new one', () => {
    
    const ratingBtns = document.querySelectorAll('.rating-btn');
    
    // Select first rating
    (ratingBtns[0] as HTMLElement).click();
    expect(ratingBtns[0].classList.contains('selected')).toBe(true);
    
    // Select second rating
    (ratingBtns[1] as HTMLElement).click();
    expect(ratingBtns[0].classList.contains('selected')).toBe(false);
    expect(ratingBtns[1].classList.contains('selected')).toBe(true);
  });

  it('should handle category changes correctly', () => {
    
    const categorySelect = document.getElementById('ai-coauthor-category') as HTMLSelectElement;
    
    const categories = ['general', 'accuracy', 'clarity', 'completeness', 'outdated'];
    
    for (const category of categories) {
      categorySelect.value = category;
      categorySelect.dispatchEvent(new window.Event('change'));
      expect(categorySelect.value).toBe(category);
    }
  });

  it('should submit feedback with valid rating', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
    });
    
    // Select rating
    const ratingBtns = document.querySelectorAll('.rating-btn');
    (ratingBtns[4] as HTMLElement).click();
    
    // Submit
    const submitBtn = document.getElementById('ai-coauthor-submit');
    submitBtn?.click();
    
    // Wait for all promises
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
    
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/_ai-coauthor/feedback',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('should handle fetch errors during submission', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (globalThis.fetch as any).mockRejectedValueOnce(new Error('Network error'));
    
    // Select rating
    const ratingBtns = document.querySelectorAll('.rating-btn');
    (ratingBtns[2] as HTMLElement).click();
    
    // Submit
    const submitBtn = document.getElementById('ai-coauthor-submit');
    submitBtn?.click();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const statusEl = document.getElementById('ai-coauthor-status');
    expect(statusEl?.textContent).toContain('Failed to submit');
    expect(statusEl?.style.color).toBe('rgb(220, 38, 38)');
    
    consoleErrorSpy.mockRestore();
  });

  it('should handle non-ok response status', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    
    // Select rating
    const ratingBtns = document.querySelectorAll('.rating-btn');
    (ratingBtns[1] as HTMLElement).click();
    
    // Submit
    const submitBtn = document.getElementById('ai-coauthor-submit');
    submitBtn?.click();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const statusEl = document.getElementById('ai-coauthor-status');
    expect(statusEl?.textContent).toContain('Failed to submit');
  });

  it('should reset form after successful submission', async () => {
    vi.useFakeTimers();
    
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
    });
    
    // Open panel
    const toggleBtn = document.getElementById('ai-coauthor-toggle');
    toggleBtn?.click();
    
    // Fill form
    const ratingBtns = document.querySelectorAll('.rating-btn');
    (ratingBtns[3] as HTMLElement).click();
    
    const categorySelect = document.getElementById('ai-coauthor-category') as HTMLSelectElement;
    categorySelect.value = 'completeness';
    categorySelect.dispatchEvent(new window.Event('change'));
    
    const commentTextarea = document.getElementById('ai-coauthor-comment') as HTMLTextAreaElement;
    commentTextarea.value = 'Needs more examples';
    commentTextarea.dispatchEvent(new window.Event('input'));
    
    // Submit
    const submitBtn = document.getElementById('ai-coauthor-submit');
    submitBtn?.click();
    
    // Wait for promise to resolve
    await Promise.resolve();
    await Promise.resolve();
    
    // Now advance timers
    await vi.advanceTimersByTimeAsync(1500);
    
    // Check panel is hidden
    const panel = document.getElementById('ai-coauthor-panel');
    expect(panel?.style.display).toBe('none');
    
    // Check form is reset
    expect((ratingBtns[3] as HTMLElement).classList.contains('selected')).toBe(false);
    expect(categorySelect.value).toBe('general');
    expect(commentTextarea.value).toBe('');
    
    vi.useRealTimers();
  });

  it('should show success message after submission', async () => {
    vi.useFakeTimers();
    
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
    });
    
    // Select rating
    const ratingBtns = document.querySelectorAll('.rating-btn');
    (ratingBtns[4] as HTMLElement).click();
    
    // Submit
    const submitBtn = document.getElementById('ai-coauthor-submit');
    submitBtn?.click();
    
    await Promise.resolve();
    await Promise.resolve();
    
    const statusEl = document.getElementById('ai-coauthor-status');
    expect(statusEl?.textContent).toContain('Feedback submitted');
    expect(statusEl?.style.color).toBe('rgb(5, 150, 105)');
    expect(statusEl?.style.display).toBe('block');
    
    vi.useRealTimers();
  });

  it('should initialize widget when document is ready', () => {
    const dom2 = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    const doc2 = dom2.window.document;
    const win2 = dom2.window as any;
    
    Object.defineProperty(doc2, 'readyState', {
      writable: true,
      value: 'complete'
    });
    
    const widget2 = new FeedbackWidget(doc2, win2);
    widget2.initialize();
    
    const widgetEl = doc2.getElementById('ai-coauthor-widget');
    expect(widgetEl).toBeTruthy();
    
    dom2.window.close();
  });

  it('should initialize widget on DOMContentLoaded when loading', () => {
    const dom2 = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    const doc2 = dom2.window.document;
    const win2 = dom2.window as any;
    
    Object.defineProperty(doc2, 'readyState', {
      writable: true,
      value: 'loading'
    });
    
    const widget2 = new FeedbackWidget(doc2, win2);
    widget2.initialize();
    
    // Widget not created yet
    let widgetEl = doc2.getElementById('ai-coauthor-widget');
    expect(widgetEl).toBeNull();
    
    // Trigger DOMContentLoaded
    const event = new dom2.window.Event('DOMContentLoaded');
    doc2.dispatchEvent(event);
    
    // Now widget should exist
    widgetEl = doc2.getElementById('ai-coauthor-widget');
    expect(widgetEl).toBeTruthy();
    
    dom2.window.close();
  });
});
