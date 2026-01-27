import { FileCode, FileJson, FileText, FileType, File, Braces } from 'lucide-react';
import { cn } from '../../utils/cn';
import { SourceFile } from '../../contexts/SourceFilesContext';

interface SourceFileItemProps {
  file: SourceFile;
  isSelected: boolean;
  onToggle: () => void;
}

function FileTypeIcon({ type }: { type: SourceFile['type'] }) {
  const iconClass = "flex-shrink-0";

  switch (type) {
    case 'typescript':
      return <FileCode size={16} className={cn(iconClass, "text-blue-400")} />;
    case 'javascript':
      return <FileCode size={16} className={cn(iconClass, "text-yellow-400")} />;
    case 'json':
      return <Braces size={16} className={cn(iconClass, "text-amber-400")} />;
    case 'markdown':
      return <FileText size={16} className={cn(iconClass, "text-slate-400")} />;
    case 'css':
      return <FileType size={16} className={cn(iconClass, "text-pink-400")} />;
    case 'html':
      return <FileCode size={16} className={cn(iconClass, "text-orange-400")} />;
    case 'python':
      return <FileCode size={16} className={cn(iconClass, "text-green-400")} />;
    default:
      return <File size={16} className={cn(iconClass, "text-slate-500")} />;
  }
}

export function SourceFileItem({ file, isSelected, onToggle }: SourceFileItemProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer",
        "transition-colors duration-150",
        "hover:bg-sidebar-accent/50",
        isSelected && "bg-sidebar-accent/30"
      )}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        className={cn(
          "w-4 h-4 rounded border-2 flex-shrink-0",
          "bg-transparent border-slate-500",
          "checked:bg-blue-600 checked:border-blue-600",
          "focus:ring-2 focus:ring-blue-500 focus:ring-offset-0",
          "transition-colors cursor-pointer"
        )}
      />

      {/* File Type Icon */}
      <FileTypeIcon type={file.type} />

      {/* File Name */}
      <span
        className={cn(
          "flex-1 text-sm truncate",
          isSelected ? "text-sidebar-foreground" : "text-muted-foreground"
        )}
        title={file.name}
      >
        {file.name}
      </span>
    </label>
  );
}
