import { FileQuestion, Search, Users, Activity, FolderOpen, Inbox } from 'lucide-react';
import { cn } from '../../utils/cn';

type EmptyStateVariant = 'default' | 'search' | 'users' | 'activity' | 'files' | 'inbox';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const variantIcons: Record<EmptyStateVariant, typeof FileQuestion> = {
  default: FileQuestion,
  search: Search,
  users: Users,
  activity: Activity,
  files: FolderOpen,
  inbox: Inbox,
};

export function EmptyState({
  variant = 'default',
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  const Icon = variantIcons[variant];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}
    >
      {/* Icon */}
      <div className="mb-4">
        {icon || (
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <Icon className="w-8 h-8 text-gray-500" />
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-400 max-w-md mb-6">{description}</p>
      )}

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'inline-flex items-center justify-center gap-2',
            'h-9 px-4 rounded-md',
            'bg-blue-500 hover:bg-blue-600 text-white',
            'font-medium text-sm',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/50'
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Pre-configured empty states
export function NoSearchResults({ query, onClear }: { query: string; onClear?: () => void }) {
  return (
    <EmptyState
      variant="search"
      title="No results found"
      description={`No matches for "${query}". Try adjusting your search terms.`}
      action={onClear ? { label: 'Clear search', onClick: onClear } : undefined}
    />
  );
}

export function NoUsers({ onInvite }: { onInvite?: () => void }) {
  return (
    <EmptyState
      variant="users"
      title="No users yet"
      description="Invite team members to collaborate on this context."
      action={onInvite ? { label: 'Invite users', onClick: onInvite } : undefined}
    />
  );
}

export function NoActivity() {
  return (
    <EmptyState
      variant="activity"
      title="No activity yet"
      description="Activity will appear here as users interact with this context."
    />
  );
}

export function NoFiles({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      variant="files"
      title="No files"
      description="Upload files to get started with this context."
      action={onUpload ? { label: 'Upload files', onClick: onUpload } : undefined}
    />
  );
}
