/**
 * Step 2C: File Upload
 *
 * Upload files/folders directly instead of from repository.
 * Includes smart filters for excluding dependencies and build artifacts.
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  Upload,
  FileText,
  Folder,
  X,
  AlertCircle,
  Check,
  Loader2,
  Archive,
  FileCode,
  Settings2,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import type {
  FileInput,
  FileFilterConfig,
  UploadedFile,
  UploadProgressState,
} from '../../../types/project';
import { DEFAULT_FILE_FILTERS } from '../../../types/project';

// =============================================================================
// Types
// =============================================================================

interface Step2CProps {
  files: FileInput[];
  onSetFiles: (files: FileInput[]) => void;
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(type: string): React.ReactNode {
  if (type.includes('zip') || type.includes('tar') || type.includes('gz')) {
    return <Archive className="w-4 h-4" />;
  }
  if (type.includes('javascript') || type.includes('typescript') || type.includes('json')) {
    return <FileCode className="w-4 h-4" />;
  }
  return <FileText className="w-4 h-4" />;
}

function shouldExcludeFile(path: string, filters: FileFilterConfig): boolean {
  const pathLower = path.toLowerCase();

  // Exclude node_modules and dependencies
  if (filters.excludeNodeModules) {
    if (
      pathLower.includes('node_modules') ||
      pathLower.includes('vendor') ||
      pathLower.includes('packages') ||
      pathLower.includes('.pnpm') ||
      pathLower.includes('__pycache__') ||
      pathLower.includes('.venv') ||
      pathLower.includes('venv')
    ) {
      return true;
    }
  }

  // Exclude build artifacts
  if (filters.excludeBuildArtifacts) {
    if (
      pathLower.includes('/dist/') ||
      pathLower.includes('/build/') ||
      pathLower.includes('/out/') ||
      pathLower.includes('/.next/') ||
      pathLower.includes('/target/') ||
      pathLower.includes('/.cache/') ||
      pathLower.endsWith('.min.js') ||
      pathLower.endsWith('.min.css')
    ) {
      return true;
    }
  }

  // Exclude test files
  if (filters.excludeTests) {
    if (
      pathLower.includes('.test.') ||
      pathLower.includes('.spec.') ||
      pathLower.includes('__tests__') ||
      pathLower.includes('/test/') ||
      pathLower.includes('/tests/')
    ) {
      return true;
    }
  }

  // Include documentation
  if (!filters.includeDocumentation) {
    if (
      pathLower.endsWith('.md') ||
      pathLower.includes('/docs/') ||
      pathLower.includes('/documentation/')
    ) {
      return true;
    }
  }

  return false;
}

// =============================================================================
// Sub-Components
// =============================================================================

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  isUploading: boolean;
}

function DropZone({ onFilesAdded, isUploading }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    const files: File[] = [];

    // Handle dropped items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      onFilesAdded(files);
    }
  }, [onFilesAdded]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      const files = Array.from(fileList);
      onFilesAdded(files);
    }
    // Reset input
    e.target.value = '';
  }, [onFilesAdded]);

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30',
          isUploading && 'opacity-50 pointer-events-none'
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Processing files...</p>
          </>
        ) : (
          <>
            <div className="p-3 bg-primary/10 rounded-full">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium">
                Drop files here or <span className="text-primary">browse</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports .zip files, individual files, or folders
              </p>
            </div>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="*/*"
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          // @ts-ignore - webkitdirectory is not in the type definition
          webkitdirectory=""
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="text-sm text-primary hover:text-primary/80 flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Select files
        </button>
        <span className="text-muted-foreground">•</span>
        <button
          type="button"
          onClick={() => folderInputRef.current?.click()}
          disabled={isUploading}
          className="text-sm text-primary hover:text-primary/80 flex items-center gap-2"
        >
          <Folder className="w-4 h-4" />
          Select folder
        </button>
      </div>
    </div>
  );
}

interface FilterOptionsProps {
  filters: FileFilterConfig;
  onFiltersChange: (filters: FileFilterConfig) => void;
}

