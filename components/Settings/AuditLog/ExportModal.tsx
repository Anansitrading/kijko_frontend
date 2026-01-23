// Export Modal Component
// Setting Sprint 10: Audit Log

import React, { useState } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
  Calendar,
  Clock,
  Lock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type {
  AuditLogFilters,
  AuditExportFormat,
  AuditExportRequest,
  AuditExportSchedule,
  PlanTier,
} from '../../../types/settings';
import {
  getAvailableExportFormats,
  isPdfExportAvailable,
  isScheduledExportAvailable,
} from '../../../lib/audit-log';

interface ExportModalProps {
  isOpen: boolean;
  filters: AuditLogFilters;
  currentPlan: PlanTier;
  onClose: () => void;
  onExport: (request: AuditExportRequest) => Promise<void>;
}

const formatIcons: Record<AuditExportFormat, React.ReactNode> = {
  csv: <FileSpreadsheet className="w-5 h-5" />,
  json: <FileJson className="w-5 h-5" />,
  pdf: <FileText className="w-5 h-5" />,
};

const formatLabels: Record<AuditExportFormat, { label: string; description: string }> = {
  csv: {
    label: 'CSV',
    description: 'Spreadsheet format, compatible with Excel and Google Sheets',
  },
  json: {
    label: 'JSON',
    description: 'Structured data format for developers and integrations',
  },
  pdf: {
    label: 'PDF',
    description: 'Formatted document for reports and compliance',
  },
};

const scheduleOptions: { id: AuditExportSchedule | 'none'; label: string }[] = [
  { id: 'none', label: 'One-time export' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export function ExportModal({
  isOpen,
  filters,
  currentPlan,
  onClose,
  onExport,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<AuditExportFormat>('csv');
  const [selectedSchedule, setSelectedSchedule] = useState<AuditExportSchedule | 'none'>('none');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableFormats = getAvailableExportFormats(currentPlan);
  const canUsePdf = isPdfExportAvailable(currentPlan);
  const canSchedule = isScheduledExportAvailable(currentPlan);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      await onExport({
        format: selectedFormat,
        filters,
        schedule: selectedSchedule !== 'none' ? selectedSchedule : undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  // Format the date range for display
  const dateRangeText = filters.dateFrom && filters.dateTo
    ? `${filters.dateFrom.toLocaleDateString()} - ${filters.dateTo.toLocaleDateString()}`
    : 'All time';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card border border-border rounded-lg shadow-xl z-50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Export Audit Log
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Export Format
            </label>
            <div className="space-y-2">
              {(['csv', 'json', 'pdf'] as AuditExportFormat[]).map((format) => {
                const isAvailable = availableFormats.includes(format);
                const isSelected = selectedFormat === format;

                return (
                  <button
                    key={format}
                    onClick={() => isAvailable && setSelectedFormat(format)}
                    disabled={!isAvailable}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : isAvailable
                        ? 'border-border hover:border-primary/50 hover:bg-muted/50'
                        : 'border-border/50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {formatIcons[format]}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isSelected ? 'text-foreground' : 'text-foreground'}`}>
                          {formatLabels[format].label}
                        </span>
                        {!isAvailable && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            <Lock className="w-3 h-3" />
                            Enterprise
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {formatLabels[format].description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Export Schedule
            </label>
            <div className="grid grid-cols-4 gap-2">
              {scheduleOptions.map((option) => {
                const isScheduledOption = option.id !== 'none';
                const isAvailable = !isScheduledOption || canSchedule;
                const isSelected = selectedSchedule === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => isAvailable && setSelectedSchedule(option.id)}
                    disabled={!isAvailable}
                    className={`relative px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : isAvailable
                        ? 'border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
                        : 'border-border/50 text-muted-foreground/50 cursor-not-allowed'
                    }`}
                  >
                    {option.label}
                    {isScheduledOption && !canSchedule && (
                      <Lock className="absolute top-1 right-1 w-3 h-3" />
                    )}
                  </button>
                );
              })}
            </div>
            {!canSchedule && (
              <p className="mt-2 text-xs text-muted-foreground">
                Scheduled exports are available on Enterprise plans
              </p>
            )}
          </div>

          {/* Export summary */}
          <div className="bg-secondary rounded-lg p-4">
            <h4 className="text-sm font-medium text-foreground mb-3">
              Export Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date Range
                </span>
                <span className="text-foreground">{dateRangeText}</span>
              </div>
              {filters.eventCategory && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="text-foreground capitalize">{filters.eventCategory}</span>
                </div>
              )}
              {filters.searchQuery && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Search</span>
                  <span className="text-foreground">"{filters.searchQuery}"</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Schedule
                </span>
                <span className="text-foreground">
                  {scheduleOptions.find((s) => s.id === selectedSchedule)?.label}
                </span>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

export default ExportModal;
