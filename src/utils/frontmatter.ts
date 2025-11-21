/**
 * Frontmatter Utilities
 * Read and write source context in documentation frontmatter
 */

import * as fs from 'node:fs/promises';
import matter from 'gray-matter';
import type { SourceContext, AICoauthorFrontmatter } from '../types';

const DEFAULT_NAMESPACE = 'aiCoauthor';

/**
 * Read source context from a documentation file
 * 
 * @param filePath - Path to documentation file
 * @param namespace - Frontmatter namespace (default: 'aiCoauthor')
 * @returns Source context or null if not found
 */
export async function readSourceContext(
  filePath: string,
  namespace: string = DEFAULT_NAMESPACE
): Promise<SourceContext | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(content);
    
    const aiData = data[namespace] as AICoauthorFrontmatter['aiCoauthor'];
    return aiData?.sourceContext ?? null;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Failed to read source context from ${filePath}:`, error.message);
    }
    return null;
  }
}

/**
 * Read all AI Coauthor data from frontmatter
 * 
 * @param filePath - Path to documentation file
 * @param namespace - Frontmatter namespace (default: 'aiCoauthor')
 * @returns AI Coauthor data or empty object
 */
export async function readAICoauthorData(
  filePath: string,
  namespace: string = DEFAULT_NAMESPACE
): Promise<AICoauthorFrontmatter['aiCoauthor']> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(content);
    
    return (data[namespace] as AICoauthorFrontmatter['aiCoauthor']) ?? {};
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Failed to read AI Coauthor data from ${filePath}:`, error.message);
    }
    return {};
  }
}

/**
 * Update source context in a documentation file
 * 
 * @param filePath - Path to documentation file
 * @param sourceContext - Source context to write
 * @param namespace - Frontmatter namespace (default: 'aiCoauthor')
 */
export async function updateSourceContext(
  filePath: string,
  sourceContext: SourceContext,
  namespace: string = DEFAULT_NAMESPACE
): Promise<void> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data, content: body } = matter(content);
    
    // Initialize namespace if needed
    if (!data[namespace]) {
      data[namespace] = {};
    }
    
    // Update source context with timestamp
    data[namespace].sourceContext = {
      ...sourceContext,
      lastUpdated: new Date().toISOString(),
    };
    
    // Write back to file - use default gray-matter stringify
    let updated = matter.stringify(body, data);
    
    // Post-process to ensure string values are quoted for Astro compatibility
    // This is necessary because Astro's frontmatter parser is stricter than standard YAML
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const frontmatterMatch = frontmatterRegex.exec(updated);
    if (frontmatterMatch) {
      let frontmatter = frontmatterMatch[1];
      
      // Quote unquoted string values (but not booleans, numbers, or arrays)
      const valueRegex = /^(\s*)([a-zA-Z_]\w*): ([^'"\n].*?)$/gm;
      frontmatter = frontmatter.replaceAll(valueRegex, (_match, indent, key, value) => {
        const trimmedValue = value.trim();
        // Don't quote if it's already quoted, a boolean, a number, or starts with object/array
        const startsWithQuote = /^['"]/.exec(trimmedValue);
        const isNumber = /^-?\d+(\.\d+)?$/.exec(trimmedValue);
        if (
          startsWithQuote || // already quoted
          trimmedValue === 'true' || trimmedValue === 'false' || // boolean
          trimmedValue === 'null' || trimmedValue === 'undefined' || // null/undefined
          isNumber || // number
          trimmedValue.startsWith('{') || trimmedValue.startsWith('[') // object/array
        ) {
          return `${indent}${key}: ${value}`;
        }
        // Quote the value
        return `${indent}${key}: '${trimmedValue}'`;
      });
      
      updated = `---\n${frontmatter}\n---${updated.slice(frontmatterMatch[0].length)}`;
    }
    
    await fs.writeFile(filePath, updated, 'utf-8');
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to update source context in ${filePath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Update related pages list in frontmatter
 * 
 * @param filePath - Path to documentation file
 * @param relatedPages - Array of related page paths
 * @param namespace - Frontmatter namespace (default: 'aiCoauthor')
 */
export async function updateRelatedPages(
  filePath: string,
  relatedPages: string[],
  namespace: string = DEFAULT_NAMESPACE
): Promise<void> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data, content: body } = matter(content);
    
    // Initialize namespace if needed
    if (!data[namespace]) {
      data[namespace] = {};
    }
    
    // Update related pages
    data[namespace].relatedPages = relatedPages;
    
    // Write back to file
    const updated = matter.stringify(body, data);
    await fs.writeFile(filePath, updated, 'utf-8');
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to update related pages in ${filePath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Remove AI Coauthor data from frontmatter
 * Used for clean uninstallation
 * 
 * @param filePath - Path to documentation file
 * @param namespace - Frontmatter namespace (default: 'aiCoauthor')
 */
export async function removeAICoauthorData(
  filePath: string,
  namespace: string = DEFAULT_NAMESPACE
): Promise<void> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data, content: body } = matter(content);
    
    // Remove namespace
    delete data[namespace];
    
    // Write back to file
    const updated = matter.stringify(body, data);
    await fs.writeFile(filePath, updated, 'utf-8');
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to remove AI Coauthor data from ${filePath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Check if a file has AI Coauthor data
 * 
 * @param filePath - Path to documentation file
 * @param namespace - Frontmatter namespace (default: 'aiCoauthor')
 * @returns True if namespace exists in frontmatter
 */
export async function hasAICoauthorData(
  filePath: string,
  namespace: string = DEFAULT_NAMESPACE
): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(content);
    
    return namespace in data;
  } catch {
    return false;
  }
}

/**
 * Read full documentation page with frontmatter
 * 
 * @param filePath - Path to documentation file
 * @returns Documentation page data
 */
export async function readDocumentationPage(
  filePath: string
): Promise<{
  path: string;
  title: string;
  content: string;
  frontmatter: Record<string, any>;
}> {
  const content = await fs.readFile(filePath, 'utf-8');
  const { data, content: body } = matter(content);
  
  return {
    path: filePath,
    title: data.title || 'Untitled',
    content: body,
    frontmatter: data,
  };
}
