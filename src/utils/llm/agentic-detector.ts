/**
 * Agentic Source Context Detector
 * Provider-agnostic detection using LangGraph's ReAct agent
 */

import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { PromptPackRegistry, PromptPackTemplate } from '@promptpack/langchain';
import { HumanMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getLogger } from '../logger';
import type { LLMDetectionRequest, LLMDetectionResponse, ConfidenceLevel } from '../../types';
import { createFilesystemTools } from './tools';

const logger = getLogger();

/**
 * Configuration for the agentic detector
 */
export interface AgenticDetectorConfig {
  /** Project root for filesystem tools */
  projectRoot: string;
  /** Model name for logging/tracking */
  modelName: string;
}

/**
 * Agentic detector that works with any LangChain chat model
 */
export class AgenticDetector {
  private readonly template: PromptPackTemplate;
  private readonly projectRoot: string;
  private readonly modelName: string;

  constructor(config: AgenticDetectorConfig) {
    this.projectRoot = config.projectRoot;
    this.modelName = config.modelName;

    // Load PromptPack
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const packPath = path.resolve(__dirname, '../../../prompts/source-context-detection.json');
    const pack = PromptPackRegistry.loadFromFile(packPath);
    
    // Create template
    this.template = new PromptPackTemplate({
      pack,
      promptId: 'detect',
    });
  }

  /**
   * Detect source context using agentic approach with filesystem tools
   */
  async detectSourceContext(
    model: BaseChatModel,
    request: LLMDetectionRequest
  ): Promise<LLMDetectionResponse> {
    logger.start('llm-agentic', `Starting detection for: ${request.docPath}`);
    logger.debug('llm-agentic', `Content length: ${request.docContent.length} chars`);

    try {
      const allowedTools = this.prepareTools();
      const systemPrompt = await this.buildSystemPrompt(request);
      const agent = this.createAgent(model, allowedTools, systemPrompt);
      const result = await this.invokeAgent(agent);
      
      this.logAgentActivity(result);
      
      const finalContent = result.messages.at(-1)?.content as string || '';
      const parsed = this.parseLLMResponse(finalContent);
      const totalTokens = this.getActualTokenUsage(result.messages);

      return this.buildResponse(parsed, totalTokens);
    } catch (error) {
      return this.handleError(error, request.docPath);
    }
  }

  /**
   * Prepare and filter filesystem tools
   */
  private prepareTools() {
    const tools = createFilesystemTools(this.projectRoot);
    logger.debug('llm-agentic', `Created ${tools.length} filesystem tools`);
    
    const allowedTools = this.template.filterTools(tools);
    logger.info('llm-agentic', `Using ${allowedTools.length} allowed tools: ${allowedTools.map(t => t.name).join(', ')}`);
    
    return allowedTools;
  }

  /**
   * Build system prompt from request
   */
  private async buildSystemPrompt(request: LLMDetectionRequest): Promise<string> {
    const truncatedContent = request.docContent.length > 6000 
      ? request.docContent.slice(0, 6000) + '\n\n[... content truncated ...]'
      : request.docContent;

    const existingMappingSection = this.formatExistingMapping(request.existingMapping);

    const systemPromptValue = await this.template.formatPromptValue({
      docPath: request.docPath,
      docTitle: request.docTitle,
      docContent: truncatedContent,
      existingMappingSection,
    });

    const messages = systemPromptValue.toChatMessages();
    const systemMessage = messages.find(m => m.constructor.name === 'SystemMessage');
    return systemMessage?.content as string || '';
  }

  /**
   * Format existing mapping section for prompt
   */
  private formatExistingMapping(existingMapping?: { files: string[]; folders: string[] }): string {
    if (!existingMapping || (existingMapping.files.length === 0 && existingMapping.folders.length === 0)) {
      return '';
    }

    return `**Existing Mapping (for reference):**
Files: ${existingMapping.files.join(', ') || 'none'}
Folders: ${existingMapping.folders.join(', ') || 'none'}

Note: You may confirm, refine, or completely revise this mapping based on your analysis.

`;
  }

  /**
   * Create ReAct agent
   */
  private createAgent(model: BaseChatModel, tools: any[], systemPrompt: string) {
    logger.debug('llm-agentic', `Initializing ReAct agent with model: ${this.modelName}`);
    const agent = createReactAgent({
      llm: model,
      tools,
      messageModifier: systemPrompt,
    });
    logger.debug('llm-agentic', `Agent initialized, project root: ${this.projectRoot}`);
    return agent;
  }

