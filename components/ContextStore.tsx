import { Folder, Database, File, HardDrive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ContextItem } from '../types/contextInspector';

// Extended mock data with all required fields for the modal
const MOCK_CONTEXT: ContextItem[] = [
    { id: '1', name: 'panopticon-core', type: 'repo', size: 2400000, status: 'cached', fileCount: 847, lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { id: '2', name: 'api-spec-v2.json', type: 'files', size: 450000, status: 'cached', fileCount: 1, lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { id: '3', name: 'memory-dump-242.bin', type: 'files', size: 12000000, status: 'expired', fileCount: 1, lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    { id: '4', name: 'hyperglyph-ui', type: 'repo', size: 5100000, status: 'pending', fileCount: 324, lastUpdated: new Date() },
];

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ContextStore() {
  const navigate = useNavigate();

  const handleItemClick = (item: ContextItem) => {
    // Navigate to the full-page Context Detail Inspector
    navigate(`/project/${item.id}`);
  };

  return (
    <div className="h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Database size={14} /> Context Store
            </h2>
            <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-secondary-foreground font-mono">
                18/500 MB
            </span>
        </div>

        <div className="space-y-1 overflow-y-auto flex-1 pr-1">
            {MOCK_CONTEXT.map(item => (
                <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="group flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-border hover:bg-card transition-all cursor-pointer"
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className={cn(
                            "p-2 rounded-md",
                            item.type === 'repo' ? "bg-chart-1/10 text-chart-1" : "bg-chart-3/10 text-chart-3"
                        )}>
                            {item.type === 'repo' ? <Folder size={16} /> : <File size={16} />}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-foreground truncate">{item.name}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                {formatSize(item.size)} •
                                <span className={cn(
                                    "w-1.5 h-1.5 rounded-full inline-block ml-1",
                                    item.status === 'cached' ? "bg-accent-green" :
                                    item.status === 'pending' ? "bg-chart-4 animate-pulse" : "bg-destructive"
                                )} />
                                {item.status}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border/50">
            <button className="w-full py-2 px-3 bg-secondary/50 hover:bg-secondary text-secondary-foreground text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-2">
                <HardDrive size={14} />
                Manage Storage
            </button>
        </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}