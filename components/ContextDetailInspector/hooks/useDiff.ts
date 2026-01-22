// useDiff Hook - Fetches and manages diff data between versions
import { useState, useEffect, useCallback } from 'react';
import type { DiffData, DiffViewMode, UseDiffReturn, DiffFile } from '../../../types/contextInspector';

// Mock diff data generator
function generateMockDiff(contextId: string, fromVersion: number, toVersion: number): DiffData {
  const mockFiles: DiffFile[] = [
    {
      path: 'src/core/client.ts',
      status: 'modified',
      linesAdded: 15,
      linesRemoved: 8,
      language: 'typescript',
      hunks: [
        {
          oldStart: 1, oldLines: 10, newStart: 1, newLines: 12,
          lines: [
            { type: 'context', content: "import { Config } from './config';", oldLineNumber: 1, newLineNumber: 1 },
            { type: 'addition', content: "import { WebSocketManager } from '../real-time';", newLineNumber: 2 },
            { type: 'context', content: "import { ApiClient } from './api';", oldLineNumber: 2, newLineNumber: 3 },
            { type: 'context', content: '', oldLineNumber: 3, newLineNumber: 4 },
            { type: 'context', content: 'export class PanopticonClient {', oldLineNumber: 4, newLineNumber: 5 },
            { type: 'deletion', content: '  constructor(config: Config) {', oldLineNumber: 5 },
            { type: 'addition', content: '  constructor(config: Config, wsEnabled = false) {', newLineNumber: 6 },
            { type: 'context', content: '    this.config = config;', oldLineNumber: 6, newLineNumber: 7 },
            { type: 'addition', content: '    if (wsEnabled) {', newLineNumber: 8 },
            { type: 'addition', content: '      this.ws = new WebSocketManager(config);', newLineNumber: 9 },
            { type: 'addition', content: '    }', newLineNumber: 10 },
            { type: 'context', content: '  }', oldLineNumber: 7, newLineNumber: 11 },
          ],
        },
      ],
    },
    {
      path: 'src/real-time/WebSocketManager.ts',
      status: 'added',
      linesAdded: 45,
      linesRemoved: 0,
      language: 'typescript',
      hunks: [
        {
          oldStart: 0, oldLines: 0, newStart: 1, newLines: 17,
          lines: [
            { type: 'addition', content: "import { Config } from '../core/config';", newLineNumber: 1 },
            { type: 'addition', content: "import { EventEmitter } from '../utils/events';", newLineNumber: 2 },
            { type: 'addition', content: '', newLineNumber: 3 },
            { type: 'addition', content: 'export interface WebSocketOptions {', newLineNumber: 4 },
            { type: 'addition', content: '  reconnect: boolean;', newLineNumber: 5 },
            { type: 'addition', content: '  maxRetries: number;', newLineNumber: 6 },
            { type: 'addition', content: '}', newLineNumber: 7 },
            { type: 'addition', content: '', newLineNumber: 8 },
            { type: 'addition', content: 'export class WebSocketManager extends EventEmitter {', newLineNumber: 9 },
            { type: 'addition', content: '  private ws: WebSocket | null = null;', newLineNumber: 10 },
            { type: 'addition', content: '  private config: Config;', newLineNumber: 11 },
            { type: 'addition', content: '', newLineNumber: 12 },
            { type: 'addition', content: '  constructor(config: Config) {', newLineNumber: 13 },
            { type: 'addition', content: '    super();', newLineNumber: 14 },
            { type: 'addition', content: '    this.config = config;', newLineNumber: 15 },
            { type: 'addition', content: '  }', newLineNumber: 16 },
            { type: 'addition', content: '}', newLineNumber: 17 },
          ],
        },
      ],
    },
    {
      path: 'src/legacy/oldClient.ts',
      status: 'removed',
      linesAdded: 0,
      linesRemoved: 35,
      language: 'typescript',
      hunks: [
        {
          oldStart: 1, oldLines: 10, newStart: 0, newLines: 0,
          lines: [
            { type: 'deletion', content: '// Legacy client implementation', oldLineNumber: 1 },
            { type: 'deletion', content: "import { Config } from '../core/config';", oldLineNumber: 2 },
            { type: 'deletion', content: '', oldLineNumber: 3 },
            { type: 'deletion', content: 'export class OldClient {', oldLineNumber: 4 },
            { type: 'deletion', content: '  private config: Config;', oldLineNumber: 5 },
            { type: 'deletion', content: '', oldLineNumber: 6 },
            { type: 'deletion', content: '  constructor(config: Config) {', oldLineNumber: 7 },
            { type: 'deletion', content: '    this.config = config;', oldLineNumber: 8 },
            { type: 'deletion', content: '  }', oldLineNumber: 9 },
            { type: 'deletion', content: '}', oldLineNumber: 10 },
          ],
        },
      ],
    },
    {
      path: 'src/utils/helpers.ts',
      status: 'modified',
      linesAdded: 5,
      linesRemoved: 1,
      language: 'typescript',
      hunks: [
        {
          oldStart: 12, oldLines: 5, newStart: 12, newLines: 9,
          lines: [
            { type: 'context', content: 'export function formatDate(date: Date): string {', oldLineNumber: 12, newLineNumber: 12 },
            { type: 'deletion', content: '  return date.toISOString();', oldLineNumber: 13 },
            { type: 'addition', content: "  return date.toLocaleDateString('en-US', {", newLineNumber: 13 },
            { type: 'addition', content: "    month: 'short',", newLineNumber: 14 },
            { type: 'addition', content: "    day: 'numeric',", newLineNumber: 15 },
            { type: 'addition', content: "    year: 'numeric',", newLineNumber: 16 },
            { type: 'addition', content: '  });', newLineNumber: 17 },
            { type: 'context', content: '}', oldLineNumber: 14, newLineNumber: 18 },
          ],
        },
      ],
    },
  ];

  return {
    files: mockFiles,
    summary: {
      filesAdded: mockFiles.filter(f => f.status === 'added').length,
      filesRemoved: mockFiles.filter(f => f.status === 'removed').length,
      filesModified: mockFiles.filter(f => f.status === 'modified').length,
      totalAdditions: mockFiles.reduce((sum, f) => sum + f.linesAdded, 0),
      totalDeletions: mockFiles.reduce((sum, f) => sum + f.linesRemoved, 0),
    },
    fromVersion,
    toVersion,
  };
}

export function useDiff(contextId: string, fromVersion: number, toVersion: number): UseDiffReturn {
  const [diff, setDiff] = useState<DiffData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [viewMode, setViewMode] = useState<DiffViewMode>('unified');

  useEffect(() => {
    if (!contextId || fromVersion === toVersion) {
      setDiff(null);
      return;
    }

    let cancelled = false;

    async function fetchDiff() {
      setIsLoading(true);
      setError(null);

      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (cancelled) return;
        const mockData = generateMockDiff(contextId, fromVersion, toVersion);
        setDiff(mockData);
        setCurrentFileIndex(0);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch diff');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchDiff();
    return () => { cancelled = true; };
  }, [contextId, fromVersion, toVersion]);

  const handleSetCurrentFileIndex = useCallback((index: number) => {
    if (diff && index >= 0 && index < diff.files.length) {
      setCurrentFileIndex(index);
    }
  }, [diff]);

  return { diff, isLoading, error, currentFileIndex, setCurrentFileIndex: handleSetCurrentFileIndex, viewMode, setViewMode };
}
