# 🤖 astro-ai-coauthor

**For solo developers and small teams who want to improve their documentation quality without expensive tools or complex workflows.**

An intelligent Astro integration that transforms your documentation workflow with developer-mode feedback collection, metadata tracking, and AI-assisted documentation maintenance.

## 🎯 Who Is This For?

- **Solo Developers** building documentation sites who want to track improvement areas
- **Technical Writers** who need a lightweight way to self-review and iterate on docs
- **Small Teams** working on internal documentation without enterprise doc tools
- **Open Source Maintainers** who want to improve docs incrementally

## 💡 The Problem It Solves

As you write documentation, you notice issues but forget to fix them later. You want to:
- 📝 **Capture feedback while reviewing** your own docs in dev mode
- 📊 **Track which pages need improvement** without complex tools
- 🔄 **Iterate on documentation quality** over time
- 🤖 **Get AI suggestions** for improvements (coming soon)
- 🚫 **Avoid expensive doc platforms** for personal/small projects

**This tool gives you a simple feedback loop**: Write docs → Review in dev mode → Log issues → See dashboard → Improve → Repeat.

---

[![npm version](https://img.shields.io/npm/v/astro-ai-coauthor.svg)](https://www.npmjs.com/package/astro-ai-coauthor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CodeQL](https://github.com/AltairaLabs/astro-ai-coauther/actions/workflows/codeql.yml/badge.svg)](https://github.com/AltairaLabs/astro-ai-coauther/actions/workflows/codeql.yml)
[![Dependabot Updates](https://github.com/AltairaLabs/astro-ai-coauther/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/AltairaLabs/astro-ai-coauther/actions/workflows/dependabot/dependabot-updates)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=AltairaLabs_astro-ai-coauther&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=AltairaLabs_astro-ai-coauther)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=AltairaLabs_astro-ai-coauther&metric=coverage)](https://sonarcloud.io/summary/new_code?id=AltairaLabs_astro-ai-coauther)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=AltairaLabs_astro-ai-coauther&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=AltairaLabs_astro-ai-coauther)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=AltairaLabs_astro-ai-coauther&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=AltairaLabs_astro-ai-coauther)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=AltairaLabs_astro-ai-coauther&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=AltairaLabs_astro-ai-coauther)

---

## 🌟 Features

### ✅ Currently Available (v0.0.3)

#### Core Features
- **📝 Dev-Mode Feedback Widget** - Floating widget in development mode for instant self-review
- **💾 Local-First Storage** - File-based storage by default (`.local-doc-feedback.json`), no cloud required
- **📊 Enhanced Dashboard** - Beautiful interface at `/_ai-coauthor/dashboard` with comprehensive analytics
- **🔍 Category Filtering** - Organize feedback by accuracy, clarity, completeness, and more
- **🏷️ Metadata Tracking** - Track documentation metadata for better organization
- **🔌 Pluggable Adapters** - Extend with custom storage if needed (optional)

#### NEW in v0.0.3 - Productivity Features
- **📥 Smart Export** - Export feedback in JSON, CSV, or Markdown formats
- **📈 Advanced Analytics** - Page performance tracking, rating distributions, category breakdowns
- **📊 Trend Visualization** - See feedback patterns over time with visual charts
- **✅ Smart Task Generation** - Automatically prioritize pages that need attention
- **🔍 Advanced Filtering** - Filter exports by page, category, rating, or date range
- **📑 Page Performance Table** - Quick overview of all pages with status indicators

### 🚧 Future Planned Features

- **⏰ Stale Documentation Detection** - Automatically flag outdated documentation (v0.4.0)
- **🤖 Local AI Integration** - Ollama/LM Studio support for privacy-first AI suggestions (v0.4.0)
- **🔄 Workspace Sync** - Sync feedback across multiple machines (v0.4.0)
- **🔗 CI Integration** - Run documentation quality checks in CI pipeline (v1.0+, if team features are needed)

---

## 📦 Installation

```bash
npm install astro-ai-coauthor
```

---

## 🚀 Quick Start

### 1. Add the integration to your `astro.config.mjs`

```javascript
import { defineConfig } from 'astro/config';
import astroAICoauthor from 'astro-ai-coauthor';

export default defineConfig({
  integrations: [
    astroAICoauthor({
      enableFeedbackWidget: true,
      enableMetadata: true,
    }),
  ],
});
```

### 2. Start your development server

```bash
npm run dev
```

### 3. Use the feedback widget

Visit any page and click the feedback widget (💬) in the bottom-right corner to:

- Rate the page helpfulness (1-5)
- Select a feedback category
- Leave comments and suggestions

### 4. View the Enhanced Dashboard

Navigate to `/_ai-coauthor/dashboard` to see:

**Summary Statistics**
- Total feedback count and average rating
- Number of pages with feedback
- Category distribution

**Analytics & Insights**
- Page performance table with status indicators
- Feedback trends over time
- Category breakdown visualization
- Action items prioritized by urgency

**Export Options**
- Download feedback as JSON, CSV, or Markdown
- Filter by page, category, rating, or date
- Share reports with stakeholders

---

## 📚 Documentation

- **[Configuration Guide](./docs/configuration.md)** - All configuration options
- **[Custom Storage Adapters](./docs/storage-adapters.md)** - Implement custom storage backends
- **[Development Guide](./docs/development.md)** - Contributing and local development
- **[Testing Guide](./TESTING.md)** - Unit and E2E testing
- **[E2E Testing Guide](./docs/e2e-testing.md)** - End-to-end testing with Playwright
- **[Debugging Guide](./DEBUGGING.md)** - Debugging tips and tricks

---

## 🎯 Use Cases

### Solo Developer Self-Review

- **Log issues as you spot them** while reviewing your own docs
- **Track TODOs** for documentation improvements
- **See patterns** in what needs work (clarity, examples, etc.)
- **Prioritize** which pages to improve first

### Small Team Documentation

- **Lightweight feedback collection** without heavy tools
- **Local-first** - no external services required
- **Simple dashboard** to review all feedback
- **Export feedback** to share with stakeholders

### Technical Writing Workflow

- **Iterate on drafts** with structured feedback
- **Rate page quality** as you write
- **Self-review checklist** built into dev mode
- **AI-assisted improvements** (coming in v0.3.0)

### Open Source Documentation

- **Dogfood your own docs** before publishing
- **Track documentation debt** alongside code
- **Keep it simple** - just install and use
- **No external dependencies** or services needed

---

## 🤝 Contributing

Contributions are welcome! See the [Development Guide](./docs/development.md) for setup instructions and testing with the playground.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Built with ❤️ for the Astro community.

Special thanks to:

- The Astro core team for building an amazing framework
- Documentation maintainers everywhere who inspired this project
- Early adopters and contributors

---

**Built for developers who care about documentation quality** 📝✨
