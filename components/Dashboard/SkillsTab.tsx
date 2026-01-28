// SkillsTab - Dashboard Tab Component for Skills Library
// Task 2_2: Skills Library UI
// Task 2_3: Create Skill Form
// Task 3_5: Analytics & Polish - Added onboarding
// Layout Redesign: Skills shown in sidebar grouped by category
// New: Inline skill editor with chat interface

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { cn } from '../../utils/cn';
import { SkillsCategorySidebar } from '../Skills/SkillsCategorySidebar';
import { SkillEditorPanel } from '../Skills/SkillEditorPanel';
import { CommunitySkillsView } from '../Skills/CommunitySkillsView';
import { ExecuteSkillModal } from '../Skills/ExecuteSkillModal';
import { ConversationalSkillBuilder, OnboardingModal, useSkillsOnboarding } from '../Skills';
import { useSkills } from '../../hooks/useSkills';
import { useSkillsSubNavigation, type SkillsSubTabType } from '../../hooks/useSkillsSubNavigation';
import type { Skill } from '../../types/skills';

// Sub-tab configuration
const SUB_TABS: { id: SkillsSubTabType; label: string }[] = [
  { id: 'all-skills', label: 'All' },
  { id: 'my-skills', label: 'My Skills' },
  { id: 'community-skills', label: 'Community' },
];

export function SkillsTab() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { skills, loading, refetch } = useSkills();
  const { activeSubTab, setActiveSubTab } = useSkillsSubNavigation();
  const { showOnboarding, dismissOnboarding } = useSkillsOnboarding();

  // Selected skill and modal states
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [executeModalSkill, setExecuteModalSkill] = useState<Skill | null>(null);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter skills based on search and active tab
  const filteredSkills = useMemo(() => {
    let result = [...skills];

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (skill) =>
          skill.name.toLowerCase().includes(searchLower) ||
          skill.description?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [skills, search]);

  // Clear selection when switching tabs
  useEffect(() => {
    setSelectedSkill(null);
  }, [activeSubTab]);

  // Update selected skill when skills list changes (e.g., after edit)
  useEffect(() => {
    if (selectedSkill) {
      const updated = skills.find((s) => s.id === selectedSkill.id);
      if (updated) {
        setSelectedSkill(updated);
      } else {
        setSelectedSkill(null);
      }
    }
  }, [skills, selectedSkill?.id]);

  const handleCreateSkill = useCallback(() => {
    setIsWizardOpen(true);
  }, []);

  const handleSkillCreated = useCallback((skill: Skill) => {
    console.log('Skill created:', skill);
    refetch();
    setSelectedSkill(skill);
  }, [refetch]);

  const handleSelectSkill = useCallback((skill: Skill) => {
    setSelectedSkill(skill);
  }, []);

  const handleRunSkill = useCallback((skill: Skill) => {
    setExecuteModalSkill(skill);
  }, []);

  const handleSaveSkill = useCallback((skill: Skill) => {
    // TODO: Call API to save skill
    console.log('Saving skill:', skill);
    refetch();
  }, [refetch]);

  const handleCloseExecuteModal = useCallback(() => {
    setExecuteModalSkill(null);
  }, []);

  const handleExecutionComplete = useCallback(() => {
    refetch();
  }, [refetch]);

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

  // Render community tab content
  if (activeSubTab === 'community-skills') {
    return (
      <div
        role="tabpanel"
        id="tabpanel-skills"
        aria-labelledby="tab-skills"
        className="flex flex-col h-full"
      >
        {/* Controls Bar */}
        <div className="shrink-0 border-b border-border bg-card/30 backdrop-blur-xl">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Sub-Tab Navigation */}
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
          </div>
        </div>

        {/* Community Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <CommunitySkillsView onCreateSkill={handleCreateSkill} />
        </main>

        {/* Conversational Skill Builder */}
        <ConversationalSkillBuilder
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onCreated={handleSkillCreated}
        />
      </div>
    );
  }

  // Render main skills view (All / My Skills)
  return (
    <div
      role="tabpanel"
      id="tabpanel-skills"
      aria-labelledby="tab-skills"
      className="flex flex-col h-full"
    >
      {/* Controls Bar */}
      <div className="shrink-0 border-b border-border bg-card/30 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Sub-Tab Navigation */}
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
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar with Create button, Filter, and skills grouped by category */}
          <div className="shrink-0 w-72 flex flex-col border-r border-border bg-card/30">
            {/* Create & Filter buttons */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateSkill}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                >
                  <Plus size={18} />
                  <span>Create new skill</span>
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    'p-2 rounded-lg border transition-colors',
                    showFilters
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                  title="Toggle filters"
                >
                  <Filter size={18} />
                </button>
              </div>

              {/* Filter Panel (collapsible) */}
              {showFilters && (
                <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Filter by category</p>
                  <div className="flex flex-wrap gap-1">
                    {['Analysis', 'Generation', 'Transformation', 'Communication', 'Automation'].map((cat) => (
                      <button
                        key={cat}
                        className="px-2 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Skills List */}
            <div className="flex-1 overflow-y-auto p-2">
              <SkillsCategorySidebar
                skills={filteredSkills}
                selectedSkillId={selectedSkill?.id ?? null}
                onSelectSkill={handleSelectSkill}
                onRunSkill={handleRunSkill}
                loading={loading}
              />
            </div>
          </div>

          {/* Main content - Skill Editor Panel */}
          <div className="flex-1 overflow-hidden">
            <SkillEditorPanel
              skill={selectedSkill}
              onSave={handleSaveSkill}
              onRun={handleRunSkill}
              className="h-full"
            />
          </div>
        </div>
      </main>

      {/* Conversational Skill Builder (for new skills) */}
      <ConversationalSkillBuilder
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCreated={handleSkillCreated}
      />

      {/* Execute Skill Modal */}
      {executeModalSkill && (
        <ExecuteSkillModal
          skill={executeModalSkill}
          isOpen={true}
          onClose={handleCloseExecuteModal}
          onExecutionComplete={handleExecutionComplete}
        />
      )}

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
