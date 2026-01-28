// SkillFlowDiagram Component
// Interactive flow diagram showing skill execution flow with pan/zoom

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn, ZoomOut, Maximize2, Terminal, Plug, Bot,
  CheckSquare, PlayCircle, ArrowRight, Workflow
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { SkillDraft } from '../../../types/skillDraft';

// Layout constants
const NODE_W = 160;
const NODE_H = 56;
const V_GAP = 80;
const H_GAP = 140;
const L_MARGIN = 60;
const T_MARGIN = 60;

// Zoom constraints
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const ZOOM_SENSITIVITY = 0.001;

// Node types
type NodeType = 'trigger' | 'integration' | 'agent' | 'task';

interface FlowNode {
  id: string;
  type: NodeType;
  label: string;
  description?: string;
  x: number;
  y: number;
}

interface FlowConnection {
  from: string;
  to: string;
  path: string;
}

interface FlowLayout {
  nodes: FlowNode[];
  connections: FlowConnection[];
  totalWidth: number;
  totalHeight: number;
}

// Color palette per node type
const NODE_COLORS: Record<NodeType, { accent: string; bg: string; border: string }> = {
  trigger: {
    accent: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.4)'
  },
  integration: {
    accent: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
    border: 'rgba(139,92,246,0.4)'
  },
  agent: {
    accent: '#0ea5e9',
    bg: 'rgba(14,165,233,0.12)',
    border: 'rgba(14,165,233,0.4)'
  },
  task: {
    accent: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.4)'
  },
};

const NODE_ICONS: Record<NodeType, typeof Terminal> = {
  trigger: PlayCircle,
  integration: Plug,
  agent: Bot,
  task: CheckSquare,
};

// Parse instructions to extract integrations, agents, and tasks
function parseInstructions(instructions: string): {
  integrations: string[];
  agents: string[];
  tasks: string[];
} {
  const integrations: string[] = [];
  const agents: string[] = [];
  const tasks: string[] = [];

  // Common integration patterns
  const integrationPatterns = [
    /\b(git|github|gitlab|bitbucket)\b/gi,
    /\b(docker|kubernetes|k8s)\b/gi,
    /\b(aws|gcp|azure|vercel|netlify)\b/gi,
    /\b(slack|discord|teams)\b/gi,
    /\b(jira|linear|notion|trello)\b/gi,
    /\b(npm|yarn|pnpm)\b/gi,
    /\b(jest|vitest|mocha|cypress)\b/gi,
    /\b(eslint|prettier|typescript)\b/gi,
    /\b(postgres|mysql|mongodb|redis)\b/gi,
    /\b(api|webhook|rest|graphql)\b/gi,
  ];

  // Agent patterns
  const agentPatterns = [
    /\b(claude|gpt|llm|ai\s*agent)\b/gi,
    /\bcode\s*review(?:er)?\b/gi,
    /\banalyzer?\b/gi,
    /\bvalidator?\b/gi,
    /\bformatter?\b/gi,
    /\bgenerator?\b/gi,
  ];

  // Extract integrations
  integrationPatterns.forEach(pattern => {
    const matches = instructions.match(pattern);
    if (matches) {
      matches.forEach(m => {
        const normalized = m.toLowerCase();
        if (!integrations.includes(normalized)) {
          integrations.push(normalized);
        }
      });
    }
  });

  // Extract agents
  agentPatterns.forEach(pattern => {
    const matches = instructions.match(pattern);
    if (matches) {
      matches.forEach(m => {
        const normalized = m.toLowerCase().replace(/\s+/g, ' ').trim();
        if (!agents.includes(normalized)) {
          agents.push(normalized);
        }
      });
    }
  });

  // Extract tasks from markdown lists or numbered items
  const taskPatterns = [
    /^[-*]\s+(.+)$/gm,
    /^\d+\.\s+(.+)$/gm,
  ];

  taskPatterns.forEach(pattern => {
    const matches = instructions.matchAll(pattern);
    for (const match of matches) {
      const task = match[1].trim();
      if (task.length > 3 && task.length < 60 && !tasks.includes(task)) {
        tasks.push(task);
      }
    }
  });

  // Limit to reasonable amounts
  return {
    integrations: integrations.slice(0, 5),
    agents: agents.slice(0, 3),
    tasks: tasks.slice(0, 6),
  };
}

