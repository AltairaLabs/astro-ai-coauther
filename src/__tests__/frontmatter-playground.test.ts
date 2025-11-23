/**
 * Test reading actual playground files with JSDoc comments
 */

import { describe, it, expect } from 'vitest';
import { readDocumentationPage } from '../utils/frontmatter';
import * as path from 'node:path';

describe('Frontmatter - Playground Files', () => {
  it('should read source-context-demo.astro without YAML parsing errors', async () => {
    const filePath = path.join(process.cwd(), 'playground/docs/src/pages/source-context-demo.astro');
    
    // This was throwing: "end of the stream or a document separator is expected at line 6, column 13"
    // Now it should work because we strip JSDoc comments before parsing
    const result = await readDocumentationPage(filePath);
    
    expect(result).toBeDefined();
    expect(result.content).toContain('<!DOCTYPE html>');
    expect(result.content).toContain('Source Context Detection Demo');
  });
});
