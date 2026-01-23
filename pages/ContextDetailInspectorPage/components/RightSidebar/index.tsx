import { useState, useEffect, useCallback } from 'react';
import { Download, ChevronLeft, FileJson, FileText } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { ChatHistoryPanel } from '../../../../components/ContextDetailInspector/tabs/OverviewTab/ChatHistoryPanel';
import { useChatHistory } from '../../../../contexts/ChatHistoryContext';

// ==========================================
// Constants
// ==========================================

const STORAGE_KEY = 'kijko_right_sidebar_collapsed';
const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 48;
const TRANSITION_DURATION = 300; // ms

// ==========================================
// Export Format Types
// ==========================================

type ExportFormat = 'json' | 'markdown';

interface ExportDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
}

function ExportDropdown({ isOpen, onClose, onExport }: ExportDropdownProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full left-0 right-0 mb-1 z-50 bg-[#1a1f2e] border border-white/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
        <button
          onClick={() => onExport('json')}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/10 transition-colors"
        >
          <FileJson size={14} className="text-blue-400" />
          <span>Export as JSON</span>
        </button>
        <button
          onClick={() => onExport('markdown')}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/10 transition-colors"
        >
          <FileText size={14} className="text-green-400" />
          <span>Export as Markdown</span>
        </button>
      </div>
    </>
  );
}

// ==========================================
// Props Interface
// ==========================================

interface RightSidebarProps {
  className?: string;
  onWidthChange?: (width: number) => void;
}

// ==========================================
// Main Component
// ==========================================

export function RightSidebar({ className, onWidthChange }: RightSidebarProps) {
  const { state, getCurrentSession } = useChatHistory();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Load initial state from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'true';
    }
    return false;
  });
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Persist collapse state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed));
    onWidthChange?.(isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH);
  }, [isCollapsed, onWidthChange]);

  // Notify parent of initial width
  useEffect(() => {
    onWidthChange?.(isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH);
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // Export functionality
  const handleExport = useCallback(async (format: ExportFormat) => {
    setShowExportDropdown(false);

    try {
      const session = getCurrentSession();
      const exportData = {
        exportedAt: new Date().toISOString(),
        chatSession: session ? {
          id: session.id,
          title: session.metadata.title,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          messageCount: session.messages.length,
          messages: session.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          sourceFiles: session.sourceFiles.map(file => ({
            name: file.name,
            path: file.path,
            type: file.type,
            size: file.size,
          })),
        } : null,
        totalChats: state.historyItems.length,
      };

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        content = JSON.stringify(exportData, null, 2);
        filename = `context-export-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        // Markdown format
        const lines: string[] = [
          '# Context Export',
          '',
          `**Exported:** ${new Date().toLocaleString()}`,
          `**Total Chats:** ${exportData.totalChats}`,
          '',
        ];

        if (exportData.chatSession) {
          lines.push(
            '## Current Chat Session',
            '',
            `**Title:** ${exportData.chatSession.title}`,
            `**Created:** ${new Date(exportData.chatSession.createdAt).toLocaleString()}`,
            `**Messages:** ${exportData.chatSession.messageCount}`,
            '',
          );

          if (exportData.chatSession.sourceFiles.length > 0) {
            lines.push('### Source Files', '');
            exportData.chatSession.sourceFiles.forEach(file => {
              const sizeKB = Math.round(file.size / 1024);
              lines.push(`- ${file.name} (${file.path || 'unknown path'}) - ${sizeKB}KB`);
            });
            lines.push('');
          }

          if (exportData.chatSession.messages.length > 0) {
            lines.push('### Conversation', '');
            exportData.chatSession.messages.forEach(msg => {
              const role = msg.role === 'user' ? '**User**' : '**Assistant**';
              lines.push(`${role}:`);
              lines.push('');
              lines.push(msg.content);
              lines.push('');
              lines.push('---');
              lines.push('');
            });
          }
        } else {
          lines.push('*No active chat session*', '');
        }

        content = lines.join('\n');
        filename = `context-export-${new Date().toISOString().split('T')[0]}.md`;
        mimeType = 'text/markdown';
      }

      // Create and trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportFeedback({ type: 'success', message: 'Export successful!' });
      setTimeout(() => setExportFeedback(null), 3000);
    } catch (error) {
      setExportFeedback({ type: 'error', message: 'Export failed. Please try again.' });
      setTimeout(() => setExportFeedback(null), 3000);
    }
  }, [getCurrentSession, state.historyItems.length]);

  const currentWidth = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <aside
      className={cn(
        'h-full bg-[#0d1220] border-l border-[#1e293b] flex flex-col overflow-hidden',
        'transition-all ease-out',
        className
      )}
      style={{
        width: currentWidth,
        minWidth: currentWidth,
        transitionDuration: `${TRANSITION_DURATION}ms`,
      }}
    >
      {isCollapsed ? (
        // Collapsed state
        <div
          className="flex-1 flex flex-col items-center py-4 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={handleToggleCollapse}
          role="button"
          aria-label="Expand chat history sidebar"
        >
          <ChevronLeft size={16} className="text-gray-400 mb-3" />
          <div
            className="text-[10px] font-semibold uppercase tracking-wider text-gray-500"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            History
          </div>
          <div className="mt-2 text-[10px] text-gray-600">
            {state.historyItems.length}
          </div>
        </div>
      ) : (
        // Expanded state
        <>
          {/* Chat History Panel */}
          <div className="flex-1 overflow-hidden">
            <ChatHistoryPanel
              isCollapsed={false}
              onToggleCollapse={handleToggleCollapse}
            />
          </div>

          {/* Export Button */}
          <div className="shrink-0 p-3 border-t border-white/10">
            <div className="relative">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md",
                  "bg-white/5 hover:bg-white/10 border border-white/10",
                  "text-gray-300 hover:text-white text-xs font-medium transition-colors"
                )}
                aria-label="Export context"
              >
                <Download size={14} />
                <span>Export Context</span>
              </button>

              <ExportDropdown
                isOpen={showExportDropdown}
                onClose={() => setShowExportDropdown(false)}
                onExport={handleExport}
              />
            </div>

            {/* Export feedback toast */}
            {exportFeedback && (
              <div
                className={cn(
                  "mt-2 px-3 py-2 rounded-md text-xs text-center animate-in fade-in duration-200",
                  exportFeedback.type === 'success'
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                )}
              >
                {exportFeedback.message}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}

export default RightSidebar;