function FilterOptions({ filters, onFiltersChange }: FilterOptionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const filterOptions: {
    key: keyof FileFilterConfig;
    label: string;
    description: string;
    defaultChecked: boolean;
  }[] = [
    {
      key: 'excludeNodeModules',
      label: 'Exclude node_modules & dependencies',
      description: 'node_modules, vendor, __pycache__, venv',
      defaultChecked: true,
    },
    {
      key: 'excludeBuildArtifacts',
      label: 'Exclude build artifacts',
      description: '/dist, /build, /.next, /target',
      defaultChecked: true,
    },
    {
      key: 'excludeTests',
      label: 'Exclude test files',
      description: '*test*, *spec*, __tests__',
      defaultChecked: true,
    },
    {
      key: 'includeDocumentation',
      label: 'Include documentation',
      description: 'README.md, docs/',
      defaultChecked: false,
    },
  ];

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Settings2 className="w-4 h-4" />
        Smart filters
        <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
      </button>

      {isExpanded && (
        <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-3">
          {filterOptions.map((option) => (
            <label
              key={option.key}
              className="flex items-start gap-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters[option.key]}
                onChange={(e) =>
                  onFiltersChange({ ...filters, [option.key]: e.target.checked })
                }
                className="mt-0.5 rounded border-border"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

interface FileListProps {
  files: FileInput[];
  onRemove: (index: number) => void;
  filters: FileFilterConfig;
}

function FileList({ files, onRemove, filters }: FileListProps) {
  // Calculate stats
  const stats = useMemo(() => {
    const included = files.filter((f) => !shouldExcludeFile(f.path, filters));
    const excluded = files.filter((f) => shouldExcludeFile(f.path, filters));
    const totalSize = included.reduce((sum, f) => sum + f.size, 0);
    return { included, excluded, totalSize };
  }, [files, filters]);

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground font-medium">
          {stats.included.length} files ({formatFileSize(stats.totalSize)})
        </span>
        {stats.excluded.length > 0 && (
          <span className="text-muted-foreground">
            {stats.excluded.length} excluded by filters
          </span>
        )}
      </div>

      {/* File List */}
      <div className="max-h-64 overflow-y-auto space-y-1.5 border border-border rounded-lg p-2">
        {files.map((file, index) => {
          const isExcluded = shouldExcludeFile(file.path, filters);

          return (
            <div
              key={`${file.path}-${index}`}
              className={cn(
                'flex items-center gap-3 p-2 rounded transition-colors',
                isExcluded ? 'opacity-50 bg-muted/30' : 'hover:bg-muted/50'
              )}
            >
              <div className={cn(
                'text-muted-foreground',
                isExcluded && 'line-through'
              )}>
                {getFileIcon(file.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm truncate',
                  isExcluded ? 'text-muted-foreground line-through' : 'text-foreground'
                )}>
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                  {isExcluded && ' • Excluded'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function Step2C({ files, onSetFiles, className }: Step2CProps) {
  const [filters, setFilters] = useState<FileFilterConfig>(DEFAULT_FILE_FILTERS);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesAdded = useCallback(async (newFiles: File[]) => {
    setIsUploading(true);
    setError(null);

    try {
      // Process files
      const processedFiles: FileInput[] = await Promise.all(
        newFiles.map(async (file) => {
          // For zip files, we would normally extract them
          // For now, just add them as-is
          return {
            name: file.name,
            path: file.webkitRelativePath || file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
          };
        })
      );

      // Merge with existing files, avoiding duplicates
      const existingPaths = new Set(files.map((f) => f.path));
      const uniqueNewFiles = processedFiles.filter((f) => !existingPaths.has(f.path));

      onSetFiles([...files, ...uniqueNewFiles]);
    } catch (err) {
      setError('Failed to process files');
    } finally {
      setIsUploading(false);
    }
  }, [files, onSetFiles]);

  const handleRemoveFile = useCallback((index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onSetFiles(newFiles);
  }, [files, onSetFiles]);

  const handleClearAll = useCallback(() => {
    onSetFiles([]);
  }, [onSetFiles]);

  // Count included files
  const includedCount = files.filter((f) => !shouldExcludeFile(f.path, filters)).length;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Drop Zone */}
      <DropZone onFilesAdded={handleFilesAdded} isUploading={isUploading} />

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}

      {/* Filter Options */}
      <FilterOptions filters={filters} onFiltersChange={setFilters} />

      {/* File List */}
      <FileList files={files} onRemove={handleRemoveFile} filters={filters} />

      {/* Clear All Button */}
      {files.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleClearAll}
            className="text-sm text-muted-foreground hover:text-destructive"
          >
            Clear all files
          </button>
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-foreground">
              {includedCount} {includedCount === 1 ? 'file' : 'files'} ready
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
