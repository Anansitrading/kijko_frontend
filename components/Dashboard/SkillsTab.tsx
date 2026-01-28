// SkillsTab - Dashboard Tab Component for Skills Library
// Task 2_2: Skills Library UI
// Task 2_3: Create Skill Form
// Task 3_5: Analytics & Polish - Added onboarding
// Layout Redesign: Skills shown in sidebar grouped by category
// New: Inline skill editor with chat interface

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { cn } from '../../utils/cn';
import { SkillsCategorySidebar } from '../Skills/SkillsCategorySidebar';
import { SkillEditorPanel } from '../Skills/SkillEditorPanel';
import { CommunitySkillsView } from '../Skills/CommunitySkillsView';
import { ExecuteSkillModal } from '../Skills/ExecuteSkillModal';
import { ConversationalSkillBuilder } from '../Skills';
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

  // Selected skill and modal states
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [executeModalSkill, setExecuteModalSkill] = useState<Skill | null>(null);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Resizable sidebar
  const [sidebarWidth, setSidebarWidth] = useState(288); // 72 * 4 = 288px (w-72)
  const isResizing = useRef(false);

  const handleMouseDown = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(Math.max(200, e.clientX), 500);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

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
    setSelectedSkill(null);
    setIsCreatingNew(true);
  }, []);

  const handleSkillCreated = useCallback((skill: Skill) => {
    console.log('Skill created:', skill);
    refetch();
    setSelectedSkill(skill);
    setIsCreatingNew(false);
  }, [refetch]);

  const handleCancelCreate = useCallback(() => {
    setIsCreatingNew(false);
  }, []);

  const handleSelectSkill = useCallback((skill: Skill) => {
    setSelectedSkill(skill);
    setIsCreatingNew(false);
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

        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar with Create button, Filter, and skills grouped by category */}
          <div
            className="shrink-0 flex flex-col border-r border-border bg-card/30 relative"
            style={{ width: sidebarWidth }}
          >
            {/* Resize Handle */}
            <div
              onMouseDown={handleMouseDown}
              className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10"
            />
            {/* Create, Search & Filter buttons */}
            <div className="p-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateSkill}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                >
                  <Plus size={18} />
                  <span>New</span>
                </button>
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className={cn(
                    'p-2 rounded-lg border transition-colors',
                    showSearch
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                  title="Search skills"
                >
                  <Search size={18} />
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

              {/* Search Input (collapsible) */}
              {showSearch && (
                <div className="mt-3">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search skills..."
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              )}

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
                isCreatingDraft={isCreatingNew}
                onSelectDraft={() => setIsCreatingNew(true)}
              />
            </div>
          </div>

          {/* Main content - Skill Editor Panel */}
          <div className="flex-1 overflow-hidden">
            <SkillEditorPanel
              skill={selectedSkill}
              onSave={handleSaveSkill}
              onRun={handleRunSkill}
              onCreated={handleSkillCreated}
              onCancelCreate={handleCancelCreate}
              isCreatingNew={isCreatingNew}
              className="h-full"
            />
          </div>
        </div>
      </main>

      {/* Execute Skill Modal */}
      {executeModalSkill && (
        <ExecuteSkillModal
          skill={executeModalSkill}
          isOpen={true}
          onClose={handleCloseExecuteModal}
          onExecutionComplete={handleExecutionComplete}
        />
      )}

    </div>
  );
}
