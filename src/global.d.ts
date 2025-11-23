import type { FeedbackStorageAdapter } from './storage';
import type { LLMProviderConfig } from './types';

export type LogLevel = 'none' | 'error' | 'warn' | 'info' | 'debug';

export interface LoggingConfig {
  level: LogLevel;
  prefix?: string;
}

interface AstroIntegrationLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

declare global {
  var __ASTRO_COAUTHOR__: {
    storage: FeedbackStorageAdapter;
    llmProvider?: LLMProviderConfig;
    sourceRoot?: string;
    docsRoot?: string;
    logger?: AstroIntegrationLogger;
  } | undefined;
}

// Declare HTML file imports as raw strings
declare module '*.html?raw' {
  const content: string;
  export default content;
}

export {};
