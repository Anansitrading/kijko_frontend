// Setting Sprint 9: Advanced Security - Login History
import React, { useState, useCallback } from 'react';
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Filter,
  Loader2,
  Calendar,
  ChevronDown,
  Key,
  Mail,
  Shield,
  Lock,
} from 'lucide-react';
import { tw } from '../../../styles/settings';
import SettingsSection from '../SettingsSection';
import type {
  LoginHistoryEntry,
  LoginHistoryFilters,
  LoginStatus,
  LoginMethod,
  LOGIN_STATUS_LABELS,
  LOGIN_METHOD_LABELS,
} from '../../../types/settings';

interface LoginHistoryProps {
  initialEntries?: LoginHistoryEntry[];
}

// Helper to format date
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// Helper to mask IP address
function maskIP(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  if (ip.includes(':')) {
    return ip.split(':').slice(0, 4).join(':') + ':...';
  }
  return ip;
}

// Status labels
const STATUS_LABELS: Record<LoginStatus, { label: string; color: string }> = {
  success: { label: 'Success', color: '#10b981' },
  failed: { label: 'Failed', color: '#ef4444' },
  blocked: { label: 'Blocked', color: '#f59e0b' },
};

// Method labels
const METHOD_LABELS: Record<LoginMethod, string> = {
  password: 'Password',
  sso: 'Single Sign-On',
  '2fa': 'Two-Factor Auth',
  api_key: 'API Key',
  magic_link: 'Magic Link',
};

