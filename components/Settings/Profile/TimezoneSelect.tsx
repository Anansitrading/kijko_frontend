import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Clock, ChevronDown, Check } from 'lucide-react';
import { useSettings } from '../../../contexts/SettingsContext';
import { useAutoSave } from '../../../hooks/useAutoSave';
import {
  timezoneData,
  searchTimezones,
  detectUserTimezone,
  getCurrentTimeInTimezone,
  type TimezoneOption,
} from '../../../lib/timezones';
import { tw } from '../../../styles/settings';
import SettingsRow from '../SettingsRow';

export function TimezoneSelect() {
  const { getSetting } = useSettings();
  const { save } = useAutoSave();

  const detectedTimezone = detectUserTimezone();
  const currentTimezone = getSetting('profile.timezone', detectedTimezone) as string;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Update current time display
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getCurrentTimeInTimezone(currentTimezone));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [currentTimezone]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredTimezones = useMemo(() => {
    if (!searchQuery) return timezoneData;

    const matches = searchTimezones(searchQuery);
    const matchValues = new Set(matches.map(m => m.value));

    // Return groups with filtered timezones
    return timezoneData
      .map(group => ({
        ...group,
        timezones: group.timezones.filter(tz => matchValues.has(tz.value)),
      }))
      .filter(group => group.timezones.length > 0);
  }, [searchQuery]);

  const selectedTimezone = useMemo(() => {
    for (const group of timezoneData) {
      const found = group.timezones.find(tz => tz.value === currentTimezone);
      if (found) return found;
    }
    return { value: currentTimezone, label: currentTimezone, offset: '', region: '' };
  }, [currentTimezone]);

  const handleSelect = (timezone: TimezoneOption) => {
    save('profile.timezone', timezone.value, true);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery('');
    }
  };

  return (
    <SettingsRow
      label="Timezone"
      description="Select your local timezone for accurate time display"
    >
      <div ref={dropdownRef} className="relative w-72">
        {/* Selected Value Button */}
        <button
          type="button"
          onClick={handleToggle}
          className={`${tw.dropdown} w-full flex items-center justify-between pr-3`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{selectedTimezone.label}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-500">{currentTime}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-[#1a1f26] border border-white/10 rounded-md shadow-lg max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-2 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search timezones..."
                  className="w-full bg-white/5 border border-white/10 rounded-md pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Timezone List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredTimezones.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No timezones found
                </div>
              ) : (
                filteredTimezones.map(group => (
                  <div key={group.region}>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-white/5 sticky top-0">
                      {group.region}
                    </div>
                    {group.timezones.map(timezone => (
                      <button
                        key={timezone.value}
                        onClick={() => handleSelect(timezone)}
                        className={`w-full px-3 py-2 flex items-center justify-between text-sm hover:bg-white/5 ${
                          timezone.value === currentTimezone ? 'bg-blue-500/10 text-blue-400' : 'text-white'
                        }`}
                      >
                        <span>{timezone.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{timezone.offset}</span>
                          {timezone.value === currentTimezone && (
                            <Check className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </SettingsRow>
  );
}

export default TimezoneSelect;
