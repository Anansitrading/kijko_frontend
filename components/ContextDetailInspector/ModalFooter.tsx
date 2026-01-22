import {
  MessageSquare,
  RefreshCw,
  Eye,
  Zap,
  Settings,
  UserPlus,
  Users,
  Download,
  Filter,
  Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type { ModalFooterProps, TabType } from '../../types/contextInspector';

interface FooterButtonConfig {
  label: string;
  icon: typeof MessageSquare;
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
  users: {
    primary: { label: 'Invite User', icon: UserPlus, variant: 'primary' },
    secondary: { label: 'Manage Roles', icon: Users, variant: 'secondary' },
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

export function ModalFooter({
  activeTab,
  onPrimaryAction,
  onSecondaryAction,
  isLoading
}: ModalFooterProps) {
  const buttons = FOOTER_BUTTONS[activeTab];

  return (
    <div className="flex items-center justify-end gap-3 px-6 h-16 border-t border-white/10 shrink-0">
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
  );
}
