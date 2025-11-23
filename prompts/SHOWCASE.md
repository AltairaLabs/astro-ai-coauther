# PromptPack Development Showcase

This directory demonstrates the complete **PromptPack development workflow** using PromptArena, showcasing best practices for professional prompt engineering and evaluation.

## What This Showcases

This is a **real, production prompt** used by the Astro AI Coauthor integration to automatically map documentation pages to source code files. The prompt uses:

- ✅ **Agentic AI** with function calling (ReAct pattern)
- ✅ **Multi-provider evaluation** (OpenAI, Anthropic, Google)
- ✅ **Structured testing** with scenarios and assertions
- ✅ **Version control** for prompts (YAML source → JSON artifact)
- ✅ **Performance metrics** (accuracy, cost, latency)
- ✅ **Tool integration** (filesystem exploration tools)

## Quick Start

### 1. Explore the Configuration

```bash
cd prompts/src
cat arena.yaml              # Arena configuration
cat prompts/*.yaml          # Prompt templates
cat scenarios/*.yaml        # Test scenarios
cat providers/*.yaml        # Provider configs
cat tools/*.yaml            # Tool definitions
```

### 2. Set Up API Keys

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Run Evaluation (requires PromptKit)

```bash
npm install -g @altairalabs/promptkit
promptarena run arena.yaml
```

This will:
- Test the prompt with GPT-4o, GPT-4o-mini, Claude, and Gemini
- Run 3 test scenarios (API docs, component docs, config docs)
- Generate an HTML evaluation report
- Compare accuracy, cost, and latency

### 4. View Results

```bash
open out/evaluation-report.html
```

## File Structure

```
prompts/
├── README.md                  # Detailed development guide
├── SHOWCASE.md               # This file - quick overview
│
├── src/                      # Source (YAML) - version controlled
│   ├── arena.yaml           # Main configuration
│   ├── .env.example         # API key template
│   ├── .gitignore          # Ignore out/ and .env
│   │
│   ├── prompts/            # Prompt templates
│   │   └── source-context-detection.yaml
│   │
│   ├── providers/          # LLM provider configs
│   │   ├── openai-gpt-4o.yaml
│   │   ├── openai-gpt-4o-mini.yaml
│   │   ├── claude-3-5-sonnet.yaml
│   │   └── gemini-2-0-flash.yaml
│   │
│   ├── scenarios/          # Test scenarios with assertions
│   │   ├── api-documentation.yaml
│   │   ├── component-documentation.yaml
│   │   └── configuration-documentation.yaml
│   │
│   └── tools/              # Function calling tool definitions
│       ├── list-source-files.yaml
│       ├── list-folders.yaml
│       ├── read-file.yaml
│       ├── find-files.yaml
│       └── list-folder-contents.yaml
│
└── dist/                   # Compiled artifacts (JSON)
    └── source-context-detection.json  # Production PromptPack
```

## Key Concepts Demonstrated

### 1. Prompt as Code
The prompt is defined in structured YAML with:
- Template variables
- Parameter constraints
- Tool specifications
- Output schema
- Validation rules

### 2. Multi-Provider Testing
Compare the same prompt across different LLMs:
- **GPT-4o**: Baseline for quality
- **GPT-4o-mini**: Cost-effective alternative
- **Claude 3.5 Sonnet**: Alternative high-quality option
- **Gemini 2.0 Flash**: Free tier experimentation

### 3. Scenario-Based Evaluation
Test with realistic scenarios that include:
- Input context (documentation content)
- Expected output (file mappings)
- Assertions (validation rules)

Example scenario:
```yaml
context:
  docTitle: "Task Manager API Reference"
  docContent: "# TaskManager Class\n\nThe main class..."
expected_output:
  files: ["src/task-manager.ts", "src/types.ts"]
  confidence: "high"
assertions:
  - type: files_include
    params:
      expected: "src/task-manager.ts"
```

### 4. Tool Integration
The prompt uses function calling to explore codebases:
```yaml
tools:
  - list_source_files
  - list_folders
  - read_file
  - find_files
  - list_folder_contents
```

Each tool has a YAML definition specifying its parameters, return types, and examples.

### 5. Metrics & Analysis
PromptArena calculates:
- **Accuracy**: Overall correctness
- **Precision**: Ratio of correct to identified files
- **Recall**: Ratio of identified to expected files
- **F1 Score**: Harmonic mean of precision and recall
- **Cost**: Token usage and pricing per provider
- **Latency**: Response time metrics

### 6. Compilation to PromptPack
The YAML source compiles to a standard PromptPack JSON:
```bash
promptarena compile arena.yaml --output ../dist/source-context-detection.json
```

This JSON is loaded by the Astro integration at runtime.

## Development Workflow

```
┌─────────────────────┐
│ Edit YAML Source    │
│ (prompts/src/)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Run Evaluation      │
│ promptarena run     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Review Results      │
│ (HTML report)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Iterate & Improve   │
│ (adjust prompt)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Compile to JSON     │
│ (prompts/dist/)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Use in Production   │
│ (loaded by Astro)   │
└─────────────────────┘
```

## Why This Matters

### Traditional Prompt Development Problems:
- ❌ Prompts buried in code strings
- ❌ No systematic testing
- ❌ Manual provider switching
- ❌ No performance tracking
- ❌ Difficult to version control
- ❌ No collaboration workflow

### PromptArena Solution:
- ✅ Prompts as structured, versionable YAML
- ✅ Automated multi-provider evaluation
- ✅ Scenario-based testing with assertions
- ✅ Built-in metrics and reporting
- ✅ Git-friendly source format
- ✅ Team collaboration support

## Real-World Usage

This prompt runs in production when:
1. User visits a documentation page in an Astro site
2. The AI Coauthor integration loads the PromptPack JSON
3. An LLM (configured by the user) receives the prompt + tools
4. The LLM explores the codebase using function calling
5. Returns a mapping of docs → source files
6. Result is cached and displayed in the feedback widget

## Resources

- **PromptKit**: https://github.com/AltairaLabs/promptkit
- **PromptPack Spec**: https://promptpack.org
- **Examples**: https://github.com/AltairaLabs/promptkit/tree/main/examples
- **Full README**: See [README.md](./README.md) for detailed documentation

## Try It Yourself

1. Clone this repo
2. `cd prompts/src`
3. Add API keys to `.env`
4. Run `promptarena run arena.yaml`
5. Open the HTML report
6. Edit `prompts/source-context-detection.yaml`
7. Re-run and see the difference!

---

**This is how professional prompt engineering should work.**