  /**
   * Invoke agent with analysis request
   */
  private async invokeAgent(agent: any) {
    const userMessage = `Please analyze this documentation and identify the relevant source files and folders. Use your tools to explore the codebase as needed.

When you're ready with your analysis, provide your final answer as a JSON object with:
- files: array of file paths
- folders: array of folder paths  
- confidence: "high", "medium", or "low"
- reasoning: array of explanation strings

Be thorough but selective - only include clearly relevant files/folders.`;

    logger.start('llm-agentic', 'Invoking agent...');
    const startTime = Date.now();
    const result = await agent.invoke({
      messages: [new HumanMessage(userMessage)],
    });
    const duration = Date.now() - startTime;
    logger.success('llm-agentic', `Agent completed in ${duration}ms`);
    
    return result;
  }

  /**
   * Log agent activity and tool usage
   */
  private logAgentActivity(result: any): void {
    logger.debug('llm-agentic', `Agent returned ${result.messages.length} messages`);
    
    const toolMessages = result.messages.filter((m: any) => m._getType() === 'tool');
    const aiMessages = result.messages.filter((m: any) => m._getType() === 'ai');
    logger.debug('llm-agentic', `Tool calls: ${toolMessages.length}, AI responses: ${aiMessages.length}`);
    
    for (const msg of result.messages) {
      const toolCalls = msg.tool_calls;
      if (toolCalls && toolCalls.length > 0) {
        for (const tc of toolCalls) {
          const argsStr = JSON.stringify(tc.args);
          const preview = argsStr.length > 80 ? argsStr.substring(0, 80) + '...' : argsStr;
          logger.step('llm-agentic', `Tool: ${tc.name}(${preview})`);
        }
      }
    }
  }

  /**
   * Build final detection response
   */
  private buildResponse(parsed: any, totalTokens: number): LLMDetectionResponse {
    const result: LLMDetectionResponse = {
      files: parsed.files,
      folders: parsed.folders,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      model: this.modelName,
      tokensUsed: totalTokens,
      cached: false,
    };

    logger.success(
      'llm-agentic',
      `Detection complete - ` +
      `Files: ${result.files.length}, ` +
      `Folders: ${result.folders.length}, ` +
      `Confidence: ${result.confidence}, ` +
      `Tokens: ${totalTokens}`
    );
    logger.info('llm-agentic', `Reasoning: ${result.reasoning.join('; ')}`);

    return result;
  }

  /**
   * Handle detection errors
   */
  private handleError(error: unknown, docPath: string): LLMDetectionResponse {
    logger.error('llm-agentic', `Error processing ${docPath}:`, error);
    return {
      files: [],
      folders: [],
      confidence: 'low',
      reasoning: [`Error calling LLM agent: ${error instanceof Error ? error.message : 'Unknown error'}`],
      model: this.modelName,
      cached: false,
    };
  }

  /**
   * Get actual token usage from message history
   * Uses usage_metadata from AI messages when available
   */
  private getActualTokenUsage(messages: any[]): number {
    let totalTokens = 0;
    
    for (const msg of messages) {
      // Check if message has usage_metadata (AI messages from LangChain)
      if (msg.usage_metadata) {
        totalTokens += msg.usage_metadata.total_tokens || 0;
      }
    }
    
    // If no usage metadata found, fall back to rough estimation
    if (totalTokens === 0) {
      let totalChars = 0;
      for (const msg of messages) {
        if (typeof msg.content === 'string') {
          totalChars += msg.content.length;
        }
      }
      totalTokens = Math.ceil(totalChars / 4);
      logger.debug('llm-agentic', 'No usage_metadata found, using estimated tokens');
    }
    
    return totalTokens;
  }

  /**
   * Parse LLM response for source context detection
   */
  private parseLLMResponse(responseText: string): {
    files: string[];
    folders: string[];
    confidence: ConfidenceLevel;
    reasoning: string[];
  } {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonRegex1 = /```json\n([\s\S]*?)\n```/;
      const jsonRegex2 = /```\n([\s\S]*?)\n```/;
      const jsonMatch = jsonRegex1.exec(responseText) || jsonRegex2.exec(responseText);
      
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      const parsed = JSON.parse(jsonText.trim());

      // Validate and normalize the response
      return {
        files: Array.isArray(parsed.files) ? parsed.files : [],
        folders: Array.isArray(parsed.folders) ? parsed.folders : [],
        confidence: ['high', 'medium', 'low'].includes(parsed.confidence) 
          ? parsed.confidence 
          : 'low',
        reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning : [],
      };
    } catch (error) {
      // If parsing fails, return empty result with low confidence
      logger.error('llm-agentic', 'Failed to parse LLM response:', error);
      return {
        files: [],
        folders: [],
        confidence: 'low',
        reasoning: ['Failed to parse LLM response'],
      };
    }
  }
}
