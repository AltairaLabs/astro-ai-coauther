/**
 * Export utilities for feedback data
 * Supports JSON, CSV, and Markdown formats
 */

import type { FeedbackStorageEntry } from '../storage/FeedbackStorageAdapter.js';

export interface ExportOptions {
  format: 'json' | 'csv' | 'markdown';
  filterByPage?: string;
  filterByCategory?: string;
  filterByRating?: { min?: number; max?: number };
  dateRange?: { start?: Date; end?: Date };
}

/**
 * Export feedback data in the specified format
 */
export function exportFeedback(
  entries: FeedbackStorageEntry[],
  options: ExportOptions
): string {
  // Apply filters
  const filtered = filterEntries(entries, options);

  switch (options.format) {
    case 'json':
      return exportToJSON(filtered);
    case 'csv':
      return exportToCSV(filtered);
    case 'markdown':
      return exportToMarkdown(filtered);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

/**
 * Filter entries based on provided options
 */
function filterEntries(
  entries: FeedbackStorageEntry[],
  options: ExportOptions
): FeedbackStorageEntry[] {
  return entries.filter((entry) => {
    return matchesPageFilter(entry, options) &&
           matchesCategoryFilter(entry, options) &&
           matchesRatingFilter(entry, options) &&
           matchesDateFilter(entry, options);
  });
}

function matchesPageFilter(entry: FeedbackStorageEntry, options: ExportOptions): boolean {
  return !options.filterByPage || entry.page === options.filterByPage;
}

function matchesCategoryFilter(entry: FeedbackStorageEntry, options: ExportOptions): boolean {
  return !options.filterByCategory || entry.category === options.filterByCategory;
}

function matchesRatingFilter(entry: FeedbackStorageEntry, options: ExportOptions): boolean {
  if (!options.filterByRating) return true;
  const rating = entry.rating as number;
  if (options.filterByRating.min !== undefined && rating < options.filterByRating.min) {
    return false;
  }
  if (options.filterByRating.max !== undefined && rating > options.filterByRating.max) {
    return false;
  }
  return true;
}

function matchesDateFilter(entry: FeedbackStorageEntry, options: ExportOptions): boolean {
  if (!options.dateRange) return true;
  const entryDate = new Date(entry.timestamp);
  if (options.dateRange.start && entryDate < options.dateRange.start) {
    return false;
  }
  if (options.dateRange.end && entryDate > options.dateRange.end) {
    return false;
  }
  return true;
}

/**
 * Export to JSON format
 */
function exportToJSON(entries: FeedbackStorageEntry[]): string {
  return JSON.stringify(
    {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      totalEntries: entries.length,
      entries,
    },
    null,
    2
  );
}

/**
 * Export to CSV format
 */
function exportToCSV(entries: FeedbackStorageEntry[]): string {
  if (entries.length === 0) {
    return 'No feedback entries to export';
  }

  // CSV headers
  const headers = ['Timestamp', 'Page', 'Rating', 'Category', 'Notes', 'Highlight'];
  const csvRows = [headers.join(',')];

  // CSV data rows
  for (const entry of entries) {
    const row = [
      new Date(entry.timestamp).toISOString(),
      escapeCSV(entry.page),
      entry.rating?.toString() || '',
      escapeCSV(entry.category || ''),
      escapeCSV(entry.notes || ''),
      escapeCSV(entry.highlight || ''),
    ];
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Export to Markdown format
 */
function exportToMarkdown(entries: FeedbackStorageEntry[]): string {
  if (entries.length === 0) {
    return '# Feedback Report\n\nNo feedback entries to export.';
  }

  const lines: string[] = [
    '# Feedback Report',
    '',
    `**Generated:** ${new Date().toLocaleString()}`,
    `**Total Entries:** ${entries.length}`,
    ''
  ];

  // Calculate stats
  const avgRating = entries.reduce((sum, e) => sum + (e.rating as number || 0), 0) / entries.length;
  const categoryBreakdown = entries.reduce((acc, e) => {
    const cat = e.category || 'general';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  lines.push(
    '## Summary Statistics',
    '',
    `- **Average Rating:** ${avgRating.toFixed(2)}/5`,
    `- **Category Breakdown:**`
  );
  
  for (const [category, count] of Object.entries(categoryBreakdown)) {
    lines.push(`  - ${category}: ${count}`);
  }
  lines.push('');

  // Group by page
  const byPage = entries.reduce((acc, e) => {
    const page = e.page || 'unknown';
    if (!acc[page]) acc[page] = [];
    acc[page].push(e);
    return acc;
  }, {} as Record<string, FeedbackStorageEntry[]>);

  lines.push('## Feedback by Page', '');

  for (const [page, pageEntries] of Object.entries(byPage)) {
    lines.push(`### ${page}`, '');
    
    for (const entry of pageEntries) {
      const date = new Date(entry.timestamp).toLocaleString();
      const stars = '⭐'.repeat(entry.rating as number || 0);
      
      lines.push(`**${date}** | ${stars} (${entry.rating}/5) | *${entry.category || 'general'}*`);
      
      if (entry.notes) {
        lines.push('', `> ${entry.notes}`);
      }
      
      if (entry.highlight) {
        lines.push('', '*Highlighted text:*', `> ${entry.highlight}`);
      }
      
      lines.push('', '---', '');
    }
  }

  return lines.join('\n');
}

/**
 * Escape special characters for CSV
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\\')) {
    return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '""')}"`;
  }
  return value;
}

/**
 * Generate analytics data from feedback entries
 */
export interface AnalyticsData {
  totalFeedback: number;
  averageRating: number;
  categoryBreakdown: Record<string, number>;
  pageBreakdown: Record<string, { count: number; avgRating: number }>;
  ratingDistribution: Record<number, number>;
  trendData: Array<{ date: string; count: number; avgRating: number }>;
}

export function generateAnalytics(entries: FeedbackStorageEntry[]): AnalyticsData {
  if (entries.length === 0) {
    return {
      totalFeedback: 0,
      averageRating: 0,
      categoryBreakdown: {},
      pageBreakdown: {},
      ratingDistribution: {},
      trendData: [],
    };
  }

  // Calculate average rating
  const totalRating = entries.reduce((sum, e) => sum + (e.rating as number || 0), 0);
  const averageRating = totalRating / entries.length;

  // Category breakdown
  const categoryBreakdown = entries.reduce((acc, e) => {
    const cat = e.category || 'general';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Page breakdown with average ratings
  const pageBreakdown = entries.reduce((acc, e) => {
    const page = e.page || 'unknown';
    if (!acc[page]) {
      acc[page] = { count: 0, totalRating: 0, avgRating: 0 };
    }
    acc[page].count++;
    acc[page].totalRating += (e.rating as number || 0);
    acc[page].avgRating = acc[page].totalRating / acc[page].count;
    return acc;
  }, {} as Record<string, any>);

  // Clean up pageBreakdown
  const cleanPageBreakdown: Record<string, { count: number; avgRating: number }> = {};
  for (const [page, data] of Object.entries(pageBreakdown)) {
    cleanPageBreakdown[page] = { count: data.count, avgRating: data.avgRating };
  }

  // Rating distribution
  const ratingDistribution = entries.reduce((acc, e) => {
    const rating = e.rating as number || 0;
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Trend data (by day)
  const trendMap = entries.reduce((acc, e) => {
    const date = new Date(e.timestamp).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { count: 0, totalRating: 0 };
    }
    acc[date].count++;
    acc[date].totalRating += (e.rating as number || 0);
    return acc;
  }, {} as Record<string, { count: number; totalRating: number }>);

  const trendData = Object.entries(trendMap)
    .map(([date, data]) => ({
      date,
      count: data.count,
      avgRating: data.totalRating / data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalFeedback: entries.length,
    averageRating,
    categoryBreakdown,
    pageBreakdown: cleanPageBreakdown,
    ratingDistribution,
    trendData,
  };
}

/**
 * Generate actionable tasks from feedback
 */
export interface FeedbackTask {
  priority: 'high' | 'medium' | 'low';
  page: string;
  issue: string;
  feedbackCount: number;
  averageRating: number;
  categories: string[];
}

export function generateTasks(entries: FeedbackStorageEntry[]): FeedbackTask[] {
  const tasks: FeedbackTask[] = [];

  // Group by page
  const byPage = entries.reduce((acc, e) => {
    const page = e.page || 'unknown';
    if (!acc[page]) acc[page] = [];
    acc[page].push(e);
    return acc;
  }, {} as Record<string, FeedbackStorageEntry[]>);

  for (const [page, pageEntries] of Object.entries(byPage)) {
    // Calculate average rating for page
    const avgRating = pageEntries.reduce((sum, e) => sum + (e.rating as number || 0), 0) / pageEntries.length;
    
    // Get unique categories
    const categories = [...new Set(pageEntries.map(e => e.category || 'general'))];
    
    // Determine priority based on rating and count
    let priority: 'high' | 'medium' | 'low' = 'low';
    if (avgRating < 3 && pageEntries.length >= 3) {
      priority = 'high';
    } else if (avgRating < 3 || pageEntries.length >= 5) {
      priority = 'medium';
    }

    // Generate issue description
    const categoryText = categories.length > 1 
      ? `${categories[0]} and ${categories.length - 1} other issue(s)` 
      : categories[0];
    
    const issue = avgRating < 3
      ? `Low rating (${avgRating.toFixed(1)}/5) - ${categoryText}`
      : `Multiple feedback items (${pageEntries.length}) - ${categoryText}`;

    tasks.push({
      priority,
      page,
      issue,
      feedbackCount: pageEntries.length,
      averageRating: avgRating,
      categories,
    });
  }

  // Sort by priority and feedback count
  return tasks.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.feedbackCount - a.feedbackCount;
  });
}
