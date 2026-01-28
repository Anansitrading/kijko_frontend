/**
 * useSkillBuilder Hook
 * Manages state for the conversational skill builder
 */

import { useReducer, useCallback, useRef, useEffect } from 'react';
import { streamClaude, isApiKeyConfigured } from '../services/claudeApi';
import {
  parseSkillConfig,
  removeSkillConfigBlock,
  buildConversationContext,
  generateMessageId,
} from '../lib/skillBuilderPrompt';
import { draftToFullContent } from '../lib/yamlUtils';
import type {
  SkillDraft,
  SkillBuilderState,
  SkillBuilderAction,
  SkillBuilderMessage,
  ProposedSkillConfig,
  CreatePlaybookSkillRequest,
} from '../types/skillDraft';
import { initialSkillDraft } from '../types/skillDraft';

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';
const MAX_TOKENS = 2048;

const INITIAL_MESSAGE: SkillBuilderMessage = {
  id: generateMessageId(),
  role: 'assistant',
  content:
    "Hi! I'll help you create a new skill. Describe what you want the skill to do, and I'll help you configure it.\n\nFor example: *\"I need a skill to review code before committing\"* or *\"Create a deployment skill with staged rollbacks\"*",
  timestamp: new Date(),
};

// =============================================================================
// Reducer
// =============================================================================

const initialState: SkillBuilderState = {
  messages: [INITIAL_MESSAGE],
  draft: { ...initialSkillDraft },
  isLoading: false,
  isStreaming: false,
  error: null,
};

function skillBuilderReducer(
  state: SkillBuilderState,
  action: SkillBuilderAction
): SkillBuilderState {
  switch (action.type) {
    case 'ADD_USER_MESSAGE': {
      const newMessage: SkillBuilderMessage = {
        id: generateMessageId(),
        role: 'user',
        content: action.content,
        timestamp: new Date(),
      };
      return {
        ...state,
        messages: [...state.messages, newMessage],
        error: null,
      };
    }

    case 'ADD_ASSISTANT_MESSAGE': {
      const newMessage: SkillBuilderMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: action.content,
        timestamp: new Date(),
        proposedConfig: action.proposedConfig,
        configStatus: action.proposedConfig ? 'pending' : undefined,
      };
      return {
        ...state,
        messages: [...state.messages, newMessage],
        isLoading: false,
        isStreaming: false,
      };
    }

    case 'UPDATE_STREAMING_MESSAGE': {
      const messages = [...state.messages];
      const lastMessage = messages[messages.length - 1];

      if (lastMessage && lastMessage.role === 'assistant') {
        messages[messages.length - 1] = {
          ...lastMessage,
          content: action.content,
        };
      }

      return { ...state, messages };
    }

    case 'FINISH_STREAMING': {
      const messages = [...state.messages];
      const lastMessage = messages[messages.length - 1];

      if (lastMessage && lastMessage.role === 'assistant') {
        messages[messages.length - 1] = {
          ...lastMessage,
          proposedConfig: action.proposedConfig,
          configStatus: action.proposedConfig ? 'pending' : undefined,
        };
      }

      return {
        ...state,
        messages,
        isLoading: false,
        isStreaming: false,
      };
    }

    case 'APPROVE_CONFIG': {
      const messages = state.messages.map((msg) => {
        if (msg.id === action.messageId && msg.proposedConfig) {
          return { ...msg, configStatus: 'approved' as const };
        }
        return msg;
      });

      // Find the config to apply
      const targetMessage = state.messages.find((m) => m.id === action.messageId);
      if (!targetMessage?.proposedConfig) {
        return { ...state, messages };
      }

      // Merge modifications if any
      const config = action.modifications
        ? { ...targetMessage.proposedConfig, ...action.modifications }
        : targetMessage.proposedConfig;

      // Apply config changes to draft
      const updatedDraft: SkillDraft = {
        ...state.draft,
        ...config.configChanges,
        tags: [...new Set([...state.draft.tags, ...config.detectedTags])],
        trigger: config.suggestedTrigger,
        scope: config.suggestedScope,
      };

      return { ...state, messages, draft: updatedDraft };
    }

    case 'REJECT_CONFIG': {
      const messages = state.messages.map((msg) => {
        if (msg.id === action.messageId) {
          return { ...msg, configStatus: 'rejected' as const };
        }
        return msg;
      });

      return { ...state, messages };
    }

    case 'UPDATE_DRAFT':
      return {
        ...state,
        draft: { ...state.draft, ...action.updates },
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };

    case 'SET_STREAMING':
      return { ...state, isStreaming: action.streaming };

    case 'SET_ERROR':
      return { ...state, error: action.error, isLoading: false, isStreaming: false };

    case 'RESET':
      return {
        ...initialState,
        messages: [
          {
            ...INITIAL_MESSAGE,
            id: generateMessageId(),
            timestamp: new Date(),
          },
        ],
      };

    case 'LOAD_SKILL': {
      const loadedDraft: SkillDraft = {
        ...initialSkillDraft,
        ...action.draft,
      };

      // Create initial message for editing mode
      const editMessage: SkillBuilderMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: `I've loaded **${loadedDraft.name || 'this skill'}** for editing.\n\nYou can ask me to:\n- Modify the instructions or behavior\n- Add new capabilities\n- Change trigger timing or scope\n- Update the description\n\nWhat would you like to change?`,
        timestamp: new Date(),
      };

      return {
        ...initialState,
        draft: loadedDraft,
        messages: [editMessage],
      };
    }

    default:
      return state;
  }
}

