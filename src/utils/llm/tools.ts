/**
 * LangChain Tools for Agentic Source Context Detection
 * 
 * These tools allow the LLM agent to browse the filesystem and gather
 * context needed to make accurate source mapping decisions.
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { buildFileTree, flattenFileTree, extractFolders } from '../file-tree';
import { getLogger } from '../logger';

const logger = getLogger();

/**
 * Create filesystem browsing tools for the agent
 */
export function createFilesystemTools(projectRoot: string) {
  return [
    // Tool 1: List all source files in the project
    new DynamicStructuredTool({
      name: 'list_source_files',
      description: 'Get a complete list of all source code files in the project. Returns file paths relative to project root. Use this to understand what files are available before making mapping decisions.',
      schema: z.object({
        pattern: z.string().optional().describe('Optional glob pattern to filter files (e.g., "src/**/*.ts" for TypeScript files in src/). If omitted, returns all source files.'),
      }),
      func: async ({ pattern }) => {
        const msg = pattern ? `with pattern: ${pattern}` : 'listing all source files';
        logger.debug('tool:list_source_files', msg);
        logger.debug('tool:list_source_files', `Project root: ${projectRoot}`);
        try {
          const tree = await buildFileTree(projectRoot);
          let files = flattenFileTree(tree);
          logger.debug('tool:list_source_files', `After flattenFileTree: ${files.length} files`);
          
          // Apply pattern filter if provided
          if (pattern) {
            const minimatch = await import('minimatch');
            const beforeFilter = files.length;
            files = files.filter(f => minimatch.minimatch(f, pattern));
            logger.debug('tool:list_source_files', `After pattern filter: ${files.length}/${beforeFilter} files`);
          }
          
          // Filter out non-source files
          const beforeSourceFilter = files.length;
          files = files.filter(f => {
            const ext = path.extname(f);
            return ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte', '.astro', '.py', '.go', '.rs', '.java', '.cpp', '.c', '.h'].includes(ext);
          });
          
          logger.info('tool:list_source_files', `Found ${files.length} source files (filtered from ${beforeSourceFilter})`);
          const sortedFiles = files.toSorted((a, b) => a.localeCompare(b));
          return JSON.stringify({
            count: files.length,
            files: sortedFiles,
          });
        } catch (error) {
          logger.error('tool:list_source_files', 'Error:', error);
          return JSON.stringify({ error: String(error) });
        }
      },
    }),

    // Tool 2: List all folders in the project
    new DynamicStructuredTool({
      name: 'list_folders',
      description: 'Get a list of all folders/directories in the project. Use this to understand the project structure and identify relevant folders for broader documentation topics.',
      schema: z.object({
        depth: z.number().optional().describe('Maximum depth to traverse (1 = top level only, 2 = one level deep, etc.). Default is unlimited.'),
      }),
      func: async ({ depth }) => {
        const msg = depth ? `with depth: ${depth}` : 'listing all folders';
        logger.debug('tool:list_folders', msg);
        logger.debug('tool:list_folders', `Project root: ${projectRoot}`);
        try{
          const tree = await buildFileTree(projectRoot);
          let folders = extractFolders(tree);
          logger.debug('tool:list_folders', `After extractFolders: ${folders.length} folders`);
          
          // Apply depth filter if provided
          if (depth !== undefined) {
            const beforeFilter = folders.length;
            folders = folders.filter(f => {
              const parts = f.split(path.sep);
              return parts.length <= depth;
            });
            logger.debug('tool:list_folders', `After depth filter: ${folders.length}/${beforeFilter} folders`);
          }
          
          logger.info('tool:list_folders', `Found ${folders.length} folders`);
          const sortedFolders = folders.toSorted((a, b) => a.localeCompare(b));
          return JSON.stringify({
            count: folders.length,
            folders: sortedFolders,
          });
        } catch (error) {
          logger.error('tool:list_folders', 'Error:', error);
          return JSON.stringify({ error: String(error) });
        }
      },
    }),

    // Tool 3: Read file content
    new DynamicStructuredTool({
      name: 'read_file',
      description: 'Read the contents of a specific file. Use this when you need to examine a file to determine if it\'s relevant to the documentation. Can read full file or a preview.',
      schema: z.object({
        file_path: z.string().describe('Relative path to the file from project root'),
        lines: z.number().optional().describe('Optional: number of lines to read from the start of the file (for preview). If omitted, reads entire file.'),
      }),
      func: async ({ file_path, lines }) => {
        const msg = lines ? `Reading ${file_path} (${lines} lines)` : `Reading ${file_path}`;
        logger.debug('tool:read_file', msg);
        try {
          const fullPath = path.join(projectRoot, file_path);
          const content = await fs.readFile(fullPath, 'utf-8');
          
          if (lines !== undefined) {
            const preview = content.split('\n').slice(0, lines).join('\n');
            logger.debug('tool:read_file', `Returned ${lines} line preview of ${file_path} (${preview.length} chars)`);
            return JSON.stringify({
              file: file_path,
              preview: true,
              lines_shown: lines,
              content: preview,
            });
          }
          
          logger.debug('tool:read_file', `Read full file ${file_path} (${content.length} chars)`);
          return JSON.stringify({
            file: file_path,
            preview: false,
            content,
          });
        } catch (error) {
          logger.error('tool:read_file', `Error reading ${file_path}:`, error);
          return JSON.stringify({ error: `Could not read file: ${String(error)}` });
        }
      },
    }),

    // Tool 4: Search for files by name pattern
    new DynamicStructuredTool({
      name: 'find_files',
      description: 'Search for files matching a name pattern. Use this when the documentation mentions specific file names or patterns and you want to find matching files.',
      schema: z.object({
        name_pattern: z.string().describe('Pattern to match against file names (supports * wildcards, e.g., "*user*", "*.test.ts")'),
      }),
      func: async ({ name_pattern }) => {
        logger.debug('tool:find_files', `Searching for pattern: ${name_pattern}`);
        logger.debug('tool:find_files', `Project root: ${projectRoot}`);
        try {
          const tree = await buildFileTree(projectRoot);
          const allFiles = flattenFileTree(tree);
          logger.debug('tool:find_files', `Total files to search: ${allFiles.length}`);
          
          const minimatch = await import('minimatch');
          const pattern = name_pattern.includes('/') ? name_pattern : `**/${name_pattern}`;
          logger.debug('tool:find_files', `Using pattern: ${pattern}`);
          const matches = allFiles.filter(f => minimatch.minimatch(f, pattern, { nocase: true }));
          
          logger.info('tool:find_files', `Found ${matches.length} matches for "${name_pattern}"`);
          const sortedMatches = matches.toSorted((a, b) => a.localeCompare(b));
          return JSON.stringify({
            pattern: name_pattern,
            matches: sortedMatches,
            count: matches.length,
          });
        } catch (error) {
          logger.error('tool:find_files', 'Error:', error);
          return JSON.stringify({ error: String(error) });
        }
      },
    }),

    // Tool 5: Get folder contents
    new DynamicStructuredTool({
      name: 'list_folder_contents',
      description: 'List the immediate contents of a specific folder (non-recursive). Use this to explore what files and subfolders are in a particular directory.',
      schema: z.object({
        folder_path: z.string().describe('Relative path to the folder from project root (e.g., "src/api", "src")'),
      }),
      func: async ({ folder_path }) => {
        logger.debug('tool:list_folder_contents', `Listing: ${folder_path}`);
        try {
          const fullPath = path.join(projectRoot, folder_path);
          const entries = await fs.readdir(fullPath, { withFileTypes: true });
          
          const files = entries
            .filter(e => e.isFile())
            .map(e => e.name)
            .sort((a, b) => a.localeCompare(b));
          
          const folders = entries
            .filter(e => e.isDirectory())
            .map(e => e.name)
            .sort((a, b) => a.localeCompare(b));
          
          logger.debug('tool:list_folder_contents', `Found ${files.length} files, ${folders.length} folders in ${folder_path}`);
          return JSON.stringify({
            folder: folder_path,
            files,
            folders,
            total: files.length + folders.length,
          });
        } catch (error) {
          logger.error('tool:list_folder_contents', `Error listing ${folder_path}:`, error);
          return JSON.stringify({ error: `Could not read folder: ${String(error)}` });
        }
      },
    }),
  ];
}
