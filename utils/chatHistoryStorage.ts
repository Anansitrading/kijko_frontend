// Chat History localStorage Persistence Utilities
// Sprint EX4: Chat History - Data Management & Persistence

import {
  ChatHistoryItem,
  ChatSession,
  StoredChatHistory,
  StoredChatSession,
  STORAGE_KEYS,
  CHAT_HISTORY_VERSION,
  MAX_PREVIEW_LENGTH,
} from '../types/chatHistory';

// ==========================================
// ID Generation
// ==========================================

/**
 * Generate a unique ID for chat sessions
 * Uses timestamp + random string for uniqueness
 */
export function generateChatId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `chat_${timestamp}_${randomPart}`;
}

// ==========================================
// Date Serialization
// ==========================================

/**
 * Serialize a ChatHistoryItem for storage
 */
function serializeChatHistoryItem(item: ChatHistoryItem): StoredChatSession['session']['metadata'] {
  return {
    ...item,
    timestamp: item.timestamp.toISOString(),
    lastActivity: item.lastActivity.toISOString(),
  };
}

/**
 * Deserialize a ChatHistoryItem from storage
 */
function deserializeChatHistoryItem(item: StoredChatSession['session']['metadata']): ChatHistoryItem {
  return {
    ...item,
    timestamp: new Date(item.timestamp),
    lastActivity: new Date(item.lastActivity),
  };
}

/**
 * Serialize a ChatSession for storage
 */
function serializeChatSession(session: ChatSession): StoredChatSession['session'] {
  return {
    id: session.id,
    metadata: serializeChatHistoryItem(session.metadata),
    messages: session.messages,
    sourceFiles: session.sourceFiles,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

/**
 * Deserialize a ChatSession from storage
 */
function deserializeChatSession(stored: StoredChatSession['session']): ChatSession {
  return {
    id: stored.id,
    metadata: deserializeChatHistoryItem(stored.metadata),
    messages: stored.messages,
    sourceFiles: stored.sourceFiles,
    createdAt: new Date(stored.createdAt),
    updatedAt: new Date(stored.updatedAt),
  };
}

// ==========================================
// Chat History List Operations
// ==========================================

/**
 * Load the chat history list from localStorage
 * Returns empty array if no data or corrupted data
 */
export function loadChatHistoryList(): ChatHistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    if (!stored) return [];

    const parsed: StoredChatHistory = JSON.parse(stored);

    // Version check for future migrations
    if (parsed.version !== CHAT_HISTORY_VERSION) {
      console.warn(`Chat history version mismatch. Expected ${CHAT_HISTORY_VERSION}, got ${parsed.version}`);
      // Future: implement migration logic here
    }

    // Deserialize dates
    return parsed.items.map(item => ({
      ...item,
      timestamp: new Date(item.timestamp as unknown as string),
      lastActivity: new Date(item.lastActivity as unknown as string),
    }));
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return [];
  }
}

/**
 * Save the chat history list to localStorage
 */
export function saveChatHistoryList(items: ChatHistoryItem[]): boolean {
  try {
    const stored: StoredChatHistory = {
      version: CHAT_HISTORY_VERSION,
      items: items.map(item => ({
        ...item,
        timestamp: item.timestamp.toISOString() as unknown as Date,
        lastActivity: item.lastActivity.toISOString() as unknown as Date,
      })),
      activeChatId: null, // Could be used to restore last active chat
    };

    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(stored));
    return true;
  } catch (error) {
    console.error('Failed to save chat history:', error);
    // Handle quota exceeded
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
    }
    return false;
  }
}

// ==========================================
// Individual Chat Session Operations
// ==========================================

/**
 * Load a specific chat session from localStorage
 */
