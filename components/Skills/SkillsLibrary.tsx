// SkillsLibrary Component - Main Skills Library UI with Sub-Tab Navigation
// Task 2_2: Skills Library UI
// Task 2_4: Skill Detail & Edit Integration
// Task 2_5: Skill Execution Integration
// Skills Library Redesign: Added sub-tab navigation (My Skills / All Skills / Community)

import { useState, useCallback } from 'react';
import { useSkills } from '../../hooks/useSkills';
import { useSkillsSubNavigation } from '../../hooks/useSkillsSubNavigation';
import { MySkillsView } from './MySkillsView';
import { AllSkillsView } from './AllSkillsView';
import { CommunitySkillsView } from './CommunitySkillsView';
import { ExecuteSkillModal } from './ExecuteSkillModal';
import { SkillDetailModal } from './SkillDetailModal';
import type { Skill } from '../../types/skills';
import type { SkillsSidebarFilters } from './SkillsFilterSidebar';

type SortOption = 'most-used' | 'recent' | 'alphabetical';
type ViewMode = 'grid' | 'list';

interface SkillsLibraryProps {
  onCreateSkill?: () => void;
  onEditSkill?: (skill: Skill) => void;
  onRunSkill?: (skill: Skill) => void;
  search?: string;
  sortBy?: SortOption;
  viewMode?: ViewMode;
  sidebarFilters?: SkillsSidebarFilters;
}

export function SkillsLibrary({
  onCreateSkill,
  onEditSkill,
  onRunSkill,
  search = '',
  sortBy = 'most-used',
  viewMode = 'grid',
  sidebarFilters,
}: SkillsLibraryProps) {
  const { deleteSkill, refetch } = useSkills();
  const { activeSubTab, setActiveSubTab } = useSkillsSubNavigation();

  const [isDeleting, setIsDeleting] = useState(false);
  const [executeModalSkill, setExecuteModalSkill] = useState<Skill | null>(null);
  const [detailModalSkill, setDetailModalSkill] = useState<Skill | null>(null);

  const handleCreateClick = useCallback(() => {
    if (onCreateSkill) {
      onCreateSkill();
    } else {
      console.log('Create skill clicked');
    }
  }, [onCreateSkill]);

  const handleViewSkill = useCallback((skill: Skill) => {
    setDetailModalSkill(skill);
  }, []);

  const handleEditSkill = useCallback((skill: Skill) => {
    if (onEditSkill) {
      onEditSkill(skill);
    } else {
      setDetailModalSkill(skill);
    }
  }, [onEditSkill]);

  const handleRunSkill = useCallback((skill: Skill) => {
    if (onRunSkill) {
      onRunSkill(skill);
    } else {
      setExecuteModalSkill(skill);
    }
  }, [onRunSkill]);

  const handleCloseExecuteModal = useCallback(() => {
    setExecuteModalSkill(null);
  }, []);

  const handleExecutionComplete = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleCloseDetailModal = useCallback(() => {
    setDetailModalSkill(null);
  }, []);

  const handleSkillUpdated = useCallback((updatedSkill: Skill) => {
    setDetailModalSkill(updatedSkill);
    refetch();
  }, [refetch]);

  const handleSkillDeleted = useCallback(() => {
    setDetailModalSkill(null);
    refetch();
  }, [refetch]);

  const handleDeleteSkill = useCallback(async (skill: Skill) => {
    if (isDeleting) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${skill.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      setIsDeleting(true);
      try {
        await deleteSkill(skill.id);
      } catch (err) {
        console.error('Failed to delete skill:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  }, [deleteSkill, isDeleting]);

  const handleActivateSkill = useCallback((skill: Skill) => {
    // TODO: Implement skill activation for marketplace
    console.log('Activate skill:', skill.id);
  }, []);

  // Render the active view based on selected sub-tab
  const renderActiveView = () => {
    switch (activeSubTab) {
      case 'my-skills':
        return (
          <MySkillsView
            onCreateSkill={handleCreateClick}
            onRunSkill={handleRunSkill}
            onEditSkill={handleEditSkill}
            onDeleteSkill={handleDeleteSkill}
            onViewSkill={handleViewSkill}
            search={search}
            sortBy={sortBy}
            viewMode={viewMode}
            sidebarFilters={sidebarFilters}
          />
        );
      case 'all-skills':
        return (
          <AllSkillsView
            onCreateSkill={handleCreateClick}
            onRunSkill={handleRunSkill}
            onEditSkill={handleEditSkill}
            onDeleteSkill={handleDeleteSkill}
            onViewSkill={handleViewSkill}
            onActivateSkill={handleActivateSkill}
            search={search}
            sortBy={sortBy}
            viewMode={viewMode}
            sidebarFilters={sidebarFilters}
          />
        );
      case 'community-skills':
        return (
          <CommunitySkillsView
            onCreateSkill={handleCreateClick}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Tab Content - Sub-tabs are now in SkillsTab controls bar */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeSubTab}`}
        aria-labelledby={`tab-${activeSubTab}`}
      >
        {renderActiveView()}
      </div>

      {/* Execute Skill Modal */}
      {executeModalSkill && (
        <ExecuteSkillModal
          skill={executeModalSkill}
          isOpen={true}
          onClose={handleCloseExecuteModal}
          onExecutionComplete={handleExecutionComplete}
        />
      )}

      {/* Skill Detail Modal */}
      {detailModalSkill && (
        <SkillDetailModal
          skill={detailModalSkill}
          isOpen={true}
          onClose={handleCloseDetailModal}
          onUpdated={handleSkillUpdated}
          onDeleted={handleSkillDeleted}
          onRun={handleRunSkill}
        />
      )}
    </>
  );
}
