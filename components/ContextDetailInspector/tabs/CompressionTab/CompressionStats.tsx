import { cn } from '../../../../utils/cn';
import { formatNumber } from '../../../../utils/formatting';
import type { CompressionMetrics } from '../../../../types/contextInspector';

type StatCardVariant = 'primary' | 'secondary' | 'tertiary';

interface StatCardProps {
  value: string;
  label: string;
  cost: string;
  variant: StatCardVariant;
}

function StatCard({ value, label, cost, variant }: StatCardProps) {
  const variantStyles = {
    primary: {
      container: 'bg-slate-800/60 border-cyan-500/20',
      label: 'text-[10px] text-cyan-400 font-medium uppercase tracking-wider',
      value: 'text-lg font-bold text-white tracking-tight',
      cost: 'text-[10px] text-cyan-400/60',
    },
    secondary: {
      container: 'bg-slate-800/40 border-white/5',
      label: 'text-[10px] text-gray-400 uppercase tracking-wider',
      value: 'text-lg font-semibold text-gray-300 tracking-tight',
      cost: 'text-[10px] text-gray-500',
    },
    tertiary: {
      container: 'bg-slate-800/30 border-white/5',
      label: 'text-[10px] text-gray-500 uppercase tracking-wider',
      value: 'text-lg font-medium text-gray-400 tracking-tight',
      cost: 'text-[10px] text-gray-600',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={cn('border rounded-lg p-3 flex flex-col items-center justify-center text-center', styles.container)}>
      <div className={styles.value}>
        {value}
      </div>
      <div className={styles.cost}>
        {cost}
      </div>
      <div className={styles.label}>
        {label}
      </div>
    </div>
  );
}

interface CompressionStatsProps {
  metrics: CompressionMetrics;
  tokensSaved: number;
}

function formatCost(tokens: number, costPerToken: number): string {
  const cost = tokens * costPerToken;
  return cost < 0.01 ? '< $0.01' : `$${cost.toFixed(2)}`;
}

export function CompressionStats({ metrics, tokensSaved }: CompressionStatsProps) {
  const costPerToken = tokensSaved > 0 ? metrics.costSavings / tokensSaved : 0;

  return (
    <div className="grid grid-cols-3 gap-2">
      <StatCard
        value={formatNumber(metrics.compressedTokens)}
        cost={formatCost(metrics.compressedTokens, costPerToken)}
        label="Current Tokens"
        variant="primary"
      />
      <StatCard
        value={formatNumber(metrics.originalTokens)}
        cost={formatCost(metrics.originalTokens, costPerToken)}
        label="Starting Tokens"
        variant="secondary"
      />
      <StatCard
        value={formatNumber(tokensSaved)}
        cost={formatCost(tokensSaved, costPerToken)}
        label="Saved Tokens"
        variant="tertiary"
      />
    </div>
  );
}
