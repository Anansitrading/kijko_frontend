import { cn } from '../../../../utils/cn';
import { formatNumber } from '../../../../utils/formatting';
import type { CompressionMetrics } from '../../../../types/contextInspector';

type StatCardVariant = 'primary' | 'secondary' | 'tertiary';

interface StatCardProps {
  value: string;
  label: string;
  variant: StatCardVariant;
}

function StatCard({ value, label, variant }: StatCardProps) {
  const variantStyles = {
    primary: {
      container: 'bg-slate-800/60 border-cyan-500/20',
      label: 'text-xs text-cyan-400 font-medium',
      value: 'text-2xl font-bold text-white tracking-tight',
    },
    secondary: {
      container: 'bg-slate-800/40 border-white/5',
      label: 'text-xs text-gray-400',
      value: 'text-lg font-semibold text-gray-300 tracking-tight',
    },
    tertiary: {
      container: 'bg-slate-800/30 border-white/5',
      label: 'text-xs text-gray-500',
      value: 'text-base font-medium text-gray-400 tracking-tight',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={cn('border rounded-lg py-2.5 px-4 flex items-center justify-between', styles.container)}>
      <div className={styles.label}>
        {label}
      </div>
      <div className={styles.value}>
        {value}
      </div>
    </div>
  );
}

interface CompressionStatsProps {
  metrics: CompressionMetrics;
  tokensSaved: number;
}

export function CompressionStats({ metrics, tokensSaved }: CompressionStatsProps) {
  return (
    <div className="flex flex-col gap-2">
      <StatCard
        value={formatNumber(metrics.compressedTokens)}
        label="Current Tokens"
        variant="primary"
      />
      <StatCard
        value={formatNumber(metrics.originalTokens)}
        label="Starting Tokens"
        variant="secondary"
      />
      <StatCard
        value={formatNumber(tokensSaved)}
        label="Saved Tokens"
        variant="tertiary"
      />
    </div>
  );
}
