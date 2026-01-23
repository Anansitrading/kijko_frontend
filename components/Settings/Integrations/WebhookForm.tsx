// Webhook Form Component
// Setting Sprint 6: Integrations

import React, { useState, useEffect } from 'react';
import { X, Loader2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import type {
  WebhookFormProps,
  WebhookEventType,
  CreateWebhookData,
} from '../../../types/settings';
import { WEBHOOK_EVENT_LABELS } from '../../../types/settings';
import { tw } from '../../../styles/settings';

// All available webhook events
const ALL_EVENTS: WebhookEventType[] = [
  'lead.created',
  'lead.updated',
  'context.created',
  'context.updated',
  'context.deleted',
  'user.login',
  'user.settings_changed',
  'export.completed',
];

// Generate a random secret
const generateSecret = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export function WebhookForm({ isOpen, webhook, onClose, onSubmit }: WebhookFormProps) {
  const [formData, setFormData] = useState<CreateWebhookData>({
    name: '',
    endpointUrl: '',
    secret: '',
    events: [],
  });
  const [showSecret, setShowSecret] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when editing
  useEffect(() => {
    if (webhook) {
      setFormData({
        name: webhook.name,
        endpointUrl: webhook.endpointUrl,
        secret: webhook.secret,
        events: webhook.events,
      });
    } else {
      setFormData({
        name: '',
        endpointUrl: '',
        secret: generateSecret(),
        events: [],
      });
    }
    setErrors({});
  }, [webhook, isOpen]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.endpointUrl.trim()) {
      newErrors.endpointUrl = 'Endpoint URL is required';
    } else {
      try {
        const url = new URL(formData.endpointUrl);
        if (url.protocol !== 'https:') {
          newErrors.endpointUrl = 'URL must use HTTPS';
        }
      } catch {
        newErrors.endpointUrl = 'Invalid URL format';
      }
    }

    if (!formData.secret.trim()) {
      newErrors.secret = 'Secret is required';
    } else if (formData.secret.length < 16) {
      newErrors.secret = 'Secret must be at least 16 characters';
    }

    if (formData.events.length === 0) {
      newErrors.events = 'Select at least one event';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle event toggle
  const toggleEvent = (event: WebhookEventType) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  // Handle select all / deselect all
  const toggleAllEvents = () => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.length === ALL_EVENTS.length ? [] : [...ALL_EVENTS],
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      setErrors({ submit: 'Failed to save webhook. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            {webhook ? 'Edit Webhook' : 'Create Webhook'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="My Webhook"
              className={errors.name ? tw.inputError : tw.input}
            />
            {errors.name && (
              <p className="text-xs text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          {/* Endpoint URL */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Endpoint URL
            </label>
            <input
              type="url"
              value={formData.endpointUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, endpointUrl: e.target.value }))}
              placeholder="https://your-server.com/webhook"
              className={errors.endpointUrl ? tw.inputError : tw.input}
            />
            {errors.endpointUrl && (
              <p className="text-xs text-destructive mt-1">{errors.endpointUrl}</p>
            )}
          </div>

          {/* Secret */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Signing Secret
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={formData.secret}
                  onChange={(e) => setFormData((prev) => ({ ...prev, secret: e.target.value }))}
                  placeholder="Webhook signing secret"
                  className={errors.secret ? tw.inputError : tw.input}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                >
                  {showSecret ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, secret: generateSecret() }))}
                className={tw.buttonSecondary}
                title="Generate new secret"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {errors.secret && (
              <p className="text-xs text-destructive mt-1">{errors.secret}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Used to verify webhook payloads are from us
            </p>
          </div>

          {/* Events */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-foreground">
                Events
              </label>
              <button
                type="button"
                onClick={toggleAllEvents}
                className="text-xs text-primary hover:underline"
              >
                {formData.events.length === ALL_EVENTS.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="border border-border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
              {ALL_EVENTS.map((event) => (
                <label
                  key={event}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.events.includes(event)}
                    onChange={() => toggleEvent(event)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">
                    {WEBHOOK_EVENT_LABELS[event]}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {event}
                  </span>
                </label>
              ))}
            </div>
            {errors.events && (
              <p className="text-xs text-destructive mt-1">{errors.events}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <p className="text-sm text-destructive">{errors.submit}</p>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className={tw.buttonSecondary}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`${tw.buttonPrimary} flex items-center gap-2`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              webhook ? 'Save Changes' : 'Create Webhook'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WebhookForm;
