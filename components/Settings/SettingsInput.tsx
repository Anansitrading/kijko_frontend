import React, { useState, useEffect } from 'react';
import type { SettingsInputProps } from '../../types/settings';
import { useSettings } from '../../contexts/SettingsContext';
import { useAutoSave } from '../../hooks/useAutoSave';
import { tw } from '../../styles/settings';
import SettingsRow from './SettingsRow';

export function SettingsInput({
  settingKey,
  label,
  description,
  placeholder,
  type = 'text',
  defaultValue = '',
  disabled = false,
  validation,
}: SettingsInputProps) {
  const { getSetting } = useSettings();
  const { save } = useAutoSave();

  // Get initial value from settings or use default
  const storedValue = getSetting(settingKey, defaultValue);
  const [value, setValue] = useState(storedValue as string);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync with stored value changes
  useEffect(() => {
    setValue(getSetting(settingKey, defaultValue) as string);
  }, [getSetting, settingKey, defaultValue]);

  // Validate input
  const validateInput = (inputValue: string): string | null => {
    if (!validation) return null;

    if (validation.required && !inputValue.trim()) {
      return 'This field is required';
    }

    if (validation.minLength && inputValue.length < validation.minLength) {
      return `Minimum ${validation.minLength} characters required`;
    }

    if (validation.maxLength && inputValue.length > validation.maxLength) {
      return `Maximum ${validation.maxLength} characters allowed`;
    }

    if (validation.pattern && !validation.pattern.test(inputValue)) {
      return 'Invalid format';
    }

    return null;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setValue(newValue);

    // Validate
    const error = validateInput(newValue);
    setValidationError(error);

    // Only save if valid (debounced for text inputs)
    if (!error) {
      save(settingKey, newValue, false);
    }
  };

  const handleBlur = () => {
    // Final validation on blur
    const error = validateInput(value);
    setValidationError(error);
  };

  return (
    <SettingsRow label={label} description={description}>
      <div className="w-64">
        <input
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`${validationError ? tw.inputError : tw.input} ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
        {validationError && (
          <p className="mt-1 text-xs text-red-400">{validationError}</p>
        )}
      </div>
    </SettingsRow>
  );
}

export default SettingsInput;
