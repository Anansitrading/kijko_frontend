import { cn } from '../../../../utils/cn';
import { formatNumber, formatPercent, formatCurrency } from '../../../../utils/formatting';

interface CompressionProgressProps {
  savingsPercent: number;
  tokensSaved: number;
  costSavings: number;
}

export function CompressionProgress({
  savingsPercent,
  tokensSaved,
  costSavings,
}: CompressionProgressProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Compression Progress</span>
          <span className="text-white font-medium">
            {formatPercent(savingsPercent)} compressed
          </span>
        </div>
        <div className="h-2.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${savingsPercent}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <div>
          <span className="text-gray-400">Token Savings: </span>
          <span className="text-emerald-400 font-medium">
            {formatNumber(tokensSaved)} tokens
          </span>
        </div>
        <div>
          <span className="text-gray-400">Estimated Cost Savings: </span>
          <span className="text-emerald-400 font-medium">
            {formatCurrency(costSavings)} per 1M queries
          </span>
        </div>
      </div>
    </div>
  );
}
