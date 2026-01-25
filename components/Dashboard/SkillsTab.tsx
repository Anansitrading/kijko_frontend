// SkillsTab - Dashboard Tab Component for Skills Library
// Task 2_2: Skills Library UI
// Task 2_3: Create Skill Form
// Task 3_5: Analytics & Polish - Added onboarding
// Skills Library Redesign: Added CustomSkillWizard
// Layout Redesign: Unified controls bar with border like Projects/Integrations

import { useState, useCallback } from 'react';
import { Plus, Search, LayoutGrid, List, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { SkillsLibrary, CustomSkillWizard, OnboardingModal, useSkillsOnboarding } from '../Skills';
import { useSkills } from '../../hooks/useSkills';
import { useSkillsSubNavigation, type SkillsSubTabType } from '../../hooks/useSkillsSubNavigation';
import type { Skill } from '../../types/skills';

// Sub-tab configuration
const SUB_TABS: { id: SkillsSubTabType; label: string }[] = [
  { id: 'all-skills', label: 'All' },
  { id: 'my-skills', label: 'My Skills' },
  { id: 'community-skills', label: 'Community' },
];

// Sort options
const SORT_OPTIONS = [
  { id: 'most-used', label: 'Most used' },
  { id: 'recent', label: 'Recent' },
  { id: 'alphabetical', label: 'A-Z' },
] as const;

type SortOption = typeof SORT_OPTIONS[number]['id'];

export function SkillsTab() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { skills, refetch } = useSkills();
  const { activeSubTab, setActiveSubTab } = useSkillsSubNavigation();
  const { showOnboarding, dismissOnboarding } = useSkillsOnboarding();

  // Filter and sort state
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('most-used');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleCreateSkill = useCallback(() => {
    setIsWizardOpen(true);
  }, []);

  const handleSkillCreated = useCallback((skill: Skill) => {
    console.log('Skill created:', skill);
    // Refetch skills list to include the new skill
    refetch();
  }, [refetch]);

  const handleEditSkill = useCallback((skill: Skill) => {
    // Skill editing is handled through SkillDetailModal
    console.log('Edit skill:', skill.id);
  }, []);

  const handleRunSkill = useCallback((skill: Skill) => {
    // Skill running is handled through ExecuteSkillModal
    console.log('Run skill:', skill.id);
  }, []);

  const handleOnboardingClose = useCallback(() => {
    dismissOnboarding();
  }, [dismissOnboarding]);

  const handleStartWithTemplate = useCallback(() => {
    dismissOnboarding();
    setIsWizardOpen(true);
  }, [dismissOnboarding]);

  const handleStartFromScratch = useCallback(() => {
    dismissOnboarding();
    setIsWizardOpen(true);
  }, [dismissOnboarding]);

  return (
    <div
      role="tabpanel"
      id="tabpanel-skills"
      aria-labelledby="tab-skills"
      className="flex flex-col h-full"
    >
      {/* Controls Bar - with border like Projects/Integrations */}
      <div className="shrink-0 border-b border-border bg-card/30 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Sub-Tab Navigation - Pill style */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
            {SUB_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={cn(
                  'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                  activeSubTab === tab.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative w-64 hidden md:block">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={16} className="text-muted-foreground" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search skills..."
                className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-muted/50 border border-border rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded-md transition-all',
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Grid view"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5 rounded-md transition-all',
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="List view"
              >
                <List size={18} />
              </button>
            </div>

            {/* Sort Dropdown - Native select for reliability */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none px-3 py-2 pr-8 bg-muted/50 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id} className="bg-card text-foreground">
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>

            {/* Action Button */}
            <button
              onClick={handleCreateSkill}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            >
              <Plus size={18} />
              <span>Create new skill</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <SkillsLibrary
            onCreateSkill={handleCreateSkill}
            onEditSkill={handleEditSkill}
            onRunSkill={handleRunSkill}
            search={search}
            sortBy={sortBy}
            viewMode={viewMode}
          />
        </div>
      </main>

      {/* Custom Skill Wizard - 5-step skill creation */}
      <CustomSkillWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCreated={handleSkillCreated}
      />

      {/* Onboarding Modal for first-time users */}
      {showOnboarding && (
        <OnboardingModal
          onClose={handleOnboardingClose}
          onStartWithTemplate={handleStartWithTemplate}
          onStartFromScratch={handleStartFromScratch}
        />
      )}
    </div>
  );
}
