/**
 * File Tree Parser
 * Builds a tree structure of project files for source context detection
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { globby } from 'globby';
import ignore from 'ignore';
import type { FileTree } from '../types';
import { getLogger } from './logger.js';

const logger = getLogger();

/**
 * Build a file tree structure for the project
 * 
 * @param rootPath - Root directory to scan
 * @param excludePatterns - Glob patterns to exclude
 * @param gitignoreRoot - Optional root directory for .gitignore (defaults to rootPath)
 * @returns Promise resolving to file tree structure
 */
export async function buildFileTree(
  rootPath: string,
  excludePatterns: string[] = [],
  gitignoreRoot?: string
): Promise<FileTree> {
  const absoluteRoot = path.resolve(rootPath);
  const absoluteGitignoreRoot = gitignoreRoot ? path.resolve(gitignoreRoot) : absoluteRoot;
  
  // Load .gitignore patterns from the specified root
  const gitignorePatterns = await loadGitignorePatterns(absoluteGitignoreRoot);
  const allExcludePatterns = [...excludePatterns, ...gitignorePatterns];
  
  // Build tree recursively
  return buildTreeNode(absoluteRoot, absoluteRoot, allExcludePatterns);
}

/**
 * Build a single tree node (file or directory)
 */
async function buildTreeNode(
  nodePath: string,
  rootPath: string,
  excludePatterns: string[]
): Promise<FileTree> {
  const stats = await fs.stat(nodePath);
  const name = path.basename(nodePath);
  const relativePath = path.relative(rootPath, nodePath);
  
  if (stats.isFile()) {
    return {
      name,
      path: relativePath || name,
      type: 'file',
    };
  }
  
  // Directory - recursively build children
  const entries = await fs.readdir(nodePath);
  const children: FileTree[] = [];
  
  for (const entry of entries) {
    const entryPath = path.join(nodePath, entry);
    const entryRelativePath = path.relative(rootPath, entryPath);
    
    // Skip if matches exclude pattern
    if (shouldExclude(entryRelativePath, excludePatterns)) {
      continue;
    }
    
    // Skip common directories that should always be excluded
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist' || entry === 'coverage') {
      continue;
    }
    
    try {
      const child = await buildTreeNode(entryPath, rootPath, excludePatterns);
      children.push(child);
    } catch (error) {
      // Skip files/directories we can't read
      logger.warn('file-tree', `Skipping ${entryPath}`, error);
    }
  }
  
  const sortedChildren = [...children].sort((a: FileTree, b: FileTree) => {
    // Directories first, then files, alphabetically
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
  
  return {
    name,
    path: relativePath || '.',
    type: 'directory',
    children: sortedChildren,
  };
}

/**
 * Load .gitignore patterns from project
 */
async function loadGitignorePatterns(rootPath: string): Promise<string[]> {
  const gitignorePath = path.join(rootPath, '.gitignore');
  
  try {
    const content = await fs.readFile(gitignorePath, 'utf-8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  } catch {
    // No .gitignore file or cannot read it - silently ignore
    return [];
  }
}

/**
 * Check if a path should be excluded based on patterns
 */
function shouldExclude(relativePath: string, patterns: string[]): boolean {
  if (patterns.length === 0) return false;
  
  const ig = ignore().add(patterns);
  return ig.ignores(relativePath);
}

/**
 * Get all files matching a glob pattern
 * 
 * @param pattern - Glob pattern
 * @param rootPath - Root directory
 * @param excludePatterns - Patterns to exclude
 * @returns Promise resolving to array of file paths
 */
export async function getFilesMatching(
  pattern: string,
  rootPath: string,
  excludePatterns: string[] = []
): Promise<string[]> {
  const files = await globby(pattern, {
    cwd: rootPath,
    ignore: [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'coverage/**',
      ...excludePatterns,
    ],
  });
  
  return files;
}

/**
 * Check if a file or directory exists
 */
export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Flatten file tree to list of file paths
 */
export function flattenFileTree(tree: FileTree): string[] {
  const files: string[] = [];
  
  function traverse(node: FileTree) {
    if (node.type === 'file') {
      files.push(node.path);
    } else if (node.children) {
      node.children.forEach(traverse);
    }
  }
  
  traverse(tree);
  return files;
}

/**
 * Extract all folder paths from file tree
 */
export function extractFolders(tree: FileTree): string[] {
  const folders: string[] = [];
  
  function traverse(node: FileTree) {
    if (node.type === 'directory') {
      folders.push(node.path);
      if (node.children) {
        node.children.forEach(traverse);
      }
    }
  }
  
  traverse(tree);
  return folders;
}

/**
 * Get all files in a directory (non-recursive)
 */
export async function getDirectoryFiles(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isFile())
      .map(entry => entry.name);
  } catch {
    return [];
  }
}
