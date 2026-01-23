import { Plus } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AddFilesButtonProps {
  onClick: () => void;
  className?: string;
}

export function AddFilesButton({ onClick, className }: AddFilesButtonProps) {
  return (
    <div className={cn("px-4 py-2", className)}>
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center justify-center gap-2",
          "px-3 py-2",
          "text-muted-foreground hover:text-sidebar-foreground",
          "text-sm font-medium",
          "rounded-lg border border-dashed border-slate-600 hover:border-slate-500",
          "hover:bg-sidebar-accent/30",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        )}
      >
        <Plus size={16} className="flex-shrink-0" />
        <span>Add Files</span>
      </button>
    </div>
  );
}
