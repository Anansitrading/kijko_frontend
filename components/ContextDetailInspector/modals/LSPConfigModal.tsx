// LSP Configuration Modal
// Allows users to configure Language Server Protocol settings

import { useState } from 'react';
import { X, Save, Code, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { LSPConfig } from '../../../types/contextInspector';

interface LSPConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: LSPConfig) => void;
  currentConfig: LSPConfig;
}

const DEFAULT_CONFIG: LSPConfig = {
  enableGoToDefinition: true,
  enableAutoCompletion: true,
  enableTypeInference: true,
  excludePatterns: ['node_modules/**', 'dist/**', '.git/**'],
  maxFileSize: 1024, // KB
};

export function LSPConfigModal({
  isOpen,
  onClose,
  onSave,
  currentConfig,
}: LSPConfigModalProps) {
  const [config, setConfig] = useState<LSPConfig>(currentConfig || DEFAULT_CONFIG);
  const [newPattern, setNewPattern] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const updateConfig = <K extends keyof LSPConfig>(key: K, value: LSPConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const addPattern = () => {
    if (newPattern.trim() && !config.excludePatterns.includes(newPattern.trim())) {
      updateConfig('excludePatterns', [...config.excludePatterns, newPattern.trim()]);
      setNewPattern('');
    }
  };

  const removePattern = (pattern: string) => {
    updateConfig(
      'excludePatterns',
      config.excludePatterns.filter(p => p !== pattern)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700 shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lsp-config-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10">
              <Code className="w-4 h-4 text-emerald-400" />
            </div>
            <h2
              id="lsp-config-title"
              className="text-lg font-bold tracking-tight text-slate-100"
            >
              Language Server Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Feature Toggles */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Features
            </h3>
            <div className="space-y-3">
              <ToggleOption
                label="Go to Definition"
                description="Navigate to symbol definitions"
                checked={config.enableGoToDefinition}
                onChange={(checked) => updateConfig('enableGoToDefinition', checked)}
              />
              <ToggleOption
                label="Auto Completion"
                description="Provide code completion suggestions"
                checked={config.enableAutoCompletion}
                onChange={(checked) => updateConfig('enableAutoCompletion', checked)}
              />
              <ToggleOption
                label="Type Inference"
                description="Infer types from context"
                checked={config.enableTypeInference}
                onChange={(checked) => updateConfig('enableTypeInference', checked)}
              />
            </div>
          </div>

          {/* Max File Size */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Max File Size
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={config.maxFileSize}
                onChange={(e) => updateConfig('maxFileSize', parseInt(e.target.value) || 0)}
                min={0}
                max={10240}
                className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-blue-500 outline-none"
              />
              <span className="text-sm text-slate-400">KB</span>
            </div>
            <p className="text-xs text-slate-500">
              Files larger than this will be skipped during indexing.
            </p>
          </div>

          {/* Exclude Patterns */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Exclude Patterns
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPattern()}
                placeholder="e.g., **/*.test.ts"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 outline-none"
              />
              <button
                onClick={addPattern}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                aria-label="Add pattern"
              >
                <Plus size={16} className="text-slate-300" />
              </button>
            </div>
            <div className="space-y-2">
              {config.excludePatterns.map((pattern) => (
                <div
                  key={pattern}
                  className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-lg group"
                >
                  <code className="text-sm text-slate-300 font-mono">{pattern}</code>
                  <button
                    onClick={() => removePattern(pattern)}
                    className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label={`Remove ${pattern}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-800/30 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Toggle Option Component
// ============================================

interface ToggleOptionProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleOption({ label, description, checked, onChange }: ToggleOptionProps) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer group">
      <div>
        <p className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">
          {label}
        </p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
      />
    </label>
  );
}

export default LSPConfigModal;
