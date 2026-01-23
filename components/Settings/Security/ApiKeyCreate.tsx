import React, { useState, useCallback } from 'react';
import {
  X,
  Key,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { tw } from '../../../styles/settings';
import type {
  ApiKeyScope,
  ApiKeyExpiration,
  CreateApiKeyData,
  CreatedApiKeyResponse,
} from '../../../types/settings';
import {
  createApiKey,
  validateKeyName,
  getScopeLabel,
  getScopeDescription,
  getScopeColor,
  formatExpirationDate,
} from '../../../lib/api-keys';

interface ApiKeyCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyCreated: (response: CreatedApiKeyResponse) => void;
}

const EXPIRATION_OPTIONS: { value: ApiKeyExpiration; label: string }[] = [
  { value: 'never', label: 'Never expires' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
  { value: 'custom', label: 'Custom' },
];

const SCOPE_OPTIONS: ApiKeyScope[] = ['read', 'write', 'admin'];

export function ApiKeyCreate({ isOpen, onClose, onKeyCreated }: ApiKeyCreateProps) {
  const [step, setStep] = useState<'form' | 'result'>('form');
  const [name, setName] = useState('');
  const [expiration, setExpiration] = useState<ApiKeyExpiration>('never');
  const [customDays, setCustomDays] = useState('');
  const [scopes, setScopes] = useState<ApiKeyScope[]>(['read']);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<CreatedApiKeyResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleScopeToggle = (scope: ApiKeyScope) => {
    setScopes(prev => {
      if (prev.includes(scope)) {
        // Don't allow removing the last scope
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== scope);
      }
      return [...prev, scope];
    });
  };

  const handleCreate = useCallback(async () => {
    const validation = validateKeyName(name);
    if (!validation.valid) {
      setError(validation.error || 'Invalid name');
      return;
    }

    if (expiration === 'custom' && (!customDays || parseInt(customDays, 10) < 1)) {
      setError('Please enter a valid number of days');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const data: CreateApiKeyData = {
        name: name.trim(),
        expiration,
        customExpirationDays: expiration === 'custom' ? parseInt(customDays, 10) : undefined,
        scopes,
      };

      const response = await createApiKey(data);
      setCreatedKey(response);
      setStep('result');
      onKeyCreated(response);
    } catch (err) {
      setError('Failed to create API key. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }, [name, expiration, customDays, scopes, onKeyCreated]);

  const handleCopyKey = useCallback(async () => {
    if (createdKey) {
      await navigator.clipboard.writeText(createdKey.key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  }, [createdKey]);

  const handleClose = useCallback(() => {
    // Reset state
    setStep('form');
    setName('');
    setExpiration('never');
    setCustomDays('');
    setScopes(['read']);
    setError(null);
    setCreatedKey(null);
    setCopiedKey(false);
    setShowKey(false);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#1a1f26] border border-white/10 rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Key className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              {step === 'form' ? 'Create API Key' : 'API Key Created'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/10 rounded"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {step === 'form' ? (
          <>
            {/* Form */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Production API"
                  className={tw.input}
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  A descriptive name to identify this key
                </p>
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Expiration
                </label>
                <select
                  value={expiration}
                  onChange={e => setExpiration(e.target.value as ApiKeyExpiration)}
                  className={tw.dropdown}
                >
                  {EXPIRATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value} className={tw.dropdownOption}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {expiration === 'custom' && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      value={customDays}
                      onChange={e => setCustomDays(e.target.value)}
                      placeholder="Number of days"
                      min="1"
                      max="365"
                      className={`${tw.input} w-32`}
                    />
                    <span className="text-sm text-gray-400">days</span>
                  </div>
                )}
              </div>

              {/* Scopes */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  {SCOPE_OPTIONS.map(scope => (
                    <label
                      key={scope}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        scopes.includes(scope)
                          ? 'bg-blue-500/10 border-blue-500/30'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={scopes.includes(scope)}
                        onChange={() => handleScopeToggle(scope)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-white">
                          {getScopeLabel(scope)}
                        </span>
                        <p className="text-xs text-gray-500">
                          {getScopeDescription(scope)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button onClick={handleClose} className={tw.buttonSecondary}>
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || isCreating}
                className={`${tw.buttonPrimary} flex-1 inline-flex items-center justify-center gap-2 ${
                  !name.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Key
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Result */}
            <div className="space-y-4">
              {/* Warning */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-400">
                    Copy your API key now
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    This is the only time you&apos;ll see this key. Store it securely.
                  </p>
                </div>
              </div>

              {/* Key Display */}
              {createdKey && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{createdKey.name}</span>
                    <div className="flex gap-1">
                      {createdKey.scopes.map(scope => (
                        <span
                          key={scope}
                          className={`px-2 py-0.5 text-xs rounded ${getScopeColor(scope)}`}
                        >
                          {getScopeLabel(scope)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex-1 p-2 bg-black/30 rounded font-mono text-sm overflow-x-auto">
                      {showKey ? (
                        <span className="text-white break-all">{createdKey.key}</span>
                      ) : (
                        <span className="text-gray-500">{'*'.repeat(48)}</span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="p-2 hover:bg-white/10 rounded"
                      title={showKey ? 'Hide key' : 'Show key'}
                    >
                      {showKey ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={handleCopyKey}
                      className="p-2 hover:bg-white/10 rounded"
                      title="Copy key"
                    >
                      {copiedKey ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {createdKey.expiresAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      {formatExpirationDate(createdKey.expiresAt)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6">
              <button
                onClick={handleClose}
                className={`${tw.buttonPrimary} w-full`}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ApiKeyCreate;
