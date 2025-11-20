# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.3] - 2025-11-20

### Added

#### Smart Export & Backup
- Export feedback data in JSON, CSV, and Markdown formats
- Advanced filtering options for exports (by page, category, rating, date range)
- Download functionality with appropriate MIME types
- Automatic CSV escaping for special characters
- Human-readable Markdown reports with statistics

#### Enhanced Dashboard Analytics
- Summary statistics cards (total feedback, average rating, page count, category count)
- Category breakdown visualization with card layout
- Page performance table showing feedback count and average rating per page
- Visual status indicators (✅ ⚠️ ❌) based on page ratings
- Export buttons prominently displayed in dashboard

#### Feedback Trends & Pattern Detection
- Trend visualization showing feedback volume over time
- Last 7 days of feedback data in bar chart format
- Average ratings displayed per day
- Color-coded gradient bars for visual appeal
- Pattern detection for identifying problematic pages

#### Smart Task Generation
- Automatic task generation from feedback data
- Priority-based classification (High, Medium, Low)
- Task details including page, issue description, feedback count, and categories
- Visual warning banner for action items
- Color-coded priority badges
- Automatic sorting by priority and feedback count

#### New API Endpoints
- `GET /_ai-coauthor/export?action=export&format={json|csv|markdown}` - Export feedback
- `GET /_ai-coauthor/export?action=analytics` - Get analytics data
- `GET /_ai-coauthor/export?action=tasks` - Get generated tasks

#### Developer Experience
- New utility functions exported: `exportFeedback`, `generateAnalytics`, `generateTasks`
- New TypeScript types: `ExportOptions`, `AnalyticsData`, `FeedbackTask`
- Comprehensive test coverage (20 new tests for export functionality)
- All 85 tests passing

### Changed
- Dashboard completely redesigned with new sections
- Enhanced visual layout with better spacing and organization
- Improved data presentation with tables and visualizations

### Technical
- Created `src/utils/export.ts` with export utilities
- Created `src/pages/_ai-coauthor/export.ts` API endpoint
- Created `src/__tests__/export.test.ts` test suite
- Updated `src/index.ts` to export new utilities and inject export route
- Refactored code to reduce cognitive complexity (split into helper functions)
- Fixed linting issues and improved code quality

## [0.0.2] - Previous Release

### Added
- Initial feedback widget implementation
- Basic dashboard functionality
- Local file storage adapter
- Category-based feedback organization

## [0.0.1] - Initial Release

### Added
- Core integration setup
- Basic project structure
- Initial documentation

---

[0.0.3]: https://github.com/AltairaLabs/astro-ai-coauther/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/AltairaLabs/astro-ai-coauther/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/AltairaLabs/astro-ai-coauther/releases/tag/v0.0.1
