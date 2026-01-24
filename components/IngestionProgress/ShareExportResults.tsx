import { useState, useRef, useCallback } from 'react';
import {
  Share2,
  Copy,
  Download,
  Mail,
  Image,
  FileJson,
  Link2,
  Check,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type { IngestionCompletionData } from './IngestionCompletionScreen';

// =============================================================================
// Types
// =============================================================================

type ExportFormat = 'json' | 'png' | 'link';

interface ShareExportResultsProps {
  data: IngestionCompletionData;
  projectUrl?: string;
  isPublic?: boolean;
  onEmailShare?: (email: string) => Promise<void>;
  className?: string;
}

interface ExportButtonProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  isLoading?: boolean;
  isSuccess?: boolean;
  disabled?: boolean;
}

// =============================================================================
// Export Button Component
// =============================================================================

function ExportButton({
  icon,
  label,
  description,
  onClick,
  isLoading = false,
  isSuccess = false,
  disabled = false,
}: ExportButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border text-left w-full',
        'transition-all duration-200',
        disabled
          ? 'border-slate-700 bg-slate-800/30 cursor-not-allowed opacity-50'
          : isSuccess
          ? 'border-emerald-500/50 bg-emerald-500/10'
          : 'border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/50'
      )}
    >
      <div
        className={cn(
          'shrink-0 p-2 rounded-md',
          isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
        )}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isSuccess ? (
          <Check className="w-4 h-4" />
        ) : (
          icon
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className={cn(
          'text-sm font-medium block',
          isSuccess ? 'text-emerald-400' : 'text-slate-200'
        )}>
          {isSuccess ? 'Done!' : label}
        </span>
        <span className="text-xs text-slate-500 block">{description}</span>
      </div>
    </button>
  );
}

// =============================================================================
// JSON Export Helper
// =============================================================================

function generateExportJSON(data: IngestionCompletionData): string {
  const exportData = {
    project: {
      id: data.projectId,
      name: data.projectName,
    },
    metrics: {
      compression: {
        originalTokens: data.originalTokens,
        optimizedTokens: data.optimizedTokens,
        reductionPercent: data.reductionPercent,
      },
      savingsBreakdown: data.savingsBreakdown,
      performance: data.performanceStats,
      files: {
        processed: data.filesProcessed,
        chunks: data.chunksCreated,
      },
      languages: data.languagesDetected,
    },
    exportedAt: new Date().toISOString(),
    exportVersion: '1.0',
  };

  return JSON.stringify(exportData, null, 2);
}

// =============================================================================
// Copy to Clipboard Helper
// =============================================================================

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

// =============================================================================
// Download Helper
// =============================================================================

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// =============================================================================
// Email Modal Component
// =============================================================================

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (email: string) => Promise<void>;
  projectName: string;
}

