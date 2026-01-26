import React, { useEffect } from 'react';
import type { SettingsSection } from '../../types/settings';
import { SettingsProvider, useSettings } from '../../contexts/SettingsContext';
import { tw, sectionConfig } from '../../styles/settings';
import SettingsSidebar from './SettingsSidebar';
import SaveStatus from './SaveStatus';
import { useAutoSave } from '../../hooks/useAutoSave';

interface SettingsLayoutOuterProps {
  children: React.ReactNode;
  initialSection?: SettingsSection;
}

// Inner layout component that uses the context
function SettingsLayoutInner({ children, initialSection }: SettingsLayoutOuterProps) {
  const { state, setSection } = useSettings();
  const { status, error, retry } = useAutoSave();

  // Navigate to the requested section when the modal opens
  useEffect(() => {
    if (initialSection) {
      setSection(initialSection);
    }
  }, [initialSection, setSection]);

  const handleSectionChange = (section: SettingsSection) => {
    setSection(section);
  };

  const currentSection = sectionConfig[state.activeSection];

  return (
    <div className={tw.layout}>
      <SettingsSidebar
        activeSection={state.activeSection}
        onSectionChange={handleSectionChange}
      />

      <main className={tw.content}>
        <div className={tw.contentContainer}>
          {/* Section Header */}
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {currentSection.title}
            </h1>
            <p className="text-muted-foreground">
              {currentSection.description}
            </p>
          </header>

          {/* Section Content */}
          {state.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            children
          )}
        </div>
      </main>

      {/* Save Status Indicator */}
      <SaveStatus status={status} error={error} onRetry={retry} />
    </div>
  );
}

// Outer component that provides the context
export function SettingsLayout({ children, initialSection }: SettingsLayoutOuterProps) {
  return (
    <SettingsProvider>
      <SettingsLayoutInner initialSection={initialSection}>{children}</SettingsLayoutInner>
    </SettingsProvider>
  );
}

export default SettingsLayout;
