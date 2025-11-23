/**
 * Source Context Detection API
 * Main entry point for detecting and managing source context
 */

import * as path from 'node:path';
import { globby } from 'globby';
import { getLogger } from './logger.js';

const logger = getLogger();

import type {
  ContextDetectionResult,
  SourceContext,
  SourceContextConfig,
  LLMDetectionRequest,
} from '../types';
import { buildFileTree } from './file-tree.js';
import { ContextMatcher, extractKeywords, matchKeywordsToFiles } from './pattern-matcher';
import {
  readDocumentationPage,
  removeAICoauthorData,
} from './frontmatter';
import {
  saveSourceContext as saveToStorage,
  readSourceContext as readFromStorage,
} from './source-context-storage';
import { createLLMProvider, isLLMAvailable } from './llm/provider-factory';

const DEFAULT_CONFIG: SourceContextConfig = {
  enabled: true,
  autoDetect: true,
  projectRoot: './src',
  excludePatterns: ['**/*.test.ts', '**/*.spec.ts', '**/*.test.js', '**/*.spec.js'],
  confidenceThreshold: 0.6,
  frontmatterNamespace: 'aiCoauthor',
  fallbackToRules: true,
};

/**
 * Detect source context for a documentation page
 * 
 * @param docPath - Path to documentation file
 * @param docContent - Documentation content
 * @param projectRoot - Project root directory
 * @param config - Detection configuration
 * @returns Detection result with source context and reasoning
 */
export async function detectSourceContext(
  docPath: string,
  docContent: string,
  projectRoot: string,
  config: Partial<SourceContextConfig> = {}
): Promise<ContextDetectionResult> {
  logger.debug('source-detection', `Starting detection for ${docPath}`);
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  const { fileTree, availableFiles, availableFolders, title, body } = await prepareDetectionContext(
    docPath,
    docContent,
    projectRoot,
    fullConfig
  );
  
  // Try LLM-powered detection first if configured
  if (fullConfig.llmProvider) {
    const llmResult = await tryLLMDetection(
      fullConfig,
      projectRoot,
      docPath,
      body,
      title,
      availableFiles,
      availableFolders
    );
    
    if (llmResult) {
      return llmResult;
    }
  } else {
    logger.debug('source-detection', 'No LLM provider configured, using rule-based detection');
  }
  
  // Fallback to rule-based detection
  return performRuleBasedDetection(
    docPath,
    projectRoot,
    fileTree,
    body,
    title,
    availableFiles,
    fullConfig
  );
}

/**
 * Prepare detection context (file tree, available files, etc.)
 */
async function prepareDetectionContext(
  docPath: string,
  docContent: string,
  projectRoot: string,
  fullConfig: SourceContextConfig
) {
  logger.debug('source-detection', `Building file tree from ${fullConfig.projectRoot}`);
  const fileTree = await buildFileTree(
    fullConfig.projectRoot,
    fullConfig.excludePatterns,
    projectRoot
  );
  
  const { flattenFileTree, extractFolders } = await import('./file-tree.js');
  const availableFiles = flattenFileTree(fileTree);
  const availableFolders = extractFolders(fileTree);
  logger.debug('source-detection', `Found ${availableFiles.length} files, ${availableFolders.length} folders`);
  
  const matter = (await import('gray-matter')).default;
  const { data, content: body } = matter(docContent);
  const title = (data.title as string) || 'Untitled';
  logger.debug('source-detection', `Doc title: "${title}"`);
  
  return { fileTree, availableFiles, availableFolders, title, body };
}

/**
 * Attempt LLM-powered detection
 */
