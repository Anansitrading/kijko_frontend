// Global Search Modal
// Cmd/Ctrl+K to open, search across users, activity, and changelog

import { useState, useRef, useEffect } from 'react';
import { Search, X, User, Activity, FileText, ArrowRight } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useSearch } from '../hooks/useSearch';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { SearchResult, SearchResultType } from '../../../types/contextInspector';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextId: string;
  onResultSelect: (result: SearchResult) => void;
}

const RESULT_TYPE_CONFIG: Record<SearchResultType, { icon: typeof User; label: string; color: string }> = {
  user: { icon: User, label: 'Users', color: 'text-blue-400' },
  activity: { icon: Activity, label: 'Activity', color: 'text-emerald-400' },
  changelog: { icon: FileText, label: 'Changelog', color: 'text-amber-400' },
  file: { icon: FileText, label: 'Files', color: 'text-purple-400' },
};

export function SearchModal({
  isOpen,
  onClose,
  contextId,
  onResultSelect,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const { results, isLoading, groupedResults } = useSearch(query, { contextId });

  // Focus trap for accessibility
  useFocusTrap(modalRef, isOpen);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Small delay to ensure modal is rendered
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Flatten results for keyboard navigation
  const flatResults = results;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(flatResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelect = (result: SearchResult) => {
    onResultSelect(result);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-slate-950/80 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-modal-title"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            id="search-modal-title"
            placeholder="Search users, activity, changelog..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
            autoComplete="off"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <LoadingState />
          ) : query && results.length === 0 ? (
            <EmptyState query={query} />
          ) : query ? (
            <ResultsList
              groupedResults={groupedResults}
              selectedIndex={selectedIndex}
              flatResults={flatResults}
              onSelect={handleSelect}
              onHover={setSelectedIndex}
            />
          ) : (
            <HintState />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">↓</kbd>
              <span className="ml-1">to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Enter</kbd>
              <span className="ml-1">to select</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Esc</kbd>
            <span className="ml-1">to close</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function LoadingState() {
  return (
    <div className="py-8 text-center">
      <div className="inline-block w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
      <p className="mt-2 text-sm text-gray-500">Searching...</p>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="py-8 text-center">
      <Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
      <p className="text-sm text-gray-400">
        No results for "{query}"
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Try a different search term
      </p>
    </div>
  );
}

function HintState() {
  return (
    <div className="py-8 text-center">
      <Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
      <p className="text-sm text-gray-400">
        Start typing to search
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Search across users, activity, and changelog
      </p>
    </div>
  );
}

interface ResultsListProps {
  groupedResults: Record<SearchResultType, SearchResult[]>;
  selectedIndex: number;
  flatResults: SearchResult[];
  onSelect: (result: SearchResult) => void;
  onHover: (index: number) => void;
}

function ResultsList({
  groupedResults,
  selectedIndex,
  flatResults,
  onSelect,
  onHover,
}: ResultsListProps) {
  let currentIndex = 0;

  return (
    <div className="py-2">
      {(Object.entries(groupedResults) as [SearchResultType, SearchResult[]][]).map(
        ([type, results]) => {
          if (results.length === 0) return null;

          const config = RESULT_TYPE_CONFIG[type];
          const Icon = config.icon;

          return (
            <div key={type} className="mb-2">
              {/* Category Header */}
              <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {config.label}
              </div>

              {/* Results */}
              {results.map((result) => {
                const index = currentIndex++;
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={result.id}
                    onClick={() => onSelect(result)}
                    onMouseEnter={() => onHover(flatResults.indexOf(result))}
                    className={cn(
                      'w-full px-4 py-2 flex items-center gap-3 text-left transition-colors',
                      isSelected ? 'bg-blue-500/20' : 'hover:bg-slate-800/50'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 flex-shrink-0', config.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{result.title}</p>
                      <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                    </div>
                    {isSelected && (
                      <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        }
      )}
    </div>
  );
}

export default SearchModal;
