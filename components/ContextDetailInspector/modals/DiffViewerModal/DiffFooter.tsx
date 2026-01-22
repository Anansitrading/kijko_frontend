// DiffFooter Component - Footer with navigation and download
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface DiffFooterProps {
  currentIndex: number;
  totalFiles: number;
  onPrevious: () => void;
  onNext: () => void;
  onDownload: () => void;
}

export function DiffFooter({
  currentIndex,
  totalFiles,
  onPrevious,
  onNext,
  onDownload,
}: DiffFooterProps) {
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < totalFiles - 1;

  return (
    <div className={cn(
      'flex items-center justify-between px-4 py-3',
      'border-t border-slate-800 bg-slate-800/30'
    )}>
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md',
            'transition-colors duration-150',
            hasPrevious
              ? 'text-gray-300 hover:text-white bg-white/5 hover:bg-white/10'
              : 'text-gray-600 cursor-not-allowed'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous File</span>
        </button>

        <span className="text-sm text-gray-500 px-3">
          {currentIndex + 1} / {totalFiles} files
        </span>

        <button
          onClick={onNext}
          disabled={!hasNext}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md',
            'transition-colors duration-150',
            hasNext
              ? 'text-gray-300 hover:text-white bg-white/5 hover:bg-white/10'
              : 'text-gray-600 cursor-not-allowed'
          )}
        >
          <span>Next File</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Download */}
      <button
        onClick={onDownload}
        className={cn(
          'flex items-center gap-2 px-4 py-1.5 text-sm rounded-md',
          'bg-blue-500 hover:bg-blue-600 text-white',
          'transition-colors duration-150'
        )}
      >
        <Download className="w-4 h-4" />
        <span>Download Diff</span>
      </button>
    </div>
  );
}
