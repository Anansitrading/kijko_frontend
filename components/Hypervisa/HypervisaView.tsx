import React, { useState, useMemo, useRef } from "react";
import {
  Search,
  List,
  LayoutGrid,
  Plus,
  Package,
  FileText,
  FolderOpen,
  Check,
  AlertTriangle,
  Clock,
  X,
  Database,
  Upload,
  Link,
  HardDrive,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { ContextItem, IngestionConfig } from "../../types";
import { ContextItem as InspectorContextItem } from "../../types/contextInspector";
import { IngestionWizard } from "./IngestionWizard";
import { useContextInspector } from "../../contexts/ContextInspectorContext";

// Convert HypervisaView ContextItem to ContextInspector ContextItem format
function toInspectorContextItem(item: ContextItem): InspectorContextItem {
  // Parse size string to bytes (e.g., "2.4 MB" -> 2516582)
  const parseSize = (sizeStr: string): number => {
    const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    const multipliers: Record<string, number> = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
    return Math.round(value * (multipliers[unit] || 1));
  };

  return {
    id: item.id,
    name: item.name,
    type: item.type === 'file' ? 'files' : item.type,
    size: parseSize(item.size),
    fileCount: item.type === 'repo' ? 42 : 1, // Mock file count
    lastUpdated: new Date(),
    status: item.status,
  };
}

// Mock context data
const MOCK_CONTEXT: ContextItem[] = [
  { id: "1", name: "panopticon-core", type: "repo", size: "2.4 MB", status: "cached" },
  { id: "2", name: "api-spec-v2.json", type: "file", size: "450 KB", status: "cached" },
  { id: "3", name: "memory-dump-242.bin", type: "file", size: "12 MB", status: "expired" },
  { id: "4", name: "hyperglyph-ui", type: "repo", size: "5.1 MB", status: "pending" },
];

type ViewMode = "list" | "grid";

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

interface SelectedFile {
  id: string;
  name: string;
  size: string;
}

interface NewIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: SelectedFile) => void;
}

function NewIngestionModal({ isOpen, onClose, onFileSelect }: NewIngestionModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect({
        id: crypto.randomUUID(),
        name: file.name,
        size: formatFileSize(file.size),
      });
      onClose();
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="*/*"
      />

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Database size={20} className="text-blue-400" />
            New Ingestion
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-400">
            Choose how you want to add new context to the store.
          </p>

          <div className="space-y-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg transition-all group"
            >
              <div className="p-2 bg-blue-600/10 text-blue-400 rounded-lg group-hover:bg-blue-600/20">
                <Upload size={20} />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-slate-200">Upload Files</div>
                <div className="text-xs text-slate-500">Upload local files or folders</div>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg transition-all group">
              <div className="p-2 bg-emerald-600/10 text-emerald-400 rounded-lg group-hover:bg-emerald-600/20">
                <Link size={20} />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-slate-200">Connect Repository</div>
                <div className="text-xs text-slate-500">Link a Git repository</div>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg transition-all group">
              <div className="p-2 bg-orange-600/10 text-orange-400 rounded-lg group-hover:bg-orange-600/20">
                <HardDrive size={20} />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-slate-200">External Source</div>
                <div className="text-xs text-slate-500">Connect API or database</div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/30">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: ContextItem["status"] }) {
  switch (status) {
    case "cached":
      return <Check size={14} className="text-emerald-400" />;
    case "expired":
      return <AlertTriangle size={14} className="text-amber-400" />;
    case "pending":
      return <Clock size={14} className="text-blue-400 animate-pulse" />;
  }
}

function ItemIcon({ type }: { type: ContextItem["type"] }) {
  switch (type) {
    case "repo":
      return <Package size={18} className="text-blue-400" />;
    case "file":
      return <FileText size={18} className="text-slate-400" />;
    default:
      return <FolderOpen size={18} className="text-slate-400" />;
  }
}

