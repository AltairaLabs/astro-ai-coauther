/**
 * LLM Provider Types
 * Type definitions for LLM-powered source context detection
 */

import type { SourceContext } from './source-context';

/**
 * Supported LLM providers
 */
export type LLMProviderType = 'openai' | 'anthropic' | 'local';

/**
 * Base LLM provider configuration
 */
export interface BaseLLMConfig {
  type: LLMProviderType;
  model: string;
  temperature?: number;
  maxTokens?: number;
  cacheResults?: boolean;
  cacheTTL?: number; // Cache time-to-live in seconds
}

/**
 * OpenAI provider configuration
 */
export interface OpenAIConfig extends BaseLLMConfig {
  type: 'openai';
  apiKey: string;
  organization?: string;
  baseURL?: string;
}

/**
 * Anthropic provider configuration
 */
export interface AnthropicConfig extends BaseLLMConfig {
  type: 'anthropic';
  apiKey: string;
}

/**
 * Local model provider configuration
 */
export interface LocalModelConfig extends BaseLLMConfig {
  type: 'local';
  endpoint: string;
  headers?: Record<string, string>;
}

/**
 * Union type for all LLM configurations
 */
export type LLMProviderConfig = OpenAIConfig | AnthropicConfig | LocalModelConfig;

/**
 * LLM detection request
 */
export interface LLMDetectionRequest {
  docPath: string;
  docContent: string;
  docTitle: string;
  availableFiles: string[];
  availableFolders: string[];
  existingMapping?: SourceContext;
}

/**
 * LLM detection response
 */
export interface LLMDetectionResponse {
  files: string[];
  folders: string[];
  confidence: import('./source-context').ConfidenceLevel;
  reasoning: string[];
  model: string;
  tokensUsed?: number;
  cached?: boolean;
}

/**
 * Cache entry for LLM results
 */
export interface LLMCacheEntry {
  request: LLMDetectionRequest;
  response: LLMDetectionResponse;
  timestamp: number;
  ttl: number;
}

/**
 * LLM provider interface
 */
export interface LLMProvider {
  /**
   * Provider name
   */
  readonly name: string;

  /**
   * Detect source context using LLM
   */
  detectSourceContext(request: LLMDetectionRequest): Promise<LLMDetectionResponse>;

  /**
   * Check if provider is available (e.g., API key is set)
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get cost estimate for a detection request
   */
  estimateCost?(request: LLMDetectionRequest): Promise<number>;
}

/**
 * Prompt template for source context detection
 */
export interface PromptTemplate {
  system: string;
  user: string;
  variables: string[];
}

/**
 * LLM detection statistics
 */
export interface LLMDetectionStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  totalCost: number;
  averageConfidence: number;
  providerBreakdown: Record<string, number>;
}
