import React, { useState, useEffect } from 'react';
import type { SettingsToggleProps } from '../../types/settings';
import { useSettings } from '../../contexts/SettingsContext';
import { useAutoSave } from '../../hooks/useAutoSave';
import { tw } from '../../styles/settings';
import SettingsRow from './SettingsRow';

export function SettingsToggle({
  settingKey,
  label,
  description,
  defaultValue = false,
  disabled = false,
}: SettingsToggleProps) {
  const { getSetting } = useSettings();
  const { save } = useAutoSave();

  // Get initial value from settings or use default
  const storedValue = getSetting(settingKey, defaultValue);
  const [isEnabled, setIsEnabled] = useState(storedValue);

  // Sync with stored value changes
  useEffect(() => {
    setIsEnabled(getSetting(settingKey, defaultValue));
  }, [getSetting, settingKey, defaultValue]);

  const handleToggle = () => {
    if (disabled) return;

    const newValue = !isEnabled;
    setIsEnabled(newValue);
    // Immediate save for toggles (no debounce)
    save(settingKey, newValue, true);
  };

  return (
    <SettingsRow label={label} description={description}>
      <button
        type="button"
        role="switch"
        aria-checked={isEnabled}
        aria-label={label}
        disabled={disabled}
        onClick={handleToggle}
        className={`${isEnabled ? tw.toggleActive : tw.toggle} ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <span
          className={isEnabled ? tw.toggleKnobActive : tw.toggleKnob}
          aria-hidden="true"
        />
      </button>
    </SettingsRow>
  );
}

export default SettingsToggle;
