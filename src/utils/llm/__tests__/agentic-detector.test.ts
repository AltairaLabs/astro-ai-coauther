/**
 * Tests for Agentic Source Context Detector
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgenticDetector } from '../agentic-detector';
import type { LLMDetectionRequest } from '../../../types';

// Mock dependencies
vi.mock('@langchain/langgraph/prebuilt', () => ({
  createReactAgent: vi.fn(() => ({
    stream: vi.fn(),
  })),
}));

vi.mock('@promptpack/langchain', () => ({
  PromptPackRegistry: {
    loadFromFile: vi.fn(() => ({
      prompts: {
        'code-analysis': {
          system_template: 'You are a helpful assistant analyzing code.',
          tools: ['list_folder_contents', 'read_file', 'find_files'],
        },
      },
    })),
  },
}));

vi.mock('../tools', () => ({
  createFilesystemTools: vi.fn(() => [
    { name: 'list_folder_contents', description: 'List folder' },
    { name: 'read_file', description: 'Read file' },
    { name: 'find_files', description: 'Find files' },
    { name: 'unauthorized_tool', description: 'Not allowed' },
  ]),
}));

vi.mock('../../logger', () => ({
  getLogger: () => ({
    start: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    step: vi.fn(),
  }),
}));

describe('AgenticDetector', () => {
  let detector: AgenticDetector;
  let mockModel: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    detector = new AgenticDetector({
      projectRoot: '/test/project',
      modelName: 'test-model',
    });

    mockModel = {
      invoke: vi.fn(),
      stream: vi.fn(),
    };
  });

  describe('Constructor', () => {
    it('should initialize with config', () => {
      expect(detector).toBeDefined();
    });

    it('should throw error if prompt not found', async () => {
      const { PromptPackRegistry } = await import('@promptpack/langchain');
      PromptPackRegistry.loadFromFile.mockReturnValueOnce({
        prompts: {},
      });

      expect(() => new AgenticDetector({
        availableFiles: [], availableFolders: [],
        modelName: 'test',
      })).toThrow('Prompt "code-analysis" not found in pack');
    });
  });

  describe('detectSourceContext', () => {
    it('should detect source context successfully', async () => {
      const mockMessages = [
        {
          _getType: () => 'ai',
          content: JSON.stringify({
            files: ['src/test.ts'],
            folders: ['src/utils'],
            confidence: 'high',
            reasoning: ['Found test file'],
          }),
          usage_metadata: { total_tokens: 150 },
          tool_calls: [],
        },
      ];

      const { createReactAgent } = await import('@langchain/langgraph/prebuilt');
      const mockAgent = {
        stream: vi.fn(async function* () {
          yield { agent: { messages: mockMessages } };
        }),
      };
      vi.mocked(createReactAgent).mockReturnValue(mockAgent as any);

      const request: LLMDetectionRequest = {
        docPath: 'docs/test.md',
        docTitle: 'Test Documentation',
        docContent: 'This is test documentation content.',
        availableFiles: ['src/test.ts', 'src/utils/helper.ts'],
        availableFolders: ['src', 'src/utils'],
      };

      const result = await detector.detectSourceContext(mockModel, request);

      expect(result.files).toEqual(['src/test.ts']);
      expect(result.folders).toEqual(['src/utils']);
      expect(result.confidence).toBe('high');
      expect(result.reasoning).toEqual(['Found test file']);
      expect(result.tokensUsed).toBe(150);
      expect(result.model).toBe('test-model');
      expect(result.cached).toBe(false);
    });

    it('should handle long content by truncating', async () => {
      const longContent = 'x'.repeat(10000);
      const mockMessages = [
        {
          _getType: () => 'ai',
          content: '{"files":[],"folders":[],"confidence":"low","reasoning":[]}',
          tool_calls: [],
        },
      ];

      const { createReactAgent } = await import('@langchain/langgraph/prebuilt');
      const mockAgent = {
        stream: vi.fn(async function* () {
          yield { agent: { messages: mockMessages } };
        }),
      };
      vi.mocked(createReactAgent).mockReturnValue(mockAgent as any);

      const request: LLMDetectionRequest = {
        docPath: 'docs/long.md',
        docTitle: 'Long Doc',
        docContent: longContent,
        availableFiles: [],
        availableFolders: [],
      };

      const result = await detector.detectSourceContext(mockModel, request);

      expect(result).toBeDefined();
    });

    it('should format existing mapping when provided', async () => {
      const mockMessages = [
        {
          _getType: () => 'ai',
          content: '{"files":["new.ts"],"folders":[],"confidence":"medium","reasoning":["Updated"]}',
          tool_calls: [],
        },
      ];

      const { createReactAgent } = await import('@langchain/langgraph/prebuilt');
      const mockAgent = {
        stream: vi.fn(async function* () {
          yield { agent: { messages: mockMessages } };
        }),
      };
      vi.mocked(createReactAgent).mockReturnValue(mockAgent as any);

      const request: LLMDetectionRequest = {
        docPath: 'docs/test.md',
        docTitle: 'Test',
        docContent: 'Content',
        availableFiles: ['old.ts', 'new.ts'],
        availableFolders: ['old-dir'],
        existingMapping: {
          files: ['old.ts'],
          folders: ['old-dir'],
          globs: [],
          exclude: [],
          manual: false,
        },
      };

      const result = await detector.detectSourceContext(mockModel, request);

      expect(result.files).toEqual(['new.ts']);
    });

    it('should handle empty existing mapping', async () => {
      const mockMessages = [
        {
          _getType: () => 'ai',
          content: '{"files":[],"folders":[],"confidence":"low","reasoning":[]}',
          tool_calls: [],
        },
      ];

      const { createReactAgent } = await import('@langchain/langgraph/prebuilt');
      const mockAgent = {
        stream: vi.fn(async function* () {
          yield { agent: { messages: mockMessages } };
        }),
      };
      vi.mocked(createReactAgent).mockReturnValue(mockAgent as any);

      const request: LLMDetectionRequest = {
        docPath: 'docs/test.md',
        docTitle: 'Test',
        docContent: 'Content',
        availableFiles: [],
        availableFolders: [],
        existingMapping: {
          files: [],
          folders: [],
          globs: [],
          exclude: [],
          manual: false,
        },
      };

      const result = await detector.detectSourceContext(mockModel, request);
      expect(result).toBeDefined();
    });

    it('should log tool calls during streaming', async () => {
      const mockMessages = [
        {
          _getType: () => 'ai',
          content: '',
          tool_calls: [
            {
              name: 'read_file',
              args: { path: 'src/test.ts' },
            },
          ],
        },
        {
          _getType: () => 'tool',
          name: 'read_file',
          content: 'file content here',
        },
        {
          _getType: () => 'ai',
          content: '{"files":["src/test.ts"],"folders":[],"confidence":"high","reasoning":["Found"]}',
          tool_calls: [],
        },
      ];

      const { createReactAgent } = await import('@langchain/langgraph/prebuilt');
      const mockAgent = {
        stream: vi.fn(async function* () {
          for (const msg of mockMessages) {
            yield { agent: { messages: [msg] } };
          }
        }),
      };
      vi.mocked(createReactAgent).mockReturnValue(mockAgent as any);

      const request: LLMDetectionRequest = {
        docPath: 'docs/test.md',
        docTitle: 'Test',
        docContent: 'Content',
        availableFiles: [], availableFolders: [],
      };

      const result = await detector.detectSourceContext(mockModel, request);
      expect(result.files).toEqual(['src/test.ts']);
    });

    it('should handle tool responses in streaming', async () => {
      const mockMessages = [
        {
          _getType: () => 'tool',
          name: 'find_files',
          content: '["file1.ts", "file2.ts"]',
        },
        {
          _getType: () => 'ai',
          content: '{"files":["file1.ts","file2.ts"],"folders":[],"confidence":"medium","reasoning":["Found files"]}',
          tool_calls: [],
        },
      ];

      const { createReactAgent } = await import('@langchain/langgraph/prebuilt');
      const mockAgent = {
        stream: vi.fn(async function* () {
          yield { tools: { messages: mockMessages } };
        }),
      };
      vi.mocked(createReactAgent).mockReturnValue(mockAgent as any);

      const request: LLMDetectionRequest = {
        docPath: 'docs/test.md',
        docTitle: 'Test',
        docContent: 'Content',
        availableFiles: [], availableFolders: [],
      };

      const result = await detector.detectSourceContext(mockModel, request);
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      const { createReactAgent } = await import('@langchain/langgraph/prebuilt');
      vi.mocked(createReactAgent).mockImplementation(() => {
        throw new Error('Agent creation failed');
      });

      const request: LLMDetectionRequest = {
        docPath: 'docs/test.md',
        docTitle: 'Test',
        docContent: 'Content',
        availableFiles: [], availableFolders: [],
      };

      const result = await detector.detectSourceContext(mockModel, request);

      expect(result.files).toEqual([]);
      expect(result.folders).toEqual([]);
      expect(result.confidence).toBe('low');
      expect(result.reasoning[0]).toContain('Error calling LLM agent');
      expect(result.cached).toBe(false);
    });

    it('should estimate tokens when no usage_metadata available', async () => {
      const mockMessages = [
        {
          _getType: () => 'ai',
          content: '{"files":[],"folders":[],"confidence":"low","reasoning":[]}',
          tool_calls: [],
          // No usage_metadata
        },
      ];

      const { createReactAgent } = await import('@langchain/langgraph/prebuilt');
      const mockAgent = {
        stream: vi.fn(async function* () {
          yield { agent: { messages: mockMessages } };
        }),
      };
      vi.mocked(createReactAgent).mockReturnValue(mockAgent as any);

      const request: LLMDetectionRequest = {
        docPath: 'docs/test.md',
        docTitle: 'Test',
        docContent: 'Content',
        availableFiles: [], availableFolders: [],
      };

      const result = await detector.detectSourceContext(mockModel, request);

      // Should have estimated tokens (content length / 4)
      expect(result.tokensUsed).toBeGreaterThan(0);
    });
  });

  describe('parseLLMResponse', () => {
    it('should parse JSON response', async () => {
      const mockMessages = [
        {
          _getType: () => 'ai',
          content: '{"files":["test.ts"],"folders":["src"],"confidence":"high","reasoning":["test"]}',
          tool_calls: [],
        },
      ];

      const { createReactAgent } = await import('@langchain/langgraph/prebuilt');
      const mockAgent = {
        stream: vi.fn(async function* () {
          yield { agent: { messages: mockMessages } };
        }),
      };
      vi.mocked(createReactAgent).mockReturnValue(mockAgent as any);

      const request: LLMDetectionRequest = {
        docPath: 'docs/test.md',
        docTitle: 'Test',
        docContent: 'Content',
        availableFiles: [], availableFolders: [],
      };

      const result = await detector.detectSourceContext(mockModel, request);

      expect(result.files).toEqual(['test.ts']);
      expect(result.folders).toEqual(['src']);
    });

    it('should parse JSON from markdown code blocks', async () => {
      const mockMessages = [
        {
          _getType: () => 'ai',
          content: '```json\n{"files":["test.ts"],"folders":[],"confidence":"high","reasoning":[]}\n```',
          tool_calls: [],
        },
      ];

      const { createReactAgent } = await import('@langchain/langgraph/prebuilt');
      const mockAgent = {
        stream: vi.fn(async function* () {
          yield { agent: { messages: mockMessages } };
        }),
      };
      vi.mocked(createReactAgent).mockReturnValue(mockAgent as any);

      const request: LLMDetectionRequest = {
        docPath: 'docs/test.md',
        docTitle: 'Test',
        docContent: 'Content',
        availableFiles: [], availableFolders: [],
      };

      const result = await detector.detectSourceContext(mockModel, request);

      expect(result.files).toEqual(['test.ts']);
    });

    it('should parse JSON from plain code blocks', async () => {
      const mockMessages = [
        {
          _getType: () => 'ai',
          content: '```\n{"files":["test.ts"],"folders":[],"confidence":"medium","reasoning":[]}\n```',
          tool_calls: [],
        },
      ];

      const { createReactAgent } = await import('@langchain/langgraph/prebuilt');
      const mockAgent = {
        stream: vi.fn(async function* () {
          yield { agent: { messages: mockMessages } };
        }),
      };
      vi.mocked(createReactAgent).mockReturnValue(mockAgent as any);

      const request: LLMDetectionRequest = {
        docPath: 'docs/test.md',
        docTitle: 'Test',
        docContent: 'Content',
        availableFiles: [], availableFolders: [],
      };

      const result = await detector.detectSourceContext(mockModel, request);

      expect(result.files).toEqual(['test.ts']);
    });

    it('should handle malformed JSON gracefully', async () => {
      const mockMessages = [
        {
          _getType: () => 'ai',
          content: 'This is not JSON at all',
          tool_calls: [],
        },
      ];

      const { createReactAgent } = await import('@langchain/langgraph/prebuilt');
      const mockAgent = {
        stream: vi.fn(async function* () {
          yield { agent: { messages: mockMessages } };
        }),
      };
      vi.mocked(createReactAgent).mockReturnValue(mockAgent as any);

      const request: LLMDetectionRequest = {
        docPath: 'docs/test.md',
        docTitle: 'Test',
        docContent: 'Content',
        availableFiles: [], availableFolders: [],
      };

      const result = await detector.detectSourceContext(mockModel, request);

      expect(result.files).toEqual([]);
      expect(result.confidence).toBe('low');
      expect(result.reasoning[0]).toContain('Failed to parse LLM response');
    });

    it('should normalize invalid confidence levels', async () => {
      const mockMessages = [
        {
          _getType: () => 'ai',
          content: '{"files":[],"folders":[],"confidence":"invalid","reasoning":[]}',
          tool_calls: [],
        },
      ];

      const { createReactAgent } = await import('@langchain/langgraph/prebuilt');
      const mockAgent = {
        stream: vi.fn(async function* () {
          yield { agent: { messages: mockMessages } };
        }),
      };
      vi.mocked(createReactAgent).mockReturnValue(mockAgent as any);

      const request: LLMDetectionRequest = {
        docPath: 'docs/test.md',
        docTitle: 'Test',
        docContent: 'Content',
        availableFiles: [], availableFolders: [],
      };

      const result = await detector.detectSourceContext(mockModel, request);

      expect(result.confidence).toBe('low');
    });

    it('should handle non-array files', async () => {
      const mockMessages = [
        {
          _getType: () => 'ai',
          content: '{"files":"not-an-array","folders":[],"confidence":"low","reasoning":[]}',
          tool_calls: [],
        },
      ];

      const { createReactAgent } = await import('@langchain/langgraph/prebuilt');
      const mockAgent = {
        stream: vi.fn(async function* () {
          yield { agent: { messages: mockMessages } };
        }),
      };
      vi.mocked(createReactAgent).mockReturnValue(mockAgent as any);

      const request: LLMDetectionRequest = {
        docPath: 'docs/test.md',
        docTitle: 'Test',
        docContent: 'Content',
        availableFiles: [], availableFolders: [],
      };

      const result = await detector.detectSourceContext(mockModel, request);

      expect(result.files).toEqual([]);
    });

    it('should handle non-array reasoning', async () => {
      const mockMessages = [
        {
          _getType: () => 'ai',
          content: '{"files":[],"folders":[],"confidence":"low","reasoning":"not-an-array"}',
          tool_calls: [],
        },
      ];

      const { createReactAgent } = await import('@langchain/langgraph/prebuilt');
      const mockAgent = {
        stream: vi.fn(async function* () {
          yield { agent: { messages: mockMessages } };
        }),
      };
      vi.mocked(createReactAgent).mockReturnValue(mockAgent as any);

      const request: LLMDetectionRequest = {
        docPath: 'docs/test.md',
        docTitle: 'Test',
        docContent: 'Content',
        availableFiles: [], availableFolders: [],
      };

      const result = await detector.detectSourceContext(mockModel, request);

      expect(result.reasoning).toEqual([]);
    });
  });

  describe('Tool filtering', () => {
    it('should filter tools based on prompt configuration', async () => {
      const { createFilesystemTools } = await import('../tools');
      
      const mockMessages = [
        {
          _getType: () => 'ai',
          content: '{"files":[],"folders":[],"confidence":"low","reasoning":[]}',
          tool_calls: [],
        },
      ];

      const { createReactAgent } = await import('@langchain/langgraph/prebuilt');
      const mockAgent = {
        stream: vi.fn(async function* () {
          yield { agent: { messages: mockMessages } };
        }),
      };
      vi.mocked(createReactAgent).mockReturnValue(mockAgent as any);

      const request: LLMDetectionRequest = {
        docPath: 'docs/test.md',
        docTitle: 'Test',
        docContent: 'Content',
        availableFiles: [], availableFolders: [],
      };

      await detector.detectSourceContext(mockModel, request);

      // Verify tools were created
      expect(createFilesystemTools).toHaveBeenCalledWith('/test/project');
      
      // Verify createReactAgent was called with filtered tools
      const agentCall = vi.mocked(createReactAgent).mock.calls[0];
      const tools = agentCall[0].tools;
      
      // Should only include allowed tools, not 'unauthorized_tool'
      expect(tools).toHaveLength(3);
      if (Array.isArray(tools)) {
        expect(tools.every((t: any) => t.name !== 'unauthorized_tool')).toBe(true);
      }
    });
  });
});
