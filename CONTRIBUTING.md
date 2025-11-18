# Contributing to astro-ai-coauthor

Thank you for your interest in contributing to astro-ai-coauthor! This document provides guidelines for contributing to this Astro integration.

## 🌟 Ways to Contribute

### 💡 Feature Development
- **New Features**: Propose and implement new capabilities
- **Widget Improvements**: Enhance the feedback widget UI/UX
- **Integration Features**: Extend Astro integration functionality
- **AI Capabilities**: Add LLM-assisted documentation features

### 🐛 Bug Fixes
- **Bug Reports**: Report issues with clear reproduction steps
- **Bug Fixes**: Submit fixes for existing issues
- **Testing**: Add test cases and improve coverage

### 📖 Documentation
- **Usage Examples**: Share real-world implementation examples
- **Guides**: Improve setup and configuration documentation
- **API Documentation**: Enhance code comments and type definitions

### 🤝 Community
- **Discussions**: Participate in [GitHub Discussions](https://github.com/AltairaLabs/astro-ai-coauther/discussions)
- **Support**: Help answer questions from users
- **Feedback**: Share ideas and suggestions for improvements

## 🚀 Getting Started

### 1. Development Setup

```bash
# Clone the repository
git clone https://github.com/AltairaLabs/astro-ai-coauther.git
cd astro-ai-coauther

# Install dependencies
npm install

# Build the integration
npm run build
```

### 2. Testing with the Playground

```bash
# Navigate to playground
cd playground

# Install dependencies
npm install

# Start dev server
npm run dev
```

Visit `http://localhost:4321/` to test your changes.

### 3. Find Your First Contribution

- **Good First Issues**: Look for [`good first issue`](https://github.com/AltairaLabs/astro-ai-coauther/labels/good%20first%20issue) labels
- **Documentation**: Improve clarity, fix typos, or add examples
- **Testing**: Test the integration and report issues

## 📋 Contribution Process

### For Code Changes

1. **Fork**: Create a fork of the repository
2. **Branch**: Create a feature branch (`git checkout -b feature/my-feature`)
3. **Develop**: Make your changes
4. **Build**: Run `npm run build` to compile TypeScript
5. **Test**: Test in the playground (`cd playground && npm run dev`)
6. **Commit**: Write clear, descriptive commit messages
7. **Push**: Push to your fork
8. **PR**: Create a pull request with detailed description

### For Bug Reports

1. **Search**: Check if the issue already exists
2. **Reproduce**: Provide clear reproduction steps
3. **Environment**: Include Astro version, Node version, OS
4. **Expected vs Actual**: Describe what should happen vs what does happen
5. **Submit**: Create a GitHub issue with all details

### For Feature Requests

1. **Discussion**: Start with a GitHub Discussion to gauge interest
2. **Use Case**: Explain the problem you're trying to solve
3. **Proposal**: Outline your proposed solution
4. **Feedback**: Gather community input
5. **Implementation**: Once approved, create a PR

## 🔍 Code Standards

### TypeScript
- Use strict TypeScript types
- Add JSDoc comments for public APIs
- Follow existing code style

### Commits
- Use conventional commits format: `feat:`, `fix:`, `docs:`, `chore:`
- Keep commits focused and atomic
- Write clear commit messages

### Testing
- Test all changes in the playground
- Ensure build completes without errors
- Verify widget functionality in browser

## 👥 Review Process

### Pull Request Guidelines
- **Clear Title**: Summarize the change concisely
- **Description**: Explain what changed and why
- **Screenshots**: Include for UI changes
- **Testing**: Describe how you tested the changes
- **Breaking Changes**: Clearly mark any breaking changes

### Review Criteria
- **Functionality**: Does it work as intended?
- **Code Quality**: Is the code clean and maintainable?
- **Documentation**: Are changes documented?
- **Backwards Compatibility**: Does it break existing functionality?
- **Performance**: Does it impact performance negatively?

### Review Timeline
- **Minor Changes**: Usually reviewed within 2-3 days
- **Major Features**: May take 1-2 weeks for thorough review
- **Bug Fixes**: Prioritized for quicker review

## 📊 Communication

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General discussion and questions
- **Pull Requests**: Code contributions and reviews

## 🔒 Security

For security vulnerabilities, please email [security@altairalabs.com](mailto:security@altairalabs.com) instead of creating a public issue.

## 📄 License

By contributing to astro-ai-coauthor, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

## 🙏 Recognition

All contributors are recognized in release notes and the README. Significant contributors may be invited to join the maintainer team.

---

**Questions?** Open a [GitHub Discussion](https://github.com/AltairaLabs/astro-ai-coauther/discussions) - we're here to help!
