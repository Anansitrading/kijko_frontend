// SkillsTab - Dashboard Tab Component for Skills Library
// Task 2_2: Skills Library UI
// Task 2_3: Create Skill Form
// Task 3_5: Analytics & Polish - Added onboarding
// Layout Redesign: Full-width header like Integrations page

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, LayoutGrid, List, ChevronDown, X, Filter, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import { SkillsCategorySidebar } from '../Skills/SkillsCategorySidebar';
import { SkillEditorPanel } from '../Skills/SkillEditorPanel';
import { useSkills } from '../../hooks/useSkills';
import type { Skill, SkillCategory } from '../../types/skills';

type SkillSortBy = 'popular' | 'name' | 'recent' | 'newest';

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

// Sort options for skills browse view
const SORT_OPTIONS: { id: SkillSortBy; label: string }[] = [
  { id: 'popular', label: 'Popular' },
  { id: 'name', label: 'Name' },
  { id: 'recent', label: 'Most recent' },
  { id: 'newest', label: 'Newest from community' },
];

export function SkillsTab() {
  const { skills, loading, refetch } = useSkills();

  // Selected skill and modal states
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Browse view state (lifted from SkillEditorPanel)
  const [browseSearch, setBrowseSearch] = useState('');
  const [browseViewMode, setBrowseViewMode] = useState<'grid' | 'list'>('grid');
  const [browseSortBy, setBrowseSortBy] = useState<SkillSortBy>('popular');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [sortDropdownPosition, setSortDropdownPosition] = useState({ top: 0, left: 0 });
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Category filter state - shared between sidebar and main panel
  const [selectedCategories, setSelectedCategories] = useState<SkillCategory[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterDropdownPosition, setFilterDropdownPosition] = useState({ top: 0, left: 0 });
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);


  // Sort dropdown handlers
  const openSort = useCallback(() => {
    if (sortButtonRef.current) {
      const rect = sortButtonRef.current.getBoundingClientRect();
      setSortDropdownPosition({
        top: rect.bottom + 8,
        left: rect.right - 192, // 192px = w-48 dropdown width
      });
    }
    setIsSortDropdownOpen(true);
  }, []);

  // Filter dropdown handlers
  const openFilter = useCallback(() => {
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setFilterDropdownPosition({
        top: rect.bottom + 8,
        left: rect.right - 224, // 224px = w-56 dropdown width
      });
    }
    setIsFilterOpen(true);
  }, []);

  const toggleCategory = useCallback((category: SkillCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Close filter dropdown
      if (
        filterButtonRef.current && !filterButtonRef.current.contains(target) &&
        filterDropdownRef.current && !filterDropdownRef.current.contains(target)
      ) {
        setIsFilterOpen(false);
      }
      // Close sort dropdown
      if (
        sortButtonRef.current && !sortButtonRef.current.contains(target) &&
        sortDropdownRef.current && !sortDropdownRef.current.contains(target)
      ) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilters = selectedCategories.length > 0;

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

  const handleSaveSkill = useCallback((skill: Skill) => {
    // TODO: Call API to save skill
    console.log('Saving skill:', skill);
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
          {/* Left side: Title */}
          <h1 className="text-lg font-semibold text-foreground">All Skills</h1>

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

              {/* Filter Button */}
              <div className="relative">
                <button
                  ref={filterButtonRef}
                  onClick={() => isFilterOpen ? setIsFilterOpen(false) : openFilter()}
                  className={cn(
                    'flex items-center justify-center p-2 border rounded-lg transition-colors',
                    hasActiveFilters
                      ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                      : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                  title="Filter by category"
                >
                  <Filter size={18} />
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {selectedCategories.length}
                    </span>
                  )}
                </button>

                {/* Filter Dropdown - rendered via portal */}
                {isFilterOpen && createPortal(
                  <div
                    ref={filterDropdownRef}
                    className="fixed w-56 bg-card border border-border rounded-lg shadow-xl z-[100] py-2"
                    style={{ top: filterDropdownPosition.top, left: filterDropdownPosition.left }}
                  >
                    <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Filter by Category</span>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          <X size={12} />
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="py-1">
                      {CATEGORY_ORDER.map((category) => (
                        <button
                          key={category}
                          onClick={() => toggleCategory(category)}
                          className={cn(
                            'w-full px-3 py-2 text-sm text-left flex items-center justify-between transition-colors',
                            selectedCategories.includes(category)
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          <span>{CATEGORY_LABELS[category]}</span>
                          {selectedCategories.includes(category) && (
                            <Check size={14} className="text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>,
                  document.body
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
                  ref={sortButtonRef}
                  onClick={() => isSortDropdownOpen ? setIsSortDropdownOpen(false) : openSort()}
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

                {/* Sort Dropdown - rendered via portal */}
                {isSortDropdownOpen && createPortal(
                  <div
                    ref={sortDropdownRef}
                    className="fixed w-48 bg-card border border-border rounded-lg shadow-xl z-[100] py-1"
                    style={{ top: sortDropdownPosition.top, left: sortDropdownPosition.left }}
                  >
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
                  </div>,
                  document.body
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Filter Sidebar */}
          <SkillsCategorySidebar
            skills={filteredSkills}
            selectedSkillId={selectedSkill?.id ?? null}
            onSelectSkill={handleSelectSkill}
            loading={loading}
            isCreatingDraft={isCreatingNew}
            onSelectDraft={() => setIsCreatingNew(true)}
            onCreateNew={handleCreateSkill}
            selectedCategories={selectedCategories}
            search={browseSearch}
          />

          {/* Main content - Skill Editor Panel */}
          <div className="flex-1 overflow-hidden p-6">
            <SkillEditorPanel
              skill={selectedSkill}
              onSave={handleSaveSkill}
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
              selectedCategories={selectedCategories}
              className="h-full"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
