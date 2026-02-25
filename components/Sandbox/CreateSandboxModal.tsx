/** Create Sandbox modal — CodeSandbox-style configuration screen. */

import { useState } from 'react';
import { X, Monitor, Terminal, Lock, Globe, GitBranch } from 'lucide-react';
import { cn } from '../../utils/cn';
import { createIdeSession, VM_SPECS, type IdeSession, type VmSpec } from '../../services/sandraApi';
import { useProjects } from '../../contexts/ProjectsContext';

interface CreateSandboxModalProps {
  onClose: () => void;
  onCreated: (session: IdeSession) => void;
}

const TEMPLATES = [
  { id: 'sandra-ubuntu24-claude', label: 'Ubuntu 24.04 + Claude', description: 'Full dev environment with Claude Code pre-installed' },
  { id: 'sandra-ubuntu24-claude-8cpu', label: 'Ubuntu 24.04 + Claude (8 CPU)', description: 'High-performance sandbox for large projects' },
];

interface RuntimeOption {
  id: string;
  label: string;
  description: string;
  icon: typeof Monitor;
  disabled?: boolean;
  note?: string;
}

const RUNTIME_OPTIONS: RuntimeOption[] = [
  { id: 'devbox', label: 'Devbox', description: 'Ideal for any type of project, language or size. Runs on a server.', icon: Monitor },
  { id: 'sandbox', label: 'Sandbox', description: 'Ideal for prototyping and sharing code snippets. Runs in the browser.', icon: Terminal, disabled: true, note: 'Not available for this template.' },
];

function generateName(): string {
  const adjectives = ['swift', 'bold', 'calm', 'keen', 'warm', 'cool', 'bright', 'quiet', 'vivid', 'gentle'];
  const nouns = ['falcon', 'river', 'storm', 'flame', 'pine', 'coral', 'dawn', 'frost', 'ember', 'brook'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}-${noun}`;
}

export function CreateSandboxModal({ onClose, onCreated }: CreateSandboxModalProps) {
  const { projects } = useProjects();
  const [name, setName] = useState(generateName());
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [projectId, setProjectId] = useState<string>('');
  const [runtime, setRuntime] = useState('devbox');
  const [vmSpec, setVmSpec] = useState('small');
  const [openIn, setOpenIn] = useState<'vscode-web' | 'terminal'>('vscode-web');
  const [template, setTemplate] = useState(TEMPLATES[0].id);
  const [repoUrl, setRepoUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSpec = VM_SPECS.find((s) => s.name === vmSpec) ?? VM_SPECS[1];

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const session = await createIdeSession({
        name,
        template,
        workspace_repo: repoUrl || undefined,
        visibility,
        project_id: projectId || undefined,
        vm_spec: vmSpec,
        open_in: openIn,
      });
      onCreated(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create sandbox');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
              <Monitor size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Configure</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Name */}
          <Field label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="my-sandbox"
              autoFocus
            />
          </Field>

          {/* Visibility + Project (side by side) */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Visibility">
              <div className="relative">
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as 'private' | 'public')}
                  className="w-full appearance-none px-3 py-2.5 pr-10 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="private">Private (only workspace members)</option>
                  <option value="public">Public</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  {visibility === 'private' ? <Lock size={14} /> : <Globe size={14} />}
                </div>
              </div>
            </Field>

            <Field label="Project">
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Git Repo (optional) */}
          <Field label="Repository (optional)">
            <div className="relative">
              <GitBranch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/org/repo"
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </Field>

          {/* Runtime */}
          <Field label="Runtime">
            <div className="grid grid-cols-2 gap-3">
              {RUNTIME_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => !opt.disabled && setRuntime(opt.id)}
                    disabled={opt.disabled}
                    className={cn(
                      'flex flex-col items-start gap-1 p-4 rounded-xl border-2 transition-all text-left',
                      runtime === opt.id
                        ? 'border-primary bg-primary/5'
                        : opt.disabled
                          ? 'border-border opacity-50 cursor-not-allowed'
                          : 'border-border hover:border-primary/40 cursor-pointer'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={16} className={runtime === opt.id ? 'text-primary' : 'text-muted-foreground'} />
                      <span className="font-semibold text-foreground text-sm">{opt.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      {opt.description}
                    </span>
                    {opt.disabled && opt.note && (
                      <span className="text-xs text-amber-500 mt-1">{opt.note}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* VM Specs */}
          <Field label="VM specs">
            <select
              value={vmSpec}
              onChange={(e) => setVmSpec(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {VM_SPECS.map((spec) => (
                <option key={spec.name} value={spec.name}>
                  {spec.label} ({spec.cpu} vCPUs, {spec.memory_gb} GiB RAM, {spec.disk_gb} GB Disk for {spec.credits_per_hour} credits/hour)
                </option>
              ))}
            </select>
          </Field>

          {/* Open in */}
          <Field label="Open in">
            <select
              value={openIn}
              onChange={(e) => setOpenIn(e.target.value as 'vscode-web' | 'terminal')}
              className="w-full appearance-none px-3 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="vscode-web">VS Code for the web</option>
              <option value="terminal">Terminal only</option>
            </select>
          </Field>

          {error && (
            <div className="px-4 py-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            {selectedSpec.cpu} vCPUs, {selectedSpec.memory_gb} GiB RAM
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-foreground hover:bg-muted rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className={cn(
                'px-5 py-2.5 rounded-lg font-medium transition-colors',
                creating || !name.trim()
                  ? 'bg-primary/50 text-primary-foreground/50 cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {creating ? 'Creating...' : 'Create Devbox'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}
