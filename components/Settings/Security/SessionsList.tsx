import React, { useState, useCallback } from 'react';
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { tw } from '../../../styles/settings';
import SettingsSection from '../SettingsSection';
import type { UserSession } from '../../../types/settings';

interface SessionsListProps {
  initialSessions?: UserSession[];
}

// Helper to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(date).toLocaleDateString();
}

// Helper to mask IP address
function maskIP(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  // For IPv6, just show first half
  if (ip.includes(':')) {
    return ip.split(':').slice(0, 4).join(':') + ':...';
  }
  return ip;
}

// Mock sessions for demo
function generateMockSessions(): UserSession[] {
  const now = new Date();

  return [
    {
      id: '1',
      deviceInfo: {
        browser: 'Chrome',
        os: 'Windows 11',
        deviceType: 'desktop',
      },
      ipAddress: '192.168.1.105',
      location: {
        city: 'San Francisco',
        country: 'United States',
        region: 'California',
      },
      lastActive: now,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      isCurrent: true,
    },
    {
      id: '2',
      deviceInfo: {
        browser: 'Safari',
        os: 'macOS',
        deviceType: 'desktop',
      },
      ipAddress: '10.0.0.42',
      location: {
        city: 'New York',
        country: 'United States',
        region: 'New York',
      },
      lastActive: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      isCurrent: false,
    },
    {
      id: '3',
      deviceInfo: {
        browser: 'Chrome',
        os: 'Android 14',
        deviceType: 'mobile',
      },
      ipAddress: '172.16.0.88',
      location: {
        city: 'Los Angeles',
        country: 'United States',
        region: 'California',
      },
      lastActive: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      isCurrent: false,
    },
    {
      id: '4',
      deviceInfo: {
        browser: 'Safari',
        os: 'iOS 17',
        deviceType: 'tablet',
      },
      ipAddress: '192.168.0.200',
      location: {
        city: 'London',
        country: 'United Kingdom',
        region: 'England',
      },
      lastActive: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
      isCurrent: false,
    },
  ];
}

export function SessionsList({ initialSessions }: SessionsListProps) {
  const [sessions, setSessions] = useState<UserSession[]>(
    initialSessions || generateMockSessions()
  );
  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const [terminatingAll, setTerminatingAll] = useState(false);
  const [showTerminateAllConfirm, setShowTerminateAllConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleTerminateSession = useCallback(async (sessionId: string) => {
    setTerminatingId(sessionId);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setSuccess('Session terminated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to terminate session. Please try again.');
    } finally {
      setTerminatingId(null);
    }
  }, []);

  const handleTerminateAllOthers = useCallback(async () => {
    setTerminatingAll(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSessions(prev => prev.filter(s => s.isCurrent));
      setShowTerminateAllConfirm(false);
      setSuccess('All other sessions terminated');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to terminate sessions. Please try again.');
    } finally {
      setTerminatingAll(false);
    }
  }, []);

  const getDeviceIcon = (deviceType: UserSession['deviceInfo']['deviceType']) => {
    switch (deviceType) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      default:
        return Monitor;
    }
  };

  const otherSessions = sessions.filter(s => !s.isCurrent);

  return (
    <SettingsSection
      title="Active Sessions"
      description="Manage your active sessions across devices"
    >
      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.map(session => {
          const DeviceIcon = getDeviceIcon(session.deviceInfo.deviceType);
          const isTerminating = terminatingId === session.id;

          return (
            <div
              key={session.id}
              className={`p-4 rounded-lg border ${
                session.isCurrent
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Device Info */}
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${session.isCurrent ? 'bg-blue-500/20' : 'bg-white/10'}`}>
                    <DeviceIcon className={`w-5 h-5 ${session.isCurrent ? 'text-blue-400' : 'text-gray-400'}`} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {session.deviceInfo.browser} on {session.deviceInfo.os}
                      </span>
                      {session.isCurrent && (
                        <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                          Current
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {session.location.city}, {session.location.country}
                      </span>
                      <span>IP: {maskIP(session.ipAddress)}</span>
                    </div>

                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      Last active: {formatRelativeTime(session.lastActive)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {!session.isCurrent && (
                  <button
                    onClick={() => handleTerminateSession(session.id)}
                    disabled={isTerminating}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Terminate session"
                  >
                    {isTerminating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminate All Others */}
      {otherSessions.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <button
            onClick={() => setShowTerminateAllConfirm(true)}
            className={`${tw.buttonSecondary} text-red-400 border-red-500/30 hover:bg-red-500/10`}
          >
            Terminate All Other Sessions
          </button>
          <p className="mt-2 text-xs text-gray-500">
            This will sign you out of all devices except this one.
          </p>
        </div>
      )}

      {/* Terminate All Confirmation Modal */}
      {showTerminateAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#1a1f26] border border-white/10 rounded-lg p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <h4 className="text-lg font-semibold text-white">
                Terminate All Sessions?
              </h4>
            </div>

            <p className="text-sm text-gray-400 mb-2">
              This will immediately sign you out of {otherSessions.length} other{' '}
              {otherSessions.length === 1 ? 'device' : 'devices'}:
            </p>

            <ul className="text-xs text-gray-500 mb-6 space-y-1">
              {otherSessions.slice(0, 3).map(s => (
                <li key={s.id}>
                  {s.deviceInfo.browser} on {s.deviceInfo.os} ({s.location.city})
                </li>
              ))}
              {otherSessions.length > 3 && (
                <li>...and {otherSessions.length - 3} more</li>
              )}
            </ul>

            <div className="flex gap-3">
              <button
                onClick={() => setShowTerminateAllConfirm(false)}
                className={tw.buttonSecondary}
                disabled={terminatingAll}
              >
                Cancel
              </button>
              <button
                onClick={handleTerminateAllOthers}
                disabled={terminatingAll}
                className={`${tw.buttonPrimary} inline-flex items-center gap-2 bg-red-500 hover:bg-red-600`}
              >
                {terminatingAll && <Loader2 className="w-4 h-4 animate-spin" />}
                Terminate All
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}

export default SessionsList;
