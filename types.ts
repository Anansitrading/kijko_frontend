export type WorkspaceMode = 'hyperglyph' | 'panopticon' | 'agents';

export interface LogEntry {
  ts: string;
  level: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR';
  agent: string;
  msg: string;
}

export interface AgentStatus {
    name: string;
    state: 'Idle' | 'Thinking' | 'Working' | 'Error';
    load: number;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  attachments?: File[];
}

export interface ContextItem {
    id: string;
    name: string;
    type: 'file' | 'repo';
    size: string;
    status: 'cached' | 'pending' | 'expired';
}

export interface IngestionConfig {
    fileId: string;
    fileName: string;
    displayName: string;
    processingMode: 'none' | 'compress';
    codebase: {
        type: 'existing' | 'new';
        id?: string;
        name: string;
    };
    tags?: string[];
    documentationTags?: string[];
    knowledgeGraphTags?: string[];
    description?: string;
    neverCompress?: boolean;
    chromacode?: ChromacodeConfig;
}

export interface ChromacodeColorEntry {
    label: string;
    role: string;
    hex: string;
}

export interface ChromacodeConfig {
    controlFlow: string;
    storage: string;
    literals: string;
    execution: string;
    meta: string;
}

export const CHROMACODE_DEFAULTS: ChromacodeConfig = {
    controlFlow: '#D00000',
    storage: '#0000D0',
    literals: '#007000',
    execution: '#800080',
    meta: '#505050',
};

export const CHROMACODE_LABELS: Record<keyof ChromacodeConfig, { label: string; role: string; example: string }> = {
    controlFlow: { label: 'Control Flow', role: 'if, for, while', example: 'Conditionals & loops' },
    storage: { label: 'Storage / Identity', role: 'class, def, var', example: 'Definitions & declarations' },
    literals: { label: 'Literals / Payload', role: 'strings, numbers', example: 'Values & data' },
    execution: { label: 'Execution', role: 'function calls', example: 'Invocations & calls' },
    meta: { label: 'Meta / Context', role: 'comments', example: 'Annotations & docs' },
};

// Tag Suggestions
export const DOCUMENTATION_TAG_SUGGESTIONS = [
    'api', 'readme', 'guide', 'tutorial', 'reference', 'changelog',
    'architecture', 'setup', 'configuration', 'deployment', 'migration',
    'troubleshooting', 'faq', 'specification', 'runbook',
];

export const KNOWLEDGE_GRAPH_TAG_SUGGESTIONS = [
    'entity', 'relationship', 'concept', 'dependency', 'module',
    'service', 'interface', 'schema', 'workflow', 'taxonomy',
    'ontology', 'hierarchy', 'mapping', 'constraint', 'rule',
];

// Visibility Index Calculation
function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [
        parseInt(h.substring(0, 2), 16),
        parseInt(h.substring(2, 4), 16),
        parseInt(h.substring(4, 6), 16),
    ];
}

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

/** Calculate visibility index (0–100%) based on chromacode color distinguishability. Default colors = 75%. */
export function calculateVisibilityIndex(config: ChromacodeConfig): number {
    const keys = Object.keys(CHROMACODE_DEFAULTS) as (keyof ChromacodeConfig)[];
    const colors = keys.map((k) => hexToRgb(config[k]));

    let totalDistance = 0;
    let pairs = 0;
    for (let i = 0; i < colors.length; i++) {
        for (let j = i + 1; j < colors.length; j++) {
            totalDistance += colorDistance(colors[i], colors[j]);
            pairs++;
        }
    }
    const avgDistance = totalDistance / pairs;

    // Calculate reference distance from defaults
    const defaultColors = keys.map((k) => hexToRgb(CHROMACODE_DEFAULTS[k]));
    let refTotal = 0;
    let refPairs = 0;
    for (let i = 0; i < defaultColors.length; i++) {
        for (let j = i + 1; j < defaultColors.length; j++) {
            refTotal += colorDistance(defaultColors[i], defaultColors[j]);
            refPairs++;
        }
    }
    const refAvgDistance = refTotal / refPairs;

    // Scale so defaults = 75%, cap at 100%
    const raw = (avgDistance / refAvgDistance) * 75;
    return Math.min(100, Math.round(raw));
}

// Project Overview Types
export interface ProjectLastActiveUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
}

export interface Project {
    id: string;
    name: string;
    icon: ProjectIcon;
    createdAt: Date;
    updatedAt: Date;
    sourceCount: number;
    isShared: boolean;
    sharedBy?: string;
    owner: string;
    description?: string;
    label?: string;
    color?: string;
    starred?: boolean;
    archived?: boolean;
    lastActiveUser?: ProjectLastActiveUser;
    previewUrl?: string;
}

export interface ProjectIcon {
    type: 'emoji' | 'initials' | 'image';
    value: string;
    backgroundColor?: string;
}

export type ProjectFilter = 'all' | 'mine' | 'shared';
export type ProjectSort = 'recent' | 'name' | 'sources';
export type ProjectViewMode = 'grid' | 'list';

// Project Creation Wizard Types
export type ProjectType = 'repository' | 'files' | 'manual';
export type ProjectStatus = 'draft' | 'processing' | 'active' | 'error';
export type ChunkingStrategy = 'semantic' | 'fixed' | 'recursive' | 'custom';
export type PersonaType = 'alex' | 'maya' | 'sam';

export interface ProjectCreationStep1 {
    name: string;
    description: string;
    type: ProjectType;
}

export interface ProjectCreationFormData {
    // Step 1
    name: string;
    description: string;
    type: ProjectType;
    // Future steps will add more fields
}

export interface NameValidationResult {
    valid: boolean;
    error?: string;
    suggestion?: string;
}

export interface CheckNameResponse {
    exists: boolean;
    suggestion?: string;
}

// Workspace & Branch Types (worktree selector)
export interface Workspace {
    id: string;
    name: string;
    path: string;
    isActive: boolean;
}

export interface Branch {
    name: string;
    isDefault: boolean;
    isCurrent: boolean;
    lastCommit?: string;
}

export interface WorkspaceWithBranches extends Workspace {
    branches: Branch[];
    currentBranch: string;
}