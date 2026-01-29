// SkillsTab - Dashboard Tab Component for Skills Library
// Task 2_2: Skills Library UI
// Task 2_3: Create Skill Form
// Task 3_5: Analytics & Polish - Added onboarding
// Layout Redesign: Full-width header like Integrations page

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Plus, Search, LayoutGrid, List, ChevronDown, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { SkillsCategorySidebar } from '../Skills/SkillsCategorySidebar';
import { SkillEditorPanel } from '../Skills/SkillEditorPanel';
import { ExecuteSkillModal } from '../Skills/ExecuteSkillModal';
import { useSkills } from '../../hooks/useSkills';
import type { Skill } from '../../types/skills';

type SkillSortBy = 'popular' | 'name' | 'recent';

// Sort options for skills browse view
const SORT_OPTIONS: { id: SkillSortBy; label: string }[] = [
  { id: 'popular', label: 'Popular' },
  { id: 'name', label: 'Name' },
  { id: 'recent', label: 'Most recent' },
];

export function SkillsTab() {
  const { skills, loading, refetch } = useSkills();

  // Selected skill and modal states
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [executeModalSkill, setExecuteModalSkill] = useState<Skill | null>(null);

  // Browse view state (lifted from SkillEditorPanel)
  const [browseSearch, setBrowseSearch] = useState('');
  const [browseViewMode, setBrowseViewMode] = useState<'grid' | 'list'>('grid');
  const [browseSortBy, setBrowseSortBy] = useState<SkillSortBy>('popular');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

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

  // Filter skills for sidebar - always show only installed (my) skills
  const filteredSkills = useMemo(() => {
    // Sidebar always shows only user's own installed skills
    const result = skills.filter((skill) => !skill.isPublic);

    // Sort by star count (most starred first) for better discovery
    result.sort((a, b) => (b.starCount ?? 0) - (a.starCount ?? 0));

    return result;
  }, [skills]);

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

  const handleToggleStar = useCallback((skill: Skill, starred: boolean) => {
    // TODO: Call API to toggle star
    console.log(`${starred ? 'Starred' : 'Unstarred'} skill:`, skill.name);
    // For now, just log - in production this would update the backend
  }, []);

  const handleCloseSkill = useCallback(() => {
    setSelectedSkill(null);
    setIsCreatingNew(false);
  }, []);

  // Current sort label
  const currentSortLabel = SORT_OPTIONS.find((o) => o.id === browseSortBy)?.label || 'Sort';

  // Show header controls only when browsing (no skill selected and not creating)
  const showBrowseHeader = !selectedSkill && !isCreatingNew;

  // Render main skills view (All / My Skills)
  return (
    <div
      role="tabpanel"
      id="tabpanel-skills"
      aria-labelledby="tab-skills"
      className="flex flex-col h-full"
    >
      {/* Full-width Header Bar */}
      <div className="shrink-0 border-b border-border bg-card/30 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left side: Title and New button */}
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-foreground">All Skills</h1>
            <button
              onClick={handleCreateSkill}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            >
              <Plus size={18} />
              <span>New</span>
            </button>
          </div>

          {/* Right side: Search and View Controls (only when browsing) */}
          {showBrowseHeader && (
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative flex items-center">
                <Search size={16} className="absolute left-3 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={browseSearch}
                  onChange={(e) => setBrowseSearch(e.target.value)}
                  placeholder="Search skills..."
                  className="w-64 pl-9 pr-8 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                />
                {browseSearch && (
                  <button
                    onClick={() => setBrowseSearch('')}
                    className="absolute right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-muted/50 border border-border rounded-lg p-1">
                <button
                  onClick={() => setBrowseViewMode('grid')}
                  className={cn(
                    'p-1.5 rounded-md transition-all',
                    browseViewMode === 'grid'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="Grid view"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setBrowseViewMode('list')}
                  className={cn(
                    'p-1.5 rounded-md transition-all',
                    browseViewMode === 'list'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="List view"
                >
                  <List size={18} />
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>{currentSortLabel}</span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      'transition-transform',
                      isSortDropdownOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isSortDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsSortDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl z-50 py-1">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setBrowseSortBy(option.id);
                            setIsSortDropdownOpen(false);
                          }}
                          className={cn(
                            'w-full px-4 py-2 text-sm text-left transition-colors',
                            browseSortBy === option.id
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar with skills grouped by category */}
          <div
            className="shrink-0 flex flex-col border-r border-border bg-card/30 relative"
            style={{ width: sidebarWidth }}
          >
            {/* Resize Handle */}
            <div
              onMouseDown={handleMouseDown}
              className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10"
            />

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
              onCreateNew={handleCreateSkill}
              onToggleStar={handleToggleStar}
              onSelectSkill={handleSelectSkill}
              onClose={handleCloseSkill}
              isCreatingNew={isCreatingNew}
              browseSearch={browseSearch}
              browseViewMode={browseViewMode}
              browseSortBy={browseSortBy}
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
