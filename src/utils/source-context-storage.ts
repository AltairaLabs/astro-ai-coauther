/**
 * Source Context Storage Manager
 * Routes storage operations to appropriate handler based on file type
 */

import type { SourceContext } from '../types';
import { updateSourceContext as updateFrontmatter, readSourceContext as readFrontmatter } from './frontmatter';
import { AstroComponentMetadata } from './astro-component-metadata';

const astroMetadata = new AstroComponentMetadata();

/**
 * Save source context to appropriate storage based on file type
 * - .md/.mdx files: YAML frontmatter
 * - .astro files: JSDoc comments
 * 
 * @param filePath - Path to documentation file
 * @param sourceContext - Source context to save
 * @param namespace - Frontmatter namespace (only used for .md/.mdx)
 */
export async function saveSourceContext(
  filePath: string,
  sourceContext: SourceContext,
  namespace: string = 'aiCoauthor'
): Promise<void> {
  // Determine storage mechanism based on file type
  if (astroMetadata.supportsFile(filePath)) {
    // Use JSDoc storage for .astro files
    await astroMetadata.updateMetadata(filePath, sourceContext);
  } else {
    // Use frontmatter storage for .md/.mdx files
    await updateFrontmatter(filePath, sourceContext, namespace);
  }
}

/**
 * Read source context from appropriate storage based on file type
 * - .md/.mdx files: YAML frontmatter
 * - .astro files: JSDoc comments
 * 
 * @param filePath - Path to documentation file
 * @param namespace - Frontmatter namespace (only used for .md/.mdx)
 * @returns Source context or null if not found
 */
export async function readSourceContext(
  filePath: string,
  namespace: string = 'aiCoauthor'
): Promise<SourceContext | null> {
  // Determine storage mechanism based on file type
  if (astroMetadata.supportsFile(filePath)) {
    // Use JSDoc storage for .astro files
    return astroMetadata.extractMetadata(filePath);
  } else {
    // Use frontmatter storage for .md/.mdx files
    return readFrontmatter(filePath, namespace);
  }
}

/**
 * Check if a file supports source context storage
 * 
 * @param filePath - Path to documentation file
 * @returns True if file type is supported
 */
export function supportsSourceContext(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase();
  return ext === 'md' || ext === 'mdx' || ext === 'astro';
}
