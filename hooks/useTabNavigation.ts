import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type DashboardTabType = 'projects' | 'integrations' | 'skills';

const VALID_TABS: DashboardTabType[] = ['projects', 'integrations', 'skills'];
const DEFAULT_TAB: DashboardTabType = 'projects';
const TAB_PARAM = 'tab';

function isValidTab(value: string | null): value is DashboardTabType {
  return value !== null && VALID_TABS.includes(value as DashboardTabType);
}

export function useTabNavigation() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: DashboardTabType = useMemo(() => {
    const tabParam = searchParams.get(TAB_PARAM);
    return isValidTab(tabParam) ? tabParam : DEFAULT_TAB;
  }, [searchParams]);

  const setActiveTab = useCallback(
    (tab: DashboardTabType) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          if (tab === DEFAULT_TAB) {
            // Remove the tab param if it's the default to keep URLs clean
            newParams.delete(TAB_PARAM);
          } else {
            newParams.set(TAB_PARAM, tab);
          }
          // Clear subtab when switching main tabs so each tab starts fresh
          newParams.delete('subtab');
          return newParams;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Handle keyboard shortcuts (Cmd/Ctrl + 1/2/3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
      const isModifierPressed = e.metaKey || e.ctrlKey;
      if (!isModifierPressed) return;

      // Ignore if focus is in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case '1':
          e.preventDefault();
          setActiveTab('projects');
          break;
        case '2':
          e.preventDefault();
          setActiveTab('integrations');
          break;
        case '3':
          e.preventDefault();
          setActiveTab('skills');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  return {
    activeTab,
    setActiveTab,
    tabs: VALID_TABS,
  };
}
