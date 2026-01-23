import { Plus } from 'lucide-react';
import { cn } from '../../utils/cn';

interface NewIngestionButtonProps {
  onClick: () => void;
  className?: string;
}

export function NewIngestionButton({ onClick, className }: NewIngestionButtonProps) {
  return (
    <div className={cn("px-4", className)}>
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center justify-center gap-2",
          "px-4 py-2.5",
          "bg-blue-600 hover:bg-blue-500 active:bg-blue-700",
          "text-white text-sm font-medium",
          "rounded-lg",
          "shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-sidebar"
        )}
      >
        <Plus size={18} className="flex-shrink-0" />
        <span>New Ingestion</span>
      </button>
    </div>
  );
}