function EmailModal({ isOpen, onClose, onSend, projectName }: EmailModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await onSend(email);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setEmail('');
      }, 1500);
    } catch (err) {
      setError('Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X size={18} />
        </button>

        <h3 className="text-lg font-semibold text-white mb-2">
          Email Summary
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Send a summary of {projectName} ingestion results to an email address.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-slate-300 mb-1">
              Email address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className={cn(
                'w-full px-3 py-2 rounded-lg bg-slate-800 border text-white',
                'placeholder:text-slate-500 focus:outline-none focus:ring-2',
                error
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-slate-700 focus:ring-blue-500/50 focus:border-blue-500'
              )}
            />
            {error && (
              <p className="text-xs text-red-400 mt-1">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || success}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium',
              'transition-colors',
              success
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : success ? (
              <>
                <Check className="w-4 h-4" />
                Sent!
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Send Summary
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function ShareExportResults({
  data,
  projectUrl,
  isPublic = false,
  onEmailShare,
  className,
}: ShareExportResultsProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [exportedJSON, setExportedJSON] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Copy shareable link
  const handleCopyLink = useCallback(async () => {
    if (!projectUrl) return;

    const success = await copyToClipboard(projectUrl);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }, [projectUrl]);

  // Export as JSON
  const handleExportJSON = useCallback(() => {
    const json = generateExportJSON(data);
    downloadFile(json, `${data.projectName}-metrics.json`, 'application/json');
    setExportedJSON(true);
    setTimeout(() => setExportedJSON(false), 2000);
  }, [data]);

  // Export as PNG (placeholder - would need html-to-image library)
  const handleExportPNG = useCallback(async () => {
    // Note: This is a placeholder. In a real implementation, you would use
    // a library like html-to-image or html2canvas to capture the summary div.
    console.log('PNG export would capture:', summaryRef.current);
    alert('PNG export requires html-to-image library. See implementation notes.');
  }, []);

  // Handle email share
  const handleEmailShare = useCallback(async (email: string) => {
    if (onEmailShare) {
      await onEmailShare(email);
    } else {
      // Fallback: open mailto link with pre-filled content
      const subject = encodeURIComponent(`Ingestion Results: ${data.projectName}`);
      const body = encodeURIComponent(
        `Project: ${data.projectName}\n\n` +
        `Compression Results:\n` +
        `- Original tokens: ${data.originalTokens.toLocaleString()}\n` +
        `- Optimized tokens: ${data.optimizedTokens.toLocaleString()}\n` +
        `- Reduction: ${data.reductionPercent}%\n\n` +
        `Performance:\n` +
        `- Query latency: <${data.performanceStats.queryLatencyMs}ms\n` +
        `- Relevance score: ${data.performanceStats.relevanceScore}%\n\n` +
        (projectUrl ? `View project: ${projectUrl}` : '')
      );
      window.open(`mailto:${email}?subject=${subject}&body=${body}`);
    }
  }, [data, projectUrl, onEmailShare]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Share2 className="w-4 h-4 text-slate-400" />
        <h4 className="text-sm font-medium text-slate-200">Share Results</h4>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Copy Link */}
        <ExportButton
          icon={<Link2 className="w-4 h-4" />}
          label="Copy Link"
          description={isPublic ? 'Anyone with link can view' : 'Private - requires login'}
          onClick={handleCopyLink}
          isSuccess={copiedLink}
          disabled={!projectUrl}
        />

        {/* Export JSON */}
        <ExportButton
          icon={<FileJson className="w-4 h-4" />}
          label="Export JSON"
          description="Download metrics data"
          onClick={handleExportJSON}
          isSuccess={exportedJSON}
        />

        {/* Export PNG */}
        <ExportButton
          icon={<Image className="w-4 h-4" />}
          label="Export Image"
          description="Save as PNG for sharing"
          onClick={handleExportPNG}
        />

        {/* Email */}
        <ExportButton
          icon={<Mail className="w-4 h-4" />}
          label="Email Summary"
          description="Send results via email"
          onClick={() => setIsEmailModalOpen(true)}
        />
      </div>

      {/* Hidden div for PNG capture (reference) */}
      <div ref={summaryRef} className="hidden">
        {/* This would contain the summary content for PNG export */}
      </div>

      {/* Email Modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onSend={handleEmailShare}
        projectName={data.projectName}
      />
    </div>
  );
}

// =============================================================================
// Compact Share Button
// =============================================================================

interface CompactShareButtonProps {
  onClick: () => void;
  className?: string;
}

export function CompactShareButton({ onClick, className }: CompactShareButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-slate-800 border border-slate-700',
        'text-sm text-slate-300 hover:text-white',
        'hover:border-blue-500/50 hover:bg-slate-700',
        'transition-all',
        className
      )}
    >
      <Share2 className="w-4 h-4" />
      Share
    </button>
  );
}

// =============================================================================
// Quick Copy Button
// =============================================================================

interface QuickCopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function QuickCopyButton({ text, label = 'Copy', className }: QuickCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
        'transition-colors',
        copied
          ? 'bg-emerald-500/20 text-emerald-400'
          : 'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600',
        className
      )}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          {label}
        </>
      )}
    </button>
  );
}
