// Audit Event Card Component
// Setting Sprint 10: Audit Log

import React from 'react';
import {
  User,
  Folder,
  Users,
  Shield,
  Link,
  Server,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Monitor,
} from 'lucide-react';
import type { AuditLogEntry, AuditEventCategory } from '../../../types/settings';
import { AUDIT_CATEGORY_CONFIG, AUDIT_EVENT_TYPE_LABELS } from '../../../types/settings';
import { formatRelativeTime, formatFullTimestamp, getInitials } from '../../../lib/audit-log';

interface AuditEventCardProps {
  entry: AuditLogEntry;
  isExpanded?: boolean;
  onToggleExpand: () => void;
}

// Get icon component for category
function getCategoryIcon(category: AuditEventCategory) {
  const icons: Record<AuditEventCategory, React.ReactNode> = {
    user: <User className="w-4 h-4" />,
    context: <Folder className="w-4 h-4" />,
    team: <Users className="w-4 h-4" />,
    security: <Shield className="w-4 h-4" />,
    integration: <Link className="w-4 h-4" />,
    system: <Server className="w-4 h-4" />,
  };
  return icons[category];
}

export function AuditEventCard({ entry, isExpanded, onToggleExpand }: AuditEventCardProps) {
  const categoryConfig = AUDIT_CATEGORY_CONFIG[entry.eventCategory];
  const eventLabel = AUDIT_EVENT_TYPE_LABELS[entry.eventType] || entry.eventType;
  const hasDetails = entry.metadata || entry.changes;

  return (
    <div
      className="group bg-card hover:bg-muted/50 border border-border rounded-lg p-4 transition-colors"
    >
      {/* Main row */}
      <div className="flex items-start gap-4">
        {/* User avatar */}
        <div className="flex-shrink-0">
          {entry.userAvatarUrl ? (
            <img
              src={entry.userAvatarUrl}
              alt={entry.userName || 'User'}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
              style={{
                backgroundColor: categoryConfig.bgColor,
                color: categoryConfig.color,
              }}
            >
              {getInitials(entry.userName)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header with description */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                {entry.description}
              </p>

              {/* Meta info row */}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {/* Category badge */}
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: categoryConfig.bgColor,
                    color: categoryConfig.color,
                  }}
                >
                  {getCategoryIcon(entry.eventCategory)}
                  {categoryConfig.label}
                </span>

                {/* Event type */}
                <span className="text-xs text-muted-foreground">
                  {eventLabel}
                </span>

                {/* User email if different from name */}
                {entry.userEmail && (
                  <span className="text-xs text-muted-foreground">
                    {entry.userEmail}
                  </span>
                )}
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex-shrink-0 text-right">
              <span className="text-sm text-muted-foreground" title={formatFullTimestamp(entry.createdAt)}>
                {formatRelativeTime(entry.createdAt)}
              </span>
            </div>
          </div>

          {/* Expand button for details */}
          {hasDetails && (
            <button
              onClick={onToggleExpand}
              className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Show details
                </>
              )}
            </button>
          )}

          {/* Expanded details */}
          {isExpanded && hasDetails && (
            <div className="mt-4 pt-4 border-t border-border space-y-4">
              {/* Metadata */}
              {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Details
                  </h4>
                  <div className="bg-secondary rounded-md p-3 space-y-1">
                    {Object.entries(entry.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                        </span>
                        <span className="text-foreground">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Changes */}
              {entry.changes && entry.changes.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Changes
                  </h4>
                  <div className="bg-secondary rounded-md p-3 space-y-2">
                    {entry.changes.map((change, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="text-muted-foreground capitalize">
                          {change.field.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}:
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-destructive line-through">
                            {String(change.oldValue || 'empty')}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-accent">
                            {String(change.newValue || 'empty')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical info */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {entry.ipAddress && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {entry.ipAddress}
                  </span>
                )}
                {entry.sessionId && (
                  <span className="flex items-center gap-1">
                    <Monitor className="w-3 h-3" />
                    Session: {entry.sessionId}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatFullTimestamp(entry.createdAt)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuditEventCard;
