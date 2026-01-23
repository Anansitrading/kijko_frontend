// Settings Module Design Tokens
// Setting Sprint 1: Foundation - Styling Constants

import type { SettingsSection, SettingsNavItem } from '../types/settings';

export const colors = {
  // Background colors
  background: '#0f1419',
  backgroundSecondary: '#1a1f26',
  backgroundTertiary: '#252b33',
  backgroundHover: 'rgba(255, 255, 255, 0.05)',

  // Primary accent (blue)
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryMuted: 'rgba(59, 130, 246, 0.1)',

  // Status colors
  success: '#10b981',
  successMuted: 'rgba(16, 185, 129, 0.1)',
  warning: '#f59e0b',
  warningMuted: 'rgba(245, 158, 11, 0.1)',
  error: '#ef4444',
  errorMuted: 'rgba(239, 68, 68, 0.1)',

  // Text colors
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',

  // Border colors
  border: 'rgba(255, 255, 255, 0.1)',
  borderHover: 'rgba(255, 255, 255, 0.2)',
  borderFocus: '#3b82f6',
} as const;

export const spacing = {
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
} as const;

export const dimensions = {
  // Sidebar dimensions
  sidebarWidth: '240px',
  sidebarMinWidth: '200px',

  // Content dimensions
  contentMaxWidth: '720px',

  // Component heights
  rowHeight: '64px',
  inputHeight: '40px',
  toggleHeight: '24px',
  toggleWidth: '44px',

  // Button sizes
  buttonHeight: '36px',
  buttonHeightSm: '32px',
} as const;

// Navigation items configuration
export const navigationItems: SettingsNavItem[] = [
  { id: 'profile', label: 'My Profile', icon: 'User' },
  { id: 'general', label: 'General', icon: 'Settings' },
  { id: 'integrations', label: 'Integrations', icon: 'Puzzle' },
  { id: 'notifications', label: 'Notifications', icon: 'Bell' },
  { id: 'security', label: 'Security and Data', icon: 'Shield' },
  { id: 'billing', label: 'Billing and Usage', icon: 'CreditCard' },
  { id: 'members', label: 'Members', icon: 'Users', badge: 'Teams/Enterprise' },
  { id: 'advanced-security', label: 'Advanced Security', icon: 'Lock' },
  { id: 'audit-log', label: 'Audit Log', icon: 'FileText' },
] as const;

// Section titles and descriptions
export const sectionConfig: Record<SettingsSection, { title: string; description: string }> = {
  profile: {
    title: 'My Profile',
    description: 'Manage your personal information and preferences',
  },
  general: {
    title: 'General Settings',
    description: 'Configure general application settings',
  },
  integrations: {
    title: 'Integrations',
    description: 'Connect and manage third-party integrations',
  },
  notifications: {
    title: 'Notifications',
    description: 'Configure how and when you receive notifications',
  },
  security: {
    title: 'Security and Data',
    description: 'Manage your security settings and data privacy',
  },
  billing: {
    title: 'Billing and Usage',
    description: 'View your plan, usage, and billing information',
  },
  members: {
    title: 'Team Members',
    description: 'Manage team members and their roles',
  },
  'advanced-security': {
    title: 'Advanced Security',
    description: 'Configure advanced security options',
  },
  'audit-log': {
    title: 'Audit Log',
    description: 'View security and activity logs',
  },
} as const;

// Tailwind class utilities for settings components
// Updated to use semantic CSS variable-based classes for theme support
export const tw = {
  // Layout
  layout: 'flex h-full bg-background',
  sidebar: 'w-60 min-w-[200px] border-r border-border bg-card flex flex-col',
  content: 'flex-1 overflow-y-auto p-8',
  contentContainer: 'max-w-[720px] mx-auto',

  // Sidebar navigation
  navItem: 'flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer',
  navItemActive: 'flex items-center gap-3 px-4 py-2.5 text-sm text-foreground bg-secondary rounded-md',
  navItemDisabled: 'flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground/50 cursor-not-allowed',
  navBadge: 'ml-auto text-xs px-2 py-0.5 bg-primary/20 text-primary rounded',

  // Section styling
  section: 'mb-8',
  sectionTitle: 'text-lg font-semibold text-foreground mb-1',
  sectionDescription: 'text-sm text-muted-foreground mb-6',
  sectionDivider: 'border-t border-border my-6',

  // Row styling
  row: 'flex items-center justify-between py-4 border-b border-border/50',
  rowLabel: 'text-sm font-medium text-foreground',
  rowDescription: 'text-sm text-muted-foreground mt-0.5',

  // Toggle styling
  toggle: 'relative inline-flex w-11 h-6 bg-muted rounded-full cursor-pointer transition-colors duration-200 shrink-0',
  toggleActive: 'relative inline-flex w-11 h-6 bg-primary rounded-full cursor-pointer transition-colors duration-200 shrink-0',
  toggleKnob: 'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200',
  toggleKnobActive: 'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 translate-x-5',

  // Input styling
  input: 'w-full bg-secondary border border-border rounded-md px-3 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-150',
  inputError: 'w-full bg-secondary border border-destructive rounded-md px-3 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-destructive focus:ring-1 focus:ring-destructive transition-colors duration-150',

  // Dropdown styling
  dropdown: 'bg-secondary border border-border rounded-md px-3 py-2.5 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-150 cursor-pointer appearance-none',
  dropdownOption: 'bg-card text-foreground',

  // Save status
  saveStatus: 'fixed top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-md text-sm z-50 transition-opacity duration-300',
  saveStatusSaving: 'bg-primary/20 text-primary',
  saveStatusSaved: 'bg-accent/20 text-accent',
  saveStatusError: 'bg-destructive/20 text-destructive',

  // Button styles
  buttonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md h-9 px-4 transition-colors duration-150',
  buttonSecondary: 'bg-secondary hover:bg-muted text-secondary-foreground font-medium rounded-md h-9 px-4 border border-border transition-colors duration-150',
  buttonGhost: 'hover:bg-muted text-muted-foreground hover:text-foreground rounded-md p-2 transition-colors duration-150',

  // Card styling
  card: 'bg-secondary border border-border rounded-lg p-4',
  cardHover: 'bg-secondary border border-border rounded-lg p-4 hover:border-border/80 transition-colors duration-150',
} as const;

// Animation configurations
export const animations = {
  saveStatusDuration: 2000, // Auto-dismiss saved status after 2s
  debounceDelay: 400, // Default debounce delay for text inputs
  retryDelay: 1000, // Base retry delay (exponential backoff)
  maxRetries: 3, // Maximum number of retry attempts
} as const;
