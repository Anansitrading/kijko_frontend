import { Cpu } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import type { CompressionAlgorithmInfo } from '../../../../types/contextInspector';

interface CompressionDetailsProps {
  algorithmInfo: CompressionAlgorithmInfo;
}

export function CompressionDetails({ algorithmInfo }: CompressionDetailsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Cpu size={14} className="text-gray-500" />
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Compression Algorithm
        </h3>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-gray-500">•</span>
          <span className="text-gray-400">Method:</span>
          <span className="text-white">{algorithmInfo.method}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-gray-500">•</span>
          <span className="text-gray-400">Preserve:</span>
          <span className="text-white">{algorithmInfo.preserves.join(', ')}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-gray-500">•</span>
          <span className="text-gray-400">Optimization Level:</span>
          <span className="text-white">{algorithmInfo.optimizationLevel}</span>
        </div>
      </div>
    </div>
  );
}
