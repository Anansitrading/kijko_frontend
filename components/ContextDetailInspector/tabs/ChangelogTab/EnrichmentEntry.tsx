import { Wrench, Network, GitBranch } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import type { ChangelogEntry, UserAccess } from '../../../../types/contextInspector';

interface EnrichmentEntryProps {
  entry: ChangelogEntry;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getAuthorName(author: UserAccess | 'System'): string {
  if (author === 'System') return 'System';
  return author.name;
}

export function EnrichmentEntry({ entry }: EnrichmentEntryProps) {
  const { timestamp, author, description, filesAdded, filesModified } = entry;
  const dateStr = formatDate(timestamp);
  const timeStr = formatTime(timestamp);
  const authorName = getAuthorName(author);

  // For enrichment entries, filesAdded represents entities/symbols, filesModified represents relationships/files
  const entitiesOrSymbols = filesAdded;
  const relationshipsOrFiles = filesModified;

  // Determine if this is a Knowledge Graph or LSP update based on description
  const isKnowledgeGraph = description?.toLowerCase().includes('knowledge graph');
  const isLSP = description?.toLowerCase().includes('lsp');

  return (
    <div
      className={cn(
        'bg-white/5 border border-white/10 rounded-lg p-4',
        'hover:border-white/20 transition-colors duration-150'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-amber-500/10">
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">
                Enrichment Update
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {dateStr} {timeStr} • {authorName}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-white mb-3">{description}</p>
      )}

      {/* Stats */}
      {(entitiesOrSymbols || relationshipsOrFiles) && (
        <div className="flex items-center gap-4 text-sm">
          {entitiesOrSymbols !== undefined && entitiesOrSymbols > 0 && (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Network className="w-3.5 h-3.5" />
              <span>
                +{entitiesOrSymbols} {isKnowledgeGraph ? 'entities' : isLSP ? 'symbols' : 'items'}
              </span>
            </div>
          )}
          {relationshipsOrFiles !== undefined && relationshipsOrFiles > 0 && (
            <div className="flex items-center gap-1.5 text-blue-400">
              <GitBranch className="w-3.5 h-3.5" />
              <span>
                +{relationshipsOrFiles} {isKnowledgeGraph ? 'relationships' : 'files processed'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
