import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Copy, Pencil, ExternalLink, FileUp, Info, GitBranchPlus, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { Project, WorktreeWithBranches, Branch } from '../../types';

// Layout constants
const WT_W = 140;
const WT_H = 76;
const BR_W = 180;
const BR_H = 40;
const WT_GAP = 100;
const BR_GAP = 50;
const H_GAP = 120;
const L_MARGIN = 80;
const T_MARGIN = 52;

// Zoom constraints
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const ZOOM_SENSITIVITY = 0.001;

// Folder tab dimensions
const TAB_H = 14;
const TAB_W = 50;
const TAB_R = 6;
const BODY_R = 10;

/** SVG path for a folder shape: tab on top-left, rounded corners. */
function folderPath(x: number, y: number, w: number, h: number): string {
  return [
    // start left side, below bottom-left corner radius
    `M ${x},${y + BODY_R}`,
    // up left side to tab top-left corner
    `L ${x},${y - TAB_H + TAB_R}`,
    `Q ${x},${y - TAB_H} ${x + TAB_R},${y - TAB_H}`,
    // across tab top
    `L ${x + TAB_W - TAB_R},${y - TAB_H}`,
    `Q ${x + TAB_W},${y - TAB_H} ${x + TAB_W},${y - TAB_H + TAB_R}`,
    // down tab right side to main body top
    `L ${x + TAB_W},${y}`,
    // across main body top to top-right corner
    `L ${x + w - BODY_R},${y}`,
    `Q ${x + w},${y} ${x + w},${y + BODY_R}`,
    // down right side
    `L ${x + w},${y + h - BODY_R}`,
    `Q ${x + w},${y + h} ${x + w - BODY_R},${y + h}`,
    // across bottom
    `L ${x + BODY_R},${y + h}`,
    `Q ${x},${y + h} ${x},${y + h - BODY_R}`,
    'Z',
  ].join(' ');
}

// Color palette per worktree
const COLORS = [
  { accent: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.3)' },
  { accent: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.3)' },
  { accent: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)' },
  { accent: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.3)' },
  { accent: '#f43f5e', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.3)' },
];

interface LayoutBranch extends Branch {
  x: number;
  y: number;
  connectorPath: string;
}

interface LayoutWorktree {
  id: string;
  name: string;
  x: number;
  y: number;
  branches: LayoutBranch[];
}

interface LayoutResult {
  worktrees: LayoutWorktree[];
  connectors: { x: number; y1: number; y2: number }[];
  totalWidth: number;
  totalHeight: number;
}

function computeLayout(worktrees: WorktreeWithBranches[]): LayoutResult {
  const worktreeNodes: LayoutWorktree[] = [];
  const connectors: { x: number; y1: number; y2: number }[] = [];
  let maxRightX = 0;
  let maxBottomY = 0;

  for (let i = 0; i < worktrees.length; i++) {
    const wt = worktrees[i];
    const wtX = L_MARGIN;
    const wtY = T_MARGIN + i * (WT_H + WT_GAP);
    const wtCenterY = wtY + WT_H / 2;

    const branchCount = wt.branches.length;
    const totalBranchHeight = (branchCount - 1) * BR_GAP;
    const branchStartY = wtCenterY - totalBranchHeight / 2 - BR_H / 2;
    const branchX = wtX + WT_W + H_GAP;

    const branches: LayoutBranch[] = wt.branches.map((br, j) => {
      const brY = branchStartY + j * BR_GAP;
      const brCenterY = brY + BR_H / 2;

      const startX = wtX + WT_W;
      const startY = wtCenterY;
      const endX = branchX;
      const endY = brCenterY;
      const cpX = startX + (endX - startX) / 2;
      const connectorPath = `M${startX},${startY} C${cpX},${startY} ${cpX},${endY} ${endX},${endY}`;

      maxBottomY = Math.max(maxBottomY, brY + BR_H);

      return { ...br, x: branchX, y: brY, connectorPath };
    });

    maxRightX = Math.max(maxRightX, branchX + BR_W);
    maxBottomY = Math.max(maxBottomY, wtY + WT_H);

    worktreeNodes.push({ id: wt.id, name: wt.name, x: wtX, y: wtY, branches });

    if (i < worktrees.length - 1) {
      const nextWtY = T_MARGIN + (i + 1) * (WT_H + WT_GAP);
      connectors.push({
        x: wtX + WT_W / 2,
        y1: wtY + WT_H,
        y2: nextWtY,
      });
    }
  }

  return {
    worktrees: worktreeNodes,
    connectors,
    totalWidth: maxRightX + L_MARGIN,
    totalHeight: maxBottomY + T_MARGIN,
  };
}

