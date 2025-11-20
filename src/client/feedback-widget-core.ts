/**
 * Core feedback widget functionality - exported for testing
 */

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
    const widgetHTML = `
      <div id="ai-coauthor-widget" style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <button id="ai-coauthor-toggle" style="
          background: #4F46E5;
          color: white;
          border: none;
          border-radius: 50%;
          width: 56px;
          height: 56px;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          font-size: 24px;
        ">
          💬
        </button>
        
        <div id="ai-coauthor-panel" style="
          display: none;
          position: absolute;
          bottom: 70px;
          right: 0;
          width: 320px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          padding: 20px;
        ">
          <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #1F2937;">
            📝 Doc Feedback
          </h3>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-size: 14px; color: #6B7280;">
              How helpful is this page?
            </label>
            <div id="ai-coauthor-rating" style="display: flex; gap: 8px;">
              <button class="rating-btn" data-rating="1">😞</button>
              <button class="rating-btn" data-rating="2">😐</button>
              <button class="rating-btn" data-rating="3">🙂</button>
              <button class="rating-btn" data-rating="4">😊</button>
              <button class="rating-btn" data-rating="5">🤩</button>
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-size: 14px; color: #6B7280;">
              Category
            </label>
            <select id="ai-coauthor-category" style="
              width: 100%;
              padding: 8px;
              border: 1px solid #D1D5DB;
              border-radius: 6px;
              font-size: 14px;
            ">
              <option value="general">General</option>
              <option value="accuracy">Accuracy</option>
              <option value="clarity">Clarity</option>
              <option value="completeness">Completeness</option>
              <option value="outdated">Outdated</option>
            </select>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-size: 14px; color: #6B7280;">
              Comments (optional)
            </label>
            <textarea id="ai-coauthor-comment" placeholder="What could be improved?" style="
              width: 100%;
              height: 80px;
              padding: 8px;
              border: 1px solid #D1D5DB;
              border-radius: 6px;
              font-size: 14px;
              resize: vertical;
            "></textarea>
          </div>

          <button id="ai-coauthor-submit" style="
            width: 100%;
            padding: 10px;
            background: #4F46E5;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
          ">
            Submit Feedback
          </button>

          <div id="ai-coauthor-status" style="
            margin-top: 12px;
            font-size: 13px;
            color: #059669;
            display: none;
          "></div>
        </div>
      </div>

      <style>
        .rating-btn {
          background: #F3F4F6;
          border: 2px solid transparent;
          border-radius: 8px;
          padding: 8px;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .rating-btn:hover {
          background: #E5E7EB;
        }
        .rating-btn.selected {
          border-color: #4F46E5;
          background: #EEF2FF;
        }
      </style>
    `;

    this.document.body.insertAdjacentHTML('beforeend', widgetHTML);
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const toggleBtn = this.document.getElementById('ai-coauthor-toggle');
    const panel = this.document.getElementById('ai-coauthor-panel');
    const submitBtn = this.document.getElementById('ai-coauthor-submit');
    const ratingBtns = this.document.querySelectorAll('.rating-btn');
    const categorySelect = this.document.getElementById('ai-coauthor-category');
    const commentTextarea = this.document.getElementById('ai-coauthor-comment');

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
    this.feedbackData = {
      pageUrl: this.window.location.pathname,
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

    const statusEl = this.document.getElementById('ai-coauthor-status');
    if (statusEl) statusEl.style.display = 'none';
  }

  public initialize(): void {
    if (this.document.readyState === 'loading') {
      this.document.addEventListener('DOMContentLoaded', () => this.createWidget());
    } else {
      this.createWidget();
    }
  }
}
