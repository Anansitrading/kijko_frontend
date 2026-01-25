// Context Detail Inspector Modal
// Main modal component for viewing and managing context details
// Sprint 1-8: Complete implementation with all tabs and features

import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { useContextInspector } from '../../contexts/ContextInspectorContext';
import { useRealtime } from '../../contexts/RealtimeContext';
import { ModalHeader } from './ModalHeader';
import { TabNavigation } from './TabNavigation';
import { ModalFooter } from './ModalFooter';
import { ModalErrorBoundary } from './ErrorBoundary';
import { useKeyboardShortcuts, useFocusTrap, useClickOutside } from './hooks';
import { SearchModal, KnowledgeGraphModal, CompressionSettingsModal, LSPConfigModal, ChromaCodeConfigModal } from './modals';
import { ConnectionStatus } from './common';
import { OverviewTab } from './tabs/OverviewTab';
import { CompressionTab } from './tabs/CompressionTab';
import { EnrichmentsTab } from './tabs/EnrichmentsTab';
import { ShareModal } from './modals/ShareModal';
import { exportContextInfo, downloadOriginalFiles } from '../../services/export';
import type { TabType, SearchResult, CompressionSettings, LSPConfig, ChromaCodeConfig } from '../../types/contextInspector';
import { tabConfig } from '../../styles/contextInspector';