export function loadChatSession(id: string): ChatSession | null {
  try {
    const key = STORAGE_KEYS.getChatSessionKey(id);
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed: StoredChatSession = JSON.parse(stored);

    // Version check
    if (parsed.version !== CHAT_HISTORY_VERSION) {
      console.warn(`Chat session version mismatch for ${id}`);
    }

    return deserializeChatSession(parsed.session);
  } catch (error) {
    console.error(`Failed to load chat session ${id}:`, error);
    return null;
  }
}

/**
 * Save a chat session to localStorage
 */
export function saveChatSession(session: ChatSession): boolean {
  try {
    const key = STORAGE_KEYS.getChatSessionKey(session.id);
    const stored: StoredChatSession = {
      version: CHAT_HISTORY_VERSION,
      session: serializeChatSession(session),
    };

    localStorage.setItem(key, JSON.stringify(stored));
    return true;
  } catch (error) {
    console.error(`Failed to save chat session ${session.id}:`, error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
    }
    return false;
  }
}

/**
 * Delete a chat session from localStorage
 */
export function deleteChatSession(id: string): boolean {
  try {
    const key = STORAGE_KEYS.getChatSessionKey(id);
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to delete chat session ${id}:`, error);
    return false;
  }
}

// ==========================================
// Title Generation
// ==========================================

/**
 * Generate a title from the first user message
 */
export function generateChatTitle(firstMessage: string): string {
  if (!firstMessage || !firstMessage.trim()) {
    return 'New Chat';
  }

  // Clean up the message
  let title = firstMessage.trim();

  // Remove markdown formatting
  title = title.replace(/[#*_`~\[\]]/g, '');

  // Take first line only
  title = title.split('\n')[0];

  // Truncate if too long
  if (title.length > 50) {
    title = title.substring(0, 47) + '...';
  }

  return title || 'New Chat';
}

/**
 * Generate a preview from the last message
 */
export function generateChatPreview(lastMessage: string): string {
  if (!lastMessage || !lastMessage.trim()) {
    return '';
  }

  let preview = lastMessage.trim();

  // Remove markdown formatting
  preview = preview.replace(/[#*_`~\[\]]/g, '');

  // Replace newlines with spaces
  preview = preview.replace(/\n+/g, ' ');

  // Truncate
  if (preview.length > MAX_PREVIEW_LENGTH) {
    preview = preview.substring(0, MAX_PREVIEW_LENGTH - 3) + '...';
  }

  return preview;
}

/**
 * Extract unique @context references from all messages
 */
export function extractUsedContexts(messages: Array<{ content: string }>): string[] {
  const contexts = new Set<string>();
  for (const msg of messages) {
    const matches = msg.content.matchAll(/@(\S+)/g);
    for (const match of matches) {
      contexts.add(match[1]);
    }
  }
  return Array.from(contexts);
}

/**
 * Extract unique /skill: commands from all messages
 */
export function extractUsedSkills(messages: Array<{ content: string }>): string[] {
  const skills = new Set<string>();
  for (const msg of messages) {
    const matches = msg.content.matchAll(/\/skill:(\S+)/g);
    for (const match of matches) {
      skills.add(match[1]);
    }
  }
  return Array.from(skills);
}

// ==========================================
// Utility Functions
// ==========================================

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get approximate size of chat data in localStorage (in bytes)
 */
export function getChatStorageSize(): number {
  let size = 0;

  try {
    // History list
    const historyData = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    if (historyData) {
      size += historyData.length * 2; // UTF-16 = 2 bytes per char
    }

    // Individual sessions
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEYS.CHAT_SESSION_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          size += data.length * 2;
        }
      }
    }
  } catch (error) {
    console.error('Failed to calculate storage size:', error);
  }

  return size;
}

/**
 * Clear all chat history data from localStorage
 */
export function clearAllChatHistory(): boolean {
  try {
    // Remove history list
    localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);

    // Remove all session data
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEYS.CHAT_SESSION_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error('Failed to clear chat history:', error);
    return false;
  }
}

/**
 * Format relative time for display (e.g., "2m ago", "1h ago", "Yesterday")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  // For older dates, show the actual date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