// Compute flow layout from skill draft
function computeFlowLayout(draft: SkillDraft): FlowLayout {
  const nodes: FlowNode[] = [];
  const connections: FlowConnection[] = [];

  let currentY = T_MARGIN;
  let maxX = 0;
  let prevNodeIds: string[] = [];

  // 1. Trigger node (always present)
  const triggerId = 'trigger';
  const triggerLabel = draft.trigger === 'pre-tool' ? 'Pre-tool Trigger' : 'Post-tool Trigger';
  nodes.push({
    id: triggerId,
    type: 'trigger',
    label: triggerLabel,
    description: draft.name || 'Skill Command',
    x: L_MARGIN + (NODE_W + H_GAP),
    y: currentY,
  });
  prevNodeIds = [triggerId];
  currentY += NODE_H + V_GAP;
  maxX = Math.max(maxX, L_MARGIN + (NODE_W + H_GAP) * 2);

  // Parse instructions for integrations, agents, tasks
  const { integrations, agents, tasks } = parseInstructions(draft.instructions);

  // 2. Integrations row (if any)
  if (integrations.length > 0) {
    const rowWidth = integrations.length * NODE_W + (integrations.length - 1) * (H_GAP / 2);
    const startX = L_MARGIN + Math.max(0, ((NODE_W + H_GAP) * 2 - rowWidth) / 2);

    const integrationIds: string[] = [];
    integrations.forEach((integration, i) => {
      const nodeId = `integration-${i}`;
      integrationIds.push(nodeId);
      nodes.push({
        id: nodeId,
        type: 'integration',
        label: integration.charAt(0).toUpperCase() + integration.slice(1),
        x: startX + i * (NODE_W + H_GAP / 2),
        y: currentY,
      });
      maxX = Math.max(maxX, startX + i * (NODE_W + H_GAP / 2) + NODE_W);
    });

    // Connect previous nodes to integration nodes
    prevNodeIds.forEach(fromId => {
      integrationIds.forEach(toId => {
        const fromNode = nodes.find(n => n.id === fromId)!;
        const toNode = nodes.find(n => n.id === toId)!;
        connections.push({
          from: fromId,
          to: toId,
          path: createConnectionPath(fromNode, toNode),
        });
      });
    });

    prevNodeIds = integrationIds;
    currentY += NODE_H + V_GAP;
  }

  // 3. Agents row (if any)
  if (agents.length > 0) {
    const rowWidth = agents.length * NODE_W + (agents.length - 1) * (H_GAP / 2);
    const startX = L_MARGIN + Math.max(0, ((NODE_W + H_GAP) * 2 - rowWidth) / 2);

    const agentIds: string[] = [];
    agents.forEach((agent, i) => {
      const nodeId = `agent-${i}`;
      agentIds.push(nodeId);
      nodes.push({
        id: nodeId,
        type: 'agent',
        label: agent.charAt(0).toUpperCase() + agent.slice(1),
        x: startX + i * (NODE_W + H_GAP / 2),
        y: currentY,
      });
      maxX = Math.max(maxX, startX + i * (NODE_W + H_GAP / 2) + NODE_W);
    });

    // Connect previous nodes to agent nodes
    prevNodeIds.forEach(fromId => {
      agentIds.forEach(toId => {
        const fromNode = nodes.find(n => n.id === fromId)!;
        const toNode = nodes.find(n => n.id === toId)!;
        connections.push({
          from: fromId,
          to: toId,
          path: createConnectionPath(fromNode, toNode),
        });
      });
    });

    prevNodeIds = agentIds;
    currentY += NODE_H + V_GAP;
  }

  // 4. Tasks (if any)
  if (tasks.length > 0) {
    const tasksPerRow = 2;
    const rows = Math.ceil(tasks.length / tasksPerRow);

    for (let row = 0; row < rows; row++) {
      const rowTasks = tasks.slice(row * tasksPerRow, (row + 1) * tasksPerRow);
      const rowWidth = rowTasks.length * NODE_W + (rowTasks.length - 1) * (H_GAP / 2);
      const startX = L_MARGIN + Math.max(0, ((NODE_W + H_GAP) * 2 - rowWidth) / 2);

      const taskIds: string[] = [];
      rowTasks.forEach((task, i) => {
        const nodeId = `task-${row}-${i}`;
        taskIds.push(nodeId);
        nodes.push({
          id: nodeId,
          type: 'task',
          label: task.length > 25 ? task.slice(0, 22) + '...' : task,
          description: task,
          x: startX + i * (NODE_W + H_GAP / 2),
          y: currentY,
        });
        maxX = Math.max(maxX, startX + i * (NODE_W + H_GAP / 2) + NODE_W);
      });

      // Connect previous nodes to task nodes (only for first row)
      if (row === 0) {
        prevNodeIds.forEach(fromId => {
          taskIds.forEach(toId => {
            const fromNode = nodes.find(n => n.id === fromId)!;
            const toNode = nodes.find(n => n.id === toId)!;
            connections.push({
              from: fromId,
              to: toId,
              path: createConnectionPath(fromNode, toNode),
            });
          });
        });
      } else {
        // Connect to previous row tasks
        const prevRowTaskIds = nodes
          .filter(n => n.id.startsWith(`task-${row - 1}`))
          .map(n => n.id);
        prevRowTaskIds.forEach((fromId, fi) => {
          if (taskIds[fi]) {
            const fromNode = nodes.find(n => n.id === fromId)!;
            const toNode = nodes.find(n => n.id === taskIds[fi])!;
            connections.push({
              from: fromId,
              to: taskIds[fi],
              path: createConnectionPath(fromNode, toNode),
            });
          }
        });
      }

      currentY += NODE_H + V_GAP;
    }
  }

  return {
    nodes,
    connections,
    totalWidth: maxX + L_MARGIN,
    totalHeight: currentY + T_MARGIN,
  };
}

