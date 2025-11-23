/**
 * Astro Component Metadata Storage
 * Uses JSDoc comments to store source context in .astro component files
 */

import * as fs from 'node:fs/promises';
import { parse } from '@babel/parser';
import type { SourceContext } from '../types';
import { getLogger } from './logger';

const logger = getLogger();

/**
 * Manages metadata storage in Astro component files using JSDoc comments
 */
export class AstroComponentMetadata {
  /**
   * Check if file type is supported (.astro files only)
   */
  supportsFile(filePath: string): boolean {
    const ext = filePath.split('.').pop()?.toLowerCase();
    return ext === 'astro';
  }

  /**
   * Extract metadata from Astro component JSDoc comments
   * 
   * @param filePath - Path to .astro file
   * @returns Source context or null if not found/invalid
   */
  async extractMetadata(filePath: string): Promise<SourceContext | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const scriptMatch = /^---\n([\s\S]*?)\n---/.exec(content);
      
      if (!scriptMatch) {
        return null;
      }
      
      const script = scriptMatch[1];
      
      // Parse as TypeScript (supports both JS and TS)
      const ast = parse(script, {
        sourceType: 'module',
        plugins: ['typescript'],
      });
      
      // Find JSDoc comment with @ai-coauthor tag
      if (!ast.comments) {
        return null;
      }
      
      for (const comment of ast.comments) {
        if (comment.type === 'CommentBlock' && comment.value.includes('@ai-coauthor')) {
          return this.parseMetadataComment(comment.value);
        }
      }
      
      return null;
    } catch (error) {
      logger.warn(
        'astro-metadata',
        `Failed to parse ${filePath} AST:`,
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  }

  /**
   * Parse JSDoc comment to extract metadata JSON
   */
  private parseMetadataComment(commentText: string): SourceContext | null {
    try {
      // Extract JSON after @sourceContext tag (handles both compact and multi-line formats)
      const jsonMatch = /@sourceContext[\s\S]*?(\{[\s\S]*?\})/.exec(commentText);
      
      if (!jsonMatch) {
        return null;
      }
      
      // Remove leading asterisks and trailing comment close from JSDoc formatting
      const jsonText = jsonMatch[1]
        .replace(/\*\/$/, '') // Remove trailing */
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, ''))
        .join('\n')
        .trim();
      
      const data = JSON.parse(jsonText) as Partial<SourceContext>;
      
      // Validate required fields
      if (!data.files || !Array.isArray(data.files)) {
        logger.warn('astro-metadata', 'Invalid sourceContext: missing files array');
        return null;
      }
      
      // Return with defaults for missing fields
      return {
        files: data.files,
        folders: data.folders ?? [],
        globs: data.globs ?? [],
        exclude: data.exclude ?? [],
        manual: data.manual ?? false,
        confidence: data.confidence ?? 'low',
        lastUpdated: data.lastUpdated ?? new Date().toISOString(),
      };
    } catch (error) {
      logger.warn(
        'astro-metadata',
        'Failed to parse metadata comment:',
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  }

  /**
   * Update metadata in Astro component (safe, atomic)
   * 
   * @param filePath - Path to .astro file
   * @param sourceContext - Source context to save
   */
  async updateMetadata(filePath: string, sourceContext: SourceContext): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const { script, scriptStart, scriptEnd } = this.extractComponentScript(content);
    
    try {
      const newScript = this.replaceMetadataComment(script, sourceContext);
      const newContent = content.slice(0, scriptStart) + newScript + content.slice(scriptEnd);
      
      await this.atomicWrite(filePath, newContent);
      logger.success('astro-metadata', `Updated metadata in ${filePath}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update metadata in ${filePath}: ${errorMessage}`);
    }
  }

  /**
   * Extract component script section from Astro file
   */
  private extractComponentScript(content: string): { script: string; scriptStart: number; scriptEnd: number } {
    const scriptMatch = /^---\n([\s\S]*?)\n---/.exec(content);
    
    if (!scriptMatch) {
      throw new Error('No component script found in .astro file');
    }
    
    const script = scriptMatch[1];
    const scriptStart = scriptMatch.index + 4; // "---\n".length
    const scriptEnd = scriptStart + script.length;
    
    return { script, scriptStart, scriptEnd };
  }

  /**
   * Replace or add metadata comment in script
   */
  private replaceMetadataComment(script: string, sourceContext: SourceContext): string {
    const ast = parse(script, {
      sourceType: 'module',
      plugins: ['typescript'],
    });
    
    const existingCommentIndex = this.findMetadataCommentIndex(ast.comments);
    const newComment = this.formatMetadataComment(sourceContext);
    
    const newScript = this.insertOrReplaceComment(script, ast.comments, existingCommentIndex, newComment);
    
    // Validate new script parses correctly
    parse(newScript, {
      sourceType: 'module',
      plugins: ['typescript'],
    });
    
    return newScript;
  }

  /**
   * Find index of existing @ai-coauthor comment
   */
  private findMetadataCommentIndex(comments: readonly any[] | null | undefined): number {
    if (!comments) {
      return -1;
    }
    
    for (let i = 0; i < comments.length; i++) {
      if (comments[i].value.includes('@ai-coauthor')) {
        return i;
      }
    }
    
    return -1;
  }

  /**
   * Format source context as JSDoc comment
   */
  private formatMetadataComment(sourceContext: SourceContext): string {
    const metadataForStorage = {
      files: sourceContext.files,
      folders: sourceContext.folders,
      confidence: sourceContext.confidence,
      lastUpdated: sourceContext.lastUpdated,
    };
    
    // Format as multi-line JSDoc for readability
    const jsonStr = JSON.stringify(metadataForStorage, null, 2);
    const jsonLines = jsonStr.split('\n').map(line => ` * ${line}`).join('\n');
    
    return `/**\n * @ai-coauthor\n * @sourceContext\n${jsonLines}\n */`;
  }

  /**
   * Insert or replace comment in script
   */
  private insertOrReplaceComment(
    script: string,
    comments: readonly any[] | null | undefined,
    existingIndex: number,
    newComment: string
  ): string {
    if (existingIndex >= 0 && comments) {
      const comment = comments[existingIndex];
      return script.slice(0, comment.start ?? 0) + newComment + script.slice(comment.end ?? script.length);
    }
    
    return newComment + '\n' + script;
  }

  /**
   * Atomic write with validation
   */
  private async atomicWrite(filePath: string, newContent: string): Promise<void> {
    const tempPath = `${filePath}.tmp`;
    
    try {
      await fs.writeFile(tempPath, newContent, 'utf-8');
      await this.validateAstroFile(tempPath);
      await fs.rename(tempPath, filePath);
    } catch (error) {
      await this.cleanupTempFile(tempPath);
      throw error;
    }
  }

  /**
   * Validate Astro file can be parsed
   */
  private async validateAstroFile(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const scriptMatch = /^---\n([\s\S]*?)\n---/.exec(content);
    
    if (!scriptMatch) {
      throw new Error('Validation failed: invalid script delimiters');
    }
    
    parse(scriptMatch[1], {
      sourceType: 'module',
      plugins: ['typescript'],
    });
  }

  /**
   * Clean up temporary file
   */
  private async cleanupTempFile(tempPath: string): Promise<void> {
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}
