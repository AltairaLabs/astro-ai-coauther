/**
 * Core feedback widget functionality - exported for testing
 * 
 * Architecture Decision: Vanilla JS + HTML Templates
 * 
 * This widget is built with vanilla JavaScript and HTML templates rather than
 * a framework (React, Preact, Svelte, etc.) for the following reasons:
 * 
 * 1. Zero runtime dependencies - No framework bundle shipped to users
 * 2. Framework agnostic - Works with any site (Astro, Next.js, plain HTML, etc.)
 * 3. No version conflicts - Users don't need React/etc. installed
 * 4. Minimal footprint - Keeps the injected script size small
 * 
 * Trade-offs:
 * - More verbose code (manual DOM manipulation, event listeners)
 * - Less maintainable as complexity grows
 * - No reactive state management or component lifecycle
 * 
 * Future consideration: If the widget grows significantly in complexity,
 * consider migrating to Preact (3KB, React-like API) or Lit (5KB, Web Components)
 * and bundling as a standalone script with all dependencies included.
 */

import widgetTemplate from './templates/widget.html?raw';

/**
 * Escape HTML special characters to prevent XSS attacks
 */
function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('/', '&#x2F;');
}

export interface FeedbackData {
  pageUrl: string;
  timestamp: string;
  rating: number | null;
  comment: string;
  category: string;
}

export class FeedbackWidget {
  private isWidgetVisible = false;
  private feedbackData: FeedbackData;
  private document: Document;
  private window: Window & typeof globalThis;

  constructor(doc: Document, win: Window & typeof globalThis) {
    this.document = doc;
    this.window = win;
    this.feedbackData = {
      pageUrl: win.location.pathname,
      timestamp: new Date().toISOString(),
      rating: null,
      comment: '',
      category: 'general',
    };
  }

  createWidget(): void {
    this.document.body.insertAdjacentHTML('beforeend', widgetTemplate);
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const toggleBtn = this.document.getElementById('ai-coauthor-toggle');
    const panel = this.document.getElementById('ai-coauthor-panel');
    const submitBtn = this.document.getElementById('ai-coauthor-submit');
    const ratingBtns = this.document.querySelectorAll('.rating-btn');
    const categorySelect = this.document.getElementById('ai-coauthor-category');
    const commentTextarea = this.document.getElementById('ai-coauthor-comment');
    const sourceDetectBtn = this.document.getElementById('source-detect-btn');
    const sourceSaveBtn = this.document.getElementById('source-save-btn');

    toggleBtn?.addEventListener('click', () => this.togglePanel(panel));

    for (const btn of ratingBtns) {
      btn.addEventListener('click', () => this.selectRating(btn as HTMLElement, ratingBtns));
    }

    categorySelect?.addEventListener('change', (e: Event) => {
      this.feedbackData.category = (e.target as HTMLSelectElement).value;
    });

    commentTextarea?.addEventListener('input', (e: Event) => {
      this.feedbackData.comment = (e.target as HTMLTextAreaElement).value;
    });

    submitBtn?.addEventListener('click', () => this.submitFeedback());
    
    // Source context buttons
    sourceDetectBtn?.addEventListener('click', () => this.detectSourceContext());
    sourceSaveBtn?.addEventListener('click', () => this.saveSourceContext());
    
    // Load current frontmatter when panel opens
    toggleBtn?.addEventListener('click', () => {
      if (this.isWidgetVisible) {
        this.loadCurrentFrontmatter();
      }
    });
  }

  private togglePanel(panel: HTMLElement | null): void {
    this.isWidgetVisible = !this.isWidgetVisible;
    if (panel) {
      panel.style.display = this.isWidgetVisible ? 'block' : 'none';
    }
  }

  private selectRating(btn: HTMLElement, allBtns: NodeListOf<Element>): void {
    for (const b of allBtns) {
      b.classList.remove('selected');
    }
    btn.classList.add('selected');
    this.feedbackData.rating = Number.parseInt(btn.dataset.rating || '0', 10);
  }

