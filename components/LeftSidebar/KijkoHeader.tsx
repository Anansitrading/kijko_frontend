import { X } from 'lucide-react';

interface KijkoHeaderProps {
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function KijkoHeader({ onClose, showCloseButton = false }: KijkoHeaderProps) {
  return (
    <div className="p-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
          <span className="font-bold text-primary-foreground text-lg">K</span>
        </div>
        <div>
          <h1 className="font-bold text-sidebar-foreground tracking-tight">KIJKO</h1>
          <p className="text-xs text-muted-foreground font-mono">
            CMD_CENTER_v2.1
          </p>
        </div>
      </div>
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="md:hidden text-muted-foreground hover:text-sidebar-foreground transition-colors"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
}
