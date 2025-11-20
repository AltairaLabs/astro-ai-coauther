# Features

Explore all the features of Astro AI Coauthor.

## Core Features

### 📝 Dev-Mode Feedback Widget

A floating widget that appears in development mode, allowing you to collect feedback on your documentation as you write and review it.

**Key capabilities:**

- 1-5 star rating system
- Category selection (clarity, accuracy, completeness, outdated, etc.)
- Free-form notes
- Text highlighting for specific feedback
- Non-intrusive floating design

### 💾 Local-First Storage

All feedback is stored locally by default in a `.local-doc-feedback.json` file. No cloud services, no external dependencies, your data stays with you.

**Benefits:**

- Privacy-first approach
- Works offline
- No external services required
- Git-friendly JSON format
- Pluggable storage system

### 📊 Enhanced Dashboard

Access a comprehensive dashboard at `/_ai-coauthor/dashboard` with:

- **Summary Statistics**: Total feedback count, average rating, pages with feedback
- **Page Performance Table**: Quick overview of all pages with status indicators
- **Category Breakdown**: Visual distribution of feedback categories
- **Trend Visualization**: See feedback patterns over time
- **Action Items**: Prioritized list of pages needing attention

## Productivity Features (v0.0.3)

### 📥 Smart Export

Export your feedback data in multiple formats:

- **JSON**: Machine-readable format with full metadata
- **CSV**: Spreadsheet-compatible format
- **Markdown**: Human-readable reports

**Advanced Filtering:**

- Filter by page path
- Filter by category
- Filter by rating range
- Filter by date range

### 📈 Advanced Analytics

Get insights into your documentation quality:

- **Rating Distribution**: See how pages are rated
- **Category Analysis**: Identify common issues
- **Time Series Data**: Track improvements over time
- **Page Comparisons**: Compare different sections

### ✅ Smart Task Generation

Automatically generate a prioritized task list based on:

- Average page ratings
- Number of feedback items
- Category patterns
- Recency of feedback

Tasks are categorized as:

- **High Priority**: Low ratings (< 3) with multiple feedback items
- **Medium Priority**: Either low ratings OR multiple feedback items
- **Low Priority**: Single feedback items with acceptable ratings

## Extensibility

### Custom Storage Adapters

Implement your own storage backend by implementing the `FeedbackStorageAdapter` interface:

```typescript
interface FeedbackStorageAdapter {
  save(entry: FeedbackStorageEntry): Promise<void>;
  load(): Promise<FeedbackStorageEntry[]>;
  clear(): Promise<void>;
}
```

Potential use cases:

- Database storage (PostgreSQL, MongoDB, etc.)
- Cloud storage (S3, Azure Blob, etc.)
- Version control integration
- Team collaboration systems

### Metadata Tracking

Enable metadata tracking to add additional context to your documentation:

```javascript
astroAICoauthor({
  enableMetadata: true,
})
```

This allows you to:

- Track last-modified dates
- Add custom metadata to pages
- Integrate with build systems
- Implement automated quality checks

## Development Workflow

### Self-Review Process

1. **Write documentation** in Astro as usual
2. **Review in dev mode** using the feedback widget
3. **Log issues and ideas** as you spot them
4. **View dashboard** to see patterns
5. **Prioritize improvements** using generated tasks
6. **Export reports** to share or archive

### Team Collaboration (Optional)

While designed for solo developers, teams can:

- Share the feedback JSON file via Git
- Export reports in common formats
- Use custom storage adapters for centralized storage
- Integrate with existing workflows
