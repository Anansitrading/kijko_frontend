import { Clock } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import {
  formatNumber,
  formatDateTime,
  formatRelativeTime,
  formatInterval,
  formatFileChange,
} from '../../../../utils/formatting';
import type { IngestionEntry } from '../../../../types/contextInspector';

interface IngestionHistoryProps {
  totalIngestions: number;
  lastIngestion: Date;
  avgInterval: number;
  history: IngestionEntry[];
}

function IngestionEntryRow({ entry }: { entry: IngestionEntry }) {
  return (
    <div className="py-2 px-2.5 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-500 font-mono text-xs">
          #{entry.number}
        </span>
        <span className="text-gray-400 text-xs">
          {formatDateTime(entry.timestamp)}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        {entry.filesAdded > 0 && (
          <span className="text-emerald-400">
            {formatFileChange(entry.filesAdded, true)}
          </span>
        )}
        {entry.filesRemoved > 0 && (
          <span className="text-red-400">
            {formatFileChange(entry.filesRemoved, false)}
          </span>
        )}
        {entry.filesAdded === 0 && entry.filesRemoved === 0 && (
          <span className="text-gray-500">No changes</span>
        )}
      </div>
    </div>
  );
}

export function IngestionHistory({
  totalIngestions,
  lastIngestion,
  avgInterval,
  history,
}: IngestionHistoryProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-gray-500" />
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Ingestion History
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center pb-3 border-b border-white/5">
        <div>
          <div className="text-white font-semibold text-lg">{totalIngestions}</div>
          <div className="text-gray-500 text-[10px] uppercase">Total</div>
        </div>
        <div>
          <div className="text-white font-medium text-sm">{formatRelativeTime(lastIngestion)}</div>
          <div className="text-gray-500 text-[10px] uppercase">Last</div>
        </div>
        <div>
          <div className="text-white font-medium text-sm">{formatInterval(avgInterval)}</div>
          <div className="text-gray-500 text-[10px] uppercase">Avg</div>
        </div>
      </div>

      <div className="space-y-1.5 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
        {history.map((entry) => (
          <IngestionEntryRow key={entry.number} entry={entry} />
        ))}
      </div>
    </div>
  );
}
