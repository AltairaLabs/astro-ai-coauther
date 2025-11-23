import type { FeedbackStorageAdapter } from './storage';
import type { LLMProviderConfig } from './types';

export type LogLevel = 'none' | 'error' | 'warn' | 'info' | 'debug';

export interface LoggingConfig {
  level: LogLevel;
  prefix?: string;
}

declare global {
  var __ASTRO_COAUTHOR__: {
    storage: FeedbackStorageAdapter;
    llmProvider?: LLMProviderConfig;
    sourceRoot?: string;
    docsRoot?: string;
    logger?: any; // AstroIntegrationLogger from Astro
  };
}

// Declare HTML file imports as raw strings
declare module '*.html?raw' {
  const content: string;
  export default content;
}

export {};
