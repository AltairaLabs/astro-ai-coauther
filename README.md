# 🤖 astro-ai-coauthor

An intelligent Astro integration that transforms your documentation workflow with developer-mode feedback collection, metadata tracking, and AI-assisted documentation maintenance.

[![npm version](https://img.shields.io/npm/v/astro-ai-coauthor.svg)](https://www.npmjs.com/package/astro-ai-coauthor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=AltairaLabs_astro-ai-coauther&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=AltairaLabs_astro-ai-coauther)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=AltairaLabs_astro-ai-coauther&metric=coverage)](https://sonarcloud.io/summary/new_code?id=AltairaLabs_astro-ai-coauther)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=AltairaLabs_astro-ai-coauther&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=AltairaLabs_astro-ai-coauther)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=AltairaLabs_astro-ai-coauther&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=AltairaLabs_astro-ai-coauther)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=AltairaLabs_astro-ai-coauther&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=AltairaLabs_astro-ai-coauther)

---

## 🌟 Features

### ✅ Currently Available

- **📝 Dev-Mode Feedback Widget** - Floating widget in development mode for instant documentation feedback
- **💾 Pluggable Storage System** - File-based storage by default, with support for custom adapters (GitHub Issues, Cloudflare KV, databases, etc.)
- **📊 Feedback Dashboard** - Beautiful interface to review all collected feedback at `/_ai-coauthor/dashboard`
- **🔍 Category Filtering** - Organize feedback by accuracy, clarity, completeness, and more
- **🏷️ Metadata Tracking** - Track documentation metadata for better organization

### 🚧 Planned Features

- **⏰ Stale Documentation Detection** - Automatically flag outdated documentation
- **🔗 CI Integration** - Run documentation quality checks in your CI pipeline
- **🤖 LLM-Assisted Maintenance** - AI-powered suggestions for improving documentation
- **📈 Analytics & Insights** - Track documentation quality trends over time

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

### 4. View collected feedback

Navigate to `/_ai-coauthor/dashboard` to see all collected feedback with:

- Total feedback count and average rating
- Feedback grouped by page
- Timestamp and category for each entry

---

## 📚 Documentation

- **[Configuration Guide](./docs/configuration.md)** - All configuration options
- **[Custom Storage Adapters](./docs/storage-adapters.md)** - Implement custom storage backends
- **[Development Guide](./docs/development.md)** - Contributing and local development
- **[Debugging Guide](./DEBUGGING.md)** - Debugging tips and tricks

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
