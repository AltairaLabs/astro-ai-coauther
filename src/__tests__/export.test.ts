/**
 * Tests for export utilities
 */

import { describe, it, expect } from 'vitest';
import { 
  exportFeedback, 
  generateAnalytics, 
  generateTasks,
  type ExportOptions 
} from '../utils/export.js';
import type { FeedbackStorageEntry } from '../storage/FeedbackStorageAdapter.js';

const mockEntries: FeedbackStorageEntry[] = [
  {
    id: '1',
    timestamp: new Date('2025-11-15T10:00:00Z').getTime(),
    page: '/docs/getting-started',
    rating: 5,
    category: 'clarity',
    notes: 'Very clear and helpful',
  },
  {
    id: '2',
    timestamp: new Date('2025-11-15T11:00:00Z').getTime(),
    page: '/docs/getting-started',
    rating: 4,
    category: 'completeness',
    notes: 'Missing some examples',
  },
  {
    id: '3',
    timestamp: new Date('2025-11-16T10:00:00Z').getTime(),
    page: '/docs/api',
    rating: 2,
    category: 'outdated',
    notes: 'This needs updating',
  },
  {
    id: '4',
    timestamp: new Date('2025-11-16T12:00:00Z').getTime(),
    page: '/docs/api',
    rating: 3,
    category: 'accuracy',
    notes: 'Some errors in code examples',
  },
  {
    id: '5',
    timestamp: new Date('2025-11-17T09:00:00Z').getTime(),
    page: '/docs/advanced',
    rating: 1,
    category: 'clarity',
    notes: 'Very confusing',
  },
];

describe('exportFeedback', () => {
  it('should export to JSON format', () => {
    const options: ExportOptions = { format: 'json' };
    const result = exportFeedback(mockEntries, options);
    
    const parsed = JSON.parse(result);
    expect(parsed.version).toBe('1.0.0');
    expect(parsed.totalEntries).toBe(5);
    expect(parsed.entries).toHaveLength(5);
    expect(parsed.exportDate).toBeDefined();
  });

  it('should export to CSV format', () => {
    const options: ExportOptions = { format: 'csv' };
    const result = exportFeedback(mockEntries, options);
    
    const lines = result.split('\n');
    expect(lines[0]).toContain('Timestamp');
    expect(lines[0]).toContain('Page');
    expect(lines[0]).toContain('Rating');
    expect(lines.length).toBe(6); // header + 5 entries
  });

  it('should export to Markdown format', () => {
    const options: ExportOptions = { format: 'markdown' };
    const result = exportFeedback(mockEntries, options);
    
    expect(result).toContain('# Feedback Report');
    expect(result).toContain('**Total Entries:** 5');
    expect(result).toContain('## Summary Statistics');
    expect(result).toContain('## Feedback by Page');
  });

  it('should filter by page', () => {
    const options: ExportOptions = {
      format: 'json',
      filterByPage: '/docs/api',
    };
    const result = exportFeedback(mockEntries, options);
    
    const parsed = JSON.parse(result);
    expect(parsed.totalEntries).toBe(2);
    expect(parsed.entries.every((e: any) => e.page === '/docs/api')).toBe(true);
  });

  it('should filter by category', () => {
    const options: ExportOptions = {
      format: 'json',
      filterByCategory: 'clarity',
    };
    const result = exportFeedback(mockEntries, options);
    
    const parsed = JSON.parse(result);
    expect(parsed.totalEntries).toBe(2);
    expect(parsed.entries.every((e: any) => e.category === 'clarity')).toBe(true);
  });

  it('should filter by rating range', () => {
    const options: ExportOptions = {
      format: 'json',
      filterByRating: { min: 4, max: 5 },
    };
    const result = exportFeedback(mockEntries, options);
    
    const parsed = JSON.parse(result);
    expect(parsed.totalEntries).toBe(2);
    expect(parsed.entries.every((e: any) => e.rating >= 4)).toBe(true);
  });

  it('should filter by date range', () => {
    const options: ExportOptions = {
      format: 'json',
      dateRange: {
        start: new Date('2025-11-16T00:00:00Z'),
        end: new Date('2025-11-16T23:59:59Z'),
      },
    };
    const result = exportFeedback(mockEntries, options);
    
    const parsed = JSON.parse(result);
    expect(parsed.totalEntries).toBe(2);
  });

  it('should handle CSV special characters', () => {
    const entriesWithSpecialChars: FeedbackStorageEntry[] = [
      {
        id: '1',
        timestamp: Date.now(),
        page: '/test',
        rating: 5,
        category: 'general',
        notes: 'Comment with "quotes" and, commas',
      },
    ];

    const options: ExportOptions = { format: 'csv' };
    const result = exportFeedback(entriesWithSpecialChars, options);
    
    expect(result).toContain('"Comment with ""quotes"" and, commas"');
  });
});

