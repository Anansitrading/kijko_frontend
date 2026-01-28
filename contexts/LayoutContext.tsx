import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from 'react';

export type PanelPosition = 'left' | 'center' | 'right';
export type RightSidebarTab = 'chats' | 'ingestions';

interface LayoutState {
  leftSidebarCollapsed: boolean;
  chatInputCollapsed: boolean;
  rightSidebarCollapsed: boolean;
  rightSidebarTab: RightSidebarTab;
  panelOrder: [PanelPosition, PanelPosition, PanelPosition];
}

interface LayoutContextValue {
  state: LayoutState;
  toggleLeftSidebar: () => void;
  toggleChatInput: () => void;
  toggleRightSidebar: () => void;
  openChatHistory: () => void;
  closeChatHistory: () => void;
  setPanelOrder: (order: [PanelPosition, PanelPosition, PanelPosition]) => void;
}

const STORAGE_KEY = 'kijko_layout_state';
const OLD_RIGHT_SIDEBAR_KEY = 'kijko_right_sidebar_collapsed';

const DEFAULT_STATE: LayoutState = {
  leftSidebarCollapsed: false,
  chatInputCollapsed: false,
  rightSidebarCollapsed: false,
  rightSidebarTab: 'ingestions',
  panelOrder: ['left', 'center', 'right'],
};

function loadState(): LayoutState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const state = { ...DEFAULT_STATE, ...parsed };
      return state;
    }
    // Migrate old right sidebar collapsed state
    const oldRight = localStorage.getItem(OLD_RIGHT_SIDEBAR_KEY);
    if (oldRight !== null) {
      return { ...DEFAULT_STATE, rightSidebarCollapsed: oldRight === 'true' };
    }
  } catch {
    // ignore
  }
  return DEFAULT_STATE;
}

function saveState(state: LayoutState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LayoutState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const toggleLeftSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, leftSidebarCollapsed: !prev.leftSidebarCollapsed }));
  }, []);

  const toggleChatInput = useCallback(() => {
    setState((prev) => ({ ...prev, chatInputCollapsed: !prev.chatInputCollapsed }));
  }, []);

  const toggleRightSidebar = useCallback(() => {
    setState((prev) => ({
      ...prev,
      rightSidebarCollapsed: !prev.rightSidebarCollapsed,
    }));
  }, []);

  const openChatHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      rightSidebarTab: 'chats',
    }));
  }, []);

  const closeChatHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      rightSidebarTab: 'ingestions',
    }));
  }, []);

  const setPanelOrder = useCallback((order: [PanelPosition, PanelPosition, PanelPosition]) => {
    setState((prev) => ({ ...prev, panelOrder: order }));
  }, []);

  return (
    <LayoutContext.Provider value={{ state, toggleLeftSidebar, toggleChatInput, toggleRightSidebar, openChatHistory, closeChatHistory, setPanelOrder }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout(): LayoutContextValue {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return ctx;
}
