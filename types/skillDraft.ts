// Playbook Skill Types
// New skill type using YAML frontmatter + markdown body format

/**
 * Trigger timing for skill execution
 */
export type SkillTrigger = 'pre-tool' | 'post-tool';

/**
 * Scope of skill applicability
 */
export type SkillScope = 'global' | 'local';

/**
 * Tag categories for automatic detection
 */
export type TagCategory =
  | 'deployment'
  | 'testing'
  | 'documentation'
  | 'communication'
  | 'analysis'
  | 'transformation'
  | 'automation'
  | 'security'
  | 'monitoring'
  | 'refactoring'
  | 'debugging';

/**
 * PlaybookSkill - New skill type stored as YAML frontmatter + markdown
 */
export interface PlaybookSkill {
  id: string;
  userId: string;

  // Raw content (stored as-is)
  content: string; // Full YAML frontmatter + markdown body

  // Parsed frontmatter (for querying/filtering)
  name: string;
  description: string;
  dependencies: string[]; // Tool/skill references
  trigger: SkillTrigger;
  scope: SkillScope;
  tags: string[];

  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SkillDraft - Working state during conversation
 */
export interface SkillDraft {
  name: string;
  description: string;
  dependencies: string[];
  trigger: SkillTrigger;
  scope: SkillScope;
  tags: string[];
  instructions: string; // Markdown body
}

/**
 * Initial empty draft
 */
export const initialSkillDraft: SkillDraft = {
  name: '',
  description: '',
  dependencies: [],
  trigger: 'pre-tool',
  scope: 'local',
  tags: [],
  instructions: '',
};

/**
 * Proposed configuration from AI during conversation
 */
export interface ProposedSkillConfig {
  detectedTags: string[];
  suggestedTrigger: SkillTrigger;
  suggestedScope: SkillScope;
  configChanges: Partial<SkillDraft>;
}

/**
 * Message in the skill builder conversation
 */
export interface SkillBuilderMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  proposedConfig?: ProposedSkillConfig;
  configStatus?: 'pending' | 'approved' | 'rejected';
}

/**
 * State for the skill builder
 */
export interface SkillBuilderState {
  messages: SkillBuilderMessage[];
  draft: SkillDraft;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}

/**
 * Actions for skill builder reducer
 */
export type SkillBuilderAction =
  | { type: 'ADD_USER_MESSAGE'; content: string }
  | {
      type: 'ADD_ASSISTANT_MESSAGE';
      content: string;
      proposedConfig?: ProposedSkillConfig;
    }
  | { type: 'UPDATE_STREAMING_MESSAGE'; content: string }
  | { type: 'FINISH_STREAMING'; proposedConfig?: ProposedSkillConfig }
  | {
      type: 'APPROVE_CONFIG';
      messageId: string;
      modifications?: Partial<ProposedSkillConfig>;
    }
  | { type: 'REJECT_CONFIG'; messageId: string }
  | { type: 'UPDATE_DRAFT'; updates: Partial<SkillDraft> }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_STREAMING'; streaming: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' }
  | { type: 'LOAD_SKILL'; draft: Partial<SkillDraft> };

/**
 * Request to create a playbook skill
 */
export interface CreatePlaybookSkillRequest {
  content: string;
  name: string;
  description: string;
  dependencies: string[];
  trigger: SkillTrigger;
  scope: SkillScope;
  tags: string[];
}
