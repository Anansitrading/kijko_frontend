// HyperVisa Tab - Session management dashboard for HyperVisa engine
// Manages persistent video-mediated Gemini sessions with adaptive swarm support

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Eye, Video, Upload, Youtube, Trash2, Search,
  MessageSquare, Cpu, HardDrive, RefreshCw, Send, X, ChevronDown,
  Zap, Globe, FolderOpen, Clock, GitBranch,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const API_BASE = '/api/hypervisa';

interface Segment {
  id: number;
  name: string;
  description: string;
  token_count: number;
  youtube_url?: string;
  video_path?: string;
}

interface Session {
  id: string;
  name: string;
  source_type: string;
  source_path?: string;
  mode: string;
  model: string;
  total_tokens: number;
  status: string;
  created_at: string;
  segments: Segment[];
}

interface QueryResult {
  session_id: string;
  prompt: string;
  response: string;
}

type ViewState = 'list' | 'query' | 'create';

export function HyperVisaTab() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>('list');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [queryInput, setQueryInput] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [querying, setQuerying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [createMode, setCreateMode] = useState<'github' | 'dir' | 'youtube'>('github');
  const [createName, setCreateName] = useState('');
  const [createDir, setCreateDir] = useState('');
  const [createUrls, setCreateUrls] = useState('');
  const [createRepoUrl, setCreateRepoUrl] = useState('');
  const [createBranch, setCreateBranch] = useState('');
  const [creating, setCreating] = useState(false);

  const queryInputRef = useRef<HTMLTextAreaElement>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error('Failed to fetch sessions:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const handleDelete = async (session: Session) => {
    if (!confirm(`Delete session "${session.name}"?`)) return;
    try {
      await fetch(`${API_BASE}/sessions/${session.id}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s.id !== session.id));
      if (selectedSession?.id === session.id) {
        setSelectedSession(null);
        setView('list');
      }
    } catch (e) {
      setError(`Delete failed: ${e}`);
    }
  };

  const handleQuery = async () => {
    if (!selectedSession || !queryInput.trim()) return;
    setQuerying(true);
    setQueryResult(null);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/sessions/${selectedSession.id}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: queryInput.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Query failed');
      }
      const data = await res.json();
      setQueryResult(data);
    } catch (e: any) {
      setError(e.message || 'Query failed');
    } finally {
      setQuerying(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);

    try {
      let res: Response;
      if (createMode === 'youtube') {
        const urls = createUrls.split('\n').map(u => u.trim()).filter(Boolean);
        if (urls.length === 0) throw new Error('Enter at least one YouTube URL');
        res = await fetch(`${API_BASE}/sessions/watch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls, name: createName || undefined }),
        });
      } else if (createMode === 'github') {
        if (!createRepoUrl.trim()) throw new Error('GitHub repository URL required');
        res = await fetch(`${API_BASE}/sessions/ingest-repo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repo_url: createRepoUrl.trim(),
            name: createName || undefined,
            branch: createBranch.trim() || undefined,
          }),
        });
      } else {
        if (!createDir.trim()) throw new Error('Directory path required');
        res = await fetch(`${API_BASE}/sessions/ingest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ directory: createDir.trim(), name: createName || undefined }),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Creation failed');
      }

      setCreateName('');
      setCreateDir('');
      setCreateUrls('');
      setCreateRepoUrl('');
      setCreateBranch('');
      setView('list');
      fetchSessions();
    } catch (e: any) {
      setError(e.message || 'Creation failed');
    } finally {
      setCreating(false);
    }
  };

  const selectAndQuery = (session: Session) => {
    setSelectedSession(session);
    setView('query');
    setQueryResult(null);
    setQueryInput('');
    setTimeout(() => queryInputRef.current?.focus(), 100);
  };

  // --- Render ---

  const statusColor = (s: string) =>
    s === 'active' ? 'text-emerald-400' : s === 'expired' ? 'text-amber-400' : 'text-red-400';
  const modeIcon = (m: string) =>
    m === 'swarm' ? <Cpu size={14} className="text-violet-400" /> : <Eye size={14} className="text-cyan-400" />;

  return (
    <div className="flex flex-col h-full p-6 gap-4 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center border border-violet-500/30">
            <Eye size={20} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">HyperVisa</h1>
            <p className="text-xs text-muted-foreground">Adaptive video-mediated context engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setView('list'); fetchSessions(); }}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-colors",
              view === 'list' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sessions
          </button>
          <button
            onClick={() => setView('create')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5",
              view === 'create'
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Zap size={14} />
            New Session
          </button>
          <button
            onClick={fetchSessions}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {/* Content */}
      {view === 'list' && (
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
              <Eye size={48} className="opacity-30" />
              <p className="text-lg">No sessions yet</p>
              <p className="text-sm">Upload files in the <span className="text-violet-400">#HyperVisa</span> Zulip channel or create one here.</p>
              <button
                onClick={() => setView('create')}
                className="px-4 py-2 bg-violet-500/20 text-violet-300 rounded-lg border border-violet-500/30 hover:bg-violet-500/30 transition-colors"
              >
                Create Session
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className="group flex items-center gap-4 p-4 bg-card/50 border border-border rounded-xl hover:border-violet-500/30 hover:bg-card/80 transition-all cursor-pointer"
                  onClick={() => selectAndQuery(session)}
                >
                  {/* Icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    session.source_type === 'youtube'
                      ? "bg-red-500/10 border border-red-500/20"
                      : session.source_type === 'repo'
                        ? "bg-purple-500/10 border border-purple-500/20"
                        : "bg-cyan-500/10 border border-cyan-500/20"
                  )}>
                    {session.source_type === 'youtube'
                      ? <Youtube size={18} className="text-red-400" />
                      : session.source_type === 'repo'
                        ? <GitBranch size={18} className="text-purple-400" />
                        : <FolderOpen size={18} className="text-cyan-400" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">{session.name}</span>
                      {modeIcon(session.mode)}
                      <span className={cn("text-xs", statusColor(session.status))}>{session.status}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <HardDrive size={10} />
                        {session.total_tokens.toLocaleString()} tokens
                      </span>
                      <span className="flex items-center gap-1">
                        <Cpu size={10} />
                        {session.segments.length} segment{session.segments.length !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); selectAndQuery(session); }}
                      className="p-2 text-muted-foreground hover:text-violet-400 rounded-lg hover:bg-violet-500/10 transition-colors"
                      title="Query"
                    >
                      <MessageSquare size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(session); }}
                      className="p-2 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'query' && selectedSession && (
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Session header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-card/50 border border-border rounded-xl">
            <button onClick={() => setView('list')} className="text-muted-foreground hover:text-foreground">
              <ChevronDown size={16} className="rotate-90" />
            </button>
            {selectedSession.source_type === 'youtube'
              ? <Youtube size={16} className="text-red-400" />
              : <FolderOpen size={16} className="text-cyan-400" />
            }
            <span className="font-medium text-foreground">{selectedSession.name}</span>
            {modeIcon(selectedSession.mode)}
            <span className="text-xs text-muted-foreground ml-auto">
              {selectedSession.total_tokens.toLocaleString()} tokens
              {' / '}
              {selectedSession.segments.length} segment{selectedSession.segments.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Query result */}
          {queryResult && (
            <div className="flex-1 min-h-0 overflow-auto px-4 py-3 bg-card/30 border border-border rounded-xl">
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                <MessageSquare size={12} />
                {queryResult.prompt}
              </div>
              <div className="prose prose-invert prose-sm max-w-none text-foreground whitespace-pre-wrap">
                {queryResult.response}
              </div>
            </div>
          )}

          {querying && (
            <div className="flex items-center gap-2 px-4 py-6 text-muted-foreground">
              <RefreshCw size={14} className="animate-spin" />
              Querying Gemini...
            </div>
          )}

          {/* Query input */}
          <div className="flex items-end gap-2">
            <textarea
              ref={queryInputRef}
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleQuery();
                }
              }}
              placeholder="Ask about this session... (Cmd+Enter to send)"
              className="flex-1 min-h-[60px] max-h-[120px] px-4 py-3 bg-card/50 border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:border-violet-500/50"
              rows={2}
            />
            <button
              onClick={handleQuery}
              disabled={querying || !queryInput.trim()}
              className={cn(
                "p-3 rounded-xl transition-colors",
                queryInput.trim() && !querying
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30"
                  : "bg-muted/30 text-muted-foreground border border-border cursor-not-allowed"
              )}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {view === 'create' && (
        <div className="max-w-lg mx-auto w-full flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">New Session</h2>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setCreateMode('github')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors text-sm",
                createMode === 'github'
                  ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                  : "bg-card/30 border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <GitBranch size={16} />
              GitHub
            </button>
            <button
              onClick={() => setCreateMode('youtube')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors text-sm",
                createMode === 'youtube'
                  ? "bg-red-500/10 border-red-500/30 text-red-300"
                  : "bg-card/30 border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <Youtube size={16} />
              YouTube
            </button>
            <button
              onClick={() => setCreateMode('dir')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors text-sm",
                createMode === 'dir'
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                  : "bg-card/30 border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <FolderOpen size={16} />
              Directory
            </button>
          </div>

          {/* Name */}
          <input
            type="text"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="Session name (optional)"
            className="px-4 py-2.5 bg-card/50 border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-violet-500/50"
          />

          {/* Mode-specific input */}
          {createMode === 'github' ? (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={createRepoUrl}
                onChange={(e) => setCreateRepoUrl(e.target.value)}
                placeholder="https://github.com/user/repo"
                className="px-4 py-2.5 bg-card/50 border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-purple-500/50"
              />
              <input
                type="text"
                value={createBranch}
                onChange={(e) => setCreateBranch(e.target.value)}
                placeholder="Branch (optional, defaults to main)"
                className="px-4 py-2.5 bg-card/50 border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-purple-500/50"
              />
            </div>
          ) : createMode === 'youtube' ? (
            <textarea
              value={createUrls}
              onChange={(e) => setCreateUrls(e.target.value)}
              placeholder="Paste YouTube URL(s), one per line..."
              className="min-h-[100px] px-4 py-3 bg-card/50 border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:border-violet-500/50"
              rows={4}
            />
          ) : (
            <input
              type="text"
              value={createDir}
              onChange={(e) => setCreateDir(e.target.value)}
              placeholder="/path/to/directory"
              className="px-4 py-2.5 bg-card/50 border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-violet-500/50"
            />
          )}

          {/* Submit */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setView('list')}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-6 py-2 text-sm bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-lg hover:bg-violet-500/30 transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