async function tryLLMDetection(
  fullConfig: SourceContextConfig,
  projectRoot: string,
  docPath: string,
  body: string,
  title: string,
  availableFiles: string[],
  availableFolders: string[]
): Promise<ContextDetectionResult | null> {
  const llmProvider = fullConfig.llmProvider;
  if (!llmProvider) {
    return null;
  }
  
  // Check if LLM provider is available (has API key) before attempting
  const llmAvailable = await isLLMAvailable(llmProvider, projectRoot);
  
  if (!llmAvailable) {
    logger.info('source-detection', `LLM provider ${llmProvider.type} not available (missing API key), using fallback`);
    return null;
  }
  
  logger.info('source-detection', `Attempting LLM-powered detection with ${llmProvider.type}`);
  logger.debug('source-detection', `LLM provider ${llmProvider.type} is available`);
  
  try {
      const provider = createLLMProvider(llmProvider, projectRoot);
      logger.debug('source-detection', 'LLM provider created successfully');
      
      const llmRequest: LLMDetectionRequest = {
        docPath,
        docContent: body,
        docTitle: title,
        availableFiles,
        availableFolders,
      };
      
      logger.debug('source-detection', `Calling LLM with content length: ${body.length} chars`);
      const llmResponse = await provider.detectSourceContext(llmRequest);
      
      logger.info(
        'source-detection',
        `LLM responded with confidence: ${llmResponse.confidence}, ` +
        `files: ${llmResponse.files.length}, folders: ${llmResponse.folders.length}` +
        `${llmResponse.cached ? ' (cached)' : ''}`
      );
      
      // Return LLM result if confidence is acceptable
      if (llmResponse.confidence !== 'low' || fullConfig.fallbackToRules === false) {
        return buildLLMResult(llmResponse, fullConfig);
      }
      
      logger.warn(
        'source-detection',
        `LLM confidence too low (${llmResponse.confidence}), falling back to rule-based detection`
      );
    } catch (error) {
      logger.error('source-detection', 'LLM detection failed:', error);
      if (fullConfig.fallbackToRules) {
        logger.info('source-detection', 'Falling back to rule-based detection');
      }
    }
  
  return null;
}

/**
 * Build LLM detection result
 */
function buildLLMResult(
  llmResponse: any,
  fullConfig: SourceContextConfig
): ContextDetectionResult {
  logger.success(
    'source-detection',
    `Using LLM result - confidence: ${llmResponse.confidence}, files: ${llmResponse.files.length}, folders: ${llmResponse.folders.length}`
  );
  logger.debug('source-detection', `LLM reasoning: ${llmResponse.reasoning.join('; ')}`);
  
  const sourceContext: SourceContext = {
    files: llmResponse.files,
    folders: llmResponse.folders,
    globs: [],
    exclude: fullConfig.excludePatterns,
    manual: false,
    confidence: llmResponse.confidence,
    lastUpdated: new Date().toISOString(),
  };
  
  return {
    sourceContext,
    confidence: llmResponse.confidence,
    reasoning: [
      `LLM-powered detection (${llmResponse.model})${llmResponse.cached ? ' [cached]' : ''}`,
      ...llmResponse.reasoning,
    ],
    suggestions: [],
  };
}

/**
 * Perform rule-based detection
 */
async function performRuleBasedDetection(
  docPath: string,
  projectRoot: string,
  fileTree: any,
  body: string,
  title: string,
  availableFiles: string[],
  fullConfig: SourceContextConfig
): Promise<ContextDetectionResult> {
  logger.info('source-detection', 'Using rule-based detection');
  
  const matcher = new ContextMatcher();
  const patternResult = await matcher.match(docPath, projectRoot, fileTree);
  
  const keywords = extractKeywords(body, title);
  const keywordMatches = matchKeywordsToFiles(keywords, availableFiles);
  
  const allFiles = new Set([
    ...patternResult.sourceContext.files,
    ...keywordMatches.slice(0, 5).map(m => m.file),
  ]);
  
  const reasoning = [
    'Rule-based detection',
    ...patternResult.reasoning,
    ...keywordMatches.slice(0, 3).map(m =>
      `Keyword match: ${m.matchedKeywords.join(', ')} → ${m.file}`
    ),
  ];
  
  const sourceContext: SourceContext = {
    files: Array.from(allFiles),
    folders: patternResult.sourceContext.folders,
    globs: [],
    exclude: fullConfig.excludePatterns,
    manual: false,
    confidence: patternResult.sourceContext.confidence,
    lastUpdated: new Date().toISOString(),
  };
  
  return {
    sourceContext,
    confidence: patternResult.sourceContext.confidence || 'low',
    reasoning,
    suggestions: keywordMatches.slice(5, 10).map(m => m.file),
  };
}

