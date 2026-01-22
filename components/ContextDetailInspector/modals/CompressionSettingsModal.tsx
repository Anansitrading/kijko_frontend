// Compression Settings Modal
// Allows users to configure compression behavior

import { useState } from 'react';
import { X, Save, Zap } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { CompressionSettings } from '../../../types/contextInspector';

interface CompressionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: CompressionSettings) => void;
  currentSettings: CompressionSettings;
}

const DEFAULT_SETTINGS: CompressionSettings = {
  method: 'hypervisa',
  preserveStructure: true,
  preserveTypes: true,
  preserveExports: true,
  preserveDocs: false,
  optimizationLevel: 'medium',
};

export function CompressionSettingsModal({
  isOpen,
  onClose,
  onSave,
  currentSettings,
}: CompressionSettingsModalProps) {
  const [settings, setSettings] = useState<CompressionSettings>(
    currentSettings || DEFAULT_SETTINGS
  );

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const updateSetting = <K extends keyof CompressionSettings>(
    key: K,
    value: CompressionSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700 shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compression-settings-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10">
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <h2
              id="compression-settings-title"
              className="text-lg font-bold tracking-tight text-slate-100"
            >
              Compression Settings
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
          {/* Compression Method */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Compression Method
            </h3>
            <div className="space-y-2">
              <select
                value={settings.method}
                onChange={(e) => updateSetting('method', e.target.value as CompressionSettings['method'])}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-blue-500 outline-none"
              >
                <option value="hypervisa">HyperVISA (Recommended)</option>
                <option value="standard">Standard Compression</option>
              </select>
              <p className="text-xs text-slate-500">
                HyperVISA uses advanced semantic compression for better results.
              </p>
            </div>
          </div>

          {/* Preservation Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Preservation Options
            </h3>
            <div className="space-y-3">
              <ToggleOption
                label="Preserve Structure"
                description="Maintain file and folder hierarchy"
                checked={settings.preserveStructure}
                onChange={(checked) => updateSetting('preserveStructure', checked)}
              />
              <ToggleOption
                label="Preserve Types"
                description="Keep TypeScript type annotations"
                checked={settings.preserveTypes}
                onChange={(checked) => updateSetting('preserveTypes', checked)}
              />
              <ToggleOption
                label="Preserve Exports"
                description="Maintain export statements"
                checked={settings.preserveExports}
                onChange={(checked) => updateSetting('preserveExports', checked)}
              />
              <ToggleOption
                label="Preserve Documentation"
                description="Keep JSDoc comments and documentation"
                checked={settings.preserveDocs}
                onChange={(checked) => updateSetting('preserveDocs', checked)}
              />
            </div>
          </div>

          {/* Optimization Level */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Optimization Level
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => updateSetting('optimizationLevel', level)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    settings.optimizationLevel === level
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  )}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Higher optimization means smaller output but longer processing time.
            </p>
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

export default CompressionSettingsModal;
