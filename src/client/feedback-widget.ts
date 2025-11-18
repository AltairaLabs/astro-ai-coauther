/**
 * Feedback Widget Client Script
 * 
 * Injects a feedback widget into documentation pages during development mode.
 * Allows developers to provide feedback on documentation quality and accuracy.
 */

interface FeedbackData {
  pageUrl: string;
  timestamp: string;
  rating: number | null;
  comment: string;
  category: string;
}

(function () {
  'use strict';

  // Only run in development mode
  if (import.meta.env.MODE !== 'development') {
    return;
  }

  console.log('[astro-ai-coauthor] Initializing feedback widget');

  // Widget state
  let isWidgetVisible = false;
  let feedbackData: FeedbackData = {
    pageUrl: globalThis.location.pathname,
    timestamp: new Date().toISOString(),
    rating: null,
    comment: '',
    category: 'general',
  };

  /**
   * Create and inject the feedback widget HTML
   */
  function createWidget() {
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

    document.body.insertAdjacentHTML('beforeend', widgetHTML);
    attachEventListeners();
  }

  /**
   * Attach event listeners to widget elements
   */
  function attachEventListeners() {
    const toggleBtn = document.getElementById('ai-coauthor-toggle');
    const panel = document.getElementById('ai-coauthor-panel');
    const submitBtn = document.getElementById('ai-coauthor-submit');
    const ratingBtns = document.querySelectorAll('.rating-btn');
    const categorySelect = document.getElementById('ai-coauthor-category');
    const commentTextarea = document.getElementById('ai-coauthor-comment');

    // Toggle panel visibility
    toggleBtn?.addEventListener('click', () => {
      isWidgetVisible = !isWidgetVisible;
      if (panel) {
        panel.style.display = isWidgetVisible ? 'block' : 'none';
      }
    });

    // Rating selection
    for (const btn of ratingBtns) {
      btn.addEventListener('click', () => {
        for (const b of ratingBtns) {
          b.classList.remove('selected');
        }
        btn.classList.add('selected');
        feedbackData.rating = Number.parseInt(btn.dataset.rating || '0', 10);
      });
    }

    // Category selection
    categorySelect?.addEventListener('change', (e: Event) => {
      feedbackData.category = (e.target as HTMLSelectElement).value;
    });

    // Comment input
    commentTextarea?.addEventListener('input', (e: Event) => {
      feedbackData.comment = (e.target as HTMLTextAreaElement).value;
    });

    // Submit feedback
    submitBtn?.addEventListener('click', submitFeedback);
  }

  /**
   * Submit feedback to the server
   */
  async function submitFeedback() {
    const statusEl = document.getElementById('ai-coauthor-status');
    
    if (!feedbackData.rating) {
      if (statusEl) {
        statusEl.textContent = '⚠️ Please select a rating';
        statusEl.style.color = '#DC2626';
        statusEl.style.display = 'block';
      }
      return;
    }

    try {
      // Send feedback to API endpoint
      const payload = {
        page: feedbackData.pageUrl,
        notes: feedbackData.comment,
        category: feedbackData.category,
        rating: feedbackData.rating,
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

        // Reset form
        setTimeout(() => {
          const panel = document.getElementById('ai-coauthor-panel');
          if (panel) panel.style.display = 'none';
          isWidgetVisible = false;
          resetForm();
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

  /**
   * Reset the feedback form
   */
  function resetForm() {
    feedbackData = {
      pageUrl: globalThis.location.pathname,
      timestamp: new Date().toISOString(),
      rating: null,
      comment: '',
      category: 'general',
    };

    for (const btn of document.querySelectorAll('.rating-btn')) {
      btn.classList.remove('selected');
    }

    const commentTextarea = document.getElementById('ai-coauthor-comment') as HTMLTextAreaElement | null;
    if (commentTextarea) commentTextarea.value = '';

    const categorySelect = document.getElementById('ai-coauthor-category') as HTMLSelectElement | null;
    if (categorySelect) categorySelect.value = 'general';

    const statusEl = document.getElementById('ai-coauthor-status');
    if (statusEl) statusEl.style.display = 'none';
  }

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
