// GeneralSection component - General settings page
// Setting Sprint 3: General Settings

import React from 'react';
import { useSettings } from '../../../contexts/SettingsContext';
import SettingsSection from '../SettingsSection';
import ThemeToggle from './ThemeToggle';
import ModelSelect from './ModelSelect';

export function GeneralSection() {
  const { state } = useSettings();

  // Only render when general section is active
  if (state.activeSection !== 'general') {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Appearance */}
      <SettingsSection
        title="Appearance"
        description="Customize the look and feel of the application"
      >
        <ThemeToggle />
      </SettingsSection>

      {/* AI Configuration */}
      <SettingsSection
        title="AI Configuration"
        description="Configure AI model preferences for analysis and chat features"
      >
        <ModelSelect />
      </SettingsSection>
    </div>
  );
}

export default GeneralSection;
