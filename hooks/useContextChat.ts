import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChatMessage } from '../types/contextInspector';

// Mock responses for development
const mockResponses = [
  "Based on my analysis of this codebase, the main entry point is the ContextDetailInspector component which orchestrates all the tab views.",
  "The compression system uses the Hypervisa algorithm to optimize token usage. You can find the metrics in the CompressionTab component.",
  "This context contains 847 files with a total size of 2.4MB. The most common file types are TypeScript (.tsx, .ts) files.",
  "The enrichment pipeline includes three main features: Knowledge Graph for entity relationships, LSP for code intelligence, and ChromaCode for semantic search.",
  "User permissions are managed through a role-based system with four levels: owner, admin, editor, and viewer. Each role has different access capabilities.",
];

interface UseContextChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
}

export function useContextChat(contextId: string): UseContextChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const responseIndexRef = useRef(0);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 300));

        // In production, this would be:
        // const response = await fetch(`/api/context/${contextId}/chat`);
        // const data = await response.json();

        // For now, start with empty history
        setMessages([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chat history');
      }
    };

    loadHistory();
  }, [contextId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setIsLoading(true);
      setError(null);

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

        // In production, this would be:
        // const response = await fetch(`/api/context/${contextId}/chat`, {
        //   method: 'POST',
        //   body: JSON.stringify({ message: content }),
        // });
        // const data = await response.json();

        // Get mock response (cycle through)
        const responseContent = mockResponses[responseIndexRef.current % mockResponses.length];
        responseIndexRef.current++;

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: responseContent,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
      } finally {
        setIsLoading(false);
      }
    },
    [contextId]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  };
}
