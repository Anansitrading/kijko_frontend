import { useCallback } from 'react';
import { IngestionWizard } from '../../../../components/Hypervisa/IngestionWizard';
import { useIngestion } from '../../../../contexts/IngestionContext';
import { useSourceFiles, SourceFile } from '../../../../contexts/SourceFilesContext';
import { IngestionConfig } from '../../../../types';

// Get file type from extension
function getFileTypeFromExtension(filename: string): SourceFile['type'] {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'json':
      return 'json';
    case 'md':
    case 'mdx':
      return 'markdown';
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return 'css';
    case 'html':
    case 'htm':
      return 'html';
    case 'py':
      return 'python';
    default:
      return 'other';
  }
}

// Get extension from filename
function getExtension(filename: string): string {
  return filename.split('.').pop() || '';
}

export function IngestionModal() {
  const { isModalOpen, selectedFile, closeIngestionModal } = useIngestion();
  const { addFiles } = useSourceFiles();

  const handleSubmit = useCallback(
    async (config: IngestionConfig) => {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create a new source file from the ingestion config
      if (selectedFile) {
        const newFile: SourceFile = {
          id: selectedFile.id,
          name: config.displayName || selectedFile.name,
          extension: getExtension(selectedFile.name),
          size: selectedFile.sizeBytes,
          type: getFileTypeFromExtension(selectedFile.name),
        };

        // Add the file to the source files list
        addFiles([newFile]);
      }

      // Close the modal after successful ingestion
      closeIngestionModal();
    },
    [selectedFile, addFiles, closeIngestionModal]
  );

  if (!isModalOpen || !selectedFile) {
    return null;
  }

  return (
    <IngestionWizard
      isOpen={isModalOpen}
      onClose={closeIngestionModal}
      file={{
        id: selectedFile.id,
        name: selectedFile.name,
        size: selectedFile.size,
      }}
      onSubmit={handleSubmit}
    />
  );
}

export default IngestionModal;
