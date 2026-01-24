/**
 * Step 2A: Single Repository Input
 *
 * Simple repository URL input with validation and suggestions.
 * Used for Alex and Sam personas.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  GitBranch,
  Plus,
  Loader2,
  AlertCircle,
  Check,
  X,
  History,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { RepoInfoCard, RepoInfoCardSkeleton } from './RepoInfoCard';
import { CompactOAuthButton } from './OAuthButtons';
import {
  validateRepositoryFull,
  getRecentRepos,
  completeOAuth,
} from '../../../services/projectApi';
import type {
  RepoInfo,
  RepoValidation,
  RecentRepo,
  OAuthConnection,
  GitProvider,
  RepositoryInput,
} from '../../../types/project';

// =============================================================================
// Types
// =============================================================================

interface Step2AProps {
  repositories: RepositoryInput[];
  onAddRepository: (repo: RepositoryInput) => void;
  onRemoveRepository: (index: number) => void;
  oauthConnections: OAuthConnection[];
  onOAuthConnectionChange: (connections: OAuthConnection[]) => void;
  className?: string;
}

type ValidationState = 'idle' | 'validating' | 'valid' | 'error' | 'auth_required';

// =============================================================================
// Constants
// =============================================================================

const DEBOUNCE_DELAY = 500;

// =============================================================================
// Custom Hook: Debounce
// =============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// =============================================================================
// Sub-Components
// =============================================================================

interface RepoInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  validationState: ValidationState;
  error?: string;
  repoInfo?: RepoInfo;
  onAdd: () => void;
  canAdd: boolean;
  requiredProvider?: GitProvider;
  oauthConnections: OAuthConnection[];
  onOAuthConnect: (provider: GitProvider) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function RepoInputField({
  value,
  onChange,
  validationState,
  error,
  repoInfo,
  onAdd,
  canAdd,
  requiredProvider,
  oauthConnections,
  onOAuthConnect,
  inputRef,
}: RepoInputFieldProps) {
  return (
    <div className="space-y-3">
      <label
        htmlFor="repo-url"
        className="block text-sm font-medium text-foreground"
      >
        Repository URL <span className="text-destructive">*</span>
      </label>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <GitBranch size={18} />
        </div>

        <input
          ref={inputRef}
          id="repo-url"
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className={cn(
            'w-full pl-10 pr-12 py-3 bg-muted/50 border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none transition-all',
            validationState === 'error' || validationState === 'auth_required'
              ? 'border-destructive focus:border-destructive focus:ring-1 focus:ring-destructive/20'
              : validationState === 'valid'
                ? 'border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500/20'
                : 'border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20'
          )}
          aria-describedby="repo-helper repo-error"
          aria-invalid={validationState === 'error'}
        />

        {/* Status Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {validationState === 'validating' && (
            <Loader2 size={18} className="text-muted-foreground animate-spin" />
          )}
          {validationState === 'valid' && (
            <Check size={18} className="text-green-500" />
          )}
          {(validationState === 'error' || validationState === 'auth_required') && (
            <AlertCircle size={18} className="text-destructive" />
          )}
        </div>
      </div>

      {/* Error Message */}
      {(validationState === 'error' || validationState === 'auth_required') && error && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p>{error}</p>
            {validationState === 'auth_required' && requiredProvider && (
              <div className="mt-2">
                <CompactOAuthButton
                  provider={requiredProvider}
                  connection={oauthConnections.find(c => c.provider === requiredProvider)}
                  onConnect={() => onOAuthConnect(requiredProvider)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Helper Text */}
      {validationState === 'idle' && (
        <p id="repo-helper" className="text-xs text-muted-foreground">
          Accepts GitHub, GitLab, and Bitbucket URLs
        </p>
      )}

      {/* Repo Info Card */}
      {validationState === 'validating' && value && (
        <RepoInfoCardSkeleton />
      )}

      {validationState === 'valid' && repoInfo && (
        <div className="space-y-3">
          <RepoInfoCard info={repoInfo} />
          <button
            type="button"
            onClick={onAdd}
            disabled={!canAdd}
            className={cn(
              'flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-medium transition-all',
              canAdd
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            <Plus size={18} />
            Add Repository
          </button>
        </div>
      )}
    </div>
  );
}

interface RecentRepoSuggestionsProps {
  suggestions: RecentRepo[];
  onSelect: (url: string) => void;
  isLoading: boolean;
}

function RecentRepoSuggestions({
  suggestions,
  onSelect,
  isLoading,
}: RecentRepoSuggestionsProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <History size={14} />
          Recently analyzed
        </p>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <History size={14} />
        Recently analyzed
      </p>
      <div className="space-y-1.5">
        {suggestions.map((repo) => (
          <button
            key={repo.repoUrl}
            type="button"
            onClick={() => onSelect(repo.repoUrl)}
            className="flex items-center gap-3 w-full p-2.5 bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border rounded-lg text-left transition-all group"
          >
            <GitBranch size={16} className="text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {repo.repoName}
              </p>
              <p className="text-xs text-muted-foreground">
                Last analyzed {formatRelativeDate(repo.lastAnalyzed)}
              </p>
            </div>
            <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Use
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface AddedRepositoriesListProps {
  repositories: RepositoryInput[];
  onRemove: (index: number) => void;
}

function AddedRepositoriesList({ repositories, onRemove }: AddedRepositoriesListProps) {
  if (repositories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">
        Added repositories ({repositories.length})
      </p>
      <div className="space-y-2">
        {repositories.map((repo, index) => (
          <div
            key={`${repo.url}-${index}`}
            className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg"
          >
            <div className="flex items-center gap-3 min-w-0">
              <GitBranch size={16} className="text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {extractRepoName(repo.url)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {repo.provider} • {repo.branch}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
              aria-label="Remove repository"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function extractRepoName(url: string): string {
  const match = url.match(/[/:]([^/]+\/[^/.]+)(?:\.git)?$/);
  return match ? match[1] : url;
}

function detectProvider(url: string): GitProvider | null {
  if (url.includes('github.com')) return 'github';
  if (url.includes('gitlab.com')) return 'gitlab';
  if (url.includes('bitbucket.org')) return 'bitbucket';
  if (url.includes('dev.azure.com') || url.includes('visualstudio.com')) return 'azure';
  return null;
}

// =============================================================================
// Main Component
// =============================================================================

export function Step2A({
  repositories,
  onAddRepository,
  onRemoveRepository,
  oauthConnections,
  onOAuthConnectionChange,
  className,
}: Step2AProps) {
  // State
  const [url, setUrl] = useState('');
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [validationError, setValidationError] = useState<string | undefined>();
  const [repoInfo, setRepoInfo] = useState<RepoInfo | undefined>();
  const [requiredProvider, setRequiredProvider] = useState<GitProvider | undefined>();
  const [recentRepos, setRecentRepos] = useState<RecentRepo[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced URL for validation
  const debouncedUrl = useDebounce(url, DEBOUNCE_DELAY);

  // Load recent repos on mount
  useEffect(() => {
    async function loadRecentRepos() {
      try {
        const repos = await getRecentRepos('current-user');
        setRecentRepos(repos);
      } catch (error) {
        console.error('Failed to load recent repos:', error);
      } finally {
        setIsLoadingRecent(false);
      }
    }
    loadRecentRepos();
  }, []);

  // Validate URL when debounced value changes
  useEffect(() => {
    async function validate() {
      if (!debouncedUrl.trim()) {
        setValidationState('idle');
        setValidationError(undefined);
        setRepoInfo(undefined);
        setRequiredProvider(undefined);
        return;
      }

      setValidationState('validating');
      setValidationError(undefined);
      setRepoInfo(undefined);
      setRequiredProvider(undefined);

      try {
        const result = await validateRepositoryFull(debouncedUrl);

        if (result.valid && result.info) {
          setValidationState('valid');
          setRepoInfo(result.info);
        } else if (result.error?.includes('private')) {
          setValidationState('auth_required');
          setValidationError(result.error);
          setRequiredProvider(detectProvider(debouncedUrl) || undefined);
        } else {
          setValidationState('error');
          setValidationError(result.error || 'Invalid repository URL');
        }
      } catch (error) {
        setValidationState('error');
        setValidationError('Failed to validate repository');
      }
    }

    validate();
  }, [debouncedUrl]);

  // Handlers
  const handleUrlChange = useCallback((value: string) => {
    setUrl(value);
  }, []);

  const handleSelectSuggestion = useCallback((repoUrl: string) => {
    setUrl(repoUrl);
    inputRef.current?.focus();
  }, []);

  const handleAddRepository = useCallback(() => {
    if (!repoInfo) return;

    const repo: RepositoryInput = {
      provider: repoInfo.provider,
      url: repoInfo.url,
      branch: repoInfo.defaultBranch,
    };

    onAddRepository(repo);
    setUrl('');
    setValidationState('idle');
    setRepoInfo(undefined);
  }, [repoInfo, onAddRepository]);

  const handleOAuthConnect = useCallback(async (provider: GitProvider) => {
    try {
      const connection = await completeOAuth(provider, 'mock-code');
      const newConnections = oauthConnections.filter(c => c.provider !== provider);
      newConnections.push(connection);
      onOAuthConnectionChange(newConnections);

      // Re-validate after connecting
      if (url) {
        setUrl(url + ' '); // Force re-validation
        setTimeout(() => setUrl(url), 10);
      }
    } catch (error) {
      console.error('OAuth connection failed:', error);
    }
  }, [url, oauthConnections, onOAuthConnectionChange]);

  // Check if URL is already added
  const isAlreadyAdded = repositories.some(
    (repo) => repo.url.toLowerCase() === url.toLowerCase()
  );

  const canAdd = validationState === 'valid' && repoInfo && !isAlreadyAdded;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Added Repositories */}
      <AddedRepositoriesList
        repositories={repositories}
        onRemove={onRemoveRepository}
      />

      {/* URL Input */}
      <RepoInputField
        value={url}
        onChange={handleUrlChange}
        validationState={isAlreadyAdded ? 'error' : validationState}
        error={isAlreadyAdded ? 'This repository is already added' : validationError}
        repoInfo={repoInfo}
        onAdd={handleAddRepository}
        canAdd={canAdd}
        requiredProvider={requiredProvider}
        oauthConnections={oauthConnections}
        onOAuthConnect={handleOAuthConnect}
        inputRef={inputRef}
      />

      {/* Recent Repos Suggestions */}
      {repositories.length === 0 && !url && (
        <RecentRepoSuggestions
          suggestions={recentRepos}
          onSelect={handleSelectSuggestion}
          isLoading={isLoadingRecent}
        />
      )}

      {/* Add Another Repo Link */}
      {repositories.length > 0 && !url && validationState === 'idle' && (
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <Plus size={16} />
          Add another repository
        </button>
      )}
    </div>
  );
}
