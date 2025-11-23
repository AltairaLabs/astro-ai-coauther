/**
 * Feedback Widget Client Script
 * 
 * Injects a feedback widget into documentation pages during development mode.
 * Allows developers to provide feedback on documentation quality and accuracy.
 */

import { FeedbackWidget } from './feedback-widget-core';

(function () {
  'use strict';

  // Only run in development mode
  if (import.meta.env.MODE !== 'development') {
    return;
  }

  const widget = new FeedbackWidget(document, globalThis as Window & typeof globalThis);
  widget.initialize();
})();
