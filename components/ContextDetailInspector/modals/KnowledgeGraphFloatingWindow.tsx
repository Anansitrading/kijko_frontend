// Knowledge Graph Popup Window
// Opens as a real separate browser window using window.open + React portal

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Filter, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import {
  fetchKnowledgeGraph,
  filterGraphByType,
  NODE_COLORS,
} from '../../../services/knowledgeGraph';
import type { GraphData, GraphNode, GraphNodeType } from '../../../types/contextInspector';

import ForceGraph2D from 'react-force-graph-2d';

interface KnowledgeGraphFloatingWindowProps {
  isOpen: boolean;
  onClose: () => void;
  contextId: string;
}

const NODE_TYPE_OPTIONS: { value: GraphNodeType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'function', label: 'Functions' },
  { value: 'class', label: 'Classes' },
  { value: 'module', label: 'Modules' },
  { value: 'variable', label: 'Variables' },
  { value: 'file', label: 'Files' },
];

function copyStyles(sourceDoc: Document, targetDoc: Document) {
  // Copy all stylesheets
  Array.from(sourceDoc.styleSheets).forEach((styleSheet) => {
    try {
      if (styleSheet.cssRules) {
        const newStyle = targetDoc.createElement('style');
        Array.from(styleSheet.cssRules).forEach((rule) => {
          newStyle.appendChild(targetDoc.createTextNode(rule.cssText));
        });
        targetDoc.head.appendChild(newStyle);
      }
    } catch {
      // Cross-origin stylesheets can't be read, copy as link instead
      if (styleSheet.href) {
        const link = targetDoc.createElement('link');
        link.rel = 'stylesheet';
        link.href = styleSheet.href;
        targetDoc.head.appendChild(link);
      }
    }
  });

  // Copy <link> stylesheets from head
  Array.from(sourceDoc.querySelectorAll('link[rel="stylesheet"]')).forEach((link) => {
    const newLink = targetDoc.createElement('link');
    newLink.rel = 'stylesheet';
    newLink.href = (link as HTMLLinkElement).href;
    targetDoc.head.appendChild(newLink);
  });

  // Copy inline <style> tags from head (e.g., Tailwind CDN)
  Array.from(sourceDoc.querySelectorAll('head > style')).forEach((style) => {
    const newStyle = targetDoc.createElement('style');
    newStyle.textContent = style.textContent;
    targetDoc.head.appendChild(newStyle);
  });
}

