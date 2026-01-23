import React, { useState, useCallback } from 'react';
import {
  Key,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  Clock,
  Activity,
} from 'lucide-react';
import { tw } from '../../../styles/settings';
import SettingsSection from '../SettingsSection';
import ApiKeyCreate from './ApiKeyCreate';
import type { ApiKey, CreatedApiKeyResponse } from '../../../types/settings';
import {
  generateMockApiKeys,
  maskApiKey,
  formatLastUsed,
  formatExpirationDate,
  getScopeLabel,
  getScopeColor,
  isKeyExpired,
} from '../../../lib/api-keys';

interface ApiKeyManagerProps {
  initialKeys?: ApiKey[];
}

export function ApiKeyManager({ initialKeys }: ApiKeyManagerProps) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys || generateMockApiKeys());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleKeyCreated = useCallback((response: CreatedApiKeyResponse) => {
    const newKey: ApiKey = {
      id: response.id,
      name: response.name,
      keyPrefix: response.keyPrefix,
      scopes: response.scopes,
      createdAt: new Date(),
      usageCount: 0,
      expiresAt: response.expiresAt,
      isExpired: false,
    };
    setKeys(prev => [newKey, ...prev]);
  }, []);

  const handleRevokeKey = useCallback(async (keyId: string) => {
    setRevokingKeyId(keyId);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      setKeys(prev => prev.filter(k => k.id !== keyId));
      setShowRevokeConfirm(null);
    } catch (err) {
      setError('Failed to revoke API key. Please try again.');
    } finally {
      setRevokingKeyId(null);
    }
  }, []);

  return (
    <SettingsSection
      title="API Keys"
      description="Manage API keys for programmatic access"
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">
          {keys.length} {keys.length === 1 ? 'key' : 'keys'} created
        </p>
        <button
          onClick={() => setShowCreateModal(true)}
          className={`${tw.buttonPrimary} inline-flex items-center gap-2`}
        >
          <Plus className="w-4 h-4" />
          Create New Key
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Keys List */}
      {keys.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
          <Key className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">No API keys yet</p>
          <p className="text-sm text-gray-500 mb-4">
            Create an API key to access the Kijko API programmatically.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className={tw.buttonPrimary}
          >
            Create Your First Key
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map(key => {
            const expired = isKeyExpired(key.expiresAt);
            const isRevoking = revokingKeyId === key.id;

            return (
              <div
                key={key.id}
                className={`p-4 rounded-lg border ${
                  expired
                    ? 'bg-red-500/5 border-red-500/20'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Key Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">
                        {key.name}
                      </span>
                      {expired && (
                        <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                          Expired
                        </span>
                      )}
                    </div>

                    <div className="font-mono text-xs text-gray-500 mb-2">
                      {maskApiKey(key.keyPrefix)}
                    </div>

                    {/* Scopes */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {key.scopes.map(scope => (
                        <span
                          key={scope}
                          className={`px-2 py-0.5 text-xs rounded ${getScopeColor(scope)}`}
                        >
                          {getScopeLabel(scope)}
                        </span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Created {new Date(key.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {key.usageCount.toLocaleString()} uses
                      </span>
                      <span>
                        Last used: {formatLastUsed(key.lastUsedAt)}
                      </span>
                    </div>

                    {key.expiresAt && !expired && (
                      <p className="text-xs text-amber-400 mt-1">
                        {formatExpirationDate(key.expiresAt)}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => setShowRevokeConfirm(key.id)}
                    disabled={isRevoking}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Revoke key"
                  >
                    {isRevoking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-2">API Key Format</h4>
        <div className="space-y-1 font-mono text-xs text-gray-400">
          <p>Production: <span className="text-blue-400">kijko_live_...</span></p>
          <p>Testing: <span className="text-amber-400">kijko_test_...</span></p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Include your API key in the Authorization header: <code className="text-gray-400">Bearer YOUR_API_KEY</code>
        </p>
      </div>

      {/* Create Modal */}
      <ApiKeyCreate
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onKeyCreated={handleKeyCreated}
      />

      {/* Revoke Confirmation Modal */}
      {showRevokeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#1a1f26] border border-white/10 rounded-lg p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h4 className="text-lg font-semibold text-white">
                Revoke API Key?
              </h4>
            </div>

            <p className="text-sm text-gray-400 mb-2">
              This will immediately revoke the API key:
            </p>
            <p className="text-sm text-white font-medium mb-4">
              {keys.find(k => k.id === showRevokeConfirm)?.name}
            </p>
            <p className="text-xs text-gray-500 mb-6">
              Any applications using this key will no longer be able to authenticate.
              This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRevokeConfirm(null)}
                className={tw.buttonSecondary}
                disabled={revokingKeyId !== null}
              >
                Cancel
              </button>
              <button
                onClick={() => handleRevokeKey(showRevokeConfirm)}
                disabled={revokingKeyId !== null}
                className={`${tw.buttonPrimary} inline-flex items-center gap-2 bg-red-500 hover:bg-red-600`}
              >
                {revokingKeyId === showRevokeConfirm && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Revoke Key
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}

export default ApiKeyManager;
