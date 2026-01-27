import { useState, useRef, useEffect, useCallback } from 'react';
import {
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  PanelBottomClose,
  PanelBottomOpen,
  PanelRightClose,
  PanelRightOpen,
  Globe,
  Share2,
} from 'lucide-react';
import { useLayout } from '../../contexts/LayoutContext';
import { LayoutCustomizePopover } from './LayoutCustomizePopover';
import { cn } from '../../utils/cn';

const btnBase =
  'p-1.5 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/50';

interface HeaderLayoutControlsProps {
  projectId?: string;
  onShare?: () => void;
}

export function HeaderLayoutControls({ projectId, onShare }: HeaderLayoutControlsProps) {
  const { state, toggleLeftSidebar, toggleChatInput, toggleRightSidebar } = useLayout();
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const customizeRef = useRef<HTMLDivElement>(null);

  const handleOpenPreview = useCallback(() => {
    if (!projectId) return;
    window.open(`https://app.kijko.nl/preview/${projectId}`, '_blank', 'noopener,noreferrer');
  }, [projectId]);

  // Close popover on Escape
  useEffect(() => {
    if (!isCustomizeOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCustomizeOpen(false);
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isCustomizeOpen]);

  // Map visual positions to the actual content panels based on panelOrder.
  // panelOrder[0] = visually leftmost, panelOrder[2] = visually rightmost.
  const visualLeftPanel = state.panelOrder[0];   // content at visual left
  const visualRightPanel = state.panelOrder[2];  // content at visual right

  // Determine toggle function and collapsed state for the visual left position
  const toggleVisualLeft = visualLeftPanel === 'left' ? toggleLeftSidebar
    : visualLeftPanel === 'right' ? toggleRightSidebar
    : undefined;
  const isVisualLeftCollapsed = visualLeftPanel === 'left' ? state.leftSidebarCollapsed
    : visualLeftPanel === 'right' ? state.rightSidebarCollapsed
    : false;

  // Determine toggle function and collapsed state for the visual right position
  const toggleVisualRight = visualRightPanel === 'right' ? toggleRightSidebar
    : visualRightPanel === 'left' ? toggleLeftSidebar
    : undefined;
  const isVisualRightCollapsed = visualRightPanel === 'right' ? state.rightSidebarCollapsed
    : visualRightPanel === 'left' ? state.leftSidebarCollapsed
    : false;

  return (
    <div className="flex items-center gap-0.5">
      {/* 0. Share */}
      {onShare && (
        <button
          onClick={onShare}
          className={cn(btnBase, 'text-gray-400 hover:text-white hover:bg-white/10')}
          title="Share project"
          aria-label="Share project"
        >
          <Share2 className="w-4 h-4" />
        </button>
      )}

      {/* 1. Preview in browser */}
      <button
        onClick={handleOpenPreview}
        disabled={!projectId}
        className={cn(btnBase, 'text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed')}
        title="Preview project in new tab"
        aria-label="Preview project in new tab"
      >
        <Globe className="w-4 h-4" />
      </button>

      {/* 1. Customize Layout */}
      <div ref={customizeRef} className="relative">
        <button
          onClick={() => setIsCustomizeOpen((v) => !v)}
          className={cn(btnBase, isCustomizeOpen ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/10')}
          title="Customize layout"
          aria-label="Customize layout"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        {isCustomizeOpen && (
          <LayoutCustomizePopover onClose={() => setIsCustomizeOpen(false)} />
        )}
      </div>

      {/* 2. Toggle visual left panel */}
      {toggleVisualLeft && (
        <button
          onClick={toggleVisualLeft}
          className={cn(btnBase, isVisualLeftCollapsed ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-white hover:bg-white/10')}
          title={isVisualLeftCollapsed ? 'Show left panel' : 'Hide left panel'}
          aria-label={isVisualLeftCollapsed ? 'Show left panel' : 'Hide left panel'}
        >
          {isVisualLeftCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      )}

      {/* 3. Toggle Chat Input */}
      <button
        onClick={toggleChatInput}
        className={cn(btnBase, state.chatInputCollapsed ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-white hover:bg-white/10')}
        title={state.chatInputCollapsed ? 'Show chat input' : 'Hide chat input'}
        aria-label={state.chatInputCollapsed ? 'Show chat input' : 'Hide chat input'}
      >
        {state.chatInputCollapsed ? <PanelBottomOpen className="w-4 h-4" /> : <PanelBottomClose className="w-4 h-4" />}
      </button>

      {/* 4. Toggle visual right panel */}
      {toggleVisualRight && (
        <button
          onClick={toggleVisualRight}
          className={cn(btnBase, isVisualRightCollapsed ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-white hover:bg-white/10')}
          title={isVisualRightCollapsed ? 'Show right panel' : 'Hide right panel'}
          aria-label={isVisualRightCollapsed ? 'Show right panel' : 'Hide right panel'}
        >
          {isVisualRightCollapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
