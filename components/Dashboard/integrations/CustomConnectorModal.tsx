// Custom Connector Modal Component
// Form for creating and editing custom MCP server integrations

import { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Upload,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import type {
  CustomConnectorFormProps,
  CreateCustomConnectorData,
  IntegrationCategory,
  CustomConnectorAuthType,
} from '../../../types/settings';
import { INTEGRATION_CATEGORIES } from '../../../types/settings';
import { tw } from '../../../styles/settings';

const CATEGORY_OPTIONS: { value: IntegrationCategory | 'custom'; label: string; icon: string }[] = [
  { value: 'custom', label: 'Custom', icon: 'zap' },
  { value: 'crm', label: 'CRM', icon: 'users' },
  { value: 'communication', label: 'Communication', icon: 'message-circle' },
  { value: 'productivity', label: 'Productivity', icon: 'briefcase' },
  { value: 'analytics', label: 'Analytics', icon: 'bar-chart-2' },
  { value: 'storage', label: 'Storage', icon: 'hard-drive' },
  { value: 'development', label: 'Development', icon: 'code' },
];

const AUTH_OPTIONS: { value: CustomConnectorAuthType; label: string; description: string }[] = [
  { value: 'none', label: 'No Authentication', description: 'Public endpoint with no auth required' },
  { value: 'api_key', label: 'API Key', description: 'Authenticate with an API key header' },
  { value: 'basic', label: 'Basic Auth', description: 'HTTP Basic username/password' },
  { value: 'oauth', label: 'OAuth 2.0', description: 'OAuth 2.0 authorization flow' },
];

export function CustomConnectorModal({
  isOpen,
  connector,
  onClose,
  onSubmit,
}: CustomConnectorFormProps) {
  const [formData, setFormData] = useState<CreateCustomConnectorData>({
    name: '',
    description: '',
    remoteMcpServerUrl: '',
    category: 'custom',
    authType: 'none',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form when editing
  useEffect(() => {
    if (connector) {
      setFormData({
        name: connector.name,
        description: connector.description || '',
        remoteMcpServerUrl: connector.remoteMcpServerUrl,
        category: connector.category,
        iconUrl: connector.iconUrl,
        authType: connector.authType,
        config: connector.config,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        remoteMcpServerUrl: '',
        category: 'custom',
        authType: 'none',
      });
    }
    setErrors({});
    setTestResult(null);
  }, [connector, isOpen]);

  // URL validation
  const validateUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  // Form validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name must be 50 characters or less';
    }

    if (!formData.remoteMcpServerUrl.trim()) {
      newErrors.remoteMcpServerUrl = 'Server URL is required';
    } else if (!validateUrl(formData.remoteMcpServerUrl)) {
      newErrors.remoteMcpServerUrl = 'Please enter a valid URL (http:// or https://)';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must be 200 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Test connection
  const handleTestConnection = async () => {
    if (!validateUrl(formData.remoteMcpServerUrl)) {
      setErrors((prev) => ({ ...prev, remoteMcpServerUrl: 'Please enter a valid URL first' }));
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Simulate connection test - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // Randomly succeed or fail for demo
      const success = Math.random() > 0.3;
      setTestResult(success ? 'success' : 'error');
    } catch {
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
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
      setErrors({ submit: 'Failed to save connector. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle icon upload (placeholder)
  const handleIconUpload = () => {
    // TODO: Implement file upload
    console.log('Icon upload clicked');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {connector ? 'Edit Custom Connector' : 'Add Custom Connector'}
              </h3>
              <p className="text-xs text-muted-foreground">MCP Server Integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="My Custom Integration"
              className={errors.name ? tw.inputError : tw.input}
              maxLength={50}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          {/* Remote MCP Server URL */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Remote MCP Server URL <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="url"
                  value={formData.remoteMcpServerUrl}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, remoteMcpServerUrl: e.target.value }));
                    setTestResult(null);
                  }}
                  placeholder="https://your-mcp-server.com/api"
                  className={cn(
                    errors.remoteMcpServerUrl ? tw.inputError : tw.input,
                    testResult === 'success' && 'border-emerald-500 focus:border-emerald-500',
                    testResult === 'error' && 'border-red-500 focus:border-red-500'
                  )}
                />
                {testResult && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {testResult === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !formData.remoteMcpServerUrl}
                className={cn(tw.buttonSecondary, 'flex items-center gap-2 whitespace-nowrap')}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </button>
            </div>
            {errors.remoteMcpServerUrl && (
              <p className="text-xs text-destructive mt-1">{errors.remoteMcpServerUrl}</p>
            )}
            {testResult === 'success' && (
              <p className="text-xs text-emerald-500 mt-1">Connection successful!</p>
            )}
            {testResult === 'error' && (
              <p className="text-xs text-red-500 mt-1">Connection failed. Please check the URL.</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this connector does..."
              rows={3}
              className={cn(tw.input, 'resize-none')}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {(formData.description || '').length}/200
            </p>
            {errors.description && (
              <p className="text-xs text-destructive mt-1">{errors.description}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  category: e.target.value as IntegrationCategory | 'custom',
                }))
              }
              className={tw.dropdown}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-card">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Icon Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Icon</label>
            <button
              type="button"
              onClick={handleIconUpload}
              className="w-full border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Drag & drop or click to upload
              </span>
              <span className="text-xs text-muted-foreground">PNG, JPG up to 1MB</span>
            </button>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Advanced Settings
          </button>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="space-y-4 pl-4 border-l-2 border-border">
              {/* Auth Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Authentication Type
                </label>
                <div className="space-y-2">
                  {AUTH_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        'flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all',
                        formData.authType === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-border/80'
                      )}
                    >
                      <input
                        type="radio"
                        name="authType"
                        value={option.value}
                        checked={formData.authType === option.value}
                        onChange={() =>
                          setFormData((prev) => ({ ...prev, authType: option.value }))
                        }
                        className="mt-0.5"
                      />
                      <div>
                        <span className="text-sm font-medium text-foreground">{option.label}</span>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Timeout */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Request Timeout (ms)
                </label>
                <input
                  type="number"
                  value={formData.config?.timeout || 30000}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      config: { ...prev.config, timeout: parseInt(e.target.value) || 30000 },
                    }))
                  }
                  min={1000}
                  max={120000}
                  className={tw.input}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Default: 30000ms (30 seconds)
                </p>
              </div>

              {/* Retry Policy */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Max Retries
                </label>
                <input
                  type="number"
                  value={formData.config?.retryPolicy?.maxRetries || 3}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      config: {
                        ...prev.config,
                        retryPolicy: {
                          maxRetries: parseInt(e.target.value) || 3,
                          backoffMs: prev.config?.retryPolicy?.backoffMs || 1000,
                        },
                      },
                    }))
                  }
                  min={0}
                  max={10}
                  className={tw.input}
                />
              </div>
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && <p className="text-sm text-destructive">{errors.submit}</p>}
        </form>

        {/* Footer */}
        <div className="flex justify-between gap-3 p-4 border-t border-border">
          <p className="text-xs text-muted-foreground self-center">
            <span className="text-destructive">*</span> Required fields
          </p>
          <div className="flex gap-3">
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
              className={cn(tw.buttonPrimary, 'flex items-center gap-2')}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : connector ? (
                'Save Changes'
              ) : (
                'Add Connector'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomConnectorModal;
