// Knowledge Graph Modal
// Visualizes entity relationships using force-directed graph

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Filter, ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useFocusTrap } from '../hooks/useFocusTrap';
import {
  fetchKnowledgeGraph,
  filterGraphByType,
  NODE_COLORS,
} from '../../../services/knowledgeGraph';
import type { GraphData, GraphNode, GraphNodeType } from '../../../types/contextInspector';

// Dynamic import for the graph component to avoid SSR issues
import ForceGraph2D from 'react-force-graph-2d';

interface KnowledgeGraphModalProps {
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

export function KnowledgeGraphModal({
  isOpen,
  onClose,
  contextId,
}: KnowledgeGraphModalProps) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [filteredData, setFilteredData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filter, setFilter] = useState<GraphNodeType | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  // Focus trap for accessibility
  useFocusTrap(modalRef, isOpen);

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

  // Apply filter when filter or data changes
  useEffect(() => {
    if (graphData) {
      setFilteredData(filterGraphByType(graphData, filter));
    }
  }, [filter, graphData]);

  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
  }, []);

  // Zoom controls
  const handleZoomIn = () => {
    graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 300);
  };

  const handleZoomOut = () => {
    graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 300);
  };

  const handleZoomReset = () => {
    graphRef.current?.zoomToFit(400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className="w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kg-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <h2 id="kg-modal-title" className="text-lg font-bold text-white">
              Knowledge Graph
            </h2>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as GraphNodeType | 'all')}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:border-blue-500 outline-none"
              >
                {NODE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Node count */}
            {filteredData && (
              <span className="text-sm text-gray-500">
                {filteredData.nodes.length} nodes, {filteredData.links.length} links
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={handleZoomOut}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Zoom out"
              >
                <ZoomOut size={18} />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Zoom in"
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={handleZoomReset}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Fit to view"
              >
                <Maximize2 size={18} />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Graph Container */}
        <div className="flex-1 relative bg-slate-950">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} />
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
              width={undefined}
              height={undefined}
            />
          ) : null}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 p-3 bg-slate-900/90 border border-slate-700 rounded-lg">
            <p className="text-xs font-semibold text-gray-400 mb-2">Legend</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(NODE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-gray-400 capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Node Details Panel */}
        {selectedNode && (
          <NodeDetailsPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function LoadingState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
        <p className="mt-3 text-sm text-gray-400">Loading knowledge graph...</p>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <Info className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-sm text-gray-400">{error}</p>
      </div>
    </div>
  );
}

interface NodeDetailsPanelProps {
  node: GraphNode;
  onClose: () => void;
}

function NodeDetailsPanel({ node, onClose }: NodeDetailsPanelProps) {
  return (
    <div className="border-t border-slate-800 p-4 bg-slate-900/50">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: node.color }}
          />
          <div>
            <h3 className="text-sm font-semibold text-white">{node.name}</h3>
            <p className="text-xs text-gray-400 capitalize">
              {node.type} &middot; {node.references} references
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white transition-colors"
          aria-label="Close details"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default KnowledgeGraphModal;
