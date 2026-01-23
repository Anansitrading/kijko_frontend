// Setting Sprint 9: Advanced Security - IP Whitelist
import React, { useState, useCallback } from 'react';
import {
  Globe,
  Plus,
  Trash2,
  Edit2,
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronDown,
  Info,
  X,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { tw } from '../../../styles/settings';
import SettingsSection from '../SettingsSection';
import SettingsRow from '../SettingsRow';
import type {
  IPWhitelistEntry,
  IPWhitelistMode,
  IPWhitelistSettings,
} from '../../../types/settings';

interface IPWhitelistProps {
  isEnterprise?: boolean;
}

// Mock IP whitelist entries
function generateMockEntries(): IPWhitelistEntry[] {
  const now = new Date();
  return [
    {
      id: '1',
      teamId: 'team-1',
      name: 'Office Network',
      ipRange: '192.168.1.0/24',
      isActive: true,
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      createdBy: 'admin@company.com',
    },
    {
      id: '2',
      teamId: 'team-1',
      name: 'VPN Gateway',
      ipAddress: '10.0.0.1',
      isActive: true,
      createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      createdBy: 'admin@company.com',
    },
    {
      id: '3',
      teamId: 'team-1',
      name: 'Remote Developer',
      ipAddress: '203.45.67.89',
      isActive: false,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      createdBy: 'manager@company.com',
    },
  ];
}

export function IPWhitelist({ isEnterprise = false }: IPWhitelistProps) {
  const [entries, setEntries] = useState<IPWhitelistEntry[]>(generateMockEntries());
  const [mode, setMode] = useState<IPWhitelistMode>('disabled');
  const [adminBypass, setAdminBypass] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<IPWhitelistEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formIpType, setFormIpType] = useState<'single' | 'range'>('single');
  const [formIpAddress, setFormIpAddress] = useState('');
  const [formIpRange, setFormIpRange] = useState('');

  const handleModeChange = useCallback(async (newMode: IPWhitelistMode) => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setMode(newMode);
      setSuccess(`IP whitelist mode changed to ${newMode}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to change mode');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleAdminBypassChange = useCallback(async (enabled: boolean) => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setAdminBypass(enabled);
      setSuccess(enabled ? 'Admin bypass enabled' : 'Admin bypass disabled');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update admin bypass');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleAddEntry = useCallback(async () => {
    if (!formName.trim()) {
      setError('Name is required');
      return;
    }
    if (formIpType === 'single' && !formIpAddress.trim()) {
      setError('IP address is required');
      return;
    }
    if (formIpType === 'range' && !formIpRange.trim()) {
      setError('IP range is required');
      return;
    }

    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const newEntry: IPWhitelistEntry = {
        id: Date.now().toString(),
        teamId: 'team-1',
        name: formName,
        ...(formIpType === 'single' ? { ipAddress: formIpAddress } : { ipRange: formIpRange }),
        isActive: true,
        createdAt: new Date(),
        createdBy: 'current-user@company.com',
      };

      if (editingEntry) {
        setEntries(prev => prev.map(e => e.id === editingEntry.id ? { ...newEntry, id: editingEntry.id } : e));
        setSuccess('IP address updated');
      } else {
        setEntries(prev => [...prev, newEntry]);
        setSuccess('IP address added to whitelist');
      }

      setShowAddModal(false);
      setEditingEntry(null);
      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to add IP address');
    } finally {
      setIsSaving(false);
    }
  }, [formName, formIpType, formIpAddress, formIpRange, editingEntry]);

  const handleDeleteEntry = useCallback(async (entryId: string) => {
    setDeletingId(entryId);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setEntries(prev => prev.filter(e => e.id !== entryId));
      setSuccess('IP address removed from whitelist');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to remove IP address');
    } finally {
      setDeletingId(null);
    }
  }, []);

  const handleToggleEntry = useCallback(async (entryId: string, isActive: boolean) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setEntries(prev => prev.map(e =>
        e.id === entryId ? { ...e, isActive } : e
      ));
    } catch (err) {
      setError('Failed to update entry');
    }
  }, []);

  const handleEditEntry = useCallback((entry: IPWhitelistEntry) => {
    setEditingEntry(entry);
    setFormName(entry.name);
    setFormIpType(entry.ipAddress ? 'single' : 'range');
    setFormIpAddress(entry.ipAddress || '');
    setFormIpRange(entry.ipRange || '');
    setShowAddModal(true);
  }, []);

  const resetForm = () => {
    setFormName('');
    setFormIpType('single');
    setFormIpAddress('');
    setFormIpRange('');
    setError(null);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingEntry(null);
    resetForm();
  };

  const getModeDescription = (m: IPWhitelistMode) => {
    switch (m) {
      case 'disabled':
        return 'IP restrictions are disabled. All IPs can access the account.';
      case 'warn':
        return 'Non-whitelisted IPs will trigger security alerts but can still access.';
      case 'enforce':
        return 'Only whitelisted IPs can access the account. Others will be blocked.';
    }
  };

  const activeEntries = entries.filter(e => e.isActive);

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      {/* Enterprise Notice */}
      {!isEnterprise && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-400">Enterprise Feature</p>
            <p className="text-xs text-gray-400 mt-1">
              IP whitelisting is available on Enterprise plans.
              Upgrade to restrict access by IP address.
            </p>
          </div>
        </div>
      )}

      {/* Mode Selection */}
      <SettingsSection
        title="IP Whitelist"
        description="Restrict account access to specific IP addresses or ranges"
      >
        <div className="space-y-4">
          <SettingsRow
            label="Whitelist Mode"
            description={getModeDescription(mode)}
          >
            <div className="relative">
              <select
                value={mode}
                onChange={(e) => handleModeChange(e.target.value as IPWhitelistMode)}
                disabled={!isEnterprise || isSaving}
                className={`${tw.dropdown} w-36 text-sm h-9 disabled:opacity-50`}
              >
                <option value="disabled">Disabled</option>
                <option value="warn">Warn Only</option>
                <option value="enforce">Enforce</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </SettingsRow>

          {mode === 'enforce' && (
            <SettingsRow
              label="Admin Bypass"
              description="Allow admins to access from any IP during emergencies"
            >
              <button
                onClick={() => handleAdminBypassChange(!adminBypass)}
                disabled={!isEnterprise || isSaving}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  !isEnterprise || isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                } ${adminBypass ? 'bg-primary' : 'bg-muted'}`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform duration-200 ${
                    adminBypass ? 'translate-x-5 bg-primary-foreground' : 'bg-foreground'
                  }`}
                />
              </button>
            </SettingsRow>
          )}
        </div>
      </SettingsSection>

      <div className="border-t border-white/10" />

      {/* Whitelisted IPs */}
      <SettingsSection
        title="Whitelisted IP Addresses"
        description={`${activeEntries.length} active IP ${activeEntries.length === 1 ? 'address' : 'addresses'} in whitelist`}
      >
        {/* Add Button */}
        <div className="mb-4">
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            disabled={!isEnterprise}
            className={`${tw.buttonPrimary} inline-flex items-center gap-2 text-sm disabled:opacity-50`}
          >
            <Plus className="w-4 h-4" />
            Add IP Address
          </button>
        </div>

        {/* IP List */}
        {entries.length > 0 ? (
          <div className="space-y-2">
            {entries.map(entry => (
              <div
                key={entry.id}
                className={`p-4 rounded-lg border ${
                  entry.isActive
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white/[0.02] border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${entry.isActive ? 'bg-green-500/20' : 'bg-white/10'}`}>
                      <Globe className={`w-5 h-5 ${entry.isActive ? 'text-green-400' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{entry.name}</span>
                        {!entry.isActive && (
                          <span className="px-2 py-0.5 text-xs bg-gray-500/20 text-gray-400 rounded-full">
                            Disabled
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="font-mono">
                          {entry.ipAddress || entry.ipRange}
                        </span>
                        <span>
                          Added by {entry.createdBy.split('@')[0]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleEntry(entry.id, !entry.isActive)}
                      disabled={!isEnterprise}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                      title={entry.isActive ? 'Disable' : 'Enable'}
                    >
                      {entry.isActive ? (
                        <ToggleRight className="w-4 h-4 text-green-400" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEditEntry(entry)}
                      disabled={!isEnterprise}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      disabled={!isEnterprise || deletingId === entry.id}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === entry.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No IP addresses in whitelist</p>
            <p className="text-xs mt-1">Add IP addresses to restrict access</p>
          </div>
        )}
      </SettingsSection>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#1a1f26] border border-white/10 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">
                {editingEntry ? 'Edit IP Address' : 'Add IP Address'}
              </h4>
              <button
                onClick={handleCloseModal}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Office Network"
                  className={tw.input}
                />
              </div>

              {/* IP Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormIpType('single')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm transition-colors ${
                      formIpType === 'single'
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    Single IP
                  </button>
                  <button
                    onClick={() => setFormIpType('range')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm transition-colors ${
                      formIpType === 'range'
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    IP Range (CIDR)
                  </button>
                </div>
              </div>

              {/* IP Address / Range */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  {formIpType === 'single' ? 'IP Address' : 'IP Range (CIDR)'}
                </label>
                <input
                  type="text"
                  value={formIpType === 'single' ? formIpAddress : formIpRange}
                  onChange={(e) => formIpType === 'single'
                    ? setFormIpAddress(e.target.value)
                    : setFormIpRange(e.target.value)
                  }
                  placeholder={formIpType === 'single' ? '192.168.1.1' : '192.168.1.0/24'}
                  className={`${tw.input} font-mono`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formIpType === 'single'
                    ? 'Enter a single IPv4 or IPv6 address'
                    : 'Enter a CIDR range (e.g., 10.0.0.0/8)'
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className={tw.buttonSecondary}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleAddEntry}
                disabled={isSaving}
                className={`${tw.buttonPrimary} inline-flex items-center gap-2 flex-1`}
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingEntry ? 'Update' : 'Add'} IP Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IPWhitelist;
