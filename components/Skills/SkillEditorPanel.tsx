// SkillEditorPanel Component
// Inline skill editor with 3-panel layout (Chat | YAML + Markdown)
// Used for both viewing/editing existing skills and creating new ones

import { useEffect, useCallback, useState } from 'react';
import { Zap, Save, Loader2, Play, RotateCcw, Code, Workflow, Globe, FolderOpen } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useSkillBuilder } from '../../hooks/useSkillBuilder';
import { SkillChat } from './ConversationalSkillBuilder/SkillChat';
import { YamlPreview } from './ConversationalSkillBuilder/YamlPreview';
import { MarkdownPreview } from './ConversationalSkillBuilder/MarkdownPreview';
import { SkillFlowDiagram } from './ConversationalSkillBuilder/SkillFlowDiagram';
import type { Skill } from '../../types/skills';
import type { SkillDraft } from '../../types/skillDraft';

type PreviewTab = 'code' | 'flow';

interface SkillEditorPanelProps {
  skill: Skill | null;
  onSave?: (skill: Skill) => void;
  onRun?: (skill: Skill) => void;
  className?: string;
}

/**
 * Convert a Skill to SkillDraft format for the editor
 */
function skillToDraft(skill: Skill): Partial<SkillDraft> {
  return {
    name: skill.name,
    description: skill.description || '',
    dependencies: [],
    trigger: 'pre-tool',
    scope: 'local',
    tags: [],
    instructions: skill.promptTemplate || '',
  };
}

export function SkillEditorPanel({
  skill,
  onSave,
  onRun,
  className,
}: SkillEditorPanelProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>('code');
  const {
    state,
    sendMessage,
    approveConfig,
    rejectConfig,
    updateDraft,
    createSkill,
    reset,
    loadSkill,
    canCreateSkill,
  } = useSkillBuilder();

  // Load skill into editor when skill changes
  useEffect(() => {
    if (skill) {
      loadSkill(skillToDraft(skill));
    } else {
      reset();
    }
  }, [skill?.id]); // Only reload when skill ID changes

  // Handle save
  const handleSave = useCallback(() => {
    if (!skill || !canCreateSkill) return;

    const skillData = createSkill();
    if (!skillData) return;

    // Create updated skill object
    const updatedSkill: Skill = {
      ...skill,
      name: skillData.name,
      description: skillData.description,
      promptTemplate: skillData.content,
      updatedAt: new Date(),
    };

    onSave?.(updatedSkill);
  }, [skill, createSkill, canCreateSkill, onSave]);

  // Handle run
  const handleRun = useCallback(() => {
    if (skill) {
      onRun?.(skill);
    }
  }, [skill, onRun]);

  // Handle reset
  const handleReset = useCallback(() => {
    if (skill) {
      loadSkill(skillToDraft(skill));
    }
  }, [skill, loadSkill]);

  if (!skill) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="text-center">
          <div className="p-4 bg-muted/50 rounded-2xl mb-4 inline-block">
            <Zap size={48} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Select a skill
          </h2>
          <p className="text-muted-foreground max-w-md">
            Choose a skill from the sidebar to view its details, edit it, or run it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {skill.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {skill.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>

          {/* Scope Selector */}
          <div className="flex items-center rounded-lg border border-border bg-secondary/50 p-0.5 ml-4">
            <button
              onClick={() => updateDraft({ scope: 'global' })}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium transition-colors',
                state.draft.scope === 'global'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Available in all projects"
            >
              <Globe size={14} />
              Global
            </button>
            <button
              onClick={() => updateDraft({ scope: 'local' })}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium transition-colors',
                state.draft.scope === 'local'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Only for current project"
            >
              <FolderOpen size={14} />
              Project
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview Tab Switcher */}
          <div className="flex items-center rounded-lg border border-border bg-secondary/50 p-0.5 mr-2">
            <button
              onClick={() => setActiveTab('code')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium transition-colors',
                activeTab === 'code'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Code size={14} />
              Code
            </button>
            <button
              onClick={() => setActiveTab('flow')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium transition-colors',
                activeTab === 'flow'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Workflow size={14} />
              Flow
            </button>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            title="Reset changes"
          >
            <RotateCcw size={16} />
          </button>

          {/* Run Button */}
          <button
            onClick={handleRun}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <Play size={16} />
            Run
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!canCreateSkill || state.isLoading}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              canCreateSkill && !state.isLoading
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {state.isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat (60%) */}
        <div className="w-[60%] h-full p-4 border-r border-border">
          <SkillChat
            messages={state.messages}
            isLoading={state.isLoading}
            isStreaming={state.isStreaming}
            error={state.error}
            onSendMessage={sendMessage}
            onApproveConfig={approveConfig}
            onRejectConfig={rejectConfig}
            className="h-full"
            mode="edit"
            skillName={skill.name}
          />
        </div>

        {/* Right Panel - Previews (40%) */}
        <div className="w-[40%] h-full flex flex-col p-4 gap-4">
          {activeTab === 'code' ? (
            <>
              {/* YAML Preview (Top) */}
              <YamlPreview draft={state.draft} className="flex-1" />

              {/* Markdown Preview (Bottom) */}
              <MarkdownPreview draft={state.draft} className="flex-1" />
            </>
          ) : (
            /* Flow Diagram - Full height */
            <div className="flex-1 border border-border rounded-lg overflow-hidden">
              <SkillFlowDiagram draft={state.draft} className="h-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SkillEditorPanel;