function ListView({ items, onItemClick }: { items: ContextItem[]; onItemClick: (item: ContextItem) => void }) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onItemClick(item)}
          className="group flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-slate-700 hover:bg-slate-800/50 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-slate-800 rounded-lg border border-slate-700 group-hover:border-slate-600">
              <ItemIcon type={item.type} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-200 truncate">
                {item.name}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {item.type === "repo" ? "Repository" : "File"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div className="text-xs text-slate-400 font-mono w-16">
              {item.size}
            </div>
            <div className="flex items-center gap-2 w-24">
              <StatusIcon status={item.status} />
              <span
                className={cn(
                  "text-xs font-medium",
                  item.status === "cached" && "text-emerald-400",
                  item.status === "expired" && "text-amber-400",
                  item.status === "pending" && "text-blue-400"
                )}
              >
                {item.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GridView({ items, onItemClick }: { items: ContextItem[]; onItemClick: (item: ContextItem) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onItemClick(item)}
          className="group flex flex-col items-center p-4 rounded-xl border border-slate-700 bg-slate-800/30 hover:bg-slate-800/60 hover:border-slate-600 transition-all cursor-pointer"
        >
          <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700 mb-3 group-hover:border-slate-600">
            <ItemIcon type={item.type} />
          </div>

          <div className="text-sm font-medium text-slate-200 truncate w-full text-center mb-1" title={item.name}>
            {item.name.length > 12 ? `${item.name.slice(0, 10)}...` : item.name}
          </div>

          <div className="text-xs text-slate-500 font-mono mb-2">
            {item.size}
          </div>

          <div className="flex items-center gap-1.5">
            <StatusIcon status={item.status} />
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wide",
                item.status === "cached" && "text-emerald-400",
                item.status === "expired" && "text-amber-400",
                item.status === "pending" && "text-blue-400"
              )}
            >
              {item.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HypervisaView() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [contextItems, setContextItems] = useState<ContextItem[]>(MOCK_CONTEXT);
  const { openModal } = useContextInspector();

  // Wrapper to convert item type before opening modal
  const handleItemClick = (item: ContextItem) => {
    openModal(toInspectorContextItem(item));
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return contextItems;
    const query = searchQuery.toLowerCase();
    return contextItems.filter((item) =>
      item.name.toLowerCase().includes(query)
    );
  }, [searchQuery, contextItems]);

  // Get existing codebases (repos) for the wizard
  const existingCodebases = useMemo(() => {
    return contextItems
      .filter((item) => item.type === "repo")
      .map((item) => ({ id: item.id, name: item.name }));
  }, [contextItems]);

  const handleFileSelect = (file: SelectedFile) => {
    setSelectedFile(file);
    setIsWizardOpen(true);
  };

  const handleIngestionSubmit = async (config: IngestionConfig) => {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Add new item to context store
    const newItem: ContextItem = {
      id: config.fileId,
      name: config.displayName,
      type: "file",
      size: selectedFile?.size || "0 KB",
      status: "pending",
    };

    setContextItems((prev) => [...prev, newItem]);
    setSelectedFile(null);
  };

  const totalSize = useMemo(() => {
    // Calculate total size (simplified for mock data)
    return contextItems.length > 0 ? `${(contextItems.length * 5).toFixed(1)} MB` : "0 MB";
  }, [contextItems]);
  const itemCount = contextItems.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 p-4 md:p-6 border-b border-slate-700 bg-slate-900/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Title & Stats */}
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Database size={20} className="text-blue-400" />
              Context Store
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              {itemCount} items • {totalSize} total
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search context items..."
                className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-slate-800/50 border border-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === "list"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-slate-200"
                )}
                title="List view"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === "grid"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-slate-200"
                )}
                title="Grid view"
              >
                <LayoutGrid size={18} />
              </button>
            </div>

            {/* New Ingestion Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 transition-all"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New Ingestion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 mb-4">
              <Search size={32} className="text-slate-600" />
            </div>
            <h3 className="text-sm font-medium text-slate-400 mb-1">
              No items found
            </h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search query
            </p>
          </div>
        ) : viewMode === "list" ? (
          <ListView items={filteredItems} onItemClick={handleItemClick} />
        ) : (
          <GridView items={filteredItems} onItemClick={handleItemClick} />
        )}
      </div>

      {/* New Ingestion Modal */}
      <NewIngestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFileSelect={handleFileSelect}
      />

      {/* Ingestion Wizard */}
      {selectedFile && (
        <IngestionWizard
          isOpen={isWizardOpen}
          onClose={() => {
            setIsWizardOpen(false);
            setSelectedFile(null);
          }}
          file={selectedFile}
          existingCodebases={existingCodebases}
          onSubmit={handleIngestionSubmit}
        />
      )}
    </div>
  );
}
