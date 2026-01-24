import {
  RefreshCw,
  Eye,
  Zap,
  Settings,
  Download,
  Filter,
  Loader2,
  Clock
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type { ModalFooterProps, TabType } from '../../types/contextInspector';

interface FooterButtonConfig {
  label: string;
  icon: typeof Download;
  variant: 'primary' | 'secondary';
}

const FOOTER_BUTTONS: Record<TabType, { primary: FooterButtonConfig; secondary: FooterButtonConfig }> = {
  overview: {
    primary: { label: 'Export Context Info', icon: Download, variant: 'secondary' },
    secondary: { label: 'Regenerate Summary', icon: RefreshCw, variant: 'secondary' },
  },
  compression: {
    primary: { label: 'Recompress', icon: RefreshCw, variant: 'primary' },
    secondary: { label: 'View Details', icon: Eye, variant: 'secondary' },
  },
  enrichments: {
    primary: { label: 'Run All Enrichments', icon: Zap, variant: 'primary' },
    secondary: { label: 'Configure', icon: Settings, variant: 'secondary' },
  },
  changelog: {
    primary: { label: 'Export Log', icon: Download, variant: 'primary' },
    secondary: { label: 'Filter', icon: Filter, variant: 'secondary' },
  },
};

interface ButtonProps {
  config: FooterButtonConfig;
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

function FooterButton({ config, onClick, isLoading, disabled }: ButtonProps) {
  const Icon = isLoading ? Loader2 : config.icon;

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'flex items-center justify-center gap-2 h-9 px-4 rounded-md',
        'font-medium text-sm transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        config.variant === 'primary'
          ? 'bg-blue-500 hover:bg-blue-600 text-white'
          : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
      )}
    >
      <Icon className={cn('w-4 h-4', isLoading && 'animate-spin')} />
      {config.label}
    </button>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return 'Just now';
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export function ModalFooter({
  activeTab,
  onPrimaryAction,
  onSecondaryAction,
  isLoading,
  lastUpdated
}: ModalFooterProps) {
  const buttons = FOOTER_BUTTONS[activeTab];

  return (
    <div className="flex items-center justify-between px-6 h-16 border-t border-white/10 shrink-0">
      {/* Updated timestamp - left side */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        {lastUpdated && (
          <>
            <Clock className="w-3 h-3" />
            <span>Updated: {formatRelativeTime(lastUpdated)}</span>
          </>
        )}
      </div>

      {/* Action buttons - right side */}
      <div className="flex items-center gap-3">
        <FooterButton
          config={buttons.secondary}
          onClick={onSecondaryAction}
        />
        <FooterButton
          config={buttons.primary}
          onClick={onPrimaryAction}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