export function KnowledgeGraphFloatingWindow({
  isOpen,
  onClose,
  contextId,
}: KnowledgeGraphFloatingWindowProps) {
  // Graph state
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [filteredData, setFilteredData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filter, setFilter] = useState<GraphNodeType | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 800, height: 600 });

  const popupRef = useRef<Window | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<any>(null);
  const [portalReady, setPortalReady] = useState(false);

  // Keep a stable ref for onClose so the effect doesn't re-run on every render
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Open popup window
  useEffect(() => {
    if (!isOpen) {
      // Close popup if open
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      popupRef.current = null;
      containerRef.current = null;
      setPortalReady(false);
      return;
    }

    // Calculate centered position
    const width = 900;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      '',
      'kijko-knowledge-graph',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,menubar=no,toolbar=no,location=no,status=no`
    );

    if (!popup) {
      console.error('Popup blocked - please allow popups for this site');
      onCloseRef.current();
      return;
    }

    popupRef.current = popup;

    // Set up the popup document
    popup.document.title = 'Knowledge Graph — Kijko';

    // Set dark background immediately
    popup.document.documentElement.classList.add('dark');
    popup.document.body.style.margin = '0';
    popup.document.body.style.padding = '0';
    popup.document.body.style.backgroundColor = '#080c16';
    popup.document.body.style.overflow = 'hidden';
    popup.document.body.style.fontFamily = '"Inter", sans-serif';

    // Create container for React portal
    const container = popup.document.createElement('div');
    container.id = 'kg-root';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    popup.document.body.appendChild(container);

    // Copy styles from parent window
    copyStyles(document, popup.document);

    containerRef.current = container;
    setWindowSize({ width, height });
    setPortalReady(true);

    // Listen for popup close
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        onCloseRef.current();
      }
    }, 300);

    // Listen for resize
    const handleResize = () => {
      setWindowSize({
        width: popup.innerWidth,
        height: popup.innerHeight,
      });
    };
    popup.addEventListener('resize', handleResize);

    // Clean up on parent unload
    const handleUnload = () => {
      if (popup && !popup.closed) popup.close();
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(checkClosed);
      window.removeEventListener('beforeunload', handleUnload);
      if (popup && !popup.closed) {
        popup.removeEventListener('resize', handleResize);
        popup.close();
      }
    };
  }, [isOpen]);

  // Fetch graph data on open
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    setError(null);
    setSelectedNode(null);

    fetchKnowledgeGraph(contextId)
      .then((data) => {
        setGraphData(data);
        setFilteredData(data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load knowledge graph');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, contextId]);

  // Apply filter
  useEffect(() => {
    if (graphData) {
      setFilteredData(filterGraphByType(graphData, filter));
    }
  }, [filter, graphData]);

  // Node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
  }, []);

  // Zoom controls
  const handleZoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 300);
  const handleZoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 300);
  const handleZoomReset = () => graphRef.current?.zoomToFit(400);

  if (!isOpen || !portalReady || !containerRef.current) return null;

  const TOOLBAR_HEIGHT = 44;
  const NODE_PANEL_HEIGHT = selectedNode ? 45 : 0;
  const graphWidth = windowSize.width;
  const graphHeight = windowSize.height - TOOLBAR_HEIGHT - NODE_PANEL_HEIGHT;

  const content = (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#080c16', color: '#fff' }}>
      {/* Toolbar */}
      <div style={{
        height: TOOLBAR_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        background: '#141b2d',
        borderBottom: '1px solid #1e293b',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Knowledge Graph</span>

          {/* Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} color="#6b7280" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as GraphNodeType | 'all')}
              style={{
                background: '#0d1220',
                border: '1px solid #1e293b',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 12,
                color: '#cbd5e1',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {NODE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Node count */}
          {filteredData && (
            <span style={{ fontSize: 11, color: '#6b7280' }}>
              {filteredData.nodes.length} nodes · {filteredData.links.length} links
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ToolbarButton onClick={handleZoomOut} title="Zoom out"><ZoomOut size={16} /></ToolbarButton>
          <ToolbarButton onClick={handleZoomIn} title="Zoom in"><ZoomIn size={16} /></ToolbarButton>
          <ToolbarButton onClick={handleZoomReset} title="Fit to view"><Maximize2 size={16} /></ToolbarButton>
        </div>
      </div>

      {/* Graph */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {isLoading ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 32, height: 32, border: '2px solid #334155', borderTopColor: '#a855f7',
                borderRadius: '50%', animation: 'spin 1s linear infinite',
                display: 'inline-block',
              }} />
              <p style={{ marginTop: 12, fontSize: 14, color: '#9ca3af' }}>Loading knowledge graph...</p>
            </div>
          </div>
        ) : error ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 14, color: '#f87171' }}>{error}</p>
          </div>
        ) : filteredData ? (
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredData}
            nodeLabel={(node: any) => `${node.name} (${node.type})`}
            nodeColor={(node: any) => node.color || '#6b7280'}
            nodeRelSize={6}
            nodeVal={(node: any) => Math.max(3, Math.min(10, node.references / 2))}
            linkColor={() => 'rgba(255,255,255,0.15)'}
            linkDirectionalArrowLength={3}
            linkDirectionalArrowRelPos={1}
            onNodeClick={(node: any) => handleNodeClick(node as GraphNode)}
            enableZoomInteraction={true}
            enablePanInteraction={true}
            cooldownTicks={100}
            onEngineStop={() => graphRef.current?.zoomToFit(400)}
            backgroundColor="transparent"
            width={graphWidth}
            height={graphHeight}
          />
        ) : null}

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          padding: 10, background: 'rgba(13,18,32,0.9)',
          border: '1px solid #1e293b', borderRadius: 8,
        }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Legend</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px' }}>
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color }} />
                <span style={{ fontSize: 11, color: '#9ca3af', textTransform: 'capitalize' }}>{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div style={{
          flexShrink: 0, borderTop: '1px solid #1e293b',
          padding: '10px 16px', background: '#141b2d',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: selectedNode.color }} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>{selectedNode.name}</span>
          <span style={{ fontSize: 12, color: '#6b7280', textTransform: 'capitalize' }}>
            {selectedNode.type} · {selectedNode.references} references
          </span>
          <button
            onClick={() => setSelectedNode(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* CSS animation for spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return createPortal(content, containerRef.current);
}

function ToolbarButton({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: 6, color: '#9ca3af', background: 'none',
        border: 'none', borderRadius: 4, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'none'; }}
    >
      {children}
    </button>
  );
}

export default KnowledgeGraphFloatingWindow;
