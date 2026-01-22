import { Search, X } from 'lucide-react';
import { cn } from '../../../../../utils/cn';

interface UserSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function UserSearch({
  value,
  onChange,
  placeholder = 'Search users...',
  className,
}: UserSearchProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg',
          'text-white text-sm placeholder-gray-500',
          'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
          'transition-colors duration-150'
        )}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      )}
    </div>
  );
}
