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
    <div className="flex items-center justify-between py-2.5 px-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-gray-500 font-mono text-sm">
          #{entry.number}
        </span>
        <span className="text-gray-300 text-sm">
          {formatDateTime(entry.timestamp)}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm">
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-gray-500" />
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Ingestion History
        </h3>
      </div>

      <div className="flex items-center gap-6 text-sm pb-2 border-b border-white/5">
        <div>
          <span className="text-gray-400">Total Ingestions: </span>
          <span className="text-white font-medium">{totalIngestions}</span>
        </div>
        <div className="text-gray-600">|</div>
        <div>
          <span className="text-gray-400">Last: </span>
          <span className="text-white font-medium">{formatRelativeTime(lastIngestion)}</span>
        </div>
        <div className="text-gray-600">|</div>
        <div>
          <span className="text-gray-400">Avg: </span>
          <span className="text-white font-medium">{formatInterval(avgInterval)}</span>
        </div>
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
        {history.map((entry) => (
          <IngestionEntryRow key={entry.number} entry={entry} />
        ))}
      </div>
    </div>
  );
}
