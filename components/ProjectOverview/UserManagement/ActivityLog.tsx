// User Management - Activity log sub-components

import { useState, useEffect, useRef } from 'react';
import {
  Eye,
  MessageSquare,
  Database,
  Shield,
  Settings,
  Filter,
  Calendar,
  Clock,
  ChevronDown,
  Info,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { ActivityEvent, ActivityEventType, TimeRange } from './shared';
import { EVENT_CONFIG, ROLE_CONFIG, ROLE_ORDER, formatTimestamp } from './shared';

// ============================================
// Filter Options
// ============================================

const TYPE_OPTIONS: {
  value: ActivityEventType | 'all';
  label: string;
  icon: typeof Eye;
}[] = [
  { value: 'all', label: 'All Activity', icon: Filter },
  { value: 'view', label: 'Views', icon: Eye },
  { value: 'chat', label: 'Chats', icon: MessageSquare },
  { value: 'ingestion', label: 'Ingestions', icon: Database },
  { value: 'permission', label: 'Permissions', icon: Shield },
  { value: 'config', label: 'Config Changes', icon: Settings },
];

const TIME_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

// ============================================
// FilterDropdown Component
// ============================================

interface FilterDropdownProps {
  value: string;
  options: { value: string; label: string; icon?: typeof Eye }[];
  onChange: (value: string) => void;
  icon?: typeof Eye;
}

function FilterDropdown({
  value,
  options,
  onChange,
  icon: ButtonIcon,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors text-sm',
          'bg-white/5 border-white/10 hover:border-white/20 text-gray-300'
        )}
      >
        {ButtonIcon && <ButtonIcon className="w-3.5 h-3.5 text-gray-400" />}
        <span className="hidden sm:inline">{selectedOption?.label}</span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 min-w-[160px] bg-[#1a1f26] border border-white/10 rounded-lg shadow-lg z-[60] overflow-hidden">
          {options.map((option) => {
            const OptionIcon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors text-sm',
                  option.value === value ? 'text-white bg-white/5' : 'text-gray-400'
                )}
              >
                {OptionIcon && <OptionIcon className="w-3.5 h-3.5" />}
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// ActivityFilter Component
// ============================================

interface ActivityFilterProps {
  typeFilter: ActivityEventType | 'all';
  onTypeFilterChange: (type: ActivityEventType | 'all') => void;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

export function ActivityFilter({
  typeFilter,
  onTypeFilterChange,
  timeRange,
  onTimeRangeChange,
}: ActivityFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <FilterDropdown
        value={typeFilter}
        options={TYPE_OPTIONS}
        onChange={(v) => onTypeFilterChange(v as ActivityEventType | 'all')}
        icon={Filter}
      />
      <FilterDropdown
        value={timeRange}
        options={TIME_OPTIONS}
        onChange={(v) => onTimeRangeChange(v as TimeRange)}
        icon={Calendar}
      />
    </div>
  );
}

// ============================================
// ActivityEventComponent
// ============================================

interface ActivityEventComponentProps {
  event: ActivityEvent;
}

export function ActivityEventComponent({ event }: ActivityEventComponentProps) {
  const config = EVENT_CONFIG[event.type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors">
      <div className={cn('p-2 rounded-lg shrink-0', config.bgColor)}>
        <Icon className={cn('w-4 h-4', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm">
          <span className="font-medium">{event.user.name}</span>{' '}
          <span className="text-gray-400">{event.description}</span>
        </p>
        <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-xs">
          <Clock className="w-3 h-3" />
          <span>{formatTimestamp(event.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PermissionInfo Component
// ============================================

export function PermissionInfo() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4 text-blue-400" />
        <h4 className="text-sm font-medium text-white">Permission Levels</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ROLE_ORDER.map((role) => {
          const { icon: Icon, label, description, color } = ROLE_CONFIG[role];
          return (
            <div key={role} className="flex items-center gap-2 text-sm">
              <Icon className={cn('w-4 h-4 shrink-0', color)} />
              <span className="text-gray-300">
                <span className="font-medium">{label}:</span>{' '}
                <span className="text-gray-500 text-xs">{description}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// LoadingSkeleton Component
// ============================================

export function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-white/5 rounded-lg w-full" />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-white/5 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
