import { cn } from '../../../../utils/cn';
import { formatNumber, formatRatio } from '../../../../utils/formatting';
import type { CompressionMetrics } from '../../../../types/contextInspector';

interface StatCardProps {
  value: string;
  unit: string;
  label: string;
}

function StatCard({ value, unit, label }: StatCardProps) {
  return (
    <div className="flex-1 bg-slate-800/50 border border-white/5 rounded-lg p-4 text-center">
      <div className="text-2xl font-bold text-white tracking-tight">
        {value}
      </div>
      <div className="text-sm text-gray-400 mt-0.5">
        {unit}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {label}
      </div>
    </div>
  );
}

interface CompressionStatsProps {
  metrics: CompressionMetrics;
}

export function CompressionStats({ metrics }: CompressionStatsProps) {
  return (
    <div className="flex gap-3">
      <StatCard
        value={formatNumber(metrics.originalTokens)}
        unit="tokens"
        label="Starting Tokens"
      />
      <StatCard
        value={formatNumber(metrics.compressedTokens)}
        unit="tokens"
        label="Current Tokens"
      />
      <StatCard
        value={formatRatio(metrics.ratio)}
        unit="compression"
        label="Space Saved"
      />
    </div>
  );
}
