/**
 * Step 2B: Batch Repository Import
 *
 * Bulk import repositories from code platforms or CSV.
 * Used for Maya/Enterprise personas.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  GitBranch,
  Upload,
  FileSpreadsheet,
  Filter,
  Check,
  X,
  Loader2,
  AlertCircle,
  ChevronDown,
  Search,
  Archive,
  Clock,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { OAuthButtons } from './OAuthButtons';
import { getBatchRepositories } from '../../../services/projectApi';
import type {
  GitProvider,
  OAuthConnection,
  RepositoryInput,
  BatchImportSource,
  BatchImportFilters,
} from '../../../types/project';

// =============================================================================
// Types
// =============================================================================

interface Step2BProps {
  repositories: RepositoryInput[];
  onAddRepositories: (repos: RepositoryInput[]) => void;
  onRemoveRepository: (index: number) => void;
  oauthConnections: OAuthConnection[];
  onOAuthConnectionChange: (connections: OAuthConnection[]) => void;
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const PLATFORM_OPTIONS: {
  id: GitProvider;
  label: string;
  description: string;
}[] = [
  { id: 'github', label: 'GitHub Enterprise', description: 'GitHub.com or Enterprise Server' },
  { id: 'gitlab', label: 'GitLab', description: 'Self-hosted or Cloud' },
  { id: 'bitbucket', label: 'Bitbucket', description: 'Bitbucket Cloud or Server' },
  { id: 'azure', label: 'Azure DevOps', description: 'Azure Repos' },
];

const DEFAULT_FILTERS: BatchImportFilters = {
  showAll: true,
  updatedInLast30Days: false,
  team: undefined,
  includeArchived: false,
};

// =============================================================================
// Sub-Components
// =============================================================================

interface PlatformSelectorProps {
  selectedPlatform: GitProvider | null;
  onSelect: (platform: GitProvider) => void;
  connections: OAuthConnection[];
}

function PlatformSelector({ selectedPlatform, onSelect, connections }: PlatformSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">
        Connect your code platform <span className="text-destructive">*</span>
      </label>
      <div className="space-y-2">
        {PLATFORM_OPTIONS.map((platform) => {
          const connection = connections.find(c => c.provider === platform.id);
          const isConnected = connection?.connected;

          return (
            <label
              key={platform.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                selectedPlatform === platform.id
                  ? 'bg-primary/5 border-primary ring-1 ring-primary/20'
                  : 'bg-muted/30 border-border hover:bg-muted/50 hover:border-muted-foreground/30'
              )}
            >
              <input
                type="radio"
                name="platform"
                value={platform.id}
                checked={selectedPlatform === platform.id}
                onChange={() => onSelect(platform.id)}
                className="sr-only"
              />

              {/* Custom Radio */}
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                  selectedPlatform === platform.id
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/40'
                )}
              >
                {selectedPlatform === platform.id && (
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </div>

              {/* Label */}
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">{platform.label}</p>
                <p className="text-xs text-muted-foreground">{platform.description}</p>
              </div>

              {/* Connection Status */}
              {isConnected && (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  <Check className="w-3 h-3" />
                  Connected
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

interface CsvDropZoneProps {
  onCsvParsed: (repos: BatchImportSource[]) => void;
}

function CsvDropZone({ onCsvParsed }: CsvDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      parseCsvFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseCsvFile(file);
    }
  }, []);

  const parseCsvFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setError(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').filter(line => line.trim());

        // Skip header row
        const dataLines = lines.slice(1);

        const repos: BatchImportSource[] = dataLines.map((line, index) => {
          const [repo_url, team, priority] = line.split(',').map(s => s.trim());
          return {
            id: `csv-${index}`,
            provider: detectProvider(repo_url) || 'github',
            repoUrl: repo_url,
            repoName: extractRepoName(repo_url),
            team: team || undefined,
            priority: (priority as 'high' | 'medium' | 'low') || undefined,
            selected: true,
          };
        }).filter(r => r.repoUrl);

        if (repos.length === 0) {
          setError('No valid repositories found in CSV');
          return;
        }

        onCsvParsed(repos);
      } catch (err) {
        setError('Failed to parse CSV file');
      }
    };

    reader.onerror = () => {
      setError('Failed to read CSV file');
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 my-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <p className="text-sm font-medium text-foreground">Bulk import via CSV</p>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30'
        )}
      >
        <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm text-foreground">
            Drop CSV file here or <span className="text-primary">browse</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Format: repo_url, team, priority
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}

