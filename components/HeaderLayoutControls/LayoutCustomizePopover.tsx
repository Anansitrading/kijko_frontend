import { useRef, useEffect, useState, useCallback } from 'react';
import { GripHorizontal, RotateCcw } from 'lucide-react';
import { useLayout, type PanelPosition } from '../../contexts/LayoutContext';
import { cn } from '../../utils/cn';

const PANEL_LABELS: Record<PanelPosition, string> = {
  left: 'Explorer',
  center: 'Chat',
  right: 'History',
};

const PANEL_COLORS: Record<PanelPosition, string> = {
  left: 'border-emerald-500/40 bg-emerald-500/10',
  center: 'border-blue-500/40 bg-blue-500/10',
  right: 'border-purple-500/40 bg-purple-500/10',
};

const PANEL_TEXT_COLORS: Record<PanelPosition, string> = {
  left: 'text-emerald-400',
  center: 'text-blue-400',
  right: 'text-purple-400',
};

interface LayoutCustomizePopoverProps {
  onClose: () => void;
}

export function LayoutCustomizePopover({ onClose }: LayoutCustomizePopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { state, setPanelOrder } = useLayout();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Local preview order: drives the popover visuals during drag
  const [previewOrder, setPreviewOrder] = useState(state.panelOrder);

  // Sync preview with actual order when not dragging
  useEffect(() => {
    if (dragIndex === null) {
      setPreviewOrder(state.panelOrder);
    }
  }, [state.panelOrder, dragIndex]);

  // Close on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);

    // Live preview reorder: only moves blocks in the popover
    if (dragIndex !== null && dragIndex !== index) {
      setPreviewOrder(prev => {
        const newOrder = [...prev] as [PanelPosition, PanelPosition, PanelPosition];
        const [moved] = newOrder.splice(dragIndex, 1);
        newOrder.splice(index, 0, moved);
        return newOrder;
      });
      setDragIndex(index);
    }
  }, [dragIndex]);

  // Ref to track whether a successful drop occurred (read synchronously in dragEnd)
  const didDropRef = useRef(false);

  const handleDrop = useCallback(() => {
    // Commit preview order to actual layout
    didDropRef.current = true;
    setPanelOrder(previewOrder);
    setDragIndex(null);
    setDragOverIndex(null);
  }, [previewOrder, setPanelOrder]);

  const handleDragEnd = useCallback(() => {
    if (!didDropRef.current) {
      // Cancelled drag: revert preview to actual order
      setPreviewOrder(state.panelOrder);
    }
    didDropRef.current = false;
    setDragIndex(null);
    setDragOverIndex(null);
  }, [state.panelOrder]);

  const handleReset = useCallback(() => {
    setPanelOrder(['left', 'center', 'right']);
  }, [setPanelOrder]);

  const isDefault =
    state.panelOrder[0] === 'left' &&
    state.panelOrder[1] === 'center' &&
    state.panelOrder[2] === 'right';

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-1 bg-[#141b2d] border border-[#1e293b] rounded-lg shadow-xl z-50 py-2 px-3"
      style={{ width: 280 }}
    >
      <div className="pb-2 mb-2 border-b border-[#1e293b]">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Panel Order</span>
      </div>

      {/* Horizontal panel blocks */}
      <div className="flex items-stretch gap-1.5">
        {previewOrder.map((panel, index) => (
          <div
            key={panel}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-md border cursor-grab active:cursor-grabbing',
              'transition-all duration-100',
              PANEL_COLORS[panel],
              dragOverIndex === index && dragIndex !== index && 'ring-2 ring-blue-500/50 scale-105',
              dragIndex === index && 'opacity-40 scale-95'
            )}
          >
            <GripHorizontal className="w-3.5 h-3.5 text-gray-500" />
            <span className={cn('text-[11px] font-medium', PANEL_TEXT_COLORS[panel])}>
              {PANEL_LABELS[panel]}
            </span>
          </div>
        ))}
      </div>

      {!isDefault && (
        <div className="pt-2 mt-2 border-t border-[#1e293b]">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2 py-1 w-full rounded-md text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset to default
          </button>
        </div>
      )}
    </div>
  );
}
