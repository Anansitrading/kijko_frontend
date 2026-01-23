// ModelSelect component - AI Model dropdown
// Setting Sprint 3: General Settings

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Bot } from 'lucide-react';
import { useSettings } from '../../../contexts/SettingsContext';
import { useAutoSave } from '../../../hooks/useAutoSave';
import { AI_MODELS } from '../../../types/settings';
import type { AIModel } from '../../../types/settings';
import SettingsRow from '../SettingsRow';

export function ModelSelect() {
  const { getAIModel } = useSettings();
  const { save } = useAutoSave();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModel = getAIModel();
  const currentModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (modelId: AIModel) => {
    save('ai_model', modelId, true);
    setIsOpen(false);
  };

  return (
    <SettingsRow
      label="AI Model"
      description="Select the AI model used for analysis and chat features"
    >
      <div className="relative" ref={dropdownRef}>
        {/* Selected value button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 min-w-[200px] bg-secondary border border-border rounded-lg text-foreground text-sm transition-colors duration-200 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <Bot size={16} className="text-primary" />
          <span className="flex-1 text-left">{currentModel.name}</span>
          <span className="text-xs text-muted-foreground">{currentModel.provider}</span>
          <ChevronDown
            size={16}
            className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown menu - positioned to open upward and align right */}
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-1 w-full min-w-[280px] max-h-[300px] overflow-y-auto bg-card border border-border rounded-lg shadow-lg z-50">
            {AI_MODELS.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => handleSelect(model.id)}
                className={`w-full flex items-start gap-3 px-3 py-3 text-left transition-colors duration-150 ${selectedModel === model.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
              >
                <Bot
                  size={18}
                  className={selectedModel === model.id ? 'text-primary' : 'text-muted-foreground'}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${selectedModel === model.id ? 'text-primary' : 'text-foreground'}`}>
                      {model.name}
                    </span>
                    <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                      {model.provider}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {model.description}
                  </p>
                </div>
                {selectedModel === model.id && (
                  <span className="text-primary text-sm">&#10003;</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </SettingsRow>
  );
}

export default ModelSelect;
