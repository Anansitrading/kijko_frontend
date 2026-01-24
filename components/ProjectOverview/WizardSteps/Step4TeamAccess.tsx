/**
 * Step 4: Team Access
 * Team member management for project access including:
 * - Team member invitation (email + role)
 * - Bulk team import via CSV
 * - Directory sync integration (Okta, Azure AD)
 * - Role definitions display
 * - Notification preferences
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  Users,
  Plus,
  X,
  Upload,
  Info,
  ChevronDown,
  ChevronUp,
  Shield,
  Link,
  Link2Off,
  AlertCircle,
  Check,
  Mail,
  FileSpreadsheet,
  Building2,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import type {
  ProjectMemberRole,
  NotificationLevel,
  TeamMemberInvitation,
  CSVImportResult,
  CSVImportError,
  DirectorySyncStatus,
  DirectorySyncProvider,
} from '../../../types/project';
import {
  ROLE_DEFINITIONS,
  NOTIFICATION_LEVEL_OPTIONS,
} from '../../../types/project';

// =============================================================================
// Types
// =============================================================================

interface Step4TeamAccessProps {
  // Team members
  members: TeamMemberInvitation[];
  onMembersChange: (members: TeamMemberInvitation[]) => void;

  // Notification preferences
  defaultNotificationLevel: NotificationLevel;
  onDefaultNotificationChange: (level: NotificationLevel) => void;

  // Directory sync (optional, enterprise feature)
  directorySync?: DirectorySyncStatus;
  onConnectDirectory?: (provider: DirectorySyncProvider) => void;
  onDisconnectDirectory?: () => void;

  // Skip handler
  onSkip?: () => void;
}

// =============================================================================
// Validation
// =============================================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function parseCSV(csvContent: string): CSVImportResult {
  const lines = csvContent.trim().split('\n');
  const success: TeamMemberInvitation[] = [];
  const errors: CSVImportError[] = [];

  // Skip header if present
  const startIndex = lines[0]?.toLowerCase().includes('email') ? 1 : 0;

  lines.slice(startIndex).forEach((line, index) => {
    const row = index + startIndex + 1;
    const parts = line.split(',').map((p) => p.trim().replace(/["']/g, ''));

    if (parts.length < 2) {
      errors.push({ row, message: 'Missing required fields (email, role)' });
      return;
    }

    const [email, roleStr, notificationStr] = parts;

    if (!isValidEmail(email)) {
      errors.push({ row, email, message: 'Invalid email format' });
      return;
    }

    const validRoles: ProjectMemberRole[] = ['admin', 'manager', 'developer', 'viewer', 'auditor'];
    const role = roleStr.toLowerCase() as ProjectMemberRole;
    if (!validRoles.includes(role)) {
      errors.push({ row, email, message: `Invalid role: ${roleStr}. Valid roles: ${validRoles.join(', ')}` });
      return;
    }

    const validNotifications: NotificationLevel[] = ['real-time', 'daily', 'weekly', 'disabled'];
    let notificationLevel: NotificationLevel = 'daily';
    if (notificationStr) {
      const normalized = notificationStr.toLowerCase().replace(' ', '-') as NotificationLevel;
      if (validNotifications.includes(normalized)) {
        notificationLevel = normalized;
      }
    }

    success.push({ email, role, notificationLevel });
  });

  return { success, errors };
}

// =============================================================================
// Sub-Components
// =============================================================================

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-flex">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg text-xs text-foreground max-w-xs whitespace-normal">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-border" />
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Team Member Row
// =============================================================================

interface TeamMemberRowProps {
  member: TeamMemberInvitation;
  onChange: (member: TeamMemberInvitation) => void;
  onRemove: () => void;
  emailError?: string;
}

function TeamMemberRow({ member, onChange, onRemove, emailError }: TeamMemberRowProps) {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleButtonRef = useRef<HTMLButtonElement>(null);

  const selectedRole = ROLE_DEFINITIONS.find((r) => r.role === member.role);

  return (
    <div className="flex items-start gap-2">
      {/* Email Input */}
      <div className="flex-1">
        <div className="relative">
          <input
            type="email"
            value={member.email}
            onChange={(e) => onChange({ ...member, email: e.target.value })}
            placeholder="email@company.com"
            className={cn(
              'w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none transition-all',
              emailError
                ? 'border-destructive focus:border-destructive'
                : 'border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20'
            )}
          />
          <Mail
            size={16}
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2',
              emailError ? 'text-destructive' : 'text-muted-foreground'
            )}
          />
        </div>
        {emailError && (
          <p className="text-[10px] text-destructive mt-0.5">{emailError}</p>
        )}
      </div>

      {/* Role Dropdown */}
      <div className="relative">
        <button
          ref={roleButtonRef}
          type="button"
          onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg text-foreground hover:bg-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 min-w-[140px] justify-between"
        >
          <span>{selectedRole?.label || 'Select role'}</span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>

        {isRoleDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsRoleDropdownOpen(false)}
            />
            <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
              {ROLE_DEFINITIONS.map((roleDef) => (
                <button
                  key={roleDef.role}
                  type="button"
                  onClick={() => {
                    onChange({ ...member, role: roleDef.role });
                    setIsRoleDropdownOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-muted transition-colors',
                    member.role === roleDef.role && 'bg-primary/5'
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {roleDef.label}
                      </span>
                      {member.role === roleDef.role && (
                        <Check size={14} className="text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {roleDef.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={onRemove}
        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
}

// =============================================================================
// Team Invitation Section
// =============================================================================

interface TeamInvitationSectionProps {
  members: TeamMemberInvitation[];
  onChange: (members: TeamMemberInvitation[]) => void;
}

function TeamInvitationSection({ members, onChange }: TeamInvitationSectionProps) {
  const [emailErrors, setEmailErrors] = useState<Record<number, string>>({});

  const addMember = () => {
    onChange([
      ...members,
      { email: '', role: 'developer', notificationLevel: 'daily' },
    ]);
  };

  const updateMember = (index: number, member: TeamMemberInvitation) => {
    const newMembers = [...members];
    newMembers[index] = member;
    onChange(newMembers);

    // Validate email
    if (member.email && !isValidEmail(member.email)) {
      setEmailErrors((prev) => ({ ...prev, [index]: 'Invalid email format' }));
    } else {
      setEmailErrors((prev) => {
        const { [index]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const removeMember = (index: number) => {
    onChange(members.filter((_, i) => i !== index));
    setEmailErrors((prev) => {
      const { [index]: _, ...rest } = prev;
      return rest;
    });
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Invite Team Members"
        description="Add team members and assign their roles"
      />

      <div className="space-y-3">
        {members.map((member, index) => (
          <TeamMemberRow
            key={index}
            member={member}
            onChange={(m) => updateMember(index, m)}
            onRemove={() => removeMember(index)}
            emailError={emailErrors[index]}
          />
        ))}

        <button
          type="button"
          onClick={addMember}
          className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add team member
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Bulk Import Section
// =============================================================================

interface BulkImportSectionProps {
  onImport: (members: TeamMemberInvitation[]) => void;
}

function BulkImportSection({ onImport }: BulkImportSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      processFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    const content = await file.text();
    const result = parseCSV(content);
    setImportResult(result);
    setShowPreview(true);
  };

  const confirmImport = () => {
    if (importResult) {
      onImport(importResult.success);
      setImportResult(null);
      setShowPreview(false);
    }
  };

  const cancelImport = () => {
    setImportResult(null);
    setShowPreview(false);
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Bulk Import via CSV"
        description="Upload a CSV file to add multiple team members"
      />

      {!showPreview ? (
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-lg transition-colors cursor-pointer',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="p-3 bg-muted rounded-lg">
            <FileSpreadsheet size={24} className="text-muted-foreground" />
          </div>

          <div className="text-center">
            <p className="text-sm text-foreground">
              Drag & drop a CSV file here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Format: <code className="px-1 py-0.5 bg-muted rounded">email, role, notifications</code>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Example: <code className="px-1 py-0.5 bg-muted rounded">alex@company.com, Developer, daily</code>
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 p-4 bg-muted/30 border border-border rounded-lg">
          {/* Success count */}
          {importResult && importResult.success.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <Check size={16} />
              {importResult.success.length} member(s) ready to import
            </div>
          )}

          {/* Preview list */}
          {importResult && importResult.success.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1">
              {importResult.success.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 px-3 py-2 bg-card rounded-lg text-sm"
                >
                  <Mail size={14} className="text-muted-foreground" />
                  <span className="flex-1 text-foreground">{member.email}</span>
                  <span className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Errors */}
          {importResult && importResult.errors.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle size={16} />
                {importResult.errors.length} error(s) found
              </div>
              <div className="max-h-20 overflow-y-auto space-y-1">
                {importResult.errors.map((error, index) => (
                  <p key={index} className="text-xs text-destructive">
                    Row {error.row}: {error.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={cancelImport}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmImport}
              disabled={!importResult || importResult.success.length === 0}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-lg transition-colors',
                importResult && importResult.success.length > 0
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              Import {importResult?.success.length || 0} member(s)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Directory Sync Section
// =============================================================================

interface DirectorySyncSectionProps {
  status?: DirectorySyncStatus;
  onConnect?: (provider: DirectorySyncProvider) => void;
  onDisconnect?: () => void;
}

function DirectorySyncSection({
  status,
  onConnect,
  onDisconnect,
}: DirectorySyncSectionProps) {
  const isConnected = status?.connected;

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Directory Sync"
        description="Connect to your identity provider for automatic team sync"
      />

      {isConnected && status ? (
        <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Link size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Connected to {status.provider === 'okta' ? 'Okta' : 'Azure AD'}
              </p>
              <p className="text-xs text-muted-foreground">
                {status.memberCount} members synced from {status.groupCount} groups
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDisconnect}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <Link2Off size={14} />
            Disconnect
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onConnect?.('okta')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-muted/50 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <Building2 size={20} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Connect Okta</span>
          </button>
          <button
            type="button"
            onClick={() => onConnect?.('azure_ad')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-muted/50 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <Building2 size={20} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Connect Azure AD</span>
          </button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Enterprise feature: Automatically sync team members from your identity provider.
      </p>
    </div>
  );
}

// =============================================================================
// Role Definitions Section
// =============================================================================

function RoleDefinitionsSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <Shield size={16} />
        <span>View role permissions</span>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isExpanded && (
        <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-4">
          {ROLE_DEFINITIONS.map((roleDef) => (
            <div key={roleDef.role} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {roleDef.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  - {roleDef.description}
                </span>
              </div>
              <ul className="ml-4 space-y-0.5">
                {roleDef.permissions.map((permission, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Notification Preferences Section
// =============================================================================

interface NotificationPreferencesSectionProps {
  value: NotificationLevel;
  onChange: (level: NotificationLevel) => void;
}

function NotificationPreferencesSection({
  value,
  onChange,
}: NotificationPreferencesSectionProps) {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Default Notification Preference"
        description="Applied to all new invites (can be changed per member)"
      />

      <div className="flex flex-wrap gap-2">
        {NOTIFICATION_LEVEL_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm border rounded-lg transition-all',
              value === option.value
                ? 'bg-primary/10 border-primary text-foreground'
                : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
            )}
          >
            {value === option.value && <Check size={14} className="text-primary" />}
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {NOTIFICATION_LEVEL_OPTIONS.find((o) => o.value === value)?.description}
      </p>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function Step4TeamAccess({
  members,
  onMembersChange,
  defaultNotificationLevel,
  onDefaultNotificationChange,
  directorySync,
  onConnectDirectory,
  onDisconnectDirectory,
  onSkip,
}: Step4TeamAccessProps) {
  const handleBulkImport = (importedMembers: TeamMemberInvitation[]) => {
    // Merge imported members, avoiding duplicates by email
    const existingEmails = new Set(members.map((m) => m.email.toLowerCase()));
    const newMembers = importedMembers.filter(
      (m) => !existingEmails.has(m.email.toLowerCase())
    );
    onMembersChange([...members, ...newMembers]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Users size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Team Access</h2>
          <p className="text-sm text-muted-foreground">
            Invite team members and manage their access
          </p>
        </div>

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="ml-auto text-sm text-muted-foreground hover:text-foreground"
          >
            Skip this step
          </button>
        )}
      </div>

      {/* Team Invitation */}
      <TeamInvitationSection
        members={members}
        onChange={onMembersChange}
      />

      {/* Bulk Import */}
      <BulkImportSection onImport={handleBulkImport} />

      {/* Directory Sync */}
      <DirectorySyncSection
        status={directorySync}
        onConnect={onConnectDirectory}
        onDisconnect={onDisconnectDirectory}
      />

      {/* Role Definitions */}
      <RoleDefinitionsSection />

      {/* Notification Preferences */}
      <NotificationPreferencesSection
        value={defaultNotificationLevel}
        onChange={onDefaultNotificationChange}
      />
    </div>
  );
}

export default Step4TeamAccess;
