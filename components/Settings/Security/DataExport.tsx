import React, { useState, useCallback } from 'react';
import {
  Download,
  FileJson,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Settings,
  Activity,
  Layers,
  Puzzle,
} from 'lucide-react';
import { tw } from '../../../styles/settings';
import SettingsSection from '../SettingsSection';
import type {
  DataExportRequest,
  DataExportType,
  DataExportCategory,
  DataExportStatus,
} from '../../../types/settings';

interface DataExportProps {
  initialExports?: DataExportRequest[];
}

const EXPORT_CATEGORIES: {
  id: DataExportCategory;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'profile',
    label: 'Profile Information',
    description: 'Name, email, avatar, and account details',
    icon: User,
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'All your application preferences',
    icon: Settings,
  },
  {
    id: 'activity',
    label: 'Activity History',
    description: 'Login history and usage data',
    icon: Activity,
  },
  {
    id: 'contexts',
    label: 'Contexts and Sources',
    description: 'Your contexts, sources, and related data',
    icon: Layers,
  },
  {
    id: 'integrations',
    label: 'Integration Data',
    description: 'Connected services and their data',
    icon: Puzzle,
  },
];

// Helper to format file size
function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Helper to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return new Date(date).toLocaleDateString();
}

// Get status badge
function getStatusBadge(status: DataExportStatus) {
  switch (status) {
    case 'pending':
      return { color: 'bg-amber-500/20 text-amber-400', icon: Clock, label: 'Pending' };
    case 'processing':
      return { color: 'bg-blue-500/20 text-blue-400', icon: Loader2, label: 'Processing' };
    case 'ready':
      return { color: 'bg-green-500/20 text-green-400', icon: CheckCircle, label: 'Ready' };
    case 'expired':
      return { color: 'bg-gray-500/20 text-gray-400', icon: XCircle, label: 'Expired' };
    case 'failed':
      return { color: 'bg-red-500/20 text-red-400', icon: XCircle, label: 'Failed' };
  }
}

// Mock data for demo
function generateMockExports(): DataExportRequest[] {
  const now = new Date();

  return [
    {
      id: '1',
      type: 'full',
      categories: ['profile', 'settings', 'activity', 'contexts', 'integrations'],
      status: 'ready',
      requestedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 22 * 60 * 60 * 1000),
      fileUrl: '#',
      fileSize: 2456789,
    },
    {
      id: '2',
      type: 'selective',
      categories: ['profile', 'settings'],
      status: 'expired',
      requestedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 47 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      fileSize: 128456,
    },
  ];
}

