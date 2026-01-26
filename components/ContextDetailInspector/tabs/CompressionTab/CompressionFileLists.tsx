import { useState } from 'react';
import { CheckCircle2, Clock, ShieldOff, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import { formatNumber } from '../../../../utils/formatting';
import type {
  CompressedFileItem,
  PendingCompressionFileItem,
  NeverCompressFileItem,
} from '../../../../types/contextInspector';

interface CompressionFileListsProps {
  compressedFiles: CompressedFileItem[];
  pendingFiles: PendingCompressionFileItem[];
  neverCompressFiles: NeverCompressFileItem[];
}

function SectionHeader({
  icon: Icon,
  title,
  count,
  isOpen,
  onToggle,
  iconColor,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  iconColor: string;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 w-full group"
    >
      {isOpen ? (
        <ChevronDown size={14} className="text-gray-500" />
      ) : (
        <ChevronRight size={14} className="text-gray-500" />
      )}
      <Icon size={14} className={iconColor} />
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </h3>
      <span className="text-[10px] text-gray-600 font-medium ml-auto">
        {count} {count === 1 ? 'file' : 'files'}
      </span>
    </button>
  );
}

function CompressedFileRow({ file }: { file: CompressedFileItem }) {
  const saved = file.originalTokens - file.compressedTokens;
  const savedPercent = ((saved / file.originalTokens) * 100).toFixed(0);

  return (
    <div className="py-2 px-2.5 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1 mr-4">
          <div className="text-sm text-gray-300 truncate">{file.name}</div>
          <div className="text-[10px] text-gray-600 truncate">{file.path}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-500 font-mono">{formatNumber(file.originalTokens)}</span>
          <ArrowRight size={10} className="text-gray-600" />
          <span className="text-xs text-emerald-400 font-mono">{formatNumber(file.compressedTokens)}</span>
          <span className="text-[10px] text-emerald-500/60 font-mono w-10 text-right">-{savedPercent}%</span>
        </div>
      </div>
    </div>
  );
}

function PendingFileRow({ file }: { file: PendingCompressionFileItem }) {
  const estimatedSaved = ((file.currentTokens - file.estimatedTokens) / file.currentTokens * 100).toFixed(0);

  return (
    <div className="py-2 px-2.5 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1 mr-4">
          <div className="text-sm text-gray-300 truncate">{file.name}</div>
          <div className="text-[10px] text-gray-600 truncate">{file.path}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400 font-mono">{formatNumber(file.currentTokens)}</span>
          <ArrowRight size={10} className="text-gray-600" />
          <span className="text-xs text-amber-400 font-mono">~{formatNumber(file.estimatedTokens)}</span>
          <span className="text-[10px] text-amber-500/60 font-mono w-10 text-right">-{estimatedSaved}%</span>
        </div>
      </div>
    </div>
  );
}

function NeverCompressFileRow({ file }: { file: NeverCompressFileItem }) {
  return (
    <div className="py-2 px-2.5 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1 mr-4">
          <div className="text-sm text-gray-300 truncate">{file.name}</div>
          <div className="text-[10px] text-gray-600 truncate">
            {file.reason ? file.reason : file.path}
          </div>
        </div>
        <div className="shrink-0">
          <span className="text-xs text-gray-500 font-mono">{formatNumber(file.tokens)}</span>
        </div>
      </div>
    </div>
  );
}

export function CompressionFileLists({
  compressedFiles,
  pendingFiles,
  neverCompressFiles,
}: CompressionFileListsProps) {
  const [compressedOpen, setCompressedOpen] = useState(true);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [neverOpen, setNeverOpen] = useState(true);

  return (
    <div className="space-y-5">
      {/* Compressed Files */}
      <div className="space-y-2.5">
        <SectionHeader
          icon={CheckCircle2}
          title="Compressed Files"
          count={compressedFiles.length}
          isOpen={compressedOpen}
          onToggle={() => setCompressedOpen(!compressedOpen)}
          iconColor="text-emerald-500"
        />
        {compressedOpen && (
          <div className="space-y-1.5">
            {compressedFiles.map((file) => (
              <CompressedFileRow key={file.id} file={file} />
            ))}
          </div>
        )}
      </div>

      {/* Pending Compression */}
      <div className="space-y-2.5">
        <SectionHeader
          icon={Clock}
          title="Pending Compression"
          count={pendingFiles.length}
          isOpen={pendingOpen}
          onToggle={() => setPendingOpen(!pendingOpen)}
          iconColor="text-amber-500"
        />
        {pendingOpen && (
          <div className="space-y-1.5">
            {pendingFiles.map((file) => (
              <PendingFileRow key={file.id} file={file} />
            ))}
          </div>
        )}
      </div>

      {/* Never Compress */}
      <div className="space-y-2.5">
        <SectionHeader
          icon={ShieldOff}
          title="Never Compress"
          count={neverCompressFiles.length}
          isOpen={neverOpen}
          onToggle={() => setNeverOpen(!neverOpen)}
          iconColor="text-red-400"
        />
        {neverOpen && (
          <div className="space-y-1.5">
            {neverCompressFiles.map((file) => (
              <NeverCompressFileRow key={file.id} file={file} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
