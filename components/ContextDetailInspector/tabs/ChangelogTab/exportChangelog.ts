import type { ChangelogEntry, UserAccess } from '../../../../types/contextInspector';

function getAuthorName(author: UserAccess | 'System'): string {
  if (author === 'System') return 'System';
  return author.name;
}

function formatDateForExport(date: Date): string {
  return date.toISOString();
}

interface ExportEntry {
  id: string;
  type: string;
  number?: number;
  timestamp: string;
  author: string;
  description?: string;
  filesAdded?: number;
  filesRemoved?: number;
  filesModified?: number;
  addedFiles?: string[];
  removedFiles?: string[];
  modifiedFiles?: { path: string; linesAdded: number; linesRemoved: number }[];
}

function transformEntryForExport(entry: ChangelogEntry): ExportEntry {
  return {
    id: entry.id,
    type: entry.type,
    number: entry.number,
    timestamp: formatDateForExport(entry.timestamp),
    author: getAuthorName(entry.author),
    description: entry.description,
    filesAdded: entry.filesAdded,
    filesRemoved: entry.filesRemoved,
    filesModified: entry.filesModified,
    addedFiles: entry.addedFiles,
    removedFiles: entry.removedFiles,
    modifiedFiles: entry.modifiedFiles,
  };
}

function convertToCSV(entries: ExportEntry[]): string {
  const headers = [
    'ID',
    'Type',
    'Number',
    'Timestamp',
    'Author',
    'Description',
    'Files Added',
    'Files Removed',
    'Files Modified',
  ];

  const rows = entries.map((entry) => [
    entry.id,
    entry.type,
    entry.number?.toString() || '',
    entry.timestamp,
    entry.author,
    entry.description || '',
    entry.filesAdded?.toString() || '',
    entry.filesRemoved?.toString() || '',
    entry.filesModified?.toString() || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        // Escape quotes and wrap in quotes if contains comma
        const escaped = cell.replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      }).join(',')
    ),
  ].join('\n');

  return csvContent;
}

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

export type ExportFormat = 'csv' | 'json';

export function exportChangelog(
  entries: ChangelogEntry[],
  format: ExportFormat,
  contextName?: string
): void {
  const exportEntries = entries.map(transformEntryForExport);
  const timestamp = new Date().toISOString().split('T')[0];
  const safeName = contextName?.replace(/[^a-z0-9]/gi, '-') || 'changelog';
  const filename = `${safeName}-${timestamp}`;

  if (format === 'json') {
    const jsonContent = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        contextName,
        totalEntries: exportEntries.length,
        entries: exportEntries,
      },
      null,
      2
    );
    downloadFile(jsonContent, `${filename}.json`, 'application/json');
  } else {
    const csvContent = convertToCSV(exportEntries);
    downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  }
}
