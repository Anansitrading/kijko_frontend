import { useState, useMemo } from 'react';
import {
  AlertCircle,
  Database,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  Package,
  Plus,
  Minus,
} from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { formatNumber, formatDateTime, formatRelativeTime, formatFileChange } from '../../../../utils/formatting';
import { useCompressionData } from '../CompressionTab/hooks';
import type { IngestionEntry } from '../../../../types/contextInspector';

interface KnowledgeBaseTabProps {
  contextId: string;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse p-6">
      <div className="space-y-4">
        <div className="h-20 bg-slate-800/50 rounded-lg" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-800/50 rounded-lg" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-800/50 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

type SortField = 'number' | 'timestamp' | 'filesAdded';
type SortDirection = 'asc' | 'desc';

function IngestionCard({ entry }: { entry: IngestionEntry }) {
  return (
    <div className="py-3 px-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors border border-white/5 hover:border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-blue-500/15 flex items-center justify-center">
            <Package size={14} className="text-blue-400" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white font-mono">#{entry.number}</span>
            {entry.displayName && (
              <span className="ml-2 text-sm text-gray-300">{entry.displayName}</span>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-500">{formatDateTime(entry.timestamp)}</span>
      </div>
      <div className="flex items-center gap-4 text-xs ml-[38px]">
        {entry.filesAdded > 0 && (
          <span className="flex items-center gap-1 text-emerald-400">
            <Plus size={11} />
            {formatFileChange(entry.filesAdded, true)}
          </span>
        )}
        {entry.filesRemoved > 0 && (
          <span className="flex items-center gap-1 text-red-400">
            <Minus size={11} />
            {formatFileChange(entry.filesRemoved, false)}
          </span>
        )}
        {entry.filesAdded === 0 && entry.filesRemoved === 0 && (
          <span className="text-gray-500">No changes</span>
        )}
      </div>
    </div>
  );
}

export function KnowledgeBaseTab({ contextId }: KnowledgeBaseTabProps) {
  const {
    metrics,
    history,
    isLoading,
    error,
    refresh,
  } = useCompressionData(contextId);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('number');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Derived stats from ingestion history
  const stats = useMemo(() => {
    const totalFilesAdded = history.reduce((sum, e) => sum + e.filesAdded, 0);
    const totalFilesRemoved = history.reduce((sum, e) => sum + e.filesRemoved, 0);
    return { totalFilesAdded, totalFilesRemoved };
  }, [history]);

  // Filter and sort ingestions
  const filteredIngestions = useMemo(() => {
    let filtered = history;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = history.filter((entry) => {
        const numStr = `#${entry.number}`;
        const nameStr = entry.displayName?.toLowerCase() || '';
        const dateStr = formatDateTime(entry.timestamp).toLowerCase();
        return numStr.includes(q) || nameStr.includes(q) || dateStr.includes(q);
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      const dir = sortDirection === 'desc' ? -1 : 1;
      switch (sortField) {
        case 'number':
          return (a.number - b.number) * dir;
        case 'timestamp':
          return (a.timestamp.getTime() - b.timestamp.getTime()) * dir;
        case 'filesAdded':
          return (a.filesAdded - b.filesAdded) * dir;
        default:
          return 0;
      }
    });

    return sorted;
  }, [history, searchQuery, sortField, sortDirection]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Failed to load knowledge base</h3>
        <p className="text-sm text-gray-400 mb-4 max-w-md">{error || 'Unable to load data'}</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'desc'
      ? <ChevronDown size={12} className="text-blue-400" />
      : <ChevronUp size={12} className="text-blue-400" />;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Knowledge Base</h2>
            <p className="text-[11px] text-gray-500">All ingestions and their file changes</p>
          </div>
          <button
            onClick={refresh}
            className={cn(
              'ml-auto flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium',
              'text-gray-400 hover:text-white',
              'bg-white/5 hover:bg-white/10',
              'border border-white/10 rounded-md',
              'transition-colors duration-150'
            )}
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-slate-800/40 rounded-lg px-3 py-2.5">
            <div className="text-white font-semibold text-lg">{metrics.totalIngestions}</div>
            <div className="text-gray-500 text-[10px] uppercase tracking-wider">Ingestions</div>
          </div>
          <div className="bg-slate-800/40 rounded-lg px-3 py-2.5">
            <div className="text-emerald-400 font-semibold text-lg">{formatNumber(stats.totalFilesAdded)}</div>
            <div className="text-gray-500 text-[10px] uppercase tracking-wider">Files Added</div>
          </div>
          <div className="bg-slate-800/40 rounded-lg px-3 py-2.5">
            <div className="text-red-400 font-semibold text-lg">{formatNumber(stats.totalFilesRemoved)}</div>
            <div className="text-gray-500 text-[10px] uppercase tracking-wider">Files Removed</div>
          </div>
          <div className="bg-slate-800/40 rounded-lg px-3 py-2.5">
            <div className="text-white font-semibold text-lg">{formatRelativeTime(metrics.lastIngestion)}</div>
            <div className="text-gray-500 text-[10px] uppercase tracking-wider">Last Ingestion</div>
          </div>
        </div>
      </div>

      {/* Search + Sort Bar */}
      <div className="shrink-0 px-6 py-3 border-b border-white/5 space-y-2.5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search ingestions by number, name, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full pl-8 pr-3 py-2 text-sm',
              'bg-white/5 border border-white/10 rounded-md',
              'text-white placeholder-gray-500',
              'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
              'transition-colors duration-150'
            )}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {([
            { field: 'number' as SortField, label: 'Number' },
            { field: 'timestamp' as SortField, label: 'Date' },
            { field: 'filesAdded' as SortField, label: 'Files Added' },
          ]).map(({ field, label }) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors',
                sortField === field
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-500 hover:text-gray-300 bg-white/5 border border-transparent hover:border-white/10'
              )}
            >
              {label}
              <SortIcon field={field} />
            </button>
          ))}
          <span className="ml-auto text-[11px] text-gray-600">
            {filteredIngestions.length} of {history.length} ingestions
          </span>
        </div>
      </div>

      {/* Ingestion List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-3">
        <div className="space-y-2">
          {filteredIngestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="w-8 h-8 text-gray-600 mb-2" />
              <p className="text-sm text-gray-500">
                {searchQuery ? 'No ingestions match your search' : 'No ingestions yet'}
              </p>
            </div>
          ) : (
            filteredIngestions.map((entry) => (
              <IngestionCard key={entry.number} entry={entry} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
