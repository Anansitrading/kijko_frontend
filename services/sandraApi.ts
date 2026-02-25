/** Sandra API client — IDE session management and sandbox operations. */

import { apiFetch } from './api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VmSpec {
  name: string;
  label: string;
  cpu: number;
  memory_gb: number;
  disk_gb: number;
  credits_per_hour: number;
}

export const VM_SPECS: VmSpec[] = [
  { name: 'nano', label: 'Nano', cpu: 2, memory_gb: 4, disk_gb: 30, credits_per_hour: 10 },
  { name: 'small', label: 'Small', cpu: 4, memory_gb: 8, disk_gb: 50, credits_per_hour: 20 },
  { name: 'medium', label: 'Medium', cpu: 8, memory_gb: 16, disk_gb: 80, credits_per_hour: 40 },
  { name: 'large', label: 'Large', cpu: 16, memory_gb: 32, disk_gb: 150, credits_per_hour: 80 },
];

export interface CreateIdeSessionRequest {
  name: string;
  template: string;
  workspace_repo?: string;
  extensions?: string[];
  visibility: 'private' | 'public';
  project_id?: string;
  vm_spec: string;
  open_in: 'vscode-web' | 'terminal';
}

export interface IdeSession {
  id: string;
  name: string;
  status: string;
  proxy_base_url: string;
  ws_base_url: string;
  sandbox_id: string;
  created_at: string;
  checkpoint_count: number;
  visibility: string;
  project_id: string | null;
  vm_spec: string;
  open_in: string;
}

export interface ChronosSnapshot {
  id: string;
  name: string;
  created_at: string;
  parent_id: string | null;
  metadata: Record<string, unknown>;
}

export interface ChronosEvent {
  id: string;
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export async function createIdeSession(req: CreateIdeSessionRequest): Promise<IdeSession> {
  const res = await apiFetch('/ide/sessions', {
    method: 'POST',
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Failed to create IDE session: ${res.statusText}`);
  return res.json();
}

export async function getIdeSession(sessionId: string): Promise<IdeSession> {
  const res = await apiFetch(`/ide/sessions/${sessionId}`);
  if (!res.ok) throw new Error(`Session not found: ${res.statusText}`);
  return res.json();
}

export async function listIdeSessions(): Promise<IdeSession[]> {
  const res = await apiFetch('/sessions');
  if (!res.ok) throw new Error(`Failed to list sessions: ${res.statusText}`);
  const sessions = await res.json();
  // Filter to IDE sessions (those with sandbox_id and code-server running)
  return sessions;
}

export async function destroyIdeSession(sessionId: string): Promise<void> {
  const res = await apiFetch(`/sessions/${sessionId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to destroy session: ${res.statusText}`);
}

export async function captureCheckpoint(sessionId: string): Promise<void> {
  const res = await apiFetch(`/chronos/${sessionId}/capture`, { method: 'POST' });
  if (!res.ok) throw new Error(`Checkpoint failed: ${res.statusText}`);
}

export async function rewindToSnapshot(snapshotId: string): Promise<void> {
  const res = await apiFetch(`/chronos/${snapshotId}/rewind`, { method: 'POST' });
  if (!res.ok) throw new Error(`Rewind failed: ${res.statusText}`);
}

export async function forkFromSnapshot(snapshotId: string, count: number = 1): Promise<IdeSession[]> {
  const res = await apiFetch(`/chronos/${snapshotId}/fork`, {
    method: 'POST',
    body: JSON.stringify({ count }),
  });
  if (!res.ok) throw new Error(`Fork failed: ${res.statusText}`);
  return res.json();
}

export async function getTimeline(sessionId: string): Promise<ChronosSnapshot[]> {
  const res = await apiFetch(`/scrubber/${sessionId}/timeline`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data.snapshots ?? []);
}