export function DataExport({ initialExports }: DataExportProps) {
  const [exports, setExports] = useState<DataExportRequest[]>(
    initialExports || generateMockExports()
  );
  const [exportType, setExportType] = useState<DataExportType>('full');
  const [selectedCategories, setSelectedCategories] = useState<DataExportCategory[]>([
    'profile',
    'settings',
    'activity',
    'contexts',
    'integrations',
  ]);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCategoryToggle = (category: DataExportCategory) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(c => c !== category);
      }
      return [...prev, category];
    });
  };

  const handleRequestExport = useCallback(async () => {
    setIsRequesting(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newExport: DataExportRequest = {
        id: crypto.randomUUID(),
        type: exportType,
        categories: exportType === 'full' ? EXPORT_CATEGORIES.map(c => c.id) : selectedCategories,
        status: 'pending',
        requestedAt: new Date(),
      };

      setExports(prev => [newExport, ...prev]);
      setSuccess('Export requested! You will be notified when it\'s ready.');
      setTimeout(() => setSuccess(null), 5000);

      // Simulate processing
      setTimeout(() => {
        setExports(prev =>
          prev.map(e =>
            e.id === newExport.id
              ? { ...e, status: 'processing' as DataExportStatus }
              : e
          )
        );
      }, 2000);

      // Simulate completion
      setTimeout(() => {
        setExports(prev =>
          prev.map(e =>
            e.id === newExport.id
              ? {
                  ...e,
                  status: 'ready' as DataExportStatus,
                  completedAt: new Date(),
                  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                  fileUrl: '#',
                  fileSize: Math.floor(Math.random() * 5000000) + 100000,
                }
              : e
          )
        );
      }, 5000);
    } catch (err) {
      setError('Failed to request export. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  }, [exportType, selectedCategories]);

  return (
    <SettingsSection
      title="Data Export"
      description="Download a copy of your data (GDPR compliant)"
    >
      {/* Export Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-3">
          Export Type
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => setExportType('full')}
            className={`flex-1 p-4 rounded-lg border text-left transition-colors ${
              exportType === 'full'
                ? 'bg-blue-500/10 border-blue-500/30'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <span className="text-sm font-medium text-white">Full Export</span>
            <p className="text-xs text-gray-500 mt-1">
              Download all your data
            </p>
          </button>
          <button
            onClick={() => setExportType('selective')}
            className={`flex-1 p-4 rounded-lg border text-left transition-colors ${
              exportType === 'selective'
                ? 'bg-blue-500/10 border-blue-500/30'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <span className="text-sm font-medium text-white">Selective Export</span>
            <p className="text-xs text-gray-500 mt-1">
              Choose specific data categories
            </p>
          </button>
        </div>
      </div>

      {/* Category Selection (Selective Export) */}
      {exportType === 'selective' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-3">
            Select Categories
          </label>
          <div className="space-y-2">
            {EXPORT_CATEGORIES.map(category => {
              const Icon = category.icon;
              const isSelected = selectedCategories.includes(category.id);

              return (
                <label
                  key={category.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <Icon className="w-4 h-4 text-gray-400" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-white">
                      {category.label}
                    </span>
                    <p className="text-xs text-gray-500">{category.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Request Button */}
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

      <button
        onClick={handleRequestExport}
        disabled={isRequesting}
        className={`${tw.buttonPrimary} inline-flex items-center gap-2 mb-8`}
      >
        {isRequesting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Request Export
      </button>

      {/* Export History */}
      {exports.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-white mb-3">Export History</h4>
          <div className="space-y-3">
            {exports.map(exp => {
              const statusBadge = getStatusBadge(exp.status);
              const StatusIcon = statusBadge.icon;

              return (
                <div
                  key={exp.id}
                  className="p-4 bg-white/5 border border-white/10 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-white/10">
                        <FileJson className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">
                            {exp.type === 'full' ? 'Full Export' : 'Selective Export'}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded flex items-center gap-1 ${statusBadge.color}`}>
                            <StatusIcon className={`w-3 h-3 ${exp.status === 'processing' ? 'animate-spin' : ''}`} />
                            {statusBadge.label}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 mb-1">
                          Requested {formatRelativeTime(exp.requestedAt)}
                          {exp.fileSize && ` \u00B7 ${formatFileSize(exp.fileSize)}`}
                        </p>

                        <div className="flex flex-wrap gap-1">
                          {exp.categories.slice(0, 3).map(cat => (
                            <span
                              key={cat}
                              className="px-1.5 py-0.5 text-xs bg-white/10 text-gray-400 rounded"
                            >
                              {EXPORT_CATEGORIES.find(c => c.id === cat)?.label || cat}
                            </span>
                          ))}
                          {exp.categories.length > 3 && (
                            <span className="px-1.5 py-0.5 text-xs bg-white/10 text-gray-400 rounded">
                              +{exp.categories.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Download Button */}
                    {exp.status === 'ready' && exp.fileUrl && (
                      <a
                        href={exp.fileUrl}
                        download
                        className={`${tw.buttonSecondary} inline-flex items-center gap-2`}
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    )}
                  </div>

                  {/* Expiration Warning */}
                  {exp.status === 'ready' && exp.expiresAt && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
                      <AlertTriangle className="w-3 h-3" />
                      Download available until {new Date(exp.expiresAt).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-500">
        <p className="mb-2">
          <strong className="text-gray-400">Export Format:</strong> Your data is exported
          as a ZIP archive containing JSON files.
        </p>
        <p>
          <strong className="text-gray-400">Download Link:</strong> Export links are
          valid for 24 hours. After that, you&apos;ll need to request a new export.
        </p>
      </div>
    </SettingsSection>
  );
}

export default DataExport;