export function ContextDetailInspector() {
  const { state, closeModal, setTab, updateContextName } = useContextInspector();
  const { connected, connecting, connect, disconnect } = useRealtime();
  const modalRef = useRef<HTMLDivElement>(null);

  // Sub-modal states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isKGModalOpen, setIsKGModalOpen] = useState(false);
  const [isCompressionSettingsOpen, setIsCompressionSettingsOpen] = useState(false);
  const [isLSPConfigOpen, setIsLSPConfigOpen] = useState(false);
  const [isChromaCodeConfigOpen, setIsChromaCodeConfigOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Loading state for footer actions
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Focus trap for accessibility
  useFocusTrap(modalRef, state.isOpen && !isSearchOpen);

  // Click outside to close
  useClickOutside({
    ref: modalRef,
    isOpen: state.isOpen && !isSearchOpen,
    onClickOutside: closeModal,
  });

  // Keyboard shortcuts
  useKeyboardShortcuts(
    {
      onSearch: () => setIsSearchOpen(true),
      onClose: () => {
        if (isSearchOpen) {
          setIsSearchOpen(false);
        } else {
          closeModal();
        }
      },
      onEscape: () => {
        if (isSearchOpen) {
          setIsSearchOpen(false);
        } else if (isKGModalOpen) {
          setIsKGModalOpen(false);
        } else if (isCompressionSettingsOpen) {
          setIsCompressionSettingsOpen(false);
        } else if (isLSPConfigOpen) {
          setIsLSPConfigOpen(false);
        } else if (isChromaCodeConfigOpen) {
          setIsChromaCodeConfigOpen(false);
        } else if (isShareModalOpen) {
          setIsShareModalOpen(false);
        } else {
          closeModal();
        }
      },
      onTabSwitch: (index) => {
        const tab = tabConfig[index];
        if (tab) {
          setTab(tab.id as TabType);
        }
      },
    },
    state.isOpen
  );

  // Connect to realtime updates when modal opens
  useEffect(() => {
    if (state.isOpen && state.contextItem) {
      connect(state.contextItem.id).catch(console.error);
    }
    return () => {
      if (state.isOpen) {
        disconnect();
      }
    };
  }, [state.isOpen, state.contextItem?.id, connect, disconnect]);

  // Handle search result selection
  const handleSearchResultSelect = useCallback((result: SearchResult) => {
    setTab(result.tab);
    setIsSearchOpen(false);
  }, [setTab]);

  // Tab-specific footer actions
  const handlePrimaryAction = useCallback(async () => {
    if (!state.contextItem) return;
    setIsActionLoading(true);

    try {
      switch (state.activeTab) {
        case 'overview':
          // Regenerate summary (mock)
          await new Promise((resolve) => setTimeout(resolve, 1000));
          console.log('Summary regenerated');
          break;
        case 'compression':
          // Recompress (mock)
          await new Promise((resolve) => setTimeout(resolve, 1500));
          console.log('Recompression started');
          break;
        case 'enrichments':
          // Run all enrichments (mock)
          await new Promise((resolve) => setTimeout(resolve, 1000));
          console.log('Enrichments started');
          break;
      }
    } finally {
      setIsActionLoading(false);
    }
  }, [state.activeTab, state.contextItem]);

  const handleSecondaryAction = useCallback(async () => {
    if (!state.contextItem) return;

    switch (state.activeTab) {
      case 'overview':
        // Export context info
        exportContextInfo(state.contextItem);
        break;
      case 'compression':
        // Download original files
        setIsActionLoading(true);
        try {
          await downloadOriginalFiles(state.contextItem.id);
        } finally {
          setIsActionLoading(false);
        }
        break;
      case 'enrichments':
        // Configure - open settings modal
        setIsCompressionSettingsOpen(true);
        break;
    }
  }, [state.activeTab, state.contextItem]);

  // Settings modal handlers
  const handleSaveCompressionSettings = useCallback((settings: CompressionSettings) => {
    console.log('Saving compression settings:', settings);
    setIsCompressionSettingsOpen(false);
  }, []);

  const handleSaveLSPConfig = useCallback((config: LSPConfig) => {
    console.log('Saving LSP config:', config);
    setIsLSPConfigOpen(false);
  }, []);

  const handleSaveChromaCodeConfig = useCallback((config: ChromaCodeConfig) => {
    console.log('Saving ChromaCode config:', config);
    setIsChromaCodeConfigOpen(false);
  }, []);

  if (!state.isOpen || !state.contextItem) {
    return null;
  }

  const renderTabContent = () => {
    switch (state.activeTab) {
      case 'overview':
        return <OverviewTab contextItem={state.contextItem!} />;
      case 'compression':
        return <CompressionTab contextItem={state.contextItem!} />;
      case 'enrichments':
        return <EnrichmentsTab contextId={state.contextItem!.id} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center',
          'bg-background/80 backdrop-blur-sm',
          'animate-in fade-in duration-200'
        )}
      >
        {/* Modal Container */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className={cn(
            'relative w-[900px] max-w-[95vw] h-[700px] max-h-[90vh]',
            'bg-card border border-border rounded-xl',
            'shadow-2xl overflow-hidden',
            'flex flex-col',
            'animate-in fade-in zoom-in-95 duration-200'
          )}
        >
          <ModalErrorBoundary>
            {/* Header */}
            <ModalHeader
              contextName={state.contextItem.name}
              contextType={state.contextItem.type}
              onClose={closeModal}
              onNameChange={updateContextName}
              onShare={() => setIsShareModalOpen(true)}
            />

            {/* Tab Navigation */}
            <div className="relative">
              <TabNavigation activeTab={state.activeTab} onTabChange={setTab} />
              {/* Connection Status */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                <ConnectionStatus connected={connected} connecting={connecting} />
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {renderTabContent()}
            </div>

            {/* Footer */}
            <ModalFooter
              activeTab={state.activeTab}
              onPrimaryAction={handlePrimaryAction}
              onSecondaryAction={handleSecondaryAction}
              isLoading={isActionLoading}
              lastUpdated={state.contextItem.lastUpdated}
            />
          </ModalErrorBoundary>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        contextId={state.contextItem.id}
        onResultSelect={handleSearchResultSelect}
      />

      {/* Knowledge Graph Modal */}
      <KnowledgeGraphModal
        isOpen={isKGModalOpen}
        onClose={() => setIsKGModalOpen(false)}
        contextId={state.contextItem.id}
      />

      {/* Settings Modals */}
      <CompressionSettingsModal
        isOpen={isCompressionSettingsOpen}
        onClose={() => setIsCompressionSettingsOpen(false)}
        onSave={handleSaveCompressionSettings}
        currentSettings={{
          method: 'hypervisa',
          preserveStructure: true,
          preserveTypes: true,
          preserveExports: true,
          preserveDocs: false,
          optimizationLevel: 'medium',
        }}
      />

      <LSPConfigModal
        isOpen={isLSPConfigOpen}
        onClose={() => setIsLSPConfigOpen(false)}
        onSave={handleSaveLSPConfig}
        currentConfig={{
          enableGoToDefinition: true,
          enableAutoCompletion: true,
          enableTypeInference: true,
          excludePatterns: ['node_modules/**', 'dist/**'],
          maxFileSize: 1024 * 1024,
        }}
      />

      <ChromaCodeConfigModal
        isOpen={isChromaCodeConfigOpen}
        onClose={() => setIsChromaCodeConfigOpen(false)}
        onSave={handleSaveChromaCodeConfig}
        currentConfig={{
          embeddingModel: 'text-embedding-3-small',
          chunkStrategy: 'semantic',
          chunkSize: 512,
          overlap: 50,
          excludePatterns: ['*.min.js', '*.bundle.js'],
        }}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        projectId={state.contextItem.id}
        projectName={state.contextItem.name}
      />
    </>
  );
}

export default ContextDetailInspector;
