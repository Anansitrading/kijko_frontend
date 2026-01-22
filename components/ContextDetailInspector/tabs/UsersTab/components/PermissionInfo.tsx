import { Crown, Shield, Edit, Eye, Info } from 'lucide-react';
import { cn } from '../../../../../utils/cn';
import type { UserRole } from '../../../../../types/contextInspector';

const PERMISSION_LEVELS: { role: UserRole; icon: typeof Crown; label: string; description: string; color: string }[] = [
  {
    role: 'owner',
    icon: Crown,
    label: 'Owner',
    description: 'Full control, can delete, manage users',
    color: 'text-yellow-400',
  },
  {
    role: 'admin',
    icon: Shield,
    label: 'Admin',
    description: 'Can ingest, configure, view all activity',
    color: 'text-purple-400',
  },
  {
    role: 'editor',
    icon: Edit,
    label: 'Editor',
    description: 'Can chat, view, suggest changes',
    color: 'text-blue-400',
  },
  {
    role: 'viewer',
    icon: Eye,
    label: 'Viewer',
    description: 'Read-only access, can chat',
    color: 'text-gray-400',
  },
];

interface PermissionInfoProps {
  className?: string;
}

export function PermissionInfo({ className }: PermissionInfoProps) {
  return (
    <div className={cn('bg-white/5 border border-white/10 rounded-lg p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4 text-blue-400" />
        <h4 className="text-sm font-medium text-white">Permission Levels</h4>
      </div>
      <div className="space-y-2">
        {PERMISSION_LEVELS.map(({ role, icon: Icon, label, description, color }) => (
          <div key={role} className="flex items-center gap-3 text-sm">
            <Icon className={cn('w-4 h-4 shrink-0', color)} />
            <span className="text-gray-300">
              <span className="font-medium">{label}:</span>{' '}
              <span className="text-gray-500">{description}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
