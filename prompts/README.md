# Source Context Detection - Prompt Development

This directory contains the PromptArena configuration for developing, testing, and evaluating the LLM-powered source context detection prompt used in the Astro AI Coauthor integration.

## Structure

```
prompts/
├── src/                              # PromptArena source files (YAML)
│   ├── arena.yaml                    # Main arena configuration
│   ├── prompts/
│   │   └── source-context-detection.yaml   # Prompt configuration
│   ├── providers/
│   │   ├── openai-gpt-4o.yaml             # GPT-4o provider config
│   │   ├── openai-gpt-4o-mini.yaml        # GPT-4o-mini provider config
│   │   ├── claude-3-5-sonnet.yaml         # Claude provider config
│   │   └── gemini-2-0-flash.yaml          # Gemini provider config
│   ├── scenarios/
│   │   ├── api-documentation.yaml         # API docs test scenarios
│   │   ├── component-documentation.yaml   # Component docs test scenarios
│   │   └── configuration-documentation.yaml # Config docs test scenarios
│   └── tools/
│       ├── list-source-files.yaml         # File listing tool definition
│       ├── list-folders.yaml              # Folder listing tool definition
│       ├── read-file.yaml                 # File reading tool definition
│       ├── find-files.yaml                # File search tool definition
│       └── list-folder-contents.yaml      # Folder contents tool definition
│
└── dist/                             # Compiled PromptPack JSON
    └── source-context-detection.json      # Production prompt pack
```

## About PromptArena

[PromptArena](https://github.com/AltairaLabs/promptkit) is a development and testing framework for LLM prompts that provides:

- **Version Control**: Manage prompts as structured YAML files
- **Multi-Provider Testing**: Compare performance across OpenAI, Anthropic, Google, etc.
- **Scenario-Based Evaluation**: Test prompts with realistic scenarios and assertions
- **Metrics & Analytics**: Track accuracy, cost, latency, and custom metrics
- **Tool Integration**: Define and test function calling/tool use
- **Compilation**: Build optimized PromptPack JSON for production

## Development Workflow

### 1. Edit Prompt Configuration

Modify the prompt template, variables, or parameters in:
```bash
src/prompts/source-context-detection.yaml
```

### 2. Add Test Scenarios

Create new test scenarios in `src/scenarios/` to cover different documentation types:
```yaml
apiVersion: promptkit.altairalabs.ai/v1alpha1
kind: Scenario
metadata:
  name: my-test-scenario
spec:
  task_type: code-analysis
  context:
    docPath: "docs/example.md"
    docTitle: "Example Documentation"
    docContent: |
      # Example
      Documentation content here...
  expected_output:
    files: ["src/example.ts"]
    folders: []
    confidence: "high"
  assertions:
    - type: files_include
      params:
        expected: "src/example.ts"
```

### 3. Run PromptArena Evaluation

Test your prompt across multiple providers and scenarios:
```bash
# From the project root
npm run prompt:test

# Or directly with promptarena CLI
cd prompts/src && promptarena run arena.yaml
```

This will:

- Execute the prompt with all configured providers (GPT-4o, Claude, Gemini, etc.)
- Run all test scenarios
- Validate assertions
- Generate evaluation report in `out/evaluation-report.html`
- Compare provider performance and costs

### 4. Review Results

Open the generated HTML report to see:

- Success/failure rates per provider
- Accuracy metrics
- Cost analysis
- Latency comparisons
- Assertion pass/fail details

### 5. Inspect Configuration

Validate your PromptArena configuration:

```bash
# From the project root
npm run prompt:inspect

# Or directly with promptarena CLI
cd prompts/src && promptarena config-inspect arena.yaml
```

### 6. Compile to PromptPack

When ready for production, compile the YAML to PromptPack JSON using [packc](https://github.com/AltairaLabs/promptkit/tree/main/packages/packc):

```bash
# From the project root
npm run prompt:compile

# Or directly with packc CLI
cd prompts/src && packc compile --config arena.yaml --output ../dist/source-context-detection.json --id detect
```

The compiled [PromptPack](https://promptpack.org) JSON is what the Astro integration loads at runtime.

**Note**: The prompt uses a stateless system template with documentation content passed in the user message. This matches the test scenario structure where the user message contains the full documentation context (path, title, content) rather than using template variables in the system prompt.

## Test Scenarios

### API Documentation

Tests mapping of API reference documentation to source code files. Expects high confidence identification of class and type definition files.

### Component Documentation

Tests mapping of UI component/feature documentation to implementation files and folders.

### Configuration Documentation

Tests mapping of configuration guides to integration entry points and utility modules.

## Provider Comparison

The arena is configured to test across multiple LLM providers:

| Provider | Model | Use Case | Cost |
|----------|-------|----------|------|
| **OpenAI GPT-4o** | gpt-4o | Baseline - highest quality | $2.50/$10.00 per 1M tokens |
| **OpenAI GPT-4o-mini** | gpt-4o-mini | Cost-effective alternative | $0.15/$0.60 per 1M tokens |
| **Anthropic Claude** | claude-3-5-sonnet | Alternative high-quality | $3.00/$15.00 per 1M tokens |
| **Google Gemini** | gemini-2.0-flash | Free tier testing | Free |

## Tool Definitions

The prompt uses function calling with these tools to explore the codebase:

- **list_source_files**: Get all source files with optional glob filtering
- **list_folders**: Get project folder structure
- **read_file**: Read file contents (with preview mode)
- **find_files**: Search for files by name pattern
- **list_folder_contents**: List immediate folder contents

Tool definitions in `src/tools/` specify the schema and behavior for each tool.

## Metrics & Assertions

Scenarios include assertions to validate prompt output:

- `is_valid_json`: Verify output is valid JSON
- `json_schema`: Validate structure matches expected schema
- `json_path`: Use JMESPath expressions to validate specific fields (e.g., check if files array contains expected values, validate confidence levels)

See [Assertion Types](https://promptkit.altairalabs.ai/docs/assertions) for full documentation.

## Best Practices

1. **Start with Scenarios**: Write test scenarios before modifying the prompt
2. **Compare Providers**: Always test across multiple providers to find the best fit
3. **Iterate on Assertions**: Add assertions as you discover edge cases
4. **Monitor Costs**: Use the cost analysis to balance quality vs. expense
5. **Version Control**: Commit changes to `src/` directory, not compiled `dist/` files
6. **Document Changes**: Update scenario descriptions when adding new test cases

## Adding New Prompts

As the project grows, you can add additional prompts for other tasks:

```yaml
# In arena.yaml
spec:
  prompt_configs:
    - id: detect
      file: prompts/source-context-detection.yaml
    - id: update-docs
      file: prompts/auto-doc-updater.yaml  # New prompt
```

Each prompt should have its own:

- Prompt configuration YAML
- Test scenarios
- Tool definitions (if different from existing)

## Resources

- [PromptKit Documentation](https://promptkit.altairalabs.ai)
- [PromptArena CLI Reference](https://promptkit.altairalabs.ai/docs/cli)
- [PromptPack Specification](https://promptpack.org)
- [Configuration Schema Reference](https://promptkit.altairalabs.ai/docs/configuration)
- [Assertion Types](https://promptkit.altairalabs.ai/docs/assertions)
- [JMESPath Guide](https://jmespath.org)

## Next Steps

1. Run your first evaluation: `promptarena run src/arena.yaml`
2. Add a new test scenario for your documentation
3. Compare provider performance and costs
4. Iterate on the prompt template to improve accuracy
5. Compile and deploy the improved prompt to production
