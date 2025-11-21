/**
 * Pattern Matcher
 * Convention-based and keyword matching for source context detection
 */

import * as path from 'node:path';
import type { MatchRule, SourceContext, FileTree } from '../types';
import { getFilesMatching, flattenFileTree } from './file-tree';

/**
 * Context matcher for detecting source files from documentation pages
 */
export class ContextMatcher {
  private readonly rules: MatchRule[];
  
  constructor(customRules: MatchRule[] = []) {
    this.rules = [...DEFAULT_RULES, ...customRules];
  }
  
  /**
   * Add a custom matching rule
   */
  addRule(rule: MatchRule): void {
    this.rules.push(rule);
  }
  
  /**
   * Match documentation page to source context
   * 
   * @param docPath - Path to documentation file
   * @param projectRoot - Project root directory
   * @param fileTree - Project file tree
   * @returns Promise resolving to source context
   */
  async match(
    docPath: string,
    projectRoot: string,
    fileTree: FileTree
  ): Promise<{ sourceContext: SourceContext; confidence: number; reasoning: string[] }> {
    const reasoning: string[] = [];
    const files = new Set<string>();
    const folders = new Set<string>();
    let totalConfidence = 0;
    let ruleMatches = 0;
    
    // Get all available files
    const allFiles = flattenFileTree(fileTree);
    
    // Try each matching rule
    for (const rule of this.rules) {
      if (this.matchesPattern(docPath, rule.docPattern)) {
        ruleMatches++;
        totalConfidence += rule.confidence;
        
        await this.processRuleMatches(rule, allFiles, projectRoot, files, folders, reasoning);
      }
    }
    
    // Calculate average confidence
    const avgConfidence = ruleMatches > 0 ? totalConfidence / ruleMatches : 0;
    const confidence = this.getConfidenceLevel(avgConfidence);
    
    return {
      sourceContext: {
        files: Array.from(files),
        folders: Array.from(folders),
        globs: [],
        exclude: [],
        manual: false,
        confidence,
      },
      confidence: avgConfidence,
      reasoning,
    };
  }

  /**
   * Process matches for a single rule
   */
  private async processRuleMatches(
    rule: MatchRule,
    allFiles: string[],
    projectRoot: string,
    files: Set<string>,
    folders: Set<string>,
    reasoning: string[]
  ): Promise<void> {
    for (const sourcePattern of rule.sourcePatterns) {
      const matchedPaths = await this.findMatches(sourcePattern, allFiles, projectRoot);
      
      for (const matchedPath of matchedPaths) {
        if (matchedPath.endsWith('/')) {
          folders.add(matchedPath);
          reasoning.push(`Matched folder ${matchedPath} via rule: ${rule.docPattern}`);
        } else {
          files.add(matchedPath);
          reasoning.push(`Matched file ${matchedPath} via rule: ${rule.docPattern}`);
        }
      }
    }
  }
  
  /**
   * Check if path matches pattern
   */
  private matchesPattern(testPath: string, pattern: string | RegExp): boolean {
    if (pattern instanceof RegExp) {
      return pattern.test(testPath);
    }
    
    // Simple glob-style matching
    const regexPattern = pattern
      .replaceAll('\\', '\\\\')
      .replaceAll('.', String.raw`\.`)
      .replaceAll('*', '.*')
      .replaceAll('?', '.');
    
    return new RegExp(regexPattern, 'i').test(testPath);
  }
  
  /**
   * Find files matching a pattern
   */
  private async findMatches(
    pattern: string,
    allFiles: string[],
    projectRoot: string
  ): Promise<string[]> {
    // Check if pattern is a literal path
    if (!pattern.includes('*') && !pattern.includes('?')) {
      // Exact path - check if it exists
      if (allFiles.some(f => f === pattern || f.startsWith(`${pattern}/`))) {
        return [pattern];
      }
      return [];
    }
    
    // Glob pattern - use globby
    try {
      const matches = await getFilesMatching(pattern, projectRoot);
      return matches;
    } catch {
      // Fallback to simple matching
      const regex = new RegExp(
        pattern
          .replaceAll('\\', '\\\\')
          .replaceAll('.', String.raw`\.`)
          .replaceAll('**', '.*')
          .replaceAll('*', '[^/]*')
          .replaceAll('?', '[^/]'),
        'i'
      );
      
      return allFiles.filter(f => regex.test(f));
    }
  }
  
