import React from 'react';
import type { SettingsRowProps } from '../../types/settings';
import { tw } from '../../styles/settings';

export function SettingsRow({ label, description, children }: SettingsRowProps) {
  return (
    <div className={tw.row}>
      <div className="flex-1 min-w-0 mr-4">
        <div className={tw.rowLabel}>{label}</div>
        {description && <p className={tw.rowDescription}>{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default SettingsRow;
