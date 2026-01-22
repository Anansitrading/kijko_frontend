// Context Detail Inspector Design Tokens
// Sprint 1: Foundation - Base Styling Constants

export const colors = {
  // Background colors
  background: '#0f1419',
  backgroundSecondary: '#1a1f26',
  backgroundTertiary: '#252b33',

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

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export const spacing = {
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
} as const;

export const borderRadius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
} as const;

export const typography = {
  // Font sizes
  xs: '11px',
  sm: '12px',
  base: '14px',
  lg: '16px',
  xl: '20px',

  // Font weights
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',

  // Font families
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "'Monaco', 'Courier New', monospace",
} as const;

export const dimensions = {
  // Modal dimensions
  modalWidth: '900px',
  modalHeight: '700px',
  modalMinWidth: '600px',
  modalMinHeight: '500px',

  // Component heights
  headerHeight: '56px',
  tabBarHeight: '48px',
  footerHeight: '64px',

  // Button heights
  buttonHeight: '36px',
  buttonHeightSm: '32px',

  // Icon sizes
  iconSm: '16px',
  iconMd: '20px',
  iconLg: '24px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 25px rgba(0, 0, 0, 0.5)',
  modal: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
} as const;

export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
} as const;

export const zIndex = {
  modal: 50,
  overlay: 40,
  dropdown: 30,
  tooltip: 60,
} as const;

// Animation keyframes for Tailwind
export const animations = {
  fadeIn: 'fadeIn 200ms ease-out',
  fadeOut: 'fadeOut 150ms ease-in',
  scaleIn: 'scaleIn 200ms ease-out',
  scaleOut: 'scaleOut 150ms ease-in',
  slideInUp: 'slideInUp 200ms ease-out',
  slideOutDown: 'slideOutDown 150ms ease-in',
} as const;

// Tab configuration
export const tabConfig = [
  { id: 'overview', label: 'Overview & Chat', shortcut: 1 },
  { id: 'compression', label: 'Compression', shortcut: 2 },
  { id: 'enrichments', label: 'Enrichments', shortcut: 3 },
  { id: 'users', label: 'Users', shortcut: 4 },
  { id: 'changelog', label: 'Changelog', shortcut: 5 },
] as const;

// Footer button configurations per tab
export const footerConfig = {
  overview: {
    primary: { label: 'Open Chat', action: 'openChat' },
    secondary: { label: 'Copy Summary', action: 'copySummary' },
  },
  compression: {
    primary: { label: 'Recompress', action: 'recompress' },
    secondary: { label: 'View Details', action: 'viewDetails' },
  },
  enrichments: {
    primary: { label: 'Run All Enrichments', action: 'runEnrichments' },
    secondary: { label: 'Configure', action: 'configure' },
  },
  users: {
    primary: { label: 'Invite User', action: 'inviteUser' },
    secondary: { label: 'Manage Roles', action: 'manageRoles' },
  },
  changelog: {
    primary: { label: 'Export Log', action: 'exportLog' },
    secondary: { label: 'Filter', action: 'filter' },
  },
} as const;

// Tailwind class utilities for consistent styling
export const tw = {
  // Button variants
  buttonPrimary: 'bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md h-9 px-4 transition-colors duration-150',
  buttonSecondary: 'bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-md h-9 px-4 border border-white/10 transition-colors duration-150',
  buttonGhost: 'hover:bg-white/5 text-gray-400 hover:text-gray-200 rounded-md p-2 transition-colors duration-150',

  // Card styles
  card: 'bg-white/5 border border-white/10 rounded-lg',
  cardHover: 'bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors duration-150',

  // Text styles
  textPrimary: 'text-white',
  textSecondary: 'text-gray-400',
  textMuted: 'text-gray-500',

  // Input styles
  input: 'bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-150',

  // Tab styles
  tabActive: 'text-white border-b-2 border-blue-500',
  tabInactive: 'text-gray-400 hover:text-gray-200 border-b-2 border-transparent',
} as const;
