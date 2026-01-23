import React from 'react';
import { useSettings } from '../../../contexts/SettingsContext';
import SettingsSection from '../SettingsSection';
import { SettingsInput } from '../SettingsInput';
import AvatarUpload from './AvatarUpload';
import GravatarToggle from './GravatarToggle';
import EmailVerification from './EmailVerification';
import RoleSelect from './RoleSelect';
import TimezoneSelect from './TimezoneSelect';
import PasswordChange from './PasswordChange';

export function ProfileSection() {
  const { state } = useSettings();

  // Only render when profile section is active
  if (state.activeSection !== 'profile') {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Avatar Section */}
      <SettingsSection
        title="Profile Photo"
        description="Upload a photo or use your Gravatar"
      >
        <div className="space-y-6">
          <AvatarUpload />
          <div className="border-t border-white/10 pt-4">
            <GravatarToggle />
          </div>
        </div>
      </SettingsSection>

      {/* Account Information */}
      <SettingsSection
        title="Account Information"
        description="Your personal details and contact information"
      >
        <EmailVerification />

        <SettingsInput
          settingKey="profile.firstName"
          label="First Name"
          placeholder="Enter your first name"
          validation={{ required: true, minLength: 1, maxLength: 50 }}
        />

        <SettingsInput
          settingKey="profile.lastName"
          label="Last Name"
          placeholder="Enter your last name"
          validation={{ required: true, minLength: 1, maxLength: 50 }}
        />

        <SettingsInput
          settingKey="profile.company"
          label="Company"
          description="Optional - your company or organization"
          placeholder="Enter your company name"
          validation={{ maxLength: 100 }}
        />
      </SettingsSection>

      {/* Role & Preferences */}
      <SettingsSection
        title="Role & Preferences"
        description="Customize your experience based on your role"
      >
        <RoleSelect />
        <TimezoneSelect />
      </SettingsSection>

      {/* Password Change */}
      <PasswordChange />
    </div>
  );
}

export default ProfileSection;