  private async submitFeedback(): Promise<void> {
    const statusEl = this.document.getElementById('ai-coauthor-status');
    
    if (!this.feedbackData.rating) {
      if (statusEl) {
        statusEl.textContent = '⚠️ Please select a rating';
        statusEl.style.color = '#DC2626';
        statusEl.style.display = 'block';
      }
      return;
    }

    try {
      const payload = {
        page: this.feedbackData.pageUrl,
        notes: this.feedbackData.comment,
        category: this.feedbackData.category,
        rating: this.feedbackData.rating,
      };

      console.debug('[astro-ai-coauthor] Submitting feedback payload:', payload);

      const response = await fetch('/_ai-coauthor/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.debug('[astro-ai-coauthor] Feedback submission response:', response.status);

      if (response.ok) {
        if (statusEl) {
          statusEl.textContent = '✓ Feedback submitted!';
          statusEl.style.color = '#059669';
          statusEl.style.display = 'block';
        }

        setTimeout(() => {
          const panel = this.document.getElementById('ai-coauthor-panel');
          if (panel) panel.style.display = 'none';
          this.isWidgetVisible = false;
          this.resetForm();
        }, 1500);
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('[astro-ai-coauthor] Error submitting feedback:', error);
      if (statusEl) {
        statusEl.textContent = '✗ Failed to submit';
        statusEl.style.color = '#DC2626';
        statusEl.style.display = 'block';
      }
    }
  }

  private resetForm(): void {
    // Wrap in try-catch to handle window being closed/destroyed during async operations
    // This happens in tests when setTimeout fires after test teardown closes the jsdom window
    try {
      this.feedbackData = {
        pageUrl: this.window?.location?.pathname || '',
        timestamp: new Date().toISOString(),
        rating: null,
        comment: '',
        category: 'general',
      };

      for (const btn of this.document.querySelectorAll('.rating-btn')) {
        btn.classList.remove('selected');
      }

      const commentTextarea = this.document.getElementById('ai-coauthor-comment') as HTMLTextAreaElement | null;
      if (commentTextarea) commentTextarea.value = '';

      const categorySelect = this.document.getElementById('ai-coauthor-category') as HTMLSelectElement | null;
      if (categorySelect) categorySelect.value = 'general';
    } catch (error) {
      // Silently ignore errors from accessing destroyed window/document
      // This is expected when setTimeout callbacks fire after environment cleanup (tests)
      // In production, this would only happen if the page is being navigated away
      if (error instanceof TypeError && error.message.includes('_location')) {
        // Expected: jsdom window was closed
        return;
      }
      // Re-throw unexpected errors
      throw error;
    }

    const statusEl = this.document.getElementById('ai-coauthor-status');
    if (statusEl) statusEl.style.display = 'none';
  }

  private currentSourceContext: any = null;

  private async loadCurrentFrontmatter(): Promise<void> {
    const frontmatterContent = this.document.getElementById('frontmatter-content');
    if (!frontmatterContent) return;
    
    try {
      const docPath = this.window?.location?.pathname || '';
      const response = await fetch(`/_ai-coauthor/get-frontmatter?path=${encodeURIComponent(docPath)}`);
      
      if (!response.ok) {
        frontmatterContent.textContent = 'No frontmatter found';
        frontmatterContent.style.fontStyle = 'italic';
        return;
      }
      
      const data = await response.json();
      const sourceContext = data.sourceContext;
      
      if (!sourceContext) {
        frontmatterContent.textContent = 'No source context mapped yet';
        frontmatterContent.style.fontStyle = 'italic';
        return;
      }
      
      // Display current mapping (even if empty arrays)
      const hasFiles = sourceContext.files?.length > 0;
      const hasFolders = sourceContext.folders?.length > 0;
      
      if (!hasFiles && !hasFolders) {
        frontmatterContent.innerHTML = `
          Files: <em>none</em><br>
          Folders: <em>none</em><br>
          <span style="color: #9CA3AF; font-size: 10px;">Confidence: ${sourceContext.confidence || 'unknown'}</span>
        `;
        frontmatterContent.style.fontStyle = 'normal';
        return;
      }
      
      const filesStr = hasFiles 
        ? `Files: ${sourceContext.files.map(f => escapeHtml(f)).join(', ')}` 
        : 'Files: <em>none</em>';
      const foldersStr = hasFolders 
        ? `Folders: ${sourceContext.folders.map(f => escapeHtml(f)).join(', ')}` 
        : 'Folders: <em>none</em>';
      
      frontmatterContent.innerHTML = `
        ${filesStr}<br>${foldersStr}
      `.trim();
      frontmatterContent.style.fontStyle = 'normal';
      
    } catch (error) {
      console.error('[frontmatter] Load error:', error);
      frontmatterContent.textContent = 'Failed to load';
      frontmatterContent.style.color = '#DC2626';
    }
  }

  private async detectSourceContext(): Promise<void> {
    const detectBtn = this.document.getElementById('source-detect-btn');
    const contentDiv = this.document.getElementById('source-context-content');
    const saveBtn = this.document.getElementById('source-save-btn');
    
    if (!detectBtn || !contentDiv) return;
    
    detectBtn.textContent = '🔍 Detecting...';
    (detectBtn as HTMLButtonElement).disabled = true;
    
    try {
      // Use textContent for compatibility with JSDOM in tests
      const pageContent = this.document.body.textContent || this.document.body.innerText || '';
      const payload = {
        docPath: this.window?.location?.pathname || '',
        docContent: pageContent.substring(0, 5000), // Limit content size
      };
      
      console.log('[source-context] Sending detection request:', { 
        docPath: payload.docPath, 
        contentLength: payload.docContent.length 
      });
      
      // Parse JSON body the same way as feedback endpoint
      const rawBody = JSON.stringify(payload);
      console.log('[source-context] Raw body length:', rawBody.length);
      
      const response = await fetch('/_ai-coauthor/detect-context', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: rawBody,
      });
      
      console.log('[source-context] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[source-context] Error response:', errorText);
        throw new Error(`Detection failed: ${response.status}`);
      }
      
      this.currentSourceContext = await response.json();
      console.log('[source-context] Detection result:', this.currentSourceContext);
      this.displaySourceContext(contentDiv, this.currentSourceContext);
      
      if (saveBtn) {
        (saveBtn as HTMLElement).style.display = 'block';
      }
    } catch (error) {
      console.error('[source-context] Error:', error);
      contentDiv.innerHTML = `<div style="color: #DC2626;">Failed to detect: ${escapeHtml(String(error))}</div>`;
    } finally {
      detectBtn.textContent = '🔍 Detect';
      (detectBtn as HTMLButtonElement).disabled = false;
    }
  }