/**
 * Detect source context for all documentation pages
 * 
 * @param docsPath - Path to documentation directory
 * @param projectRoot - Project root directory
 * @param config - Detection configuration
 * @returns Map of doc path to detection result
 */
export async function detectAllSourceContexts(
  docsPath: string,
  projectRoot: string,
  config: Partial<SourceContextConfig> = {}
): Promise<Map<string, ContextDetectionResult>> {
  const results = new Map<string, ContextDetectionResult>();
  
  // Find all markdown files in docs
  const docFiles = await globby('**/*.{md,mdx}', {
    cwd: docsPath,
    ignore: ['node_modules/**', 'dist/**', 'coverage/**'],
  });
  
  // Process each file
  for (const docFile of docFiles) {
    const fullPath = path.join(docsPath, docFile);
    const content = await readDocumentationPage(fullPath);
    
    const result = await detectSourceContext(
      docFile,
      content.content,
      projectRoot,
      config
    );
    
    results.set(docFile, result);
  }
  
  return results;
}

/**
 * Validate source context for a documentation page
 * Check if referenced files/folders exist
 * 
 * @param context - Source context to validate
 * @param projectRoot - Project root directory
 * @returns Validation result with errors
 */
export async function validateSourceContext(
  context: SourceContext,
  projectRoot: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  const { pathExists } = await import('./file-tree.js');
  
  // Check files
  for (const file of context.files) {
    const fullPath = path.resolve(projectRoot, file);
    if (!(await pathExists(fullPath))) {
      errors.push(`File does not exist: ${file}`);
    }
  }
  
  // Check folders
  for (const folder of context.folders) {
    const fullPath = path.resolve(projectRoot, folder);
    if (!(await pathExists(fullPath))) {
      errors.push(`Folder does not exist: ${folder}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Update source context in documentation file
 * 
 * @param docPath - Path to documentation file
 * @param sourceContext - Source context to save
 * @param namespace - Frontmatter namespace
 */
export async function saveSourceContext(
  docPath: string,
  sourceContext: SourceContext,
  namespace: string = 'aiCoauthor'
): Promise<void> {
  await saveToStorage(docPath, sourceContext, namespace);
}

/**
 * Read source context from documentation file
 * 
 * @param docPath - Path to documentation file
 * @param namespace - Frontmatter namespace
 * @returns Source context or null if not found
 */
export async function loadSourceContext(
  docPath: string,
  namespace: string = 'aiCoauthor'
): Promise<SourceContext | null> {
  return readFromStorage(docPath, namespace);
}

/**
 * Remove all AI Coauthor data from documentation files
 * Used for clean uninstallation
 * 
 * @param docsPath - Path to documentation directory
 * @param namespace - Frontmatter namespace
 * @returns Number of files cleaned
 */
export async function removeAllSourceContexts(
  docsPath: string,
  namespace: string = 'aiCoauthor'
): Promise<number> {
  let cleanedCount = 0;
  
  // Find all markdown files
  const docFiles = await globby('**/*.{md,mdx}', {
    cwd: docsPath,
    ignore: ['node_modules/**', 'dist/**', 'coverage/**'],
  });
  
  // Remove from each file
  for (const docFile of docFiles) {
    const fullPath = path.join(docsPath, docFile);
    
    try {
      await removeAICoauthorData(fullPath, namespace);
      cleanedCount++;
    } catch (error: unknown) {
      logger.error('source-context', `Failed to clean ${docFile}`, error);
    }
  }
  
  return cleanedCount;
}

export { DEFAULT_CONFIG as defaultSourceContextConfig };
