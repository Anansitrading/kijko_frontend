import React from 'react';
import type { SettingsSectionProps } from '../../types/settings';
import { tw } from '../../styles/settings';

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className={tw.section}>
      <h3 className={tw.sectionTitle}>{title}</h3>
      {description && <p className={tw.sectionDescription}>{description}</p>}
      <div className="space-y-0">
        {children}
      </div>
    </section>
  );
}

export default SettingsSection;
