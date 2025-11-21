/**
 * OpenAI Agentic Provider for LLM-Powered Source Context Detection
 * Uses LangGraph's createReactAgent for autonomous filesystem exploration
 */

import { ChatOpenAI } from '@langchain/openai';
import { getLogger } from '../logger';

const logger = getLogger();
import type {
  LLMProvider,
  LLMDetectionRequest,
  LLMDetectionResponse,
  OpenAIConfig,
} from '../../types';
import { LLMCache } from './cache';
import { AgenticDetector } from './agentic-detector';

/**
 * OpenAI agentic provider implementation using LangGraph and PromptPack
 */
export class OpenAIAgenticProvider implements LLMProvider {
  readonly name = 'openai-agentic';
  private readonly config: OpenAIConfig;
  private readonly model: ChatOpenAI;
  private readonly cache?: LLMCache;
  private readonly detector: AgenticDetector;

  constructor(config: OpenAIConfig, projectRoot: string) {
    this.config = config;

    // Initialize LangChain ChatOpenAI
    this.model = new ChatOpenAI({
      modelName: config.model || 'gpt-4-turbo-preview',
      temperature: config.temperature ?? 0.1,
      maxTokens: config.maxTokens || 4000, // Increased for agent interactions
      openAIApiKey: config.apiKey,
      configuration: {
        organization: config.organization,
        baseURL: config.baseURL,
      },
    });

    // Initialize agentic detector
    this.detector = new AgenticDetector({
      projectRoot,
      modelName: config.model || 'gpt-4-turbo-preview',
    });

    // Initialize cache if enabled
    if (config.cacheResults !== false) {
      this.cache = new LLMCache(config.cacheTTL);
    }
  }

  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      return !!this.config.apiKey && this.config.apiKey.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Detect source context using agentic approach with filesystem tools
   */
  async detectSourceContext(
    request: LLMDetectionRequest
  ): Promise<LLMDetectionResponse> {
    // Check cache first
    if (this.cache) {
      const cached = this.cache.get(request);
      if (cached) {
        logger.success('llm-agentic', `Cache hit for ${request.docPath}`);
        return cached;
      }
    }

    // Use the agentic detector
    const result = await this.detector.detectSourceContext(this.model, request);

    // Cache the result
    if (this.cache && result.confidence !== 'low') {
      this.cache.set(request, result);
      logger.debug('llm-agentic', 'Result cached');
    }

    return result;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache?.getStats();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache?.clear();
  }
}

/**
 * Create OpenAI agentic provider from config
 */
export function createOpenAIAgenticProvider(
  config: OpenAIConfig,
  projectRoot: string
): OpenAIAgenticProvider {
  return new OpenAIAgenticProvider(config, projectRoot);
}
