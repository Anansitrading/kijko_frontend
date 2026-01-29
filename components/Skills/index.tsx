// Skills Module - Barrel Export
// Task 2_2: Skills Library UI
// Task 2_3: Create Skill Form
// Task 2_4: Skill Detail & Edit
// Task 2_5: Skill Execution
// Task 3_5: Analytics & Polish
// Skills Library Redesign: Sub-tabs and Custom Skill Wizard

export { SkillsLibrary } from './SkillsLibrary';
export { SkillsHeader } from './SkillsHeader';
export { SkillsGrid } from './SkillsGrid';
export { SkillCard } from './SkillCard';
export { EmptyState } from './EmptyState';

// Skills Library Redesign: Sub-Tab Navigation
export { SkillsSubTabs } from './SkillsSubTabs';
export { MySkillsView } from './MySkillsView';
export { AllSkillsView } from './AllSkillsView';
export { CommunitySkillsView } from './CommunitySkillsView';

// Skills Library Redesign: Filter Sidebar
export { SkillsFilterSidebar, DEFAULT_SKILLS_SIDEBAR_FILTERS } from './SkillsFilterSidebar';
export type { SkillsSidebarFilters, SkillsQuickFilter } from './SkillsFilterSidebar';

// Skills Library Redesign: Category Sidebar (skills grouped by category)
export { SkillsCategorySidebar } from './SkillsCategorySidebar';

// Skills Library Redesign: Supporting Components
export { SkillsSortDropdown } from './SkillsSortDropdown';
export { SkillsAnalyticsSummary } from './SkillsAnalyticsSummary';
export { CreateCustomSkillCard } from './CreateCustomSkillCard';

// Skills Library Redesign: Custom Skill Wizard
export { CustomSkillWizard } from './CustomSkillWizard';

// Conversational Skill Builder (new 3-panel layout)
export { ConversationalSkillBuilder } from './ConversationalSkillBuilder';

// Inline Skill Editor Panel (embedded 3-panel layout for viewing/editing skills)
export { SkillEditorPanel } from './SkillEditorPanel';

// Scope Selector Dropdown for skills
export { ScopeSelectorDropdown } from './ScopeSelectorDropdown';

// Task 2_3: Create Skill Form Components
export { CreateSkillModal } from './CreateSkillModal';
export { SkillForm } from './SkillForm';
export { CategorySelect } from './CategorySelect';
export { ModelSelect } from './ModelSelect';
export { PromptEditor } from './PromptEditor';
export { ParametersPanel } from './ParametersPanel';

// Task 2_4: Skill Detail & Edit Components
export { SkillDetailModal } from './SkillDetailModal';
export { SkillOverviewTab } from './SkillOverviewTab';
export { SkillHistoryTab } from './SkillHistoryTab';
export { SkillHabitsTab } from './SkillHabitsTab';
export { SkillReflexesTab } from './SkillReflexesTab';
export { DeleteSkillDialog } from './DeleteSkillDialog';

// Task 2_5: Skill Execution Components (UI only - Run functionality removed)
export { DynamicInputForm } from './DynamicInputForm';
export { ExecutionResult } from './ExecutionResult';
export { MarkdownRenderer } from './MarkdownRenderer';

// Task 3_5: Analytics & Polish Components
export { SkillStats } from './SkillStats';
export { StatCard } from './StatCard';
export { TemplateSelector } from './TemplateSelector';
export { TemplateCard } from './TemplateCard';
export { OnboardingModal, useSkillsOnboarding } from './OnboardingModal';
