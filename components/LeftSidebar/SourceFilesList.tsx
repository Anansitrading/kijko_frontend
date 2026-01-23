import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useSourceFiles, formatFileSize } from '../../contexts/SourceFilesContext';
import { SourceFileItem } from './SourceFileItem';

interface SourceFilesListProps {
  className?: string;
}

export function SourceFilesList({ className }: SourceFilesListProps) {
  const {
    files,
    selectedFileIds,
    selectedCount,
    totalCount,
    selectedSize,
    isAllSelected,
    toggleFileSelection,
    selectAll,
    deselectAll,
  } = useSourceFiles();

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Section Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Select All Checkbox */}
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={handleSelectAllToggle}
            className={cn(
              "w-4 h-4 rounded border-2 flex-shrink-0",
              "bg-transparent border-slate-500",
              "checked:bg-blue-600 checked:border-blue-600",
              "focus:ring-2 focus:ring-blue-500 focus:ring-offset-0",
              "transition-colors cursor-pointer"
            )}
            title={isAllSelected ? "Deselect all" : "Select all"}
          />
          <span className="text-sm font-medium text-sidebar-foreground">
            Source Files
          </span>
          <ChevronDown size={16} className="text-muted-foreground" />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span className="text-blue-400">{selectedCount}/{totalCount}</span>
          <span className="text-slate-500">•</span>
          <span>{formatFileSize(selectedSize)}</span>
        </div>
      </div>

      {/* Scrollable Files List */}
      <div className="flex-1 overflow-y-auto px-1 custom-scrollbar">
        <div className="space-y-0.5">
          {files.map((file) => (
            <SourceFileItem
              key={file.id}
              file={file}
              isSelected={selectedFileIds.has(file.id)}
              onToggle={() => toggleFileSelection(file.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