// Mock login history entries
function generateMockEntries(): LoginHistoryEntry[] {
  const now = new Date();

  return [
    {
      id: '1',
      userId: 'user-1',
      status: 'success',
      ipAddress: '192.168.1.105',
      location: { city: 'San Francisco', country: 'United States', region: 'California' },
      deviceInfo: { browser: 'Chrome', os: 'Windows 11', deviceType: 'desktop' },
      authMethod: 'password',
      createdAt: new Date(now.getTime() - 30 * 60 * 1000),
    },
    {
      id: '2',
      userId: 'user-1',
      status: 'success',
      ipAddress: '10.0.0.42',
      location: { city: 'New York', country: 'United States', region: 'New York' },
      deviceInfo: { browser: 'Safari', os: 'macOS', deviceType: 'desktop' },
      authMethod: '2fa',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: '3',
      userId: 'user-1',
      status: 'failed',
      ipAddress: '203.45.67.89',
      location: { city: 'Beijing', country: 'China' },
      deviceInfo: { browser: 'Firefox', os: 'Linux', deviceType: 'desktop' },
      authMethod: 'password',
      failureReason: 'Invalid password',
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      id: '4',
      userId: 'user-1',
      status: 'blocked',
      ipAddress: '185.23.67.100',
      location: { city: 'Moscow', country: 'Russia' },
      deviceInfo: { browser: 'Chrome', os: 'Windows 10', deviceType: 'desktop' },
      authMethod: 'password',
      failureReason: 'IP address blocked',
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      id: '5',
      userId: 'user-1',
      status: 'success',
      ipAddress: '172.16.0.88',
      location: { city: 'Los Angeles', country: 'United States', region: 'California' },
      deviceInfo: { browser: 'Chrome', os: 'Android 14', deviceType: 'mobile' },
      authMethod: 'magic_link',
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
    {
      id: '6',
      userId: 'user-1',
      status: 'success',
      ipAddress: '192.168.0.200',
      location: { city: 'London', country: 'United Kingdom', region: 'England' },
      deviceInfo: { browser: 'Safari', os: 'iOS 17', deviceType: 'tablet' },
      authMethod: 'sso',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: '7',
      userId: 'user-1',
      status: 'failed',
      ipAddress: '45.67.89.100',
      location: { city: 'Amsterdam', country: 'Netherlands' },
      deviceInfo: { browser: 'Edge', os: 'Windows 11', deviceType: 'desktop' },
      authMethod: 'password',
      failureReason: 'Account locked',
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  ];
}

export function LoginHistory({ initialEntries }: LoginHistoryProps) {
  const [entries, setEntries] = useState<LoginHistoryEntry[]>(
    initialEntries || generateMockEntries()
  );
  const [filters, setFilters] = useState<LoginHistoryFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleFilterChange = useCallback((newFilters: LoginHistoryFilters) => {
    setFilters(newFilters);
  }, []);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create CSV content
      const csvContent = [
        ['Date', 'Status', 'IP Address', 'Location', 'Device', 'Method', 'Failure Reason'].join(','),
        ...entries.map(entry => [
          formatDate(entry.createdAt),
          entry.status,
          entry.ipAddress,
          `${entry.location.city || ''}, ${entry.location.country || ''}`,
          `${entry.deviceInfo.browser} on ${entry.deviceInfo.os}`,
          entry.authMethod,
          entry.failureReason || '',
        ].join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `login-history-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [entries]);

  const handleLoadMore = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      // Would load more entries here
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDeviceIcon = (deviceType: 'desktop' | 'mobile' | 'tablet') => {
    switch (deviceType) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      default:
        return Monitor;
    }
  };

  const getStatusIcon = (status: LoginStatus) => {
    switch (status) {
      case 'success':
        return CheckCircle;
      case 'failed':
        return XCircle;
      case 'blocked':
        return AlertTriangle;
    }
  };

  const getMethodIcon = (method: LoginMethod) => {
    switch (method) {
      case 'password':
        return Lock;
      case 'sso':
        return Shield;
      case '2fa':
        return Shield;
      case 'api_key':
        return Key;
      case 'magic_link':
        return Mail;
    }
  };

  // Apply filters
  const filteredEntries = entries.filter(entry => {
    if (filters.status && entry.status !== filters.status) return false;
    if (filters.dateFrom && new Date(entry.createdAt) < filters.dateFrom) return false;
    if (filters.dateTo && new Date(entry.createdAt) > filters.dateTo) return false;
    return true;
  });

  // Count by status
  const statusCounts = entries.reduce((acc, entry) => {
    acc[entry.status] = (acc[entry.status] || 0) + 1;
    return acc;
  }, {} as Record<LoginStatus, number>);

  const failedCount = (statusCounts.failed || 0) + (statusCounts.blocked || 0);

  return (
    <SettingsSection
      title="Login History"
      description="Review your account's login activity and detect suspicious access"
    >
      {/* Failed Login Alert */}
      {failedCount > 0 && (
        <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-400">
              {failedCount} failed or blocked login attempt{failedCount > 1 ? 's' : ''} detected
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Review these attempts to ensure your account is secure.
            </p>
          </div>
        </div>
      )}

      {/* Export Success Message */}
      {exportSuccess && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <p className="text-sm text-green-400">Login history exported successfully</p>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`${tw.buttonSecondary} inline-flex items-center gap-2 text-sm h-8 px-3`}
          >
            <Filter className="w-4 h-4" />
            Filter
            {(filters.status || filters.dateFrom || filters.dateTo) && (
              <span className="w-2 h-2 bg-primary rounded-full" />
            )}
          </button>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`${tw.buttonSecondary} inline-flex items-center gap-2 text-sm h-8 px-3`}
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Export CSV
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Status</label>
              <div className="relative">
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange({
                    ...filters,
                    status: e.target.value as LoginStatus || undefined,
                  })}
                  className={`${tw.dropdown} w-full text-sm h-9`}
                >
                  <option value="">All statuses</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="blocked">Blocked</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">From</label>
              <div className="relative">
                <input
                  type="date"
                  value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFilterChange({
                    ...filters,
                    dateFrom: e.target.value ? new Date(e.target.value) : undefined,
                  })}
                  className={`${tw.input} text-sm h-9`}
                />
              </div>
            </div>

            {/* Date To */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">To</label>
              <div className="relative">
                <input
                  type="date"
                  value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFilterChange({
                    ...filters,
                    dateTo: e.target.value ? new Date(e.target.value) : undefined,
                  })}
                  className={`${tw.input} text-sm h-9`}
                />
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {(filters.status || filters.dateFrom || filters.dateTo) && (
            <button
              onClick={() => setFilters({})}
              className="mt-3 text-xs text-primary hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Login History List */}
      <div className="space-y-2">
        {filteredEntries.map(entry => {
          const DeviceIcon = getDeviceIcon(entry.deviceInfo.deviceType);
          const StatusIcon = getStatusIcon(entry.status);
          const MethodIcon = getMethodIcon(entry.authMethod);
          const statusConfig = STATUS_LABELS[entry.status];

          return (
            <div
              key={entry.id}
              className={`p-4 rounded-lg border ${
                entry.status === 'success'
                  ? 'bg-white/5 border-white/10'
                  : entry.status === 'failed'
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-amber-500/5 border-amber-500/20'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Main Info */}
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg bg-white/10`}>
                    <DeviceIcon className="w-5 h-5 text-gray-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">
                        {entry.deviceInfo.browser} on {entry.deviceInfo.os}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full"
                        style={{
                          backgroundColor: `${statusConfig.color}20`,
                          color: statusConfig.color,
                        }}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {entry.location.city || 'Unknown'}, {entry.location.country || 'Unknown'}
                      </span>
                      <span>IP: {maskIP(entry.ipAddress)}</span>
                      <span className="inline-flex items-center gap-1">
                        <MethodIcon className="w-3 h-3" />
                        {METHOD_LABELS[entry.authMethod]}
                      </span>
                    </div>

                    {entry.failureReason && (
                      <p className="mt-1 text-xs text-red-400">
                        Reason: {entry.failureReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-right flex-shrink-0">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(entry.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredEntries.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400">No login history found</p>
          {(filters.status || filters.dateFrom || filters.dateTo) && (
            <button
              onClick={() => setFilters({})}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Load More */}
      {filteredEntries.length >= 7 && (
        <div className="mt-4 text-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className={`${tw.buttonSecondary} inline-flex items-center gap-2 text-sm`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Load More
          </button>
        </div>
      )}
    </SettingsSection>
  );
}

export default LoginHistory;
