/**
 * Persona Override Component
 * Sprint PC6: Allow users to manually switch persona/flow
 */

import React from 'react';
import { Settings2, User, Users, Code } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { PersonaType } from '@/types/project';
import { PERSONA_CONFIGS } from '@/types/project';
import { trackPersonaOverride } from '@/services/analytics';

interface PersonaOverrideProps {
  currentPersona: PersonaType;
  showAllOptions: boolean;
  onPersonaChange: (persona: PersonaType) => void;
  onShowAllOptionsChange: (enabled: boolean) => void;
  className?: string;
  compact?: boolean;
}

const PERSONA_ICONS: Record<PersonaType, React.ReactNode> = {
  alex: <User className="w-4 h-4" />,
  maya: <Users className="w-4 h-4" />,
  sam: <Code className="w-4 h-4" />
};

export function PersonaOverride({
  currentPersona,
  showAllOptions,
  onPersonaChange,
  onShowAllOptionsChange,
  className,
  compact = false
}: PersonaOverrideProps) {
  const handlePersonaChange = (persona: PersonaType) => {
    trackPersonaOverride(currentPersona, persona);
    onPersonaChange(persona);
  };

  const handleShowAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onShowAllOptionsChange(e.target.checked);
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showAllOptions}
            onChange={handleShowAllChange}
            className="rounded border-border"
          />
          <span className="text-sm text-muted-foreground">
            Show all options
          </span>
        </label>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Show All Options Toggle */}
      <div className="p-4 rounded-lg border border-border bg-muted/30">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-muted">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <span className="text-sm font-medium text-foreground">
                Show all options
              </span>
              <p className="text-xs text-muted-foreground">
                See all wizard steps regardless of your persona
              </p>
            </div>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={showAllOptions}
              onChange={handleShowAllChange}
              className="sr-only peer"
            />
            <div className={cn(
              'w-11 h-6 rounded-full transition-colors',
              'bg-muted peer-checked:bg-primary',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50'
            )} />
            <div className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm',
              'transition-transform peer-checked:translate-x-5'
            )} />
          </div>
        </label>
      </div>

      {/* Persona Selector */}
      {!showAllOptions && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            Your workflow
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            We've detected your usage pattern. Switch if you need different features.
          </p>
          <div className="grid gap-2">
            {(Object.keys(PERSONA_CONFIGS) as PersonaType[]).map((persona) => {
              const config = PERSONA_CONFIGS[persona];
              const isSelected = currentPersona === persona;

              return (
                <button
                  key={persona}
                  onClick={() => handlePersonaChange(persona)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg text-left',
                    'border transition-all',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30 hover:bg-muted/50'
                  )}
                >
                  <div className={cn(
                    'p-2 rounded-md transition-colors',
                    isSelected
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {PERSONA_ICONS[persona]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-sm font-medium',
                        isSelected ? 'text-primary' : 'text-foreground'
                      )}>
                        {config.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {config.title}
                      </span>
                      {isSelected && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {config.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Info note */}
      <p className="text-xs text-muted-foreground">
        Changing your workflow doesn't affect analytics attribution.
      </p>
    </div>
  );
}

export { PersonaOverride as default };
