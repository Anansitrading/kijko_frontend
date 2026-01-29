// SkillsCategorySidebar Component - Sidebar with skills grouped by category
// Shows skills in collapsible category sections

import { useMemo } from 'react';
import { Zap, FileEdit } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Skill, SkillCategory } from '../../types/skills';

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  analysis: 'Analysis',
  generation: 'Generation',
  transformation: 'Transformation',
  communication: 'Communication',
  automation: 'Automation',
  custom: 'Custom',
};

const CATEGORY_ORDER: SkillCategory[] = [
  'analysis',
  'generation',
  'transformation',
  'communication',
  'automation',
  'custom',
];

interface SkillsCategorySidebarProps {
  skills: Skill[];
  selectedSkillId: string | null;
  onSelectSkill: (skill: Skill) => void;
  onRunSkill: (skill: Skill) => void;
  loading?: boolean;
  isCreatingDraft?: boolean;
  onSelectDraft?: () => void;
}

interface CategorySectionProps {
  category: SkillCategory;
  skills: Skill[];
  selectedSkillId: string | null;
  onSelectSkill: (skill: Skill) => void;
}

function CategorySection({
  category,
  skills,
  selectedSkillId,
  onSelectSkill,
}: CategorySectionProps) {
  if (skills.length === 0) return null;

  return (
    <div className="mb-1">
      {/* Category Header */}
      <div className="px-2 py-1.5 text-sm font-medium text-foreground">
        {CATEGORY_LABELS[category]}
      </div>

      {/* Skills List */}
      <div className="ml-4 mt-0.5 space-y-0.5">
        {skills.map((skill) => (
          <SkillItem
            key={skill.id}
            skill={skill}
            isSelected={selectedSkillId === skill.id}
            onSelect={onSelectSkill}
          />
        ))}
      </div>
    </div>
  );
}

interface SkillItemProps {
  skill: Skill;
  isSelected: boolean;
  onSelect: (skill: Skill) => void;
}

function SkillItem({ skill, isSelected, onSelect }: SkillItemProps) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all',
        isSelected
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
        !skill.isActive && 'opacity-50'
      )}
      onClick={() => onSelect(skill)}
    >
      <Zap size={14} className={cn('shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} />
      <span className="flex-1 text-sm truncate">{skill.name}</span>
    </div>
  );
}

function SkillItemSkeleton() {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <div className="w-3.5 h-3.5 bg-muted rounded animate-pulse" />
      <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
    </div>
  );
}

export function SkillsCategorySidebar({
  skills,
  selectedSkillId,
  onSelectSkill,
  onRunSkill: _onRunSkill,
  loading = false,
  isCreatingDraft = false,
  onSelectDraft,
}: SkillsCategorySidebarProps) {
  // Note: onRunSkill kept in props for API compatibility but not used in sidebar
  void _onRunSkill;
  // Group skills by category
  const skillsByCategory = useMemo(() => {
    const grouped: Partial<Record<SkillCategory, Skill[]>> = {};

    for (const skill of skills) {
      if (!grouped[skill.category]) {
        grouped[skill.category] = [];
      }
      grouped[skill.category]!.push(skill);
    }

    // Sort skills within each category by star count (most starred first)
    for (const category of Object.keys(grouped) as SkillCategory[]) {
      grouped[category]!.sort((a, b) => (b.starCount ?? 0) - (a.starCount ?? 0));
    }

    return grouped;
  }, [skills]);

  // Loading state
  if (loading) {
    return (
      <aside className="w-64 shrink-0 overflow-y-auto">
        <div className="py-2">
          <div className="px-2 py-1.5 mb-2">
            <div className="h-5 w-24 bg-muted rounded animate-pulse" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-3">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <div className="w-3.5 h-3.5 bg-muted rounded animate-pulse" />
                <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
              </div>
              <div className="ml-4 space-y-0.5">
                <SkillItemSkeleton />
                <SkillItemSkeleton />
              </div>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  // Empty state
  if (skills.length === 0) {
    return (
      <aside className="w-64 shrink-0">
        <div className="py-4 px-2">
          <p className="text-sm text-muted-foreground text-center">
            No skills yet
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 shrink-0 h-full overflow-y-auto pr-4">
      <div className="py-2">
        {/* Draft/Concept item when creating new skill */}
        {isCreatingDraft && (
          <div className="px-2 mb-3">
            <div
              onClick={onSelectDraft}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all',
                'bg-amber-500/10 text-amber-500 border border-amber-500/30'
              )}
            >
              <FileEdit size={14} className="shrink-0" />
              <span className="flex-1 text-sm font-medium">Concept</span>
              <span className="text-xs opacity-70">draft</span>
            </div>
          </div>
        )}

        {/* Skills count header */}
        <div className="px-2 py-1.5 mb-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            My Skills ({skills.length})
          </div>
        </div>

        {/* Category sections */}
        {CATEGORY_ORDER.map((category) => (
          <CategorySection
            key={category}
            category={category}
            skills={skillsByCategory[category] || []}
            selectedSkillId={isCreatingDraft ? null : selectedSkillId}
            onSelectSkill={onSelectSkill}
          />
        ))}
      </div>
    </aside>
  );
}

export default SkillsCategorySidebar;
