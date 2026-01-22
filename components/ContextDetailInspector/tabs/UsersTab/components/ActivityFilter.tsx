import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Eye, MessageSquare, Database, Shield, Settings, Filter, Calendar } from 'lucide-react';
import { cn } from '../../../../../utils/cn';
import type { ActivityEventType, TimeRange } from '../../../../../types/contextInspector';

const TYPE_OPTIONS: { value: ActivityEventType | 'all'; label: string; icon: typeof Eye }[] = [
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

interface DropdownProps {
  value: string;
  options: { value: string; label: string; icon?: typeof Eye }[];
  onChange: (value: string) => void;
  icon?: typeof Eye;
}

function Dropdown({ value, options, onChange, icon: ButtonIcon }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
        <span>{selectedOption?.label}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 min-w-[160px] bg-[#1a1f26] border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
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
      <Dropdown
        value={typeFilter}
        options={TYPE_OPTIONS}
        onChange={(v) => onTypeFilterChange(v as ActivityEventType | 'all')}
        icon={Filter}
      />
      <Dropdown
        value={timeRange}
        options={TIME_OPTIONS}
        onChange={(v) => onTimeRangeChange(v as TimeRange)}
        icon={Calendar}
      />
    </div>
  );
}
