import type { FeedbackStorageAdapter } from './storage';

declare global {
  // eslint-disable-next-line no-var
  var __ASTRO_COAUTHOR__: {
    storage: FeedbackStorageAdapter;
  };
}

// Declare HTML file imports as raw strings
declare module '*.html?raw' {
  const content: string;
  export default content;
}

export {};