type ContextMenu =
  | { type: 'worktree'; worktreeId: string; x: number; y: number }
  | { type: 'branch'; worktreeId: string; branchName: string; x: number; y: number };

interface RepoMindmapProps {
  project: Project;
  worktrees: WorktreeWithBranches[];
  onBranchClick: (projectId: string, worktreeId: string, branchName: string) => void;
  onDuplicateWorktree?: (worktreeId: string) => void;
  onRenameWorktree?: (worktreeId: string, newName: string) => void;
  onBranchOpen?: (worktreeId: string, branchName: string) => void;
  onBranchNewIngestion?: (worktreeId: string, branchName: string) => void;
  onBranchDetails?: (worktreeId: string, branchName: string) => void;
  onRenameBranch?: (worktreeId: string, oldName: string, newName: string) => void;
  onAddBranch?: (worktreeId: string) => void;
}

export function RepoMindmap({
  project, worktrees, onBranchClick,
  onDuplicateWorktree, onRenameWorktree,
  onBranchOpen, onBranchNewIngestion, onBranchDetails, onRenameBranch, onAddBranch,
}: RepoMindmapProps) {
  const layout = useMemo(() => computeLayout(worktrees), [worktrees]);
  const [hoveredBranch, setHoveredBranch] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<ContextMenu | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renamingBranch, setRenamingBranch] = useState<{ worktreeId: string; branchName: string } | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const branchRenameInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-focus rename input when it appears
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

  // Pan & zoom
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });

  const clampScale = (s: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, s));

  // Attach non-passive wheel listener for zoom (React onWheel is passive)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      setScale((prev) => {
        const next = clampScale(prev * (1 - e.deltaY * ZOOM_SENSITIVITY));
        const ratio = next / prev;
        setPan((p) => ({
          x: cx - (cx - p.x) * ratio,
          y: cy - (cy - p.y) * ratio,
        }));
        return next;
      });
    };
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only pan on left button on empty area or middle button anywhere
    if (e.button === 1 || (e.button === 0 && (e.target as Element).tagName === 'svg')) {
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      panOrigin.current = { ...pan };
      (e.target as Element).setPointerCapture(e.pointerId);
      e.preventDefault();
    }
  }, [pan]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current) return;
    setPan({
      x: panOrigin.current.x + (e.clientX - panStart.current.x),
      y: panOrigin.current.y + (e.clientY - panStart.current.y),
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const fitToView = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const padding = 32;
    const s = clampScale(Math.min(
      (cw - padding) / layout.totalWidth,
      (ch - padding) / layout.totalHeight,
    ));
    setPan({
      x: (cw - layout.totalWidth * s) / 2,
      y: (ch - layout.totalHeight * s) / 2,
    });
    setScale(s);
  }, [layout]);

  const zoomBy = useCallback((delta: number) => {
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const cx = cw / 2;
    const cy = ch / 2;

    setScale((prev) => {
      const next = clampScale(prev + delta);
      const ratio = next / prev;
      setPan((p) => ({
        x: cx - (cx - p.x) * ratio,
        y: cy - (cy - p.y) * ratio,
      }));
      return next;
    });
  }, []);

  // Close context menu on outside click or scroll
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

      {/* SVG Canvas – fixed frame with pan & zoom */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden rounded-xl border border-border bg-[#0a0e1a]/60 relative"
        style={{ cursor: 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <svg width="100%" height="100%">
          <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
          {/* Vertical connectors between worktrees */}
          {layout.connectors.map((conn, i) => (
            <line
              key={`vc-${i}`}
              x1={conn.x}
              y1={conn.y1}
              x2={conn.x}
              y2={conn.y2}
              stroke="#2d3548"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          ))}

          {/* Worktrees and branches */}
          {layout.worktrees.map((wt, wtIdx) => {
            const color = COLORS[wtIdx % COLORS.length];

            return (
              <g key={wt.id}>
                {/* Worktree node (folder shape) */}
                <path
                  d={folderPath(wt.x, wt.y, WT_W, WT_H)}
                  fill="#141a2a"
                  stroke={color.border}
                  strokeWidth={1.5}
                  style={{ cursor: 'context-menu' }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const container = containerRef.current;
                    if (!container) return;
                    const rect = container.getBoundingClientRect();
                    setCtxMenu({
                      type: 'worktree',
                      worktreeId: wt.id,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                />
                {renamingId === wt.id ? (
                  <foreignObject
                    x={wt.x + 4}
                    y={wt.y + WT_H / 2 - 14}
                    width={WT_W - 8}
                    height={28}
                  >
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      onBlur={commitRename}
                      className="w-full h-full bg-[#0f1420] border border-blue-500/60 rounded px-2 text-sm text-slate-100 font-semibold outline-none text-center"
                    />
                  </foreignObject>
                ) : (
                  <text
                    x={wt.x + WT_W / 2}
                    y={wt.y + WT_H / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#e2e8f0"
                    fontSize={14}
                    fontWeight={600}
                    fontFamily="inherit"
                    style={{ pointerEvents: 'none' }}
                  >
                    /{wt.name}
                  </text>
                )}

                {/* Branches */}
                {wt.branches.map((br) => {
                  const brKey = `${wt.id}-${br.name}`;
                  const isHovered = hoveredBranch === brKey;

                  return (
                    <g
                      key={br.name}
                      onClick={() => onBranchClick(project.id, wt.id, br.name)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const container = containerRef.current;
                        if (!container) return;
                        const rect = container.getBoundingClientRect();
                        setCtxMenu({
                          type: 'branch',
                          worktreeId: wt.id,
                          branchName: br.name,
                          x: e.clientX - rect.left + container.scrollLeft,
                          y: e.clientY - rect.top + container.scrollTop,
                        });
                      }}
                      onMouseEnter={() => setHoveredBranch(brKey)}
                      onMouseLeave={() => setHoveredBranch(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Bezier connector */}
                      <path
                        d={br.connectorPath}
                        fill="none"
                        stroke={color.accent}
                        strokeWidth={1.5}
                        strokeOpacity={isHovered ? 0.7 : 0.3}
                        style={{ transition: 'stroke-opacity 150ms ease' }}
                      />
                      {/* Colored dot at branch endpoint */}
                      <circle
                        cx={br.x}
                        cy={br.y + BR_H / 2}
                        r={4.5}
                        fill={color.accent}
                        fillOpacity={isHovered ? 0.9 : 0.6}
                        style={{ transition: 'fill-opacity 150ms ease' }}
                      />

                      {/* Branch rect */}
                      <rect
                        x={br.x}
                        y={br.y}
                        width={BR_W}
                        height={BR_H}
                        rx={8}
                        fill={isHovered ? color.bg : '#1a1f2e'}
                        stroke={isHovered ? color.accent : color.border}
                        strokeWidth={isHovered ? 1.5 : 1}
                        style={{ transition: 'all 150ms ease' }}
                      />

                      {/* Current branch indicator */}
                      {br.isCurrent && (
                        <circle
                          cx={br.x + 14}
                          cy={br.y + BR_H / 2}
                          r={3.5}
                          fill="#10b981"
                        />
                      )}

                      {/* Branch name */}
                      {renamingBranch?.worktreeId === wt.id && renamingBranch?.branchName === br.name ? (
                        <foreignObject
                          x={br.x + 4}
                          y={br.y + BR_H / 2 - 12}
                          width={BR_W - 8}
                          height={24}
                        >
                          <input
                            ref={branchRenameInputRef}
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitBranchRename();
                              if (e.key === 'Escape') setRenamingBranch(null);
                            }}
                            onBlur={commitBranchRename}
                            className="w-full h-full bg-[#0f1420] border border-blue-500/60 rounded px-2 text-xs text-slate-100 outline-none"
                          />
                        </foreignObject>
                      ) : (
                        <text
                          x={br.x + (br.isCurrent ? 26 : 12)}
                          y={br.y + BR_H / 2}
                          dominantBaseline="central"
                          fill={isHovered ? '#f1f5f9' : '#cbd5e1'}
                          fontSize={12}
                          fontFamily="inherit"
                          style={{ transition: 'fill 150ms ease', pointerEvents: 'none' }}
                        >
                          {br.name.length > 18 ? br.name.slice(0, 18) + '...' : br.name}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
          </g>
        </svg>

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg border border-border bg-[#1a1f2e]/90 p-1 backdrop-blur-sm">
          <button
            onClick={() => zoomBy(-0.15)}
            className="rounded p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={15} />
          </button>
          <span className="min-w-[40px] text-center text-xs text-slate-400 select-none">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => zoomBy(0.15)}
            className="rounded p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={15} />
          </button>
          <div className="mx-0.5 h-4 w-px bg-border" />
          <button
            onClick={fitToView}
            className="rounded p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
            title="Fit to view"
          >
            <Maximize2 size={15} />
          </button>
        </div>

        {/* Right-click context menu */}
        {ctxMenu && (
          <div
            ref={menuRef}
            className="absolute z-50 min-w-[160px] rounded-lg border border-border bg-[#1a1f2e] py-1 shadow-xl"
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {ctxMenu.type === 'worktree' ? (
              <>
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
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-slate-100 transition-colors"
                  onClick={() => {
                    onBranchDetails?.(ctxMenu.worktreeId, ctxMenu.branchName);
                    setCtxMenu(null);
                  }}
                >
                  <Info size={14} className="shrink-0 opacity-60" />
                  Details
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

export default RepoMindmap;