  private displaySourceContext(container: HTMLElement, result: any): void {
    console.log('[source-context] Displaying result:', result);
    
    const files = result.sourceContext?.files || [];
    const folders = result.sourceContext?.folders || [];
    const confidence = result.confidence || 'low';
    const reasoning = result.reasoning || [];
    
    console.log('[source-context] Extracted data:', { files, folders, confidence, reasoning });
    
    const confidenceColors: Record<string, string> = {
      high: '#10B981',
      medium: '#F59E0B',
      low: '#EF4444',
    };
    
    const filesList = files.slice(0, 5).map((f: string) => `<li style="margin: 2px 0;">${escapeHtml(f)}</li>`).join('');
    const moreFiles = files.length > 5 ? `<li style="color: #9CA3AF;">+${files.length - 5} more...</li>` : '';
    const filesSection = files.length > 0 ? `
      <div style="margin-bottom: 6px; font-weight: 500; color: #374151;">Files:</div>
      <ul style="margin: 0 0 8px 0; padding-left: 20px; font-size: 11px; color: #6B7280;">
        ${filesList}${moreFiles}
      </ul>
    ` : '<div style="color: #9CA3AF; font-style: italic; margin-bottom: 8px;">No files detected</div>';
    
    const foldersSection = folders.length > 0 ? `
      <div style="margin-bottom: 6px; font-weight: 500; color: #374151;">Folders:</div>
      <ul style="margin: 0 0 8px 0; padding-left: 20px; font-size: 11px; color: #6B7280;">
        ${folders.map((f: string) => `<li style="margin: 2px 0;">${escapeHtml(f)}</li>`).join('')}
      </ul>
    ` : '';
    
    const reasoningSection = reasoning.length > 0 ? `
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">
        <div style="margin-bottom: 4px; font-weight: 500; color: #374151; font-size: 11px;">Reasoning:</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 10px; color: #6B7280;">
          ${reasoning.slice(0, 3).map((r: string) => `<li style="margin: 2px 0;">${escapeHtml(r)}</li>`).join('')}
        </ul>
      </div>
    ` : '';
    
    container.innerHTML = `
      <div style="margin-bottom: 8px;">
        <span style="
          display: inline-block;
          padding: 2px 8px;
          background: ${confidenceColors[confidence]}20;
          color: ${confidenceColors[confidence]};
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        ">
          ${confidence.toUpperCase()} CONFIDENCE
        </span>
      </div>
      ${filesSection}
      ${foldersSection}
      ${reasoningSection}
    `;
  }

  private async saveSourceContext(): Promise<void> {
    const saveBtn = this.document.getElementById('source-save-btn');
    const contentDiv = this.document.getElementById('source-context-content');
    
    if (!saveBtn || !this.currentSourceContext) return;
    
    saveBtn.textContent = '💾 Saving...';
    (saveBtn as HTMLButtonElement).disabled = true;
    
    try {
      const docPath = this.window?.location?.pathname || '';
      
      // Extract just the sourceContext from the detection result
      const contextToSave = this.currentSourceContext.sourceContext || this.currentSourceContext;
      
      const response = await fetch('/_ai-coauthor/save-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docPath,
          sourceContext: contextToSave,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save');
      }
      
      if (contentDiv) {
        const successMsg = this.document.createElement('div');
        successMsg.style.cssText = 'color: #10B981; font-weight: 500; margin-top: 8px; font-size: 11px;';
        successMsg.textContent = '✓ Saved to frontmatter!';
        contentDiv.appendChild(successMsg);
        
        setTimeout(() => successMsg.remove(), 3000);
      }
    } catch (error) {
      console.error('[source-context] Save error:', error);
      
      if (contentDiv) {
        const errorMsg = this.document.createElement('div');
        errorMsg.style.cssText = 'color: #EF4444; font-weight: 500; margin-top: 8px; font-size: 11px;';
        errorMsg.textContent = `✗ Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        contentDiv.appendChild(errorMsg);
        
        setTimeout(() => errorMsg.remove(), 5000);
      }
    } finally {
      saveBtn.textContent = '💾 Save';
      (saveBtn as HTMLButtonElement).disabled = false;
    }
  }

  public initialize(): void {
    if (this.document.readyState === 'loading') {
      this.document.addEventListener('DOMContentLoaded', () => this.createWidget());
    } else {
      this.createWidget();
    }
  }
}
