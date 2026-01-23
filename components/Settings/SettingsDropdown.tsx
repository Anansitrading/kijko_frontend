import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { SettingsDropdownProps } from '../../types/settings';
import { useSettings } from '../../contexts/SettingsContext';
import { useAutoSave } from '../../hooks/useAutoSave';
import { tw } from '../../styles/settings';
import SettingsRow from './SettingsRow';

export function SettingsDropdown({
  settingKey,
  label,
  description,
  options,
  defaultValue,
  disabled = false,
}: SettingsDropdownProps) {
  const { getSetting } = useSettings();
  const { save } = useAutoSave();

  // Get initial value from settings or use default (or first option)
  const initialDefault = defaultValue || options[0]?.value || '';
  const storedValue = getSetting(settingKey, initialDefault);
  const [selectedValue, setSelectedValue] = useState(storedValue);

  // Sync with stored value changes
  useEffect(() => {
    setSelectedValue(getSetting(settingKey, initialDefault));
  }, [getSetting, settingKey, initialDefault]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;
    setSelectedValue(newValue);
    // Immediate save for dropdowns (no debounce)
    save(settingKey, newValue, true);
  };

  return (
    <SettingsRow label={label} description={description}>
      <div className="relative">
        <select
          value={selectedValue as string}
          onChange={handleChange}
          disabled={disabled}
          className={`${tw.dropdown} pr-10 min-w-[180px] ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className={tw.dropdownOption}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
        />
      </div>
    </SettingsRow>
  );
}

export default SettingsDropdown;
