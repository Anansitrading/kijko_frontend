// SkillsCategorySidebar Component - Sidebar with skills grouped by category
// Shows skills in collapsible category sections

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Zap } from 'lucide-react';
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
}

interface CategorySectionProps {
  category: SkillCategory;
  skills: Skill[];
  selectedSkillId: string | null;
  onSelectSkill: (skill: Skill) => void;
  defaultExpanded?: boolean;
}

function CategorySection({
  category,
  skills,
  selectedSkillId,
  onSelectSkill,
  defaultExpanded = true,
}: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (skills.length === 0) return null;

  return (
    <div className="mb-1">
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted/50 rounded-md transition-colors"
      >
        {isExpanded ? (
          <ChevronDown size={14} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
        )}
        <span className="flex-1 text-left">{CATEGORY_LABELS[category]}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{skills.length}</span>
      </button>

      {/* Skills List */}
      {isExpanded && (
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
      )}
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

    // Sort skills within each category by execution count (most used first)
    for (const category of Object.keys(grouped) as SkillCategory[]) {
      grouped[category]!.sort((a, b) => b.executionCount - a.executionCount);
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
    <aside className="w-64 shrink-0 overflow-y-auto">
      <div className="py-2">
        {/* Skills count header */}
        <div className="px-2 py-1.5 mb-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {skills.length} {skills.length === 1 ? 'Skill' : 'Skills'}
          </p>
        </div>

        {/* Category sections */}
        {CATEGORY_ORDER.map((category) => (
          <CategorySection
            key={category}
            category={category}
            skills={skillsByCategory[category] || []}
            selectedSkillId={selectedSkillId}
            onSelectSkill={onSelectSkill}
          />
        ))}
      </div>
    </aside>
  );
}

export default SkillsCategorySidebar;
