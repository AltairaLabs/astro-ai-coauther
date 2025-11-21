/**
 * Source Context Mapping Types
 * 
 * These types support automatic detection and tracking of which source code
 * files/folders are documented by each documentation page.
 */

/**
 * Confidence level for source context detection
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Source context information stored in frontmatter
 */
export interface SourceContext {
  /** List of specific source files documented by this page */
  files: string[];
  
  /** List of source folders documented by this page */
  folders: string[];
  
  /** Glob patterns for source files (e.g., "src/storage/**\/*.ts") */
  globs: string[];
  
  /** Patterns to exclude from globs */
  exclude: string[];
  
  /** Whether this mapping was manually edited by user */
  manual: boolean;
  
  /** ISO timestamp of last update */
  lastUpdated?: string;
  
  /** Confidence level of auto-detection */
  confidence?: ConfidenceLevel;
}

/**
 * AI Coauthor frontmatter namespace
 * All integration data stored under this namespace to avoid conflicts
 */
export interface AICoauthorFrontmatter {
  aiCoauthor?: {
    /** Source code context for this documentation page */
    sourceContext?: SourceContext;
    
    /** Related pages that share source context (populated after detection) */
    relatedPages?: string[];
    
    // Future: other integration-specific fields
    // metadata?: Record<string, unknown>;
    // feedback?: FeedbackSummary;
  };
}

/**
 * Result from source context detection
 */
export interface ContextDetectionResult {
  /** Detected source context */
  sourceContext: SourceContext;
  
  /** Confidence level of detection */
  confidence: ConfidenceLevel;
  
  /** Human-readable reasoning for each mapping */
  reasoning: string[];
  
  /** Alternative suggestions for user review */
  suggestions: string[];
}

/**
 * File tree structure for project analysis
 */
export interface FileTree {
  /** File or directory name */
  name: string;
  
  /** Relative path from project root */
  path: string;
  
  /** Type of node */
  type: 'file' | 'directory';
  
  /** Child nodes (for directories) */
  children?: FileTree[];
}

/**
 * Pattern matching rule for convention-based detection
 */
export interface MatchRule {
  /** Pattern to match against documentation path */
  docPattern: string | RegExp;
  
  /** Source patterns to check when doc pattern matches */
  sourcePatterns: string[];
  
  /** Confidence score for this rule (0-1) */
  confidence: number;
}

/**
 * Configuration for source context detection
 */
export interface SourceContextConfig {
  /** Enable source context feature */
  enabled: boolean;
  
  /** Auto-detect on page creation/update */
  autoDetect: boolean;
  
  /** Root directory for source files */
  projectRoot: string;
  
  /** Patterns to exclude from detection */
  excludePatterns: string[];
  
  /** Minimum confidence threshold for auto-detection */
  confidenceThreshold: number;
  
  /** Custom convention-based rules */
  conventions?: Record<string, string[]>;
  
  /** Namespace in frontmatter (default: 'aiCoauthor') */
  frontmatterNamespace?: string;
  
  /** LLM provider configuration for intelligent detection */
  llmProvider?: import('./llm').LLMProviderConfig;
  
  /** Fallback to rule-based detection if LLM unavailable */
  fallbackToRules?: boolean;
}

/**
 * Page cluster for editing phase
 * Groups pages that document the same source code
 */
export interface PageCluster {
  /** Primary source module (folder or file) */
  sourceModule: string;
  
  /** Documentation pages in this cluster */
  pages: DocumentationPage[];
  
  /** Source files shared by all pages */
  sharedFiles: string[];
  
  /** Cross-references between pages */
  crossReferences: Map<string, string[]>;
}

/**
 * Documentation page with frontmatter
 */
export interface DocumentationPage {
  /** Relative path to documentation file */
  path: string;
  
  /** Page title */
  title: string;
  
  /** Page content (markdown) */
  content: string;
  
  /** Full frontmatter data */
  frontmatter: Record<string, any> & AICoauthorFrontmatter;
}

/**
 * Mapping between documentation page and source context
 */
export interface ContextMapping {
  /** Documentation page path */
  docPath: string;
  
  /** Source context for this page */
  sourceContext: SourceContext;
  
  /** Detection metadata */
  metadata: {
    confidence: ConfidenceLevel;
    detectedAt: string;
    manual: boolean;
  };
}
