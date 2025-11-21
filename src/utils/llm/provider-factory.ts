/**
 * LLM Provider Factory
 * Creates and manages LLM providers for source context detection
 */

import type { LLMProvider, LLMProviderConfig } from '../../types';
import { OpenAIAgenticProvider } from './openai-provider-agentic';

/**
 * Create an LLM provider from configuration
 * 
 * @param config - Provider configuration
 * @param projectRoot - Root path of the project for filesystem tools
 */
export function createLLMProvider(
  config: LLMProviderConfig, 
  projectRoot: string
): LLMProvider {
  switch (config.type) {
    case 'openai':
      return new OpenAIAgenticProvider(config, projectRoot);
    
    case 'anthropic':
      throw new Error('Anthropic provider not yet implemented');
    
    case 'local':
      throw new Error('Local model provider not yet implemented');
    
    default:
      throw new Error(`Unknown LLM provider type: ${(config as any).type}`);
  }
}

/**
 * Check if an LLM provider is configured and available
 */
export async function isLLMAvailable(
  config?: LLMProviderConfig,
  projectRoot: string = process.cwd()
): Promise<boolean> {
  if (!config) {
    return false;
  }

  try {
    const provider = createLLMProvider(config, projectRoot);
    return await provider.isAvailable();
  } catch {
    return false;
  }
}
