import React from 'react';
import { SettingsDropdown } from '../SettingsDropdown';

const roleOptions = [
  { value: 'business-owner', label: 'Business Owner' },
  { value: 'developer', label: 'Developer' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
];

export function RoleSelect() {
  return (
    <SettingsDropdown
      settingKey="profile.role"
      label="Role"
      description="Your role affects dashboard defaults and feature recommendations"
      options={roleOptions}
      defaultValue="user"
    />
  );
}

export default RoleSelect;
