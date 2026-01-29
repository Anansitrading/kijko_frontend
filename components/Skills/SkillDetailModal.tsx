// SkillDetailModal Component - View/Edit skill details with tabs
// Task 2_4: Skill Detail & Edit
// Task 3_5: Analytics & Polish - Added Stats tab

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Pencil, Trash2, Clock, Zap, History, FileText, BarChart2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { SkillForm } from './SkillForm';
import { SkillOverviewTab } from './SkillOverviewTab';
import { SkillHistoryTab } from './SkillHistoryTab';
import { SkillHabitsTab } from './SkillHabitsTab';
import { SkillReflexesTab } from './SkillReflexesTab';
import { SkillStats } from './SkillStats';
import { DeleteSkillDialog } from './DeleteSkillDialog';
import type { SkillFormValues } from '../../lib/skillValidation';
import type { Skill, SkillCategory, SkillOutputFormat } from '../../types/skills';

type TabId = 'overview' | 'stats' | 'habits' | 'reflexes' | 'history';

interface TabConfig {
  id: TabId;
  label: string;
  icon: typeof FileText;
}

const TABS: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'stats', label: 'Stats', icon: BarChart2 },
  { id: 'habits', label: 'Habits', icon: Clock },
  { id: 'reflexes', label: 'Reflexes', icon: Zap },
  { id: 'history', label: 'History', icon: History },
];

interface SkillDetailModalProps {
  skill: Skill;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (skill: Skill) => void;
  onDeleted: () => void;
}

export function SkillDetailModal({
  skill,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
}: SkillDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when skill changes
  useEffect(() => {
    setActiveTab('overview');
    setIsEditMode(false);
    setError(null);
  }, [skill.id]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isEditMode && !showDeleteDialog) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEditMode, showDeleteDialog, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  // Handle edit submission
  const handleEditSubmit = useCallback(
    async (values: SkillFormValues) => {
      setIsUpdating(true);
      setError(null);

      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/skills/${skill.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(values),
        // });

        await new Promise((resolve) => setTimeout(resolve, 500));

        const updatedSkill: Skill = {
          ...skill,
          name: values.name,
          description: values.description || undefined,
          category: values.category as SkillCategory,
          promptTemplate: values.promptTemplate,
          model: values.model,
          parameters: {
            temperature: values.temperature,
            max_tokens: values.maxTokens,
          },
          outputFormat: values.outputFormat as SkillOutputFormat,
          isActive: values.isActive,
          updatedAt: new Date(),
        };

        onUpdated(updatedSkill);
        setIsEditMode(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update skill');
      } finally {
        setIsUpdating(false);
      }
    },
    [skill, onUpdated]
  );

  // Handle delete
  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/skills/${skill.id}`, { method: 'DELETE' });

      await new Promise((resolve) => setTimeout(resolve, 500));

      setShowDeleteDialog(false);
      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete skill');
      setIsDeleting(false);
    }
  }, [onDeleted, onClose]);

  if (!isOpen) return null;

  // Convert skill to form values for editing
  const initialFormValues: Partial<SkillFormValues> = {
    name: skill.name,
    description: skill.description || '',
    category: skill.category,
    promptTemplate: skill.promptTemplate,
    model: skill.model,
    temperature: skill.parameters.temperature ?? 0.7,
    maxTokens: skill.parameters.max_tokens ?? 4096,
    outputFormat: skill.outputFormat,
    isActive: skill.isActive,
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="skill-detail-title"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={isEditMode ? undefined : onClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <div
          ref={modalRef}
          className={cn(
            'relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden',
            'bg-card border border-border rounded-xl shadow-2xl',
            'flex flex-col',
            'animate-in fade-in-0 zoom-in-95 duration-200'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <h2
              id="skill-detail-title"
              className="text-lg font-semibold text-foreground truncate"
            >
              {isEditMode ? `Edit: ${skill.name}` : skill.name}
            </h2>
            <div className="flex items-center gap-2">
              {!isEditMode && (
                <>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    title="Edit skill"
                  >
                    <Pencil size={14} />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    title="Delete skill"
                  >
                    <Trash2 size={14} />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </>
              )}
              <button
                onClick={isEditMode ? () => setIsEditMode(false) : onClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors ml-2"
                aria-label={isEditMode ? 'Cancel edit' : 'Close'}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="px-6 py-3 bg-destructive/10 border-b border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {isEditMode ? (
            /* Edit Mode - Form */
            <div className="flex-1 overflow-y-auto p-6">
              <SkillForm
                initialValues={initialFormValues}
                onSubmit={handleEditSubmit}
                onCancel={() => setIsEditMode(false)}
                submitLabel="Save Changes"
                isLoading={isUpdating}
                existingSkill={skill}
              />
            </div>
          ) : (
            <>
              {/* Tabs Navigation */}
              <div className="px-6 pt-4 border-b border-border shrink-0">
                <div className="flex items-center gap-1" role="tablist">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`tabpanel-${tab.id}`}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors',
                          'border-b-2 -mb-px',
                          isActive
                            ? 'text-foreground border-primary bg-primary/5'
                            : 'text-muted-foreground hover:text-foreground border-transparent hover:border-border/50'
                        )}
                      >
                        <Icon size={14} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'overview' && (
                  <SkillOverviewTab skill={skill} />
                )}
                {activeTab === 'stats' && <SkillStats skillId={skill.id} />}
                {activeTab === 'habits' && <SkillHabitsTab skillId={skill.id} />}
                {activeTab === 'reflexes' && <SkillReflexesTab skillId={skill.id} />}
                {activeTab === 'history' && <SkillHistoryTab skillId={skill.id} />}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteSkillDialog
        skill={skill}
        isOpen={showDeleteDialog}
        isDeleting={isDeleting}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