interface RepoListProps {
  repos: BatchImportSource[];
  filters: BatchImportFilters;
  onFiltersChange: (filters: BatchImportFilters) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

function RepoList({
  repos,
  filters,
  onFiltersChange,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
}: RepoListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Apply filters
  const filteredRepos = repos.filter((repo) => {
    if (searchQuery && !repo.repoName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filters.updatedInLast30Days && repo.lastUpdated) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (new Date(repo.lastUpdated) < thirtyDaysAgo) {
        return false;
      }
    }
    if (filters.team && repo.team !== filters.team) {
      return false;
    }
    if (!filters.includeArchived && repo.isArchived) {
      return false;
    }
    return true;
  });

  const selectedCount = filteredRepos.filter(r => r.selected).length;
  const teams = [...new Set(repos.map(r => r.team).filter(Boolean))];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          {repos.length} repositories found
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {selectedCount} selected
          </span>
          <button
            type="button"
            onClick={selectedCount === filteredRepos.length ? onDeselectAll : onSelectAll}
            className="text-xs text-primary hover:text-primary/80"
          >
            {selectedCount === filteredRepos.length ? 'Deselect all' : 'Select all'}
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search repositories..."
            className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors',
            showFilters
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border hover:bg-muted/50'
          )}
        >
          <Filter className="w-4 h-4" />
          Filters
          <ChevronDown className={cn('w-4 h-4 transition-transform', showFilters && 'rotate-180')} />
        </button>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.updatedInLast30Days}
              onChange={(e) => onFiltersChange({ ...filters, updatedInLast30Days: e.target.checked })}
              className="rounded border-border"
            />
            Updated in last 30 days
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.includeArchived}
              onChange={(e) => onFiltersChange({ ...filters, includeArchived: e.target.checked })}
              className="rounded border-border"
            />
            Include archived
          </label>
          {teams.length > 0 && (
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Team</label>
              <select
                value={filters.team || ''}
                onChange={(e) => onFiltersChange({ ...filters, team: e.target.value || undefined })}
                className="w-full px-2 py-1.5 bg-muted/50 border border-border rounded text-sm"
              >
                <option value="">All teams</option>
                {teams.map((team) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Repo List */}
      <div className="max-h-64 overflow-y-auto space-y-1.5 border border-border rounded-lg p-2">
        {filteredRepos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No repositories match your filters
          </p>
        ) : (
          filteredRepos.map((repo) => (
            <label
              key={repo.id}
              className={cn(
                'flex items-center gap-3 p-2 rounded cursor-pointer transition-colors',
                repo.selected ? 'bg-primary/5' : 'hover:bg-muted/50'
              )}
            >
              <input
                type="checkbox"
                checked={repo.selected}
                onChange={() => onToggleSelect(repo.id)}
                className="rounded border-border"
              />
              <GitBranch className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {repo.repoName}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {repo.team && <span>{repo.team}</span>}
                  {repo.isArchived && (
                    <span className="flex items-center gap-1">
                      <Archive className="w-3 h-3" />
                      Archived
                    </span>
                  )}
                  {repo.lastUpdated && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(repo.lastUpdated)}
                    </span>
                  )}
                </div>
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function detectProvider(url: string): GitProvider | null {
  if (url.includes('github.com')) return 'github';
  if (url.includes('gitlab.com')) return 'gitlab';
  if (url.includes('bitbucket.org')) return 'bitbucket';
  if (url.includes('dev.azure.com') || url.includes('visualstudio.com')) return 'azure';
  return null;
}

function extractRepoName(url: string): string {
  const match = url.match(/[/:]([^/]+\/[^/.]+)(?:\.git)?$/);
  return match ? match[1] : url;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// =============================================================================
// Main Component
// =============================================================================

export function Step2B({
  repositories,
  onAddRepositories,
  onRemoveRepository,
  oauthConnections,
  onOAuthConnectionChange,
  className,
}: Step2BProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<GitProvider | null>(null);
  const [importedRepos, setImportedRepos] = useState<BatchImportSource[]>([]);
  const [filters, setFilters] = useState<BatchImportFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if platform is authenticated
  const isPlatformConnected = selectedPlatform
    ? oauthConnections.some(c => c.provider === selectedPlatform && c.connected)
    : false;

  // Fetch repos from platform
  const handleFetchRepos = useCallback(async () => {
    if (!selectedPlatform || !isPlatformConnected) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getBatchRepositories(selectedPlatform);
      const repos: BatchImportSource[] = result.repositories.map((r) => ({
        id: r.id,
        provider: selectedPlatform,
        repoUrl: r.url,
        repoName: r.fullName,
        selected: true,
        lastUpdated: r.lastUpdated,
        isArchived: r.isArchived,
      }));
      setImportedRepos(repos);
    } catch (err) {
      setError('Failed to fetch repositories');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPlatform, isPlatformConnected]);

  // Handle CSV import
  const handleCsvParsed = useCallback((repos: BatchImportSource[]) => {
    setImportedRepos(repos);
  }, []);

  // Toggle repo selection
  const handleToggleSelect = useCallback((id: string) => {
    setImportedRepos((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setImportedRepos((prev) => prev.map((r) => ({ ...r, selected: true })));
  }, []);

  const handleDeselectAll = useCallback(() => {
    setImportedRepos((prev) => prev.map((r) => ({ ...r, selected: false })));
  }, []);

  // Import selected repos
  const handleImportSelected = useCallback(() => {
    const selected = importedRepos.filter((r) => r.selected);
    const newRepos: RepositoryInput[] = selected.map((r) => ({
      provider: r.provider,
      url: r.repoUrl,
      branch: 'main',
    }));
    onAddRepositories(newRepos);
    setImportedRepos([]);
  }, [importedRepos, onAddRepositories]);

  const selectedCount = importedRepos.filter((r) => r.selected).length;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Already added repos */}
      {repositories.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Added repositories ({repositories.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {repositories.map((repo, index) => (
              <span
                key={`${repo.url}-${index}`}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-full text-sm"
              >
                <GitBranch className="w-3.5 h-3.5 text-primary" />
                {extractRepoName(repo.url)}
                <button
                  type="button"
                  onClick={() => onRemoveRepository(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {importedRepos.length === 0 ? (
        <>
          {/* Platform Selector */}
          <PlatformSelector
            selectedPlatform={selectedPlatform}
            onSelect={setSelectedPlatform}
            connections={oauthConnections}
          />

          {/* OAuth / Authenticate Button */}
          {selectedPlatform && (
            <div className="space-y-3">
              {!isPlatformConnected ? (
                <OAuthButtons
                  connections={oauthConnections}
                  onConnectionChange={onOAuthConnectionChange}
                  providers={[selectedPlatform]}
                />
              ) : (
                <button
                  type="button"
                  onClick={handleFetchRepos}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Fetching repositories...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Fetch Repositories
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* CSV Upload */}
          <CsvDropZone onCsvParsed={handleCsvParsed} />

          {error && (
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}
        </>
      ) : (
        <>
          {/* Repo Selection List */}
          <RepoList
            repos={importedRepos}
            filters={filters}
            onFiltersChange={setFilters}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
          />

          {/* Import Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setImportedRepos([])}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImportSelected}
              disabled={selectedCount === 0}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                selectedCount > 0
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              <Check className="w-4 h-4" />
              Import {selectedCount} {selectedCount === 1 ? 'repository' : 'repositories'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