// Create bezier path between two nodes
function createConnectionPath(from: FlowNode, to: FlowNode): string {
  const startX = from.x + NODE_W / 2;
  const startY = from.y + NODE_H;
  const endX = to.x + NODE_W / 2;
  const endY = to.y;

  const cpY = startY + (endY - startY) / 2;

  return `M${startX},${startY} C${startX},${cpY} ${endX},${cpY} ${endX},${endY}`;
}

interface SkillFlowDiagramProps {
  draft: SkillDraft;
  className?: string;
}

export function SkillFlowDiagram({ draft, className }: SkillFlowDiagramProps) {
  const layout = useMemo(() => computeFlowLayout(draft), [draft]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Pan & zoom state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });

  const clampScale = (s: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, s));

  // Non-passive wheel listener for zoom
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

  // Fit to view on mount and when layout changes
  useEffect(() => {
    fitToView();
  }, [layout]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
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
    const padding = 48;
    const s = clampScale(Math.min(
      (cw - padding) / layout.totalWidth,
      (ch - padding) / layout.totalHeight,
      1.2
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

  const hasContent = layout.nodes.length > 1;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Workflow size={14} className="text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Skill Flow</span>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-[#0a0e1a]/60 relative"
        style={{ cursor: isPanning.current ? 'grabbing' : 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {!hasContent ? (
          <div className="absolute inset-0 flex items-center justify-center text-center p-4">
            <div className="text-muted-foreground">
              <Workflow size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Flow diagram will appear as you define the skill</p>
              <p className="text-xs mt-1 opacity-60">
                Add instructions, integrations, and tasks to see the flow
              </p>
            </div>
          </div>
        ) : (
          <svg width="100%" height="100%">
            <defs>
              {/* Arrow marker */}
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 8 3, 0 6"
                  fill="#475569"
                />
              </marker>
            </defs>

            <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
              {/* Connections */}
              {layout.connections.map((conn, i) => (
                <path
                  key={`conn-${i}`}
                  d={conn.path}
                  fill="none"
                  stroke="#475569"
                  strokeWidth={1.5}
                  strokeOpacity={0.6}
                  markerEnd="url(#arrowhead)"
                />
              ))}

              {/* Nodes */}
              {layout.nodes.map((node) => {
                const colors = NODE_COLORS[node.type];
                const Icon = NODE_ICONS[node.type];
                const isHovered = hoveredNode === node.id;

                return (
                  <g
                    key={node.id}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Node background */}
                    <rect
                      x={node.x}
                      y={node.y}
                      width={NODE_W}
                      height={NODE_H}
                      rx={10}
                      fill={isHovered ? colors.bg : '#141a2a'}
                      stroke={isHovered ? colors.accent : colors.border}
                      strokeWidth={isHovered ? 2 : 1.5}
                      style={{ transition: 'all 150ms ease' }}
                    />

                    {/* Icon circle */}
                    <circle
                      cx={node.x + 24}
                      cy={node.y + NODE_H / 2}
                      r={12}
                      fill={colors.bg}
                      stroke={colors.border}
                      strokeWidth={1}
                    />

                    {/* Icon */}
                    <foreignObject
                      x={node.x + 12}
                      y={node.y + NODE_H / 2 - 12}
                      width={24}
                      height={24}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon size={14} style={{ color: colors.accent }} />
                      </div>
                    </foreignObject>

                    {/* Label */}
                    <text
                      x={node.x + 44}
                      y={node.y + NODE_H / 2 - (node.description ? 4 : 0)}
                      dominantBaseline="central"
                      fill={isHovered ? '#f1f5f9' : '#cbd5e1'}
                      fontSize={11}
                      fontWeight={500}
                      fontFamily="inherit"
                      style={{ pointerEvents: 'none' }}
                    >
                      {node.label}
                    </text>

                    {/* Description (for trigger node) */}
                    {node.description && node.type === 'trigger' && (
                      <text
                        x={node.x + 44}
                        y={node.y + NODE_H / 2 + 10}
                        dominantBaseline="central"
                        fill="#64748b"
                        fontSize={9}
                        fontFamily="inherit"
                        style={{ pointerEvents: 'none' }}
                      >
                        {node.description.length > 20
                          ? node.description.slice(0, 18) + '...'
                          : node.description}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {/* Zoom controls */}
        {hasContent && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg border border-border bg-[#1a1f2e]/90 p-1 backdrop-blur-sm">
            <button
              onClick={() => zoomBy(-0.15)}
              className="rounded p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
              title="Zoom out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="min-w-[36px] text-center text-xs text-slate-400 select-none">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => zoomBy(0.15)}
              className="rounded p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
              title="Zoom in"
            >
              <ZoomIn size={14} />
            </button>
            <div className="mx-0.5 h-4 w-px bg-border" />
            <button
              onClick={fitToView}
              className="rounded p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
              title="Fit to view"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        )}

        {/* Legend */}
        {hasContent && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {Object.entries(NODE_COLORS).map(([type, colors]) => {
              const Icon = NODE_ICONS[type as NodeType];
              const labels: Record<NodeType, string> = {
                trigger: 'Trigger',
                integration: 'Integration',
                agent: 'Agent',
                task: 'Task',
              };
              return (
                <div
                  key={type}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1a1f2e]/80 border border-border text-xs"
                >
                  <Icon size={12} style={{ color: colors.accent }} />
                  <span className="text-slate-400">{labels[type as NodeType]}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SkillFlowDiagram;
