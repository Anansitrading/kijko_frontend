// ChromaCode Configuration Modal
// Allows users to configure vector embedding settings

import { useState } from 'react';
import { X, Save, Sparkles, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { ChromaCodeConfig } from '../../../types/contextInspector';

interface ChromaCodeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ChromaCodeConfig) => void;
  currentConfig: ChromaCodeConfig;
}

const DEFAULT_CONFIG: ChromaCodeConfig = {
  embeddingModel: 'text-embedding-3-small',
  chunkStrategy: 'semantic',
  chunkSize: 512,
  overlap: 50,
  excludePatterns: ['*.min.js', '*.bundle.js', 'package-lock.json'],
};

export function ChromaCodeConfigModal({
  isOpen,
  onClose,
  onSave,
  currentConfig,
}: ChromaCodeConfigModalProps) {
  const [config, setConfig] = useState<ChromaCodeConfig>(currentConfig || DEFAULT_CONFIG);
  const [newPattern, setNewPattern] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const updateConfig = <K extends keyof ChromaCodeConfig>(key: K, value: ChromaCodeConfig[K]) => {
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
        aria-labelledby="chromacode-config-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <h2
              id="chromacode-config-title"
              className="text-lg font-bold tracking-tight text-slate-100"
            >
              ChromaCode Configuration
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
          {/* Embedding Model */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Embedding Model
            </h3>
            <div className="space-y-2">
              <select
                value={config.embeddingModel}
                onChange={(e) => updateConfig('embeddingModel', e.target.value as ChromaCodeConfig['embeddingModel'])}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-blue-500 outline-none"
              >
                <option value="text-embedding-3-small">text-embedding-3-small (Recommended)</option>
                <option value="text-embedding-3-large">text-embedding-3-large (Higher quality)</option>
              </select>
              <p className="text-xs text-slate-500">
                Larger models produce higher quality embeddings but cost more.
              </p>
            </div>
          </div>

          {/* Chunk Strategy */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Chunking Strategy
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {(['sliding', 'semantic', 'paragraph'] as const).map((strategy) => (
                <button
                  key={strategy}
                  onClick={() => updateConfig('chunkStrategy', strategy)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    config.chunkStrategy === strategy
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  )}
                >
                  {strategy.charAt(0).toUpperCase() + strategy.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {config.chunkStrategy === 'sliding' && 'Fixed-size sliding window with overlap.'}
              {config.chunkStrategy === 'semantic' && 'Intelligent chunking based on code structure.'}
              {config.chunkStrategy === 'paragraph' && 'Split at natural paragraph boundaries.'}
            </p>
          </div>

          {/* Chunk Size & Overlap */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Chunk Parameters
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-medium">
                  Chunk Size (tokens)
                </label>
                <input
                  type="number"
                  value={config.chunkSize}
                  onChange={(e) => updateConfig('chunkSize', parseInt(e.target.value) || 0)}
                  min={64}
                  max={2048}
                  step={64}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-medium">
                  Overlap (tokens)
                </label>
                <input
                  type="number"
                  value={config.overlap}
                  onChange={(e) => updateConfig('overlap', parseInt(e.target.value) || 0)}
                  min={0}
                  max={config.chunkSize / 2}
                  step={10}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
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
                placeholder="e.g., *.min.js"
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

export default ChromaCodeConfigModal;
