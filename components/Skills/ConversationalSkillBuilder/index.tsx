// Conversational Skill Builder
// Main container with 3-panel layout for building skills through conversation

import { useEffect, useCallback, useState } from 'react';
import { X, Sparkles, Loader2, Code, Workflow } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useSkillBuilder } from '../../../hooks/useSkillBuilder';
import { SkillChat } from './SkillChat';
import { YamlPreview } from './YamlPreview';
import { MarkdownPreview } from './MarkdownPreview';
import { SkillFlowDiagram } from './SkillFlowDiagram';
import type { Skill } from '../../../types/skills';

type PreviewTab = 'code' | 'flow';

interface ConversationalSkillBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (skill: Skill) => void;
}

export function ConversationalSkillBuilder({
  isOpen,
  onClose,
  onCreated,
}: ConversationalSkillBuilderProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>('code');
  const {
    state,
    sendMessage,
    approveConfig,
    rejectConfig,
    createSkill,
    reset,
    canCreateSkill,
  } = useSkillBuilder();

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Handle skill creation
  const handleCreateSkill = useCallback(async () => {
    const skillData = createSkill();
    if (!skillData) return;

    // TODO: Call API to save skill
    // For now, we'll create a mock skill object
    const mockSkill: Skill = {
      id: `skill_${Date.now()}`,
      userId: 'current-user',
      name: skillData.name,
      description: skillData.description,
      category: 'custom',
      promptTemplate: skillData.content,
      model: 'claude-3-5-sonnet-20241022',
      parameters: {},
      outputFormat: 'markdown',
      isActive: true,
      executionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onCreated?.(mockSkill);
    onClose();
  }, [createSkill, onCreated, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={cn(
          'relative w-[95vw] h-[90vh] max-w-[1600px]',
          'bg-card border border-border rounded-xl',
          'flex flex-col overflow-hidden',
          'shadow-2xl'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles size={20} className="text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Create New Skill
              </h2>
              <p className="text-sm text-muted-foreground">
                Build your skill through conversation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Preview Tab Switcher */}
            <div className="flex items-center rounded-lg border border-border bg-secondary/50 p-0.5">
              <button
                onClick={() => setActiveTab('code')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
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
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  activeTab === 'flow'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Workflow size={14} />
                Flow
              </button>
            </div>

            {/* Create Skill Button */}
            <button
              onClick={handleCreateSkill}
              disabled={!canCreateSkill || state.isLoading}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                'transition-colors',
                canCreateSkill && !state.isLoading
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {state.isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Create Skill
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="Close (ESC)"
            >
              <X size={20} />
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
    </div>
  );
}

export default ConversationalSkillBuilder;