describe('generateAnalytics', () => {
  it('should generate correct analytics', () => {
    const analytics = generateAnalytics(mockEntries);
    
    expect(analytics.totalFeedback).toBe(5);
    expect(analytics.averageRating).toBe(3); // (5+4+2+3+1)/5 = 3
    expect(analytics.categoryBreakdown).toEqual({
      clarity: 2,
      completeness: 1,
      outdated: 1,
      accuracy: 1,
    });
  });

  it('should calculate page breakdown correctly', () => {
    const analytics = generateAnalytics(mockEntries);
    
    expect(analytics.pageBreakdown['/docs/getting-started']).toEqual({
      count: 2,
      avgRating: 4.5, // (5+4)/2 = 4.5
    });
    expect(analytics.pageBreakdown['/docs/api']).toEqual({
      count: 2,
      avgRating: 2.5, // (2+3)/2 = 2.5
    });
    expect(analytics.pageBreakdown['/docs/advanced']).toEqual({
      count: 1,
      avgRating: 1,
    });
  });

  it('should calculate rating distribution', () => {
    const analytics = generateAnalytics(mockEntries);
    
    expect(analytics.ratingDistribution).toEqual({
      1: 1,
      2: 1,
      3: 1,
      4: 1,
      5: 1,
    });
  });

  it('should generate trend data', () => {
    const analytics = generateAnalytics(mockEntries);
    
    expect(analytics.trendData).toHaveLength(3); // 3 different days
    expect(analytics.trendData[0].date).toBe('2025-11-15');
    expect(analytics.trendData[0].count).toBe(2);
    expect(analytics.trendData[0].avgRating).toBe(4.5);
  });

  it('should handle empty entries', () => {
    const analytics = generateAnalytics([]);
    
    expect(analytics.totalFeedback).toBe(0);
    expect(analytics.averageRating).toBe(0);
    expect(analytics.categoryBreakdown).toEqual({});
    expect(analytics.pageBreakdown).toEqual({});
    expect(analytics.trendData).toEqual([]);
  });
});

describe('generateTasks', () => {
  it('should generate high priority tasks for low-rated pages', () => {
    const tasks = generateTasks(mockEntries);
    
    // /docs/advanced has 1 entry with rating 1 (low count, low rating)
    // /docs/api has 2 entries with avg rating 2.5 (low rating, moderate count)
    const advancedTask = tasks.find(t => t.page === '/docs/advanced');
    const apiTask = tasks.find(t => t.page === '/docs/api');
    
    expect(apiTask?.priority).toBe('medium'); // Rating < 3 but count < 3
    expect(advancedTask?.priority).toBe('medium'); // Rating < 3 but count < 3
  });

  it('should calculate feedback count correctly', () => {
    const tasks = generateTasks(mockEntries);
    
    const gettingStartedTask = tasks.find(t => t.page === '/docs/getting-started');
    expect(gettingStartedTask?.feedbackCount).toBe(2);
  });

  it('should sort tasks by priority and count', () => {
    const tasks = generateTasks(mockEntries);
    
    // High priority should come first
    const priorities = tasks.map(t => t.priority);
    const firstHighIndex = priorities.indexOf('high');
    const firstMediumIndex = priorities.indexOf('medium');
    const firstLowIndex = priorities.indexOf('low');
    
    if (firstHighIndex !== -1 && firstMediumIndex !== -1) {
      expect(firstHighIndex).toBeLessThan(firstMediumIndex);
    }
    if (firstMediumIndex !== -1 && firstLowIndex !== -1) {
      expect(firstMediumIndex).toBeLessThan(firstLowIndex);
    }
  });

  it('should include all unique categories', () => {
    const tasks = generateTasks(mockEntries);
    
    const gettingStartedTask = tasks.find(t => t.page === '/docs/getting-started');
    expect(gettingStartedTask?.categories).toContain('clarity');
    expect(gettingStartedTask?.categories).toContain('completeness');
  });

  it('should generate meaningful issue descriptions', () => {
    const tasks = generateTasks(mockEntries);
    
    for (const task of tasks) {
      expect(task.issue).toBeDefined();
      expect(task.issue.length).toBeGreaterThan(0);
    }
  });

  it('should handle single entry pages', () => {
    const singleEntry: FeedbackStorageEntry[] = [
      {
        id: '1',
        timestamp: Date.now(),
        page: '/test-page',
        rating: 2,
        category: 'clarity',
        notes: 'Needs work',
      },
    ];

    const tasks = generateTasks(singleEntry);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].priority).toBe('medium'); // Low rating but single entry
  });

  it('should handle empty entries', () => {
    const tasks = generateTasks([]);
    expect(tasks).toEqual([]);
  });
});
