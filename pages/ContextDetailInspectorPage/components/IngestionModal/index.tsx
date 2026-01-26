import { useCallback, useState, useRef } from 'react';
import { IngestionWizard } from '../../../../components/Hypervisa/IngestionWizard';
import { useIngestion, formatFileSizeFromBytes, SelectedFile } from '../../../../contexts/IngestionContext';
import { addIngestionEntry } from '../../../../services/compressionService';
import { IngestionConfig } from '../../../../types';
import { X, Upload, FileText, FolderOpen } from 'lucide-react';

interface IngestionModalProps {
  projectName: string;
  projectId: string;
}

export function IngestionModal({ projectName, projectId }: IngestionModalProps) {
  const { isModalOpen, selectedFile, closeIngestionModal, openIngestionModal } = useIngestion();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = useCallback(
    async (config: IngestionConfig) => {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Add an ingestion entry to the right panel's ingestion history
      await addIngestionEntry(projectId, 1, 0, config.displayName);

      // Close the modal after successful ingestion
      closeIngestionModal();
    },
    [projectId, closeIngestionModal]
  );

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const newSelectedFile: SelectedFile = {
      id: `file-${Date.now()}`,
      name: file.name,
      size: formatFileSizeFromBytes(file.size),
      sizeBytes: file.size,
    };

    openIngestionModal(newSelectedFile);
  }, [openIngestionModal]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  if (!isModalOpen) {
    return null;
  }

  // Show file picker when no file is selected
  if (!selectedFile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={closeIngestionModal}
        />

        {/* Modal */}
        <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Configure Ingestion</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Add sources to {projectName}
              </p>
            </div>
            <button
              onClick={closeIngestionModal}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center transition-all
                ${dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
                accept=".ts,.tsx,.js,.jsx,.json,.md,.mdx,.css,.scss,.html,.py,.txt,.yaml,.yml"
              />

              <div className="flex flex-col items-center gap-4">
                <div className={`
                  w-16 h-16 rounded-full flex items-center justify-center transition-colors
                  ${dragActive ? 'bg-primary/10' : 'bg-muted'}
                `}>
                  <Upload size={28} className={dragActive ? 'text-primary' : 'text-muted-foreground'} />
                </div>

                <div>
                  <p className="text-foreground font-medium">
                    Drop files here or{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary hover:underline"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supports code files, documents, and data files
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 p-4 bg-muted/50 hover:bg-muted rounded-lg border border-border transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText size={20} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Upload Files</p>
                  <p className="text-xs text-muted-foreground">Select from your computer</p>
                </div>
              </button>

              <button
                className="flex items-center gap-3 p-4 bg-muted/50 hover:bg-muted rounded-lg border border-border transition-colors text-left opacity-50 cursor-not-allowed"
                disabled
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <FolderOpen size={20} className="text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Connect Repository</p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show wizard when file is selected
  return (
    <IngestionWizard
      isOpen={isModalOpen}
      onClose={closeIngestionModal}
      file={{
        id: selectedFile.id,
        name: selectedFile.name,
        size: selectedFile.size,
      }}
      projectName={projectName}
      onSubmit={handleSubmit}
    />
  );
}

export default IngestionModal;
