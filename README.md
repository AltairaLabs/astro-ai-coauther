# 🤖 astro-ai-coauthor

An intelligent Astro integration that transforms your documentation workflow with developer-mode feedback collection, metadata tracking, and AI-assisted documentation maintenance.

[![npm version](https://img.shields.io/npm/v/astro-ai-coauthor.svg)](https://www.npmjs.com/package/astro-ai-coauthor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Features

### ✅ **Currently Available**
- **📝 Dev-Mode Feedback Widget** - Floating widget in development mode for instant documentation feedback
- **💾 Local Feedback Backlog** - Collects and stores feedback locally in `.local-doc-feedback.json`
- **📊 Feedback Dashboard** - Beautiful interface to review all collected feedback
- **🏷️ Metadata Tracking** - Track documentation metadata for better organization
- **🔍 Category Filtering** - Organize feedback by accuracy, clarity, completeness, and more

### 🚧 **Planned Features**
- **⏰ Stale Documentation Detection** - Automatically flag outdated documentation
- **🔗 CI Integration** - Run documentation quality checks in your CI pipeline
- **🤖 LLM-Assisted Maintenance** - AI-powered suggestions for improving documentation
- **📈 Analytics & Insights** - Track documentation quality trends over time
- **🔄 Git Integration** - Link feedback to specific commits and file versions

---

## 📦 Installation

```bash
npm install astro-ai-coauthor
```

Or with your preferred package manager:

```bash
# pnpm
pnpm add astro-ai-coauthor

# yarn
yarn add astro-ai-coauthor
```

---

## 🚀 Quick Start

### 1. Add the integration to your `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import astroAICoauthor from 'astro-ai-coauthor';

export default defineConfig({
  integrations: [
    astroAICoauthor({
      enableFeedbackWidget: true,
      feedbackStorePath: '.local-doc-feedback.json',
      enableMetadata: true,
    }),
  ],
});
```

### 2. Start your development server:

```bash
npm run dev
```

### 3. Visit any documentation page

You'll see a floating feedback widget in the bottom-right corner (💬). Click it to:
- Rate the page helpfulness (1-5)
- Select a feedback category
- Leave comments and suggestions

### 4. View collected feedback

Navigate to `/FeedbackDashboard` or check the `.local-doc-feedback.json` file in your project root.

---

## ⚙️ Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableFeedbackWidget` | `boolean` | `true` | Show feedback widget in dev mode |
| `feedbackStorePath` | `string` | `'.local-doc-feedback.json'` | Path to store feedback data |
| `enableMetadata` | `boolean` | `true` | Track documentation metadata |
| `enableStaleDetection` | `boolean` | `false` | Enable stale doc detection (coming soon) |

### Example Configuration

```javascript
astroAICoauthor({
  // Enable the feedback widget
  enableFeedbackWidget: true,
  
  // Custom storage location
  feedbackStorePath: './docs/.feedback.json',
  
  // Enable metadata tracking
  enableMetadata: true,
  
  // Future feature: stale detection
  enableStaleDetection: false,
})
```

---

## 📖 Usage Guide

### Feedback Categories

The widget supports multiple feedback categories:

- **General** - Overall feedback
- **Accuracy** - Technical correctness issues
- **Clarity** - Confusing or unclear content
- **Completeness** - Missing information
- **Outdated** - Content needs updating

### Feedback Data Structure

Feedback is stored in JSON format:

```json
{
  "version": "1.0.0",
  "entries": [
    {
      "pageUrl": "/docs/getting-started",
      "timestamp": "2025-11-18T10:30:00.000Z",
      "rating": 4,
      "comment": "Great intro, but could use more examples",
      "category": "completeness"
    }
  ],
  "lastUpdated": "2025-11-18T10:30:00.000Z"
}
```

### Accessing the Dashboard

The feedback dashboard is automatically available at:

```
http://localhost:4321/_ai-coauthor/dashboard
```

It provides:
- **Total feedback count** and **average rating**
- **Feedback grouped by page**
- **Timestamp and category** for each entry
- **Visual rating indicators** (emoji-based)

---

## 🏗️ Project Structure

```
astro-ai-coauthor/
├── src/
│   ├── index.ts                    # Main integration entry point
│   ├── client/
│   │   └── feedback-widget.js      # Feedback widget UI
│   ├── middleware/
│   │   └── feedback-middleware.ts  # API endpoint handler
│   └── pages/
│       └── FeedbackDashboard.astro # Dashboard page
├── examples/
│   └── basic-astro-usage.md        # Usage examples
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🎯 Use Cases

### For Documentation Writers
- **Collect real-time feedback** from team members during doc reviews
- **Identify problem areas** with low ratings
- **Track improvement** over time

### For Development Teams
- **Centralize documentation feedback** in one place
- **Integrate with CI** to prevent stale docs from merging (coming soon)
- **Leverage AI** for automated doc improvements (coming soon)

### For Open Source Projects
- **Encourage community feedback** on documentation
- **Build better docs** based on actual user needs
- **Track documentation quality** as a project metric

---

## 🔮 Roadmap

### Version 0.2.0
- [ ] Stale documentation detection
- [ ] Git commit tracking
- [ ] Export feedback to CSV/JSON

### Version 0.3.0
- [ ] CI integration (GitHub Actions, GitLab CI)
- [ ] Slack/Discord notifications
- [ ] Multi-user feedback attribution

### Version 1.0.0
- [ ] LLM-assisted documentation improvements
- [ ] Automated fix suggestions
- [ ] Documentation quality scoring
- [ ] Analytics dashboard with trends

---

## 🧪 Development & Testing

This project includes a playground for testing the integration during development.

### Clone and Setup

```bash
# Clone the repository
git clone https://github.com/altairalabs/astro-ai-coauthor.git
cd astro-ai-coauthor

# Install dependencies
npm install

# Build the integration
npm run build
```

### Testing with the Playground

The `/playground` directory contains a test Astro site:

```bash
# Install playground dependencies
cd playground
npm install

# Start the playground dev server
npm run dev
```

Then visit:
- **`http://localhost:4321/`** - Playground home
- **`http://localhost:4321/demo`** - Demo page with sample documentation
- **`http://localhost:4321/FeedbackDashboard`** - View collected feedback

The playground imports the integration from `../dist/index.js`, so make sure to rebuild the main package (`npm run build` in the root) after making changes.

### Development Workflow

1. Make changes to the integration source in `/src`
2. Run `npm run build` (or `npm run dev` for watch mode)
3. Test changes in the playground
4. Submit feedback using the widget
5. View results in the dashboard

## 🤝 Contributing

Contributions are welcome! This project is in early development.

Please test your changes using the playground before submitting a PR.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

---

## 🙏 Acknowledgments

Built with ❤️ for the Astro community.

Special thanks to:
- The Astro core team for building an amazing framework
- Documentation maintainers everywhere who inspired this project
- Early adopters and contributors

---

## 📚 Resources

- [Astro Documentation](https://docs.astro.build/)
- [Astro Integrations Guide](https://docs.astro.build/en/guides/integrations-guide/)
- [Issue Tracker](https://github.com/altairalabs/astro-ai-coauthor/issues)

---

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/altairalabs/astro-ai-coauthor/issues)
- **Discussions**: [GitHub Discussions](https://github.com/altairalabs/astro-ai-coauthor/discussions)

---

<div align="center">

**Built for developers who care about documentation quality** 📝✨

</div>
