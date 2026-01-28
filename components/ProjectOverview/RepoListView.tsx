import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Copy,
  Pencil,
  ExternalLink,
  FileUp,
  GitBranchPlus,
  GitBranch,
  FolderOpen,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import type { Project, WorktreeWithBranches } from '../../types';
import { cn } from '../../utils/cn';

const COLORS = [
  { accent: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)' },
  { accent: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.25)' },
  { accent: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  { accent: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.25)' },
  { accent: '#f43f5e', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.25)' },
];

type ContextMenu =
  | { type: 'worktree'; worktreeId: string; x: number; y: number }
  | { type: 'branch'; worktreeId: string; branchName: string; x: number; y: number };

interface RepoListViewProps {
  project: Project;
  worktrees: WorktreeWithBranches[];
  onBranchClick: (projectId: string, worktreeId: string, branchName: string) => void;
  onDuplicateWorktree?: (worktreeId: string) => void;
  onRenameWorktree?: (worktreeId: string, newName: string) => void;
  onWorktreeNewIngestion?: (worktreeId: string) => void;
  onBranchOpen?: (worktreeId: string, branchName: string) => void;
  onBranchNewIngestion?: (worktreeId: string, branchName: string) => void;
  onRenameBranch?: (worktreeId: string, oldName: string, newName: string) => void;
  onAddBranch?: (worktreeId: string) => void;
  onBranchHover?: (worktreeId: string, branchName: string) => void;
}

export function RepoListView({
  project,
  worktrees,
  onBranchClick,
  onDuplicateWorktree,
  onRenameWorktree,
  onWorktreeNewIngestion,
  onBranchOpen,
  onBranchNewIngestion,
  onRenameBranch,
  onAddBranch,
  onBranchHover,
}: RepoListViewProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(worktrees.map((wt) => [wt.id, true])),
  );
  const [ctxMenu, setCtxMenu] = useState<ContextMenu | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingBranch, setRenamingBranch] = useState<{ worktreeId: string; branchName: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const branchRenameInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Expand new worktrees automatically
  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      for (const wt of worktrees) {
        if (!(wt.id in next)) next[wt.id] = true;
      }
      return next;
    });
  }, [worktrees]);

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

  useEffect(() => {
    if (renamingBranch) branchRenameInputRef.current?.focus();
  }, [renamingBranch]);

  const commitRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      const current = worktrees.find((w) => w.id === renamingId);
      if (current && renameValue.trim() !== current.name) {
        onRenameWorktree?.(renamingId, renameValue.trim());
      }
    }
    setRenamingId(null);
  }, [renamingId, renameValue, worktrees, onRenameWorktree]);

  const commitBranchRename = useCallback(() => {
    if (renamingBranch && renameValue.trim() && renameValue.trim() !== renamingBranch.branchName) {
      onRenameBranch?.(renamingBranch.worktreeId, renamingBranch.branchName, renameValue.trim());
    }
    setRenamingBranch(null);
  }, [renamingBranch, renameValue, onRenameBranch]);

  const closeMenu = useCallback(() => setCtxMenu(null), []);

  useEffect(() => {
    if (!ctxMenu) return;
    const handleClose = () => closeMenu();
    window.addEventListener('click', handleClose);
    window.addEventListener('contextmenu', handleClose);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('contextmenu', handleClose);
    };
  }, [ctxMenu, closeMenu]);

  const toggleExpanded = (wtId: string) => {
    setExpanded((prev) => ({ ...prev, [wtId]: !prev[wtId] }));
  };

  const iconBg = project.icon.backgroundColor || '#3b82f6';
  const iconContent =
    project.icon.type === 'emoji'
      ? project.icon.value
      : project.icon.value.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className="w-6 h-6 rounded flex items-center justify-center text-xs font-medium shrink-0"
          style={{ backgroundColor: iconBg, color: '#fff' }}
        >
          {iconContent}
        </span>
        <h2 className="text-lg font-semibold text-foreground">{project.name}</h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-[#0a0e1a]/60 relative">
        <div className="p-4 space-y-3">
          {worktrees.map((wt, wtIdx) => {
            const color = COLORS[wtIdx % COLORS.length];
            const isExpanded = expanded[wt.id] !== false;

            return (
              <div
                key={wt.id}
                className="rounded-lg border overflow-hidden"
                style={{ borderColor: color.border }}
              >
                {/* Worktree header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 select-none"
                  style={{ backgroundColor: color.bg }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setCtxMenu({ type: 'worktree', worktreeId: wt.id, x: e.clientX, y: e.clientY });
                  }}
                >
                  <button
                    onClick={() => toggleExpanded(wt.id)}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <FolderOpen size={16} style={{ color: color.accent }} className="shrink-0" />
                  {renamingId === wt.id ? (
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      onBlur={commitRename}
                      className="bg-[#0f1420] border border-blue-500/60 rounded px-2 py-0.5 text-sm text-slate-100 font-semibold outline-none w-40"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-slate-100">/{wt.name}</span>
                  )}
                  <span className="text-xs text-slate-500 ml-1">{wt.path}</span>
                  {wt.isActive && (
                    <span className="ml-auto text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: color.accent + '20', color: color.accent }}>
                      Active
                    </span>
                  )}
                  <span className="text-xs text-slate-500 ml-auto tabular-nums">
                    {wt.branches.length} {wt.branches.length === 1 ? 'branch' : 'branches'}
                  </span>
                </div>

                {/* Branches */}
                {isExpanded && (
                  <div className="bg-[#0d1117]/60">
                    {wt.branches.map((br) => (
                      <div
                        key={br.name}
                        className="flex items-center gap-3 px-4 py-2.5 border-t border-border/40 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                        onClick={() => onBranchClick(project.id, wt.id, br.name)}
                        onMouseEnter={() => onBranchHover?.(wt.id, br.name)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setCtxMenu({
                            type: 'branch',
                            worktreeId: wt.id,
                            branchName: br.name,
                            x: e.clientX,
                            y: e.clientY,
                          });
                        }}
                      >
                        <div className="w-5 flex justify-center">
                          <GitBranch size={14} className="text-slate-500" />
                        </div>
                        {br.isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
                        {renamingBranch?.worktreeId === wt.id && renamingBranch?.branchName === br.name ? (
                          <input
                            ref={branchRenameInputRef}
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitBranchRename();
                              if (e.key === 'Escape') setRenamingBranch(null);
                            }}
                            onBlur={commitBranchRename}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0f1420] border border-blue-500/60 rounded px-2 py-0.5 text-xs text-slate-100 outline-none w-44"
                          />
                        ) : (
                          <span className={cn('text-sm', br.isCurrent ? 'text-slate-100 font-medium' : 'text-slate-300')}>
                            {br.name}
                          </span>
                        )}
                        {br.isDefault && (
                          <span className="text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">
                            default
                          </span>
                        )}
                        {br.lastCommit && (
                          <span className="ml-auto text-xs text-slate-500 tabular-nums">
                            {br.lastCommit}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Context menu */}
        {ctxMenu && (
          <div
            ref={menuRef}
            className="fixed z-50 min-w-[160px] rounded-lg border border-border bg-[#1a1f2e] py-1 shadow-xl"
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {ctxMenu.type === 'worktree' ? (
              <>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-slate-100 transition-colors"
                  onClick={() => {
                    onWorktreeNewIngestion?.(ctxMenu.worktreeId);
                    setCtxMenu(null);
                  }}
                >
                  <FileUp size={14} className="shrink-0 opacity-60" />
                  New Ingestion
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-slate-100 transition-colors"
                  onClick={() => {
                    const wt = worktrees.find((w) => w.id === ctxMenu.worktreeId);
                    setRenameValue(wt?.name ?? '');
                    setRenamingId(ctxMenu.worktreeId);
                    setCtxMenu(null);
                  }}
                >
                  <Pencil size={14} className="shrink-0 opacity-60" />
                  Rename
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-slate-100 transition-colors"
                  onClick={() => {
                    onDuplicateWorktree?.(ctxMenu.worktreeId);
                    setCtxMenu(null);
                  }}
                >
                  <Copy size={14} className="shrink-0 opacity-60" />
                  Duplicate
                </button>
              </>
            ) : (
              <>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-slate-100 transition-colors"
                  onClick={() => {
                    onBranchOpen?.(ctxMenu.worktreeId, ctxMenu.branchName);
                    setCtxMenu(null);
                  }}
                >
                  <ExternalLink size={14} className="shrink-0 opacity-60" />
                  Open
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-slate-100 transition-colors"
                  onClick={() => {
                    onBranchNewIngestion?.(ctxMenu.worktreeId, ctxMenu.branchName);
                    setCtxMenu(null);
                  }}
                >
                  <FileUp size={14} className="shrink-0 opacity-60" />
                  New Ingestion
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-slate-100 transition-colors"
                  onClick={() => {
                    setRenameValue(ctxMenu.branchName);
                    setRenamingBranch({ worktreeId: ctxMenu.worktreeId, branchName: ctxMenu.branchName });
                    setCtxMenu(null);
                  }}
                >
                  <Pencil size={14} className="shrink-0 opacity-60" />
                  Rename
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-slate-100 transition-colors"
                  onClick={() => {
                    onAddBranch?.(ctxMenu.worktreeId);
                    setCtxMenu(null);
                  }}
                >
                  <GitBranchPlus size={14} className="shrink-0 opacity-60" />
                  + Branch
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RepoListView;
