// Export Service for Sprint 8
// Handles JSON, CSV exports and file downloads

import type {
  ContextItem,
  ContextSummary,
  ActivityEvent,
  ChangelogEntry,
  ExportFormat,
} from '../types/contextInspector';

// ============================================
// Core Download Utilities
// ============================================

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadJSON<T>(data: T, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, filename, 'application/json');
}

export function downloadCSV(csv: string, filename: string): void {
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

// ============================================
// CSV Conversion Utilities
// ============================================

function escapeCSVValue(value: string): string {
  const escaped = value.replace(/"/g, '""');
  // Wrap in quotes if contains comma, newline, or quotes
  if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
    return `"${escaped}"`;
  }
  return escaped;
}

export function convertToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: (keyof T)[]
): string {
  if (data.length === 0) {
    return columns.join(',');
  }

  // Header row
  const header = columns.map(col => String(col)).join(',');

  // Data rows
  const rows = data.map(row =>
    columns
      .map(col => {
        const value = row[col];
        if (value === null || value === undefined) {
          return '';
        }
        if (value instanceof Date) {
          return escapeCSVValue(value.toISOString());
        }
        if (typeof value === 'object') {
          return escapeCSVValue(JSON.stringify(value));
        }
        return escapeCSVValue(String(value));
      })
      .join(',')
  );

  return [header, ...rows].join('\n');
}

// ============================================
// Context-Specific Export Functions
// ============================================

export function exportContextInfo(
  context: ContextItem,
  summary?: ContextSummary
): void {
  const data = {
    context: {
      id: context.id,
      name: context.name,
      type: context.type,
      size: context.size,
      fileCount: context.fileCount,
      lastUpdated: context.lastUpdated,
      status: context.status,
    },
    summary: summary || null,
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };

  const filename = `${context.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-info.json`;
  downloadJSON(data, filename);
}

export function exportActivityLog(
  events: ActivityEvent[],
  format: ExportFormat = 'json'
): void {
  const timestamp = new Date().toISOString().split('T')[0];

  if (format === 'csv') {
    const csvData = events.map(event => ({
      id: event.id,
      type: event.type,
      user: event.user.name,
      email: event.user.email,
      description: event.description,
      timestamp: event.timestamp instanceof Date
        ? event.timestamp.toISOString()
        : event.timestamp,
    }));

    const csv = convertToCSV(csvData, ['id', 'type', 'user', 'email', 'description', 'timestamp']);
    downloadCSV(csv, `activity-log-${timestamp}.csv`);
  } else {
    const data = {
      events,
      exportedAt: new Date().toISOString(),
      totalCount: events.length,
    };
    downloadJSON(data, `activity-log-${timestamp}.json`);
  }
}

export function exportChangelog(
  entries: ChangelogEntry[],
  format: ExportFormat = 'json'
): void {
  const timestamp = new Date().toISOString().split('T')[0];

  if (format === 'csv') {
    const csvData = entries.map(entry => ({
      id: entry.id,
      type: entry.type,
      number: entry.number ?? '',
      timestamp: entry.timestamp instanceof Date
        ? entry.timestamp.toISOString()
        : entry.timestamp,
      author: entry.author === 'System' ? 'System' : entry.author.name,
      filesAdded: entry.filesAdded ?? 0,
      filesRemoved: entry.filesRemoved ?? 0,
      filesModified: entry.filesModified ?? 0,
      description: entry.description ?? '',
    }));

    const csv = convertToCSV(csvData, [
      'id',
      'type',
      'number',
      'timestamp',
      'author',
      'filesAdded',
      'filesRemoved',
      'filesModified',
      'description',
    ]);
    downloadCSV(csv, `changelog-${timestamp}.csv`);
  } else {
    const data = {
      entries,
      exportedAt: new Date().toISOString(),
      totalCount: entries.length,
    };
    downloadJSON(data, `changelog-${timestamp}.json`);
  }
}

// ============================================
// Original Files Download (Mock)
// ============================================

export async function downloadOriginalFiles(contextId: string): Promise<void> {
  // In production, this would:
  // 1. Request download from API
  // 2. API returns zip file or download URL
  // 3. Trigger browser download

  // Mock implementation: simulate download delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // For now, create a placeholder text file
  const placeholder = `Original files download for context: ${contextId}\n\nThis is a placeholder. In production, this would download a ZIP archive containing the original uncompressed files.`;

  downloadFile(placeholder, `original-files-${contextId}.txt`, 'text/plain');
}
