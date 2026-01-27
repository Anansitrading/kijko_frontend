import { useState, useMemo, useEffect, useRef } from 'react';
import {
  AlertCircle,
  Database,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Search,
  RefreshCw,
  FileText,
  GitBranch,
  AlignLeft,
  Plus,
  Minus,
  Shield,
  Eye,
  LayoutGrid,
  List,
  Archive,
} from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { formatDateTime, formatFileChange } from '../../../../utils/formatting';
import { useCompressionData } from '../CompressionTab/hooks';
import type { IngestionEntry, IngestionSourceType } from '../../../../types/contextInspector';

function getSourceIcon(sourceType?: IngestionSourceType) {
  switch (sourceType) {
    case 'repo':
      return { Icon: GitBranch, color: 'text-purple-400', bg: 'bg-purple-500/15', bgSelected: 'bg-purple-500/25' };
    case 'text':
      return { Icon: AlignLeft, color: 'text-emerald-400', bg: 'bg-emerald-500/15', bgSelected: 'bg-emerald-500/25' };
    case 'file':
    default:
      return { Icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/15', bgSelected: 'bg-blue-500/25' };
  }
}

interface KnowledgeBaseTabProps {
  contextId: string;
  selectedIngestionNumbers?: number[];
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse p-6">
      <div className="space-y-4">
        <div className="h-20 bg-slate-800/50 rounded-lg" />
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

interface IngestionCardProps {
  entry: IngestionEntry;
  isSelected?: boolean;
  cardRef?: React.Ref<HTMLDivElement>;
}

function IngestionCard({ entry, isSelected, cardRef }: IngestionCardProps) {
  const { Icon, color, bg, bgSelected } = getSourceIcon(entry.sourceType);
  return (
    <div
      ref={cardRef}
      className={cn(
        "py-3 px-4 rounded-lg transition-colors border",
        isSelected
          ? "bg-blue-600/15 border-blue-500/40 ring-1 ring-blue-500/20"
          : "bg-slate-800/30 hover:bg-slate-800/50 border-white/5 hover:border-white/10"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-7 h-7 rounded-md flex items-center justify-center",
            isSelected ? bgSelected : bg
          )}>
            <Icon size={14} className={color} />
          </div>
          <div>
            <span className="text-sm font-semibold text-white font-mono">#{entry.number}</span>
            {entry.displayName && (
              <span className="ml-2 text-sm text-gray-300">{entry.displayName}</span>
            )}
          </div>
          {entry.neverCompress && (
            <div className="w-5 h-5 rounded flex items-center justify-center bg-amber-500/15" title="Never compress">
              <Shield size={12} className="text-amber-400" />
            </div>
          )}
          {entry.compressed && !entry.neverCompress && (
            <div className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/15" title="Compressed">
              <Eye size={12} className="text-emerald-400" />
            </div>
          )}
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

function IngestionGridCard({ entry, isSelected, cardRef }: IngestionCardProps) {
  const { Icon, color, bg, bgSelected } = getSourceIcon(entry.sourceType);
  return (
    <div
      ref={cardRef}
      className={cn(
        "aspect-square p-2.5 rounded-lg transition-colors border flex flex-col items-center justify-center text-center gap-1.5",
        isSelected
          ? "bg-blue-600/15 border-blue-500/40 ring-1 ring-blue-500/20"
          : "bg-slate-800/30 hover:bg-slate-800/50 border-white/5 hover:border-white/10"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-md flex items-center justify-center",
        isSelected ? bgSelected : bg
      )}>
        <Icon size={16} className={color} />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs font-semibold text-white font-mono">#{entry.number}</span>
        {entry.neverCompress && (
          <Shield size={10} className="text-amber-400" />
        )}
        {entry.compressed && !entry.neverCompress && (
          <Eye size={10} className="text-emerald-400" />
        )}
      </div>
      {entry.displayName && (
        <p className="text-[10px] text-gray-300 truncate w-full leading-tight">{entry.displayName}</p>
      )}
      <span className="text-[9px] text-gray-500 leading-tight">{formatDateTime(entry.timestamp)}</span>
      <div className="flex items-center gap-2 text-[9px]">
        {entry.filesAdded > 0 && (
          <span className="flex items-center gap-0.5 text-emerald-400">
            <Plus size={8} />+{entry.filesAdded}
          </span>
        )}
        {entry.filesRemoved > 0 && (
          <span className="flex items-center gap-0.5 text-red-400">
            <Minus size={8} />-{entry.filesRemoved}
          </span>
        )}
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  entries: IngestionEntry[];
  isOpen: boolean;
  onToggle: () => void;
  viewMode: 'list' | 'grid';
  selectedSet: Set<number>;
  selectedIngestionNumbers: number[];
  selectedCardRef: React.RefObject<HTMLDivElement>;
  accentColor: string;
}

function IngestionSection({
  title,
  icon,
  count,
  entries,
  isOpen,
  onToggle,
  viewMode,
  selectedSet,
  selectedIngestionNumbers,
  selectedCardRef,
  accentColor,
}: SectionProps) {
  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-white/5 transition-colors group"
      >
        <ChevronRight
          size={14}
          className={cn(
            "text-gray-500 transition-transform duration-200",
            isOpen && "rotate-90"
          )}
        />
        {icon}
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{title}</span>
        <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", accentColor)}>
          {count}
        </span>
      </button>
      {isOpen && entries.length > 0 && (
        <div className={cn(
          "mt-1 ml-1",
          viewMode === 'grid' ? 'grid grid-cols-3 gap-2' : 'space-y-2'
        )}>
          {entries.map((entry) => {
            const cardProps = {
              key: entry.number,
              entry,
              isSelected: selectedSet.has(entry.number),
              cardRef: selectedIngestionNumbers.length === 1 && selectedIngestionNumbers[0] === entry.number ? selectedCardRef : undefined,
            };
            return viewMode === 'grid'
              ? <IngestionGridCard {...cardProps} />
              : <IngestionCard {...cardProps} />;
          })}
        </div>
      )}
      {isOpen && entries.length === 0 && (
        <p className="text-xs text-gray-600 ml-7 py-2">No ingestions in this category</p>
      )}
    </div>
  );
}

export function KnowledgeBaseTab({ contextId, selectedIngestionNumbers = [] }: KnowledgeBaseTabProps) {
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [openSections, setOpenSections] = useState({
    compressed: true,
    notCompressed: true,
    neverCompress: true,
  });

  const selectedSet = useMemo(() => new Set(selectedIngestionNumbers), [selectedIngestionNumbers]);
  const selectedCardRef = useRef<HTMLDivElement>(null);

  // Scroll to the selected ingestion card when selection changes
  useEffect(() => {
    if (selectedIngestionNumbers.length === 1 && selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedIngestionNumbers]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Filter, sort, and split into sections
  const { compressed, notCompressed, neverCompress } = useMemo(() => {
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

    return {
      compressed: sorted.filter(e => e.compressed && !e.neverCompress),
      notCompressed: sorted.filter(e => !e.compressed && !e.neverCompress),
      neverCompress: sorted.filter(e => e.neverCompress),
    };
  }, [history, searchQuery, sortField, sortDirection]);

  const totalFiltered = compressed.length + notCompressed.length + neverCompress.length;

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

  const sectionSharedProps = {
    viewMode,
    selectedSet,
    selectedIngestionNumbers,
    selectedCardRef: selectedCardRef as React.RefObject<HTMLDivElement>,
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
            {totalFiltered} of {history.length} ingestions
          </span>
          <div className="flex items-center gap-0.5 ml-2">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1 rounded transition-colors',
                viewMode === 'list'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              )}
              title="List view"
              aria-label="List view"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1 rounded transition-colors',
                viewMode === 'grid'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              )}
              title="Grid view"
              aria-label="Grid view"
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Ingestion Sections */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-3">
        {totalFiltered === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="w-8 h-8 text-gray-600 mb-2" />
            <p className="text-sm text-gray-500">
              {searchQuery ? 'No ingestions match your search' : 'No ingestions yet'}
            </p>
          </div>
        ) : (
          <>
            <IngestionSection
              title="Compressed"
              icon={<Archive size={13} className="text-emerald-400" />}
              count={compressed.length}
              entries={compressed}
              isOpen={openSections.compressed}
              onToggle={() => toggleSection('compressed')}
              accentColor="bg-emerald-500/15 text-emerald-400"
              {...sectionSharedProps}
            />
            <IngestionSection
              title="Not Compressed"
              icon={<Clock size={13} className="text-blue-400" />}
              count={notCompressed.length}
              entries={notCompressed}
              isOpen={openSections.notCompressed}
              onToggle={() => toggleSection('notCompressed')}
              accentColor="bg-blue-500/15 text-blue-400"
              {...sectionSharedProps}
            />
            <IngestionSection
              title="Never Compress"
              icon={<Shield size={13} className="text-amber-400" />}
              count={neverCompress.length}
              entries={neverCompress}
              isOpen={openSections.neverCompress}
              onToggle={() => toggleSection('neverCompress')}
              accentColor="bg-amber-500/15 text-amber-400"
              {...sectionSharedProps}
            />
          </>
        )}
      </div>
    </div>
  );
}
