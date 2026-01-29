import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Copy, Pencil, ExternalLink, FileUp, GitFork, ZoomIn, ZoomOut, Maximize2, MoreVertical, Plus, FolderPlus, Trash2 } from 'lucide-react';
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
  let nextWtY = T_MARGIN; // Dynamic Y position for next worktree

  for (let i = 0; i < worktrees.length; i++) {
    const wt = worktrees[i];
    const wtX = L_MARGIN;
    const wtY = nextWtY;
    const wtCenterY = wtY + WT_H / 2;

    const branchCount = wt.branches.length;
    // Add 1 to branch count for ghost branch space
    const totalBranchHeight = branchCount * BR_GAP;
    const branchStartY = wtCenterY - totalBranchHeight / 2 - BR_H / 2 + BR_GAP / 2;
    const branchX = wtX + WT_W + H_GAP;

    let lastBranchBottomY = wtY + WT_H;

    const branches: LayoutBranch[] = wt.branches.map((br, j) => {
      const brY = branchStartY + j * BR_GAP;
      const brCenterY = brY + BR_H / 2;

      const startX = wtX + WT_W;
      const startY = wtCenterY;
      const endX = branchX;
      const endY = brCenterY;
      const cpX = startX + (endX - startX) / 2;
      const connectorPath = `M${startX},${startY} C${cpX},${startY} ${cpX},${endY} ${endX},${endY}`;

      lastBranchBottomY = Math.max(lastBranchBottomY, brY + BR_H);
      maxBottomY = Math.max(maxBottomY, brY + BR_H);

      return { ...br, x: branchX, y: brY, connectorPath };
    });

    maxRightX = Math.max(maxRightX, branchX + BR_W);
    maxBottomY = Math.max(maxBottomY, wtY + WT_H);

    worktreeNodes.push({ id: wt.id, name: wt.name, x: wtX, y: wtY, branches });

    // Calculate next worktree Y based on where branches end + space for ghost branch
    const ghostBranchSpace = BR_H + BR_GAP / 2;
    nextWtY = Math.max(wtY + WT_H, lastBranchBottomY + ghostBranchSpace) + WT_GAP / 2;

    if (i < worktrees.length - 1) {
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
  onWorktreeNewIngestion?: (worktreeId: string) => void;
  onBranchOpen?: (worktreeId: string, branchName: string) => void;
  onBranchNewIngestion?: (worktreeId: string, branchName: string) => void;
  onRenameBranch?: (worktreeId: string, oldName: string, newName: string) => void;
  onAddBranch?: (worktreeId: string) => void;
  onForkBranch?: (worktreeId: string, sourceBranchName: string) => void;
  onAddWorktree?: () => void;
  onDeleteWorktree?: (worktreeId: string) => void;
  onBranchHover?: (worktreeId: string, branchName: string) => void;
  onRenameProject?: (newName: string) => void;
}

export function RepoMindmap({
  project, worktrees, onBranchClick,
  onDuplicateWorktree, onRenameWorktree, onWorktreeNewIngestion,
  onBranchOpen, onBranchNewIngestion, onRenameBranch, onAddBranch, onForkBranch, onAddWorktree, onDeleteWorktree,
  onBranchHover, onRenameProject,
}: RepoMindmapProps) {
  const layout = useMemo(() => computeLayout(worktrees), [worktrees]);
  const [hoveredBranch, setHoveredBranch] = useState<string | null>(null);
  const [hoveredWorktree, setHoveredWorktree] = useState<string | null>(null);
  const [showGhostWorktree, setShowGhostWorktree] = useState(false);
  const [showGhostBranch, setShowGhostBranch] = useState<string | null>(null); // worktreeId
  const [ctxMenu, setCtxMenu] = useState<ContextMenu | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ worktreeId: string; worktreeName: string } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renamingBranch, setRenamingBranch] = useState<{ worktreeId: string; branchName: string } | null>(null);
  const [isRenamingProject, setIsRenamingProject] = useState(false);
  const [projectNameValue, setProjectNameValue] = useState(project.name);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const projectNameInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    if (isRenamingProject) projectNameInputRef.current?.focus();
  }, [isRenamingProject]);

  // Keep projectNameValue in sync with project.name
  useEffect(() => {
    setProjectNameValue(project.name);
  }, [project.name]);

  const commitProjectRename = useCallback(() => {
    if (projectNameValue.trim() && projectNameValue.trim() !== project.name) {
      onRenameProject?.(projectNameValue.trim());
    }
    setIsRenamingProject(false);
  }, [projectNameValue, project.name, onRenameProject]);

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
      // Clear ghost states when clicking empty area
      setShowGhostWorktree(false);
      setShowGhostBranch(null);
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
        {isRenamingProject ? (
          <input
            ref={projectNameInputRef}
            value={projectNameValue}
            onChange={(e) => setProjectNameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitProjectRename();
              if (e.key === 'Escape') {
                setProjectNameValue(project.name);
                setIsRenamingProject(false);
              }
            }}
            onBlur={commitProjectRename}
            className="text-lg font-semibold text-foreground bg-muted/50 border border-primary/50 rounded px-2 py-0.5 outline-none focus:border-primary"
          />
        ) : (
          <div className="flex items-center gap-2 group">
            <h2 className="text-lg font-semibold text-foreground">{project.name}</h2>
            <button
              onClick={() => setIsRenamingProject(true)}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              title="Rename project"
            >
              <Pencil size={14} />
            </button>
          </div>
        )}
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
                  fill={showGhostBranch === wt.id ? color.bg : '#141a2a'}
                  stroke={showGhostBranch === wt.id || hoveredWorktree === wt.id ? color.accent : color.border}
                  strokeWidth={showGhostBranch === wt.id ? 2.5 : hoveredWorktree === wt.id ? 2 : 1.5}
                  style={{ cursor: 'pointer', transition: 'all 150ms ease' }}
                  onMouseEnter={() => setHoveredWorktree(wt.id)}
                  onMouseLeave={() => setHoveredWorktree(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Toggle ghost worktree AND ghost branch for this worktree
                    setShowGhostWorktree((prev) => !prev);
                    setShowGhostBranch((prev) => (prev === wt.id ? null : wt.id));
                  }}
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
                  <>
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
                    {/* Three-dots menu button */}
                    <g
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!containerRef.current) return;
                        const svgX = wt.x + WT_W - 20;
                        const svgY = wt.y + 8;
                        const screenX = svgX * scale + pan.x;
                        const screenY = svgY * scale + pan.y;
                        setCtxMenu({
                          type: 'worktree',
                          worktreeId: wt.id,
                          x: screenX,
                          y: screenY,
                        });
                      }}
                    >
                      <rect
                        x={wt.x + WT_W - 28}
                        y={wt.y + 4}
                        width={20}
                        height={20}
                        rx={4}
                        fill="transparent"
                        className="hover:fill-white/10"
                      />
                      <MoreVertical
                        x={wt.x + WT_W - 26}
                        y={wt.y + 6}
                        width={16}
                        height={16}
                        stroke="#94a3b8"
                        strokeWidth={1.5}
                      />
                    </g>
                  </>
                )}

                {/* Branches */}
                {wt.branches.map((br) => {
                  const brKey = `${wt.id}-${br.name}`;
                  const isHovered = hoveredBranch === brKey;

                  return (
                    <g
                      key={br.name}
                      onDoubleClick={() => {
                        // Navigate to branch detail on double-click
                        onBranchClick(project.id, wt.id, br.name);
                      }}
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
                      onMouseEnter={() => {
                        setHoveredBranch(brKey);
                        onBranchHover?.(wt.id, br.name);
                      }}
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
                        <>
                          <text
                            x={br.x + (br.isCurrent ? 26 : 12)}
                            y={br.y + BR_H / 2}
                            dominantBaseline="central"
                            fill={isHovered ? '#f1f5f9' : '#cbd5e1'}
                            fontSize={12}
                            fontFamily="inherit"
                            style={{ transition: 'fill 150ms ease', pointerEvents: 'none' }}
                          >
                            {br.name.length > 16 ? br.name.slice(0, 16) + '...' : br.name}
                          </text>
                          {/* Three-dots menu button */}
                          <g
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!containerRef.current) return;
                              const svgX = br.x + BR_W - 20;
                              const svgY = br.y + BR_H / 2 - 8;
                              const screenX = svgX * scale + pan.x;
                              const screenY = svgY * scale + pan.y;
                              setCtxMenu({
                                type: 'branch',
                                worktreeId: wt.id,
                                branchName: br.name,
                                x: screenX,
                                y: screenY,
                              });
                            }}
                          >
                            <rect
                              x={br.x + BR_W - 26}
                              y={br.y + BR_H / 2 - 10}
                              width={20}
                              height={20}
                              rx={4}
                              fill="transparent"
                              className="hover:fill-white/10"
                            />
                            <MoreVertical
                              x={br.x + BR_W - 24}
                              y={br.y + BR_H / 2 - 8}
                              width={16}
                              height={16}
                              stroke={isHovered ? '#cbd5e1' : '#64748b'}
                              strokeWidth={1.5}
                            />
                          </g>
                        </>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Ghost worktree preview - appears below last worktree */}
          {showGhostWorktree && layout.worktrees.length > 0 && (() => {
            const lastWt = layout.worktrees[layout.worktrees.length - 1];
            const nextColorIdx = layout.worktrees.length % COLORS.length;
            const color = COLORS[nextColorIdx];
            const ghostY = lastWt.y + WT_H + WT_GAP;
            const ghostCenterY = ghostY + WT_H / 2;

            // Ghost branch position
            const branchX = lastWt.x + WT_W + H_GAP;
            const branchY = ghostCenterY - BR_H / 2;
            const branchCenterY = branchY + BR_H / 2;
            const startX = lastWt.x + WT_W;
            const endX = branchX;
            const cpX = startX + (endX - startX) / 2;
            const branchConnectorPath = `M${startX},${ghostCenterY} C${cpX},${ghostCenterY} ${cpX},${branchCenterY} ${endX},${branchCenterY}`;

            return (
              <g
                style={{ cursor: 'pointer', opacity: 0.6 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddWorktree?.();
                  setShowGhostWorktree(false);
                }}
              >
                {/* Dashed connector from last worktree to ghost */}
                <line
                  x1={lastWt.x + WT_W / 2}
                  y1={lastWt.y + WT_H}
                  x2={lastWt.x + WT_W / 2}
                  y2={ghostY}
                  stroke={color.accent}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  strokeOpacity={0.5}
                />
                {/* Ghost folder shape */}
                <path
                  d={folderPath(lastWt.x, ghostY, WT_W, WT_H)}
                  fill="#141a2a"
                  stroke={color.accent}
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  strokeOpacity={0.7}
                />
                {/* Folder Plus icon */}
                <FolderPlus
                  x={lastWt.x + WT_W / 2 - 12}
                  y={ghostY + WT_H / 2 - 12}
                  width={24}
                  height={24}
                  stroke={color.accent}
                  strokeWidth={1.5}
                />

                {/* Ghost branch connector */}
                <path
                  d={branchConnectorPath}
                  fill="none"
                  stroke={color.accent}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  strokeOpacity={0.4}
                />
                {/* Ghost branch dot */}
                <circle
                  cx={branchX}
                  cy={branchCenterY}
                  r={4.5}
                  fill={color.accent}
                  fillOpacity={0.4}
                />
                {/* Ghost branch rect */}
                <rect
                  x={branchX}
                  y={branchY}
                  width={BR_W}
                  height={BR_H}
                  rx={8}
                  fill="#1a1f2e"
                  stroke={color.accent}
                  strokeWidth={1}
                  strokeDasharray="6 4"
                  strokeOpacity={0.5}
                />
                {/* Ghost branch text */}
                <text
                  x={branchX + BR_W / 2}
                  y={branchCenterY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={color.accent}
                  fillOpacity={0.6}
                  fontSize={11}
                  fontFamily="inherit"
                >
                  main
                </text>
              </g>
            );
          })()}

          {/* Ghost branch preview - appears below the last branch (orphan branch) */}
          {showGhostBranch && (() => {
            const wtIdx = layout.worktrees.findIndex(wt => wt.id === showGhostBranch);
            if (wtIdx === -1) return null;
            const wt = layout.worktrees[wtIdx];
            const color = COLORS[wtIdx % COLORS.length];
            const lastBranch = wt.branches[wt.branches.length - 1];
            if (!lastBranch) return null;

            // Position ghost branch below the last branch
            const ghostX = lastBranch.x;
            const ghostY = lastBranch.y + BR_H + BR_GAP / 2;
            const ghostCenterY = ghostY + BR_H / 2;

            // Bezier curve from worktree to ghost branch
            const startX = wt.x + WT_W;
            const startY = wt.y + WT_H / 2;
            const cpX = startX + (ghostX - startX) / 2;
            const connectorPath = `M${startX},${startY} C${cpX},${startY} ${cpX},${ghostCenterY} ${ghostX},${ghostCenterY}`;

            return (
              <g
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddBranch?.(showGhostBranch);
                  setShowGhostBranch(null);
                  setShowGhostWorktree(false);
                }}
              >
                {/* Ghost connector - bezier curve from worktree */}
                <path
                  d={connectorPath}
                  fill="none"
                  stroke={color.accent}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  strokeOpacity={0.7}
                />
                {/* Ghost dot */}
                <circle
                  cx={ghostX}
                  cy={ghostCenterY}
                  r={5}
                  fill={color.accent}
                  fillOpacity={0.7}
                />
                {/* Ghost branch rect */}
                <rect
                  x={ghostX}
                  y={ghostY}
                  width={BR_W}
                  height={BR_H}
                  rx={8}
                  fill="#1a1f2e"
                  stroke={color.accent}
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  strokeOpacity={0.8}
                />
                {/* Plus icon */}
                <Plus
                  x={ghostX + BR_W / 2 - 10}
                  y={ghostY + BR_H / 2 - 10}
                  width={20}
                  height={20}
                  stroke={color.accent}
                  strokeWidth={2}
                />
              </g>
            );
          })()}
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
                <div className="my-1 border-t border-border" />
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  onClick={() => {
                    const wt = worktrees.find((w) => w.id === ctxMenu.worktreeId);
                    setDeleteConfirm({ worktreeId: ctxMenu.worktreeId, worktreeName: wt?.name ?? '' });
                    setCtxMenu(null);
                  }}
                >
                  <Trash2 size={14} className="shrink-0 opacity-60" />
                  Delete
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
                    onForkBranch?.(ctxMenu.worktreeId, ctxMenu.branchName);
                    setCtxMenu(null);
                  }}
                >
                  <GitFork size={14} className="shrink-0 opacity-60" />
                  Fork
                </button>
              </>
            )}
          </div>
        )}

        {/* Delete confirmation dialog */}
        {deleteConfirm && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
            <div className="bg-[#1a1f2e] border border-border rounded-xl p-5 shadow-2xl max-w-sm w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Trash2 size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">Delete Worktree</h3>
                  <p className="text-sm text-slate-400">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-slate-300 mb-5">
                Are you sure you want to delete <span className="font-semibold text-slate-100">/{deleteConfirm.worktreeName}</span>?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-white/5 rounded-lg transition-colors"
                >
                  No, Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteWorktree?.(deleteConfirm.worktreeId);
                    setDeleteConfirm(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RepoMindmap;
