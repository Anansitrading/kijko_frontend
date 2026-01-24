import React from 'react';
import { GitBranch, Star, FileText, Code, Clock, Lock, Globe } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { RepoInfo, GitProvider } from '../../../types/project';

// =============================================================================
// Types
// =============================================================================

interface RepoInfoCardProps {
  info: RepoInfo;
  className?: string;
  compact?: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function getProviderIcon(provider: GitProvider): React.ReactNode {
  switch (provider) {
    case 'github':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      );
    case 'gitlab':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.546 10.93L13.067.452a1.55 1.55 0 00-2.188 0L8.708 2.627l2.76 2.76a1.838 1.838 0 012.327 2.341l2.658 2.66a1.838 1.838 0 11-1.103 1.033l-2.48-2.48v6.53a1.838 1.838 0 11-1.512-.037V8.73a1.838 1.838 0 01-.998-2.413L7.636 3.593.454 10.776a1.549 1.549 0 000 2.188l10.48 10.48a1.55 1.55 0 002.186 0l10.426-10.326a1.55 1.55 0 000-2.188z"/>
        </svg>
      );
    case 'bitbucket':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.899zM14.52 15.53H9.522L8.17 8.466h7.561z"/>
        </svg>
      );
    case 'azure':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.379 23.343a1.62 1.62 0 01-1.168-.478l-8.399-7.636 6.669-7.636a1.62 1.62 0 012.387-.182l.182.182 3.131 3.636a1.62 1.62 0 010 2.121l-2.802 9.515a1.62 1.62 0 01-1 .478zM1.62 23.343A1.62 1.62 0 010 21.723V2.277A2.277 2.277 0 012.277 0h7.778a2.277 2.277 0 012.277 2.277v6.364l-5.556 6.364L.478 22.865a1.62 1.62 0 01-1.026.478h2.168z"/>
        </svg>
      );
    default:
      return <GitBranch className="w-4 h-4" />;
  }
}

function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f7df1e',
    Python: '#3776ab',
    Go: '#00add8',
    Rust: '#dea584',
    Java: '#b07219',
    Ruby: '#701516',
    PHP: '#777bb4',
    C: '#555555',
    'C++': '#f34b7d',
    'C#': '#239120',
    Swift: '#ffac45',
    Kotlin: '#a97bff',
  };
  return colors[language] || '#6e7681';
}

// =============================================================================
// Skeleton Component
// =============================================================================

export function RepoInfoCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn(
      'bg-muted/30 border border-border rounded-lg animate-pulse',
      compact ? 'p-3' : 'p-4'
    )}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-muted rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
      {!compact && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="h-3 bg-muted rounded" />
          <div className="h-3 bg-muted rounded" />
          <div className="h-3 bg-muted rounded" />
          <div className="h-3 bg-muted rounded" />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function RepoInfoCard({ info, className, compact = false }: RepoInfoCardProps) {
  return (
    <div
      className={cn(
        'bg-muted/30 border border-border rounded-lg transition-all hover:border-primary/30',
        compact ? 'p-3' : 'p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Provider Icon */}
        <div className={cn(
          'p-2 rounded-lg shrink-0',
          info.isPrivate ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'
        )}>
          {getProviderIcon(info.provider)}
        </div>

        {/* Name & Description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-foreground truncate">
              {info.fullName}
            </h4>
            {info.isPrivate ? (
              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            )}
          </div>
          {info.description && !compact && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {info.description}
            </p>
          )}
        </div>

        {/* Stars */}
        {info.stars !== undefined && info.stars > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Star className="w-3.5 h-3.5" />
            <span>{formatNumber(info.stars)}</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      {!compact && (
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
          {/* Commits/month */}
          <div className="flex items-center gap-2 text-sm">
            <GitBranch className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">{info.commitsPerMonth}</span> commits/month
            </span>
          </div>

          {/* Files */}
          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">{formatNumber(info.fileCount)}</span> files
            </span>
          </div>

          {/* LOC */}
          <div className="flex items-center gap-2 text-sm">
            <Code className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">{formatNumber(info.locEstimate)}</span> LOC
            </span>
          </div>

          {/* Language */}
          <div className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: getLanguageColor(info.primaryLanguage) }}
            />
            <span className="text-foreground">{info.primaryLanguage}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={cn(
        'flex items-center gap-2 text-xs text-muted-foreground',
        compact ? 'mt-2' : 'mt-3 pt-3 border-t border-border'
      )}>
        <Clock className="w-3.5 h-3.5" />
        <span>Last updated: {formatDate(info.lastUpdated)}</span>
        <span className="mx-1">•</span>
        <span>Branch: {info.defaultBranch}</span>
      </div>
    </div>
  );
}
