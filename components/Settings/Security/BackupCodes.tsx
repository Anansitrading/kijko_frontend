import React, { useState, useCallback } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { tw } from '../../../styles/settings';
import type { BackupCode } from '../../../types/settings';
import { generateBackupCodes, downloadBackupCodes } from '../../../lib/2fa';

interface BackupCodesProps {
  isOpen: boolean;
  codes: BackupCode[];
  onClose: () => void;
  onRegenerate: (newCodes: BackupCode[]) => void;
  accountEmail?: string;
}

export function BackupCodes({
  isOpen,
  codes,
  onClose,
  onRegenerate,
  accountEmail = 'user@example.com',
}: BackupCodesProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyCode = useCallback(async (code: string, index: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  const handleCopyAll = useCallback(async () => {
    const allCodes = codes.map(c => c.code).join('\n');
    await navigator.clipboard.writeText(allCodes);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }, [codes]);

  const handleDownload = useCallback(() => {
    downloadBackupCodes(codes, accountEmail);
  }, [codes, accountEmail]);

  const handleRegenerate = useCallback(async () => {
    setIsRegenerating(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      const newCodes = generateBackupCodes(10);
      onRegenerate(newCodes);
      setShowRegenerateConfirm(false);
    } finally {
      setIsRegenerating(false);
    }
  }, [onRegenerate]);

  const usedCount = codes.filter(c => c.isUsed).length;
  const remainingCount = codes.length - usedCount;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#1a1f26] border border-white/10 rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Backup Codes</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Status */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-white/5 rounded-lg">
          <div className={`text-2xl font-bold ${remainingCount <= 3 ? 'text-amber-400' : 'text-green-400'}`}>
            {remainingCount}
          </div>
          <div>
            <p className="text-sm text-white">codes remaining</p>
            <p className="text-xs text-gray-500">{usedCount} of {codes.length} used</p>
          </div>
        </div>

        {remainingCount <= 3 && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-400">
              You&apos;re running low on backup codes. Consider generating new ones.
            </p>
          </div>
        )}

        {/* Codes Grid */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {codes.map((code, index) => (
            <div
              key={index}
              className={`flex items-center justify-between px-3 py-2 rounded border ${
                code.isUsed
                  ? 'bg-white/5 border-white/5 opacity-50'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <code className={`font-mono text-sm ${code.isUsed ? 'line-through text-gray-500' : 'text-white'}`}>
                {code.code}
              </code>
              {!code.isUsed && (
                <button
                  onClick={() => handleCopyCode(code.code, index)}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  {copiedIndex === index ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={handleCopyAll}
            className={`${tw.buttonSecondary} inline-flex items-center gap-2`}
          >
            {copiedAll ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            Copy All
          </button>
          <button
            onClick={handleDownload}
            className={`${tw.buttonSecondary} inline-flex items-center gap-2`}
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={() => setShowRegenerateConfirm(true)}
            className={`${tw.buttonSecondary} inline-flex items-center gap-2`}
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 border-t border-white/10 pt-4">
          <p className="mb-2">
            <strong>How to use backup codes:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Each code can only be used once</li>
            <li>Use a backup code when you can&apos;t access your authenticator app</li>
            <li>Store these codes in a safe place (password manager, safe deposit box)</li>
          </ul>
        </div>

        {/* Regenerate Confirmation Modal */}
        {showRegenerateConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-[#1a1f26] border border-white/10 rounded-lg p-6 w-full max-w-sm mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-amber-500/20">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <h4 className="text-lg font-semibold text-white">
                  Regenerate Codes?
                </h4>
              </div>

              <p className="text-sm text-gray-400 mb-6">
                This will invalidate all your existing backup codes. You will receive
                10 new codes. Make sure to save them in a secure location.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRegenerateConfirm(false)}
                  className={tw.buttonSecondary}
                  disabled={isRegenerating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className={`${tw.buttonPrimary} inline-flex items-center gap-2`}
                >
                  {isRegenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Regenerate Codes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BackupCodes;