// =============================================================================
// Hook
// =============================================================================

export interface UseSkillBuilderOptions {
  onError?: (error: Error) => void;
}

export interface UseSkillBuilderReturn {
  state: SkillBuilderState;
  sendMessage: (content: string) => Promise<void>;
  approveConfig: (
    messageId: string,
    modifications?: Partial<ProposedSkillConfig>
  ) => void;
  rejectConfig: (messageId: string) => Promise<void>;
  updateDraft: (updates: Partial<SkillDraft>) => void;
  createSkill: () => CreatePlaybookSkillRequest | null;
  reset: () => void;
  loadSkill: (draft: Partial<SkillDraft>) => void;
  canCreateSkill: boolean;
}

export function useSkillBuilder(
  options: UseSkillBuilderOptions = {}
): UseSkillBuilderReturn {
  const { onError } = options;
  const [state, dispatch] = useReducer(skillBuilderReducer, initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || state.isLoading || state.isStreaming) return;

      const trimmedContent = content.trim();

      // Check if API key is configured
      if (!isApiKeyConfigured()) {
        dispatch({
          type: 'SET_ERROR',
          error: 'API key not configured. Please set VITE_ANTHROPIC_API_KEY.',
        });
        return;
      }

      // Add user message
      dispatch({ type: 'ADD_USER_MESSAGE', content: trimmedContent });
      dispatch({ type: 'SET_LOADING', loading: true });

      try {
        // Build conversation context
        const { systemPrompt, conversationHistory } = buildConversationContext(
          state.messages,
          state.draft
        );

        // Add the new user message
        conversationHistory.push({
          role: 'user',
          content: trimmedContent,
        });

        // Start streaming
        dispatch({ type: 'SET_STREAMING', streaming: true });

        // Add empty assistant message for streaming
        const assistantMessageId = generateMessageId();
        dispatch({
          type: 'ADD_ASSISTANT_MESSAGE',
          content: '',
        });

        let streamedContent = '';
        abortControllerRef.current = new AbortController();

        const stream = streamClaude({
          model: DEFAULT_MODEL,
          messages: conversationHistory,
          systemPrompt,
          parameters: { max_tokens: MAX_TOKENS, temperature: 0.7 },
        });

        for await (const event of stream) {
          if (event.type === 'text' && event.content) {
            streamedContent += event.content;
            dispatch({
              type: 'UPDATE_STREAMING_MESSAGE',
              content: removeSkillConfigBlock(streamedContent),
            });
          }
        }

        // Parse skill config from response
        const proposedConfig = parseSkillConfig(streamedContent);

        // Finish streaming with parsed config
        dispatch({
          type: 'FINISH_STREAMING',
          proposedConfig: proposedConfig || undefined,
        });

        // Update displayed content without the JSON block
        dispatch({
          type: 'UPDATE_STREAMING_MESSAGE',
          content: removeSkillConfigBlock(streamedContent),
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        dispatch({ type: 'SET_ERROR', error: errorMessage });
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    },
    [state.messages, state.draft, state.isLoading, state.isStreaming, onError]
  );

  const approveConfig = useCallback(
    (messageId: string, modifications?: Partial<ProposedSkillConfig>) => {
      dispatch({ type: 'APPROVE_CONFIG', messageId, modifications });
    },
    []
  );

  const rejectConfig = useCallback(
    async (messageId: string) => {
      dispatch({ type: 'REJECT_CONFIG', messageId });

      // Send a message asking AI to try again
      await sendMessage(
        "That's not quite right. Can you propose a different configuration?"
      );
    },
    [sendMessage]
  );

  const updateDraft = useCallback((updates: Partial<SkillDraft>) => {
    dispatch({ type: 'UPDATE_DRAFT', updates });
  }, []);

  const createSkill = useCallback((): CreatePlaybookSkillRequest | null => {
    const { draft } = state;

    if (!draft.name) {
      dispatch({ type: 'SET_ERROR', error: 'Skill name is required' });
      return null;
    }

    // Generate full content
    const content = draftToFullContent(draft);

    return {
      content,
      name: draft.name,
      description: draft.description,
      dependencies: draft.dependencies,
      trigger: draft.trigger,
      scope: draft.scope,
      tags: draft.tags,
    };
  }, [state]);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    dispatch({ type: 'RESET' });
  }, []);

  const loadSkill = useCallback((draft: Partial<SkillDraft>) => {
    abortControllerRef.current?.abort();
    dispatch({ type: 'LOAD_SKILL', draft });
  }, []);

  // Check if we have enough data to create a skill
  const canCreateSkill = Boolean(state.draft.name && state.draft.description);

  return {
    state,
    sendMessage,
    approveConfig,
    rejectConfig,
    updateDraft,
    createSkill,
    reset,
    loadSkill,
    canCreateSkill,
  };
}
