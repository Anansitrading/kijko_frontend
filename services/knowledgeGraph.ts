// Knowledge Graph Service
// Fetches and manages knowledge graph data for visualization

import type { GraphData, GraphNode, GraphLink, GraphNodeType, GraphLinkType } from '../types/contextInspector';

// ============================================
// Mock Data Generator
// ============================================

const NODE_TYPES: GraphNodeType[] = ['function', 'class', 'module', 'variable', 'file'];
const LINK_TYPES: GraphLinkType[] = ['imports', 'calls', 'extends', 'implements'];

const NODE_COLORS: Record<GraphNodeType, string> = {
  function: '#3b82f6', // blue
  class: '#8b5cf6',    // purple
  module: '#10b981',   // emerald
  variable: '#f59e0b', // amber
  file: '#6b7280',     // gray
};

function generateMockNodes(count: number): GraphNode[] {
  const names = [
    'UserService', 'AuthController', 'DatabaseConnection', 'Logger',
    'CacheManager', 'ApiClient', 'EventEmitter', 'ConfigParser',
    'SessionHandler', 'TokenValidator', 'RateLimiter', 'MetricsCollector',
    'WebSocketManager', 'FileProcessor', 'QueueWorker', 'ErrorHandler',
    'Middleware', 'Router', 'Serializer', 'Validator',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `node-${i}`,
    name: names[i % names.length] + (i >= names.length ? `_${Math.floor(i / names.length)}` : ''),
    type: NODE_TYPES[Math.floor(Math.random() * NODE_TYPES.length)],
    references: Math.floor(Math.random() * 20) + 1,
    color: undefined, // Will be set based on type
  })).map(node => ({
    ...node,
    color: NODE_COLORS[node.type],
  }));
}

function generateMockLinks(nodes: GraphNode[]): GraphLink[] {
  const links: GraphLink[] = [];
  const nodeIds = nodes.map(n => n.id);

  // Create some connections between nodes
  nodes.forEach((node, i) => {
    // Each node connects to 1-3 other nodes
    const connectionCount = Math.floor(Math.random() * 3) + 1;

    for (let j = 0; j < connectionCount; j++) {
      const targetIndex = Math.floor(Math.random() * nodeIds.length);
      if (targetIndex !== i) {
        links.push({
          source: node.id,
          target: nodeIds[targetIndex],
          type: LINK_TYPES[Math.floor(Math.random() * LINK_TYPES.length)],
        });
      }
    }
  });

  return links;
}

// ============================================
// API Functions
// ============================================

export async function fetchKnowledgeGraph(contextId: string): Promise<GraphData> {
  // In production, this would fetch from the API:
  // const response = await fetch(`/api/contexts/${contextId}/knowledge-graph`);
  // return response.json();

  // Mock implementation with simulated delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

  const nodeCount = 15 + Math.floor(Math.random() * 10);
  const nodes = generateMockNodes(nodeCount);
  const links = generateMockLinks(nodes);

  return { nodes, links };
}

export function filterGraphByType(
  data: GraphData,
  typeFilter: GraphNodeType | 'all'
): GraphData {
  if (typeFilter === 'all') {
    return data;
  }

  const filteredNodes = data.nodes.filter(node => node.type === typeFilter);
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

  const filteredLinks = data.links.filter(
    link =>
      filteredNodeIds.has(link.source as string) &&
      filteredNodeIds.has(link.target as string)
  );

  return {
    nodes: filteredNodes,
    links: filteredLinks,
  };
}

export function getNodeColor(type: GraphNodeType): string {
  return NODE_COLORS[type];
}

export { NODE_COLORS };

export default { fetchKnowledgeGraph, filterGraphByType, getNodeColor, NODE_COLORS };
