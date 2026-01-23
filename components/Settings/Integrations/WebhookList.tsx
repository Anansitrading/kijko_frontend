// Webhook List Component
// Setting Sprint 6: Integrations

import React from 'react';
import {
  Webhook,
  MoreVertical,
  Pencil,
  Trash2,
  Play,
  Pause,
  TestTube,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import type { WebhookListProps, WebhookStatus, Webhook as WebhookType } from '../../../types/settings';
import { WEBHOOK_EVENT_LABELS } from '../../../types/settings';
import { tw } from '../../../styles/settings';

interface WebhookRowProps {
  webhook: WebhookType;
  onEdit: (webhook: WebhookType) => void;
  onDelete: (webhookId: string) => void;
  onToggleStatus: (webhookId: string, status: WebhookStatus) => void;
  onTest: (webhookId: string) => void;
  onViewLogs: (webhookId: string) => void;
}

function WebhookRow({
  webhook,
  onEdit,
  onDelete,
  onToggleStatus,
  onTest,
  onViewLogs,
}: WebhookRowProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const isActive = webhook.status === 'active';

  // Format date
  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className={`${tw.card} p-4`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <Webhook className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-foreground truncate">
              {webhook.name}
            </h4>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                isActive
                  ? 'bg-accent/20 text-accent'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {isActive ? 'Active' : 'Paused'}
            </span>
          </div>

          <p className="text-xs text-muted-foreground truncate mb-2">
            {webhook.endpointUrl}
          </p>

          {/* Events */}
          <div className="flex flex-wrap gap-1 mb-2">
            {webhook.events.slice(0, 3).map((event) => (
              <span
                key={event}
                className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded"
              >
                {WEBHOOK_EVENT_LABELS[event]}
              </span>
            ))}
            {webhook.events.length > 3 && (
              <span className="text-xs px-1.5 py-0.5 text-muted-foreground">
                +{webhook.events.length - 3} more
              </span>
            )}
          </div>

          {/* Last triggered */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            Last triggered: {formatDate(webhook.lastTriggeredAt)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Test button */}
          <button
            onClick={() => onTest(webhook.id)}
            className={`${tw.buttonGhost} p-2`}
            title="Test webhook"
          >
            <TestTube className="w-4 h-4" />
          </button>

          {/* View logs button */}
          <button
            onClick={() => onViewLogs(webhook.id)}
            className={`${tw.buttonGhost} p-2`}
            title="View delivery logs"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* More menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`${tw.buttonGhost} p-2`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-md shadow-lg z-10 py-1 min-w-[160px]">
                <button
                  onClick={() => {
                    onEdit(webhook);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onToggleStatus(webhook.id, isActive ? 'paused' : 'active');
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                >
                  {isActive ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Activate
                    </>
                  )}
                </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={() => {
                    onDelete(webhook.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WebhookList({
  webhooks,
  onEdit,
  onDelete,
  onToggleStatus,
  onTest,
  onViewLogs,
}: WebhookListProps) {
  if (webhooks.length === 0) {
    return (
      <div className={`${tw.card} p-8 text-center`}>
        <Webhook className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h4 className="text-sm font-medium text-foreground mb-1">No webhooks configured</h4>
        <p className="text-sm text-muted-foreground">
          Create a webhook to receive real-time event notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {webhooks.map((webhook) => (
        <WebhookRow
          key={webhook.id}
          webhook={webhook}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
          onTest={onTest}
          onViewLogs={onViewLogs}
        />
      ))}
    </div>
  );
}

export default WebhookList;
