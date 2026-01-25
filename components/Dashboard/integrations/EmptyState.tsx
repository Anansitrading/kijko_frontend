// EmptyState Component for Integrations Tab
// Shows when no integrations are connected or found

import { Link2, Zap, Search, PlugZap } from 'lucide-react';

interface EmptyStateProps {
  variant: 'no-integrations' | 'no-results' | 'no-custom';
  onAction?: () => void;
  searchQuery?: string;
}

export function EmptyState({ variant, onAction, searchQuery }: EmptyStateProps) {
  const config = {
    'no-integrations': {
      icon: PlugZap,
      title: 'No connected integrations',
      description: 'Connect your favorite apps to extend functionality and sync data.',
      actionLabel: 'Browse Integrations',
    },
    'no-results': {
      icon: Search,
      title: 'No integrations found',
      description: searchQuery
        ? `No integrations match "${searchQuery}". Try a different search term.`
        : "Try adjusting your filters to find what you're looking for.",
      actionLabel: 'Clear Filters',
    },
    'no-custom': {
      icon: Zap,
      title: 'No custom connectors',
      description: 'Create your own MCP server integrations to connect to any service.',
      actionLabel: '+ Add Custom Connector',
    },
  };

  const { icon: Icon, title, description, actionLabel } = config[variant];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-4 bg-muted/50 rounded-xl border border-border mb-4">
        <Icon size={40} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors"
        >
          {variant === 'no-integrations' && <Link2 size={18} />}
          {variant === 'no-custom' && <Zap size={18} />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
