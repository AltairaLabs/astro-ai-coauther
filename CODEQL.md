# CodeQL Local Scanning

This document explains how to run CodeQL security analysis locally on this project.

## Prerequisites

Install CodeQL via Homebrew:

```bash
brew install --cask codeql
```

Verify installation:

```bash
codeql version
```

## Usage

### Quick Scan

Run a complete CodeQL analysis with one command:

```bash
npm run codeql
```

This will:
1. Create a fresh CodeQL database from your source code
2. Run security and quality queries against the database
3. Generate a summary report in CSV format

### Step-by-Step

You can also run each step individually:

```bash
# 1. Create the CodeQL database
npm run codeql:create-db

# 2. Run security and quality analysis
npm run codeql:analyze

# 3. View the results summary
npm run codeql:summary
```

## Understanding Results

### Result Files

- `codeql-results.sarif` - SARIF format results (standard format for static analysis)
- `codeql-summary.csv` - Human-readable CSV summary of all findings

### Severity Levels

CodeQL classifies issues into three severity levels:

- **error** - High severity security vulnerabilities or critical bugs
- **warning** - Medium severity issues that should be reviewed
- **note** - Low severity informational findings or best practice suggestions

### Common Issue Categories

Security issues detected include:

- **CWE-312**: Clear-text logging of sensitive information
- **CWE-079**: Cross-site scripting (XSS) vulnerabilities
- **CWE-078**: Command injection vulnerabilities
- **CWE-089**: SQL injection vulnerabilities
- **CWE-915**: Prototype pollution
- And many more...

## Viewing Results

### CSV Summary

The `codeql-summary.csv` file contains:
- Issue description and message
- Severity level
- File path and line numbers

Open it in any spreadsheet application or text editor.

### SARIF Format

The `codeql-results.sarif` file can be:
- Viewed in VS Code with the SARIF viewer extension
- Uploaded to GitHub Advanced Security
- Integrated into CI/CD pipelines

## Integration with CI/CD

This project already has CodeQL analysis in GitHub Actions (`.github/workflows/codeql.yml`). The local scanning capability complements this by allowing developers to:

- Test security fixes before committing
- Debug specific security issues
- Run custom queries during development

## Query Packs

The default scan uses the `javascript-security-and-quality` query suite, which includes:

- Security queries (XSS, injection, authentication issues, etc.)
- Quality queries (code smells, maintainability issues)
- Performance queries (ReDoS, inefficient patterns)

To download additional query packs:

```bash
codeql pack download codeql/javascript-queries
```

## Updating CodeQL

Keep CodeQL up to date to get the latest security checks:

```bash
brew upgrade codeql
```

## Troubleshooting

### Database Creation Fails

If database creation fails:
1. Ensure you're in the project root directory
2. Check that all dependencies are installed (`npm install`)
3. Verify CodeQL is properly installed (`codeql version`)

### No Results Displayed

If analysis completes but no results show:
- This is good! It means no security issues were detected
- You can still view the SARIF file to confirm the scan ran successfully

### Query Pack Not Found

If you see "Query pack cannot be found":
1. Download the query pack: `codeql pack download codeql/javascript-queries`
2. Retry the analysis

## Further Reading

- [CodeQL Documentation](https://codeql.github.com/docs/)
- [CodeQL for JavaScript/TypeScript](https://codeql.github.com/docs/codeql-language-guides/codeql-for-javascript/)
- [Writing Custom Queries](https://codeql.github.com/docs/writing-codeql-queries/)
