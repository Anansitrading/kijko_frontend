// Diff utilities - Syntax highlighting and diff download
import type { DiffData, DiffFile } from '../types/contextInspector';

// Language detection from file path
export function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    md: 'markdown',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    h: 'c',
    hpp: 'cpp',
    css: 'css',
    scss: 'scss',
    html: 'html',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    sh: 'bash',
    bash: 'bash',
    sql: 'sql',
  };
  return languageMap[ext] || 'text';
}

// Generate unified diff format (.patch file)
export function generatePatch(diff: DiffData): string {
  const lines: string[] = [];

  lines.push(`# Diff between Ingestion #${diff.toVersion} and #${diff.fromVersion}`);
  lines.push(`# Generated at ${new Date().toISOString()}`);
  lines.push('');

  for (const file of diff.files) {
    // File header
    if (file.status === 'added') {
      lines.push(`diff --git a/dev/null b/${file.path}`);
      lines.push('new file mode 100644');
      lines.push('--- /dev/null');
      lines.push(`+++ b/${file.path}`);
    } else if (file.status === 'removed') {
      lines.push(`diff --git a/${file.path} b/dev/null`);
      lines.push('deleted file mode 100644');
      lines.push(`--- a/${file.path}`);
      lines.push('+++ /dev/null');
    } else {
      lines.push(`diff --git a/${file.path} b/${file.path}`);
      lines.push(`--- a/${file.path}`);
      lines.push(`+++ b/${file.path}`);
    }

    // Hunks
    for (const hunk of file.hunks) {
      lines.push(`@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`);

      for (const line of hunk.lines) {
        const prefix = line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' ';
        lines.push(`${prefix}${line.content}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

// Download diff as .patch file
export function downloadDiff(diff: DiffData, filename?: string): void {
  const patch = generatePatch(diff);
  const defaultFilename = `diff_v${diff.fromVersion}_to_v${diff.toVersion}.patch`;
  const blob = new Blob([patch], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Get file icon based on status
export function getFileStatusIcon(status: DiffFile['status']): string {
  switch (status) {
    case 'added': return '+';
    case 'removed': return '-';
    case 'modified': return '~';
    default: return ' ';
  }
}

// Get file status color class
export function getFileStatusColor(status: DiffFile['status']): string {
  switch (status) {
    case 'added': return 'text-emerald-400';
    case 'removed': return 'text-red-400';
    case 'modified': return 'text-amber-400';
    default: return 'text-gray-400';
  }
}

// Format line count
export function formatLineCount(added: number, removed: number): string {
  const parts: string[] = [];
  if (added > 0) parts.push(`+${added}`);
  if (removed > 0) parts.push(`-${removed}`);
  return parts.join(', ') || '0 changes';
}
