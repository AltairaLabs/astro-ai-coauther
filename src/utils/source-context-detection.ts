/**
 * Source Context Detection API
 * Main entry point for detecting and managing source context
 */

import * as path from 'node:path';
import { globby } from 'globby';
import type {
  ContextDetectionResult,
  SourceContext,
  SourceContextConfig,
} from '../types';
import { buildFileTree } from './file-tree';
import { ContextMatcher, extractKeywords, matchKeywordsToFiles } from './pattern-matcher';
import {
  readSourceContext,
  updateSourceContext,
  readDocumentationPage,
  removeAICoauthorData,
} from './frontmatter';

const DEFAULT_CONFIG: SourceContextConfig = {
  enabled: true,
  autoDetect: true,
  projectRoot: './src',
  excludePatterns: ['**/*.test.ts', '**/*.spec.ts', '**/*.test.js', '**/*.spec.js'],
  confidenceThreshold: 0.6,
  frontmatterNamespace: 'aiCoauthor',
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
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Build file tree
  const fileTree = await buildFileTree(fullConfig.projectRoot, fullConfig.excludePatterns);
  
  // Create matcher with custom rules
  const matcher = new ContextMatcher();
  
  // Use pattern matching
  const patternResult = await matcher.match(docPath, projectRoot, fileTree);
  
  // Extract keywords and match to files
  const page = await readDocumentationPage(path.resolve(projectRoot, docPath));
  const keywords = extractKeywords(page.content, page.title);
  const keywordMatches = matchKeywordsToFiles(keywords, patternResult.sourceContext.files);
  
  // Combine results
  const allFiles = new Set([
    ...patternResult.sourceContext.files,
    ...keywordMatches.slice(0, 5).map(m => m.file), // Top 5 keyword matches
  ]);
  
  const reasoning = [
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
    suggestions: keywordMatches.slice(5, 10).map(m => m.file), // Next 5 as suggestions
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
  const { pathExists } = await import('./file-tree');
  
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
  await updateSourceContext(docPath, sourceContext, namespace);
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
  return readSourceContext(docPath, namespace);
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
      if (error instanceof Error) {
        console.error(`Failed to clean ${docFile}:`, error.message);
      }
    }
  }
  
  return cleanedCount;
}

export { DEFAULT_CONFIG as defaultSourceContextConfig };
