import type { FeedbackStorageAdapter } from './storage';

declare global {
  // eslint-disable-next-line no-var
  var __ASTRO_COAUTHOR__: {
    storage: FeedbackStorageAdapter;
  };
}

export {};