  /**
   * Convert numeric confidence to level
   */
  private getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.4) return 'medium';
    return 'low';
  }
}

/**
 * Default convention-based rules
 */
const DEFAULT_RULES: MatchRule[] = [
  // Getting started / installation docs
  {
    docPattern: /getting[_-]?started|installation|quick[_-]?start/i,
    sourcePatterns: ['README.md', 'src/index.ts', 'index.ts'],
    confidence: 0.8,
  },
  
  // Configuration docs
  {
    docPattern: /configuration|config|setup/i,
    sourcePatterns: ['*config*.ts', '*config*.js', 'src/types.ts', 'types.ts'],
    confidence: 0.8,
  },
  
  // API reference docs
  {
    docPattern: /\bapi\b/i,
    sourcePatterns: ['src/index.ts', 'index.ts', 'src/**/index.ts'],
    confidence: 0.7,
  },
  
  // Storage/adapters docs
  {
    docPattern: /storage|adapter/i,
    sourcePatterns: ['src/storage/', 'storage/'],
    confidence: 0.9,
  },
  
  // Development/contributing docs
  {
    docPattern: /development|contributing|dev/i,
    sourcePatterns: ['package.json', '.github/', 'scripts/'],
    confidence: 0.6,
  },
  
  // Testing docs
  {
    docPattern: /testing|test/i,
    sourcePatterns: ['**/*.test.ts', '**/*.spec.ts', 'vitest.config.ts', 'playwright.config.ts'],
    confidence: 0.7,
  },
  
  // Feature-specific docs (match by name)
  {
    docPattern: /([^/]+)\.md$/,
    sourcePatterns: ['src/$1.ts', 'src/$1/', 'src/**/$1.ts'],
    confidence: 0.5,
  },
];

/**
 * Extract keywords from documentation content
 * 
 * @param content - Documentation content
 * @param title - Page title
 * @returns Array of keywords
 */
export function extractKeywords(content: string, title: string): string[] {
  const keywords = new Set<string>();
  
  // Add title words
  title
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .forEach(word => keywords.add(word));
  
  // Extract code references (import statements)
  const importMatches = content.matchAll(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
  for (const match of importMatches) {
    const importPath = match[1];
    if (!importPath.startsWith('.') && !importPath.startsWith('@')) {
      continue; // Skip external imports
    }
    keywords.add(importPath);
  }
  
  // Extract heading keywords
  const headingMatches = content.matchAll(/^#{1,6}\s+(.+?)$/gm);
  for (const match of headingMatches) {
    const heading = match[1]
      .replaceAll(/[`*_]/g, '')
      .toLowerCase();
    
    heading
      .split(/\s+/)
      .filter(word => word.length > 3)
      .forEach(word => keywords.add(word));
  }
  
  return Array.from(keywords);
}

/**
 * Match keywords to file paths
 * 
 * @param keywords - Keywords to match
 * @param allFiles - All available file paths
 * @returns Matched file paths with confidence scores
 */
export function matchKeywordsToFiles(
  keywords: string[],
  allFiles: string[]
): Array<{ file: string; confidence: number; matchedKeywords: string[] }> {
  const matches: Array<{ file: string; confidence: number; matchedKeywords: string[] }> = [];
  
  for (const file of allFiles) {
    const fileName = path.basename(file, path.extname(file)).toLowerCase();
    const filePath = file.toLowerCase();
    const matchedKeywords: string[] = [];
    
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase();
      
      if (fileName.includes(lowerKeyword) || filePath.includes(lowerKeyword)) {
        matchedKeywords.push(keyword);
      }
    }
    
    if (matchedKeywords.length > 0) {
      // Confidence based on number of matches and file specificity
      const confidence = matchedKeywords.length / keywords.length;
      matches.push({ file, confidence, matchedKeywords });
    }
  }
  
  // Sort by confidence
  return matches.sort((a, b) => b.confidence - a.confidence);
}
