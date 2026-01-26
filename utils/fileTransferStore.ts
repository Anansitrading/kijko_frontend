// Simple module-level store to transfer a File object across SPA navigation.
// The native File object cannot be serialized, so we hold it in memory.

let pendingFile: File | null = null;
let pendingProjectId: string | null = null;

export function setPendingFileForIngestion(file: File, projectId: string): void {
  pendingFile = file;
  pendingProjectId = projectId;
}

export function getPendingFileForIngestion(): { file: File; projectId: string } | null {
  if (pendingFile && pendingProjectId) {
    const result = { file: pendingFile, projectId: pendingProjectId };
    pendingFile = null;
    pendingProjectId = null;
    return result;
  }
  return null;
}

export function clearPendingFile(): void {
  pendingFile = null;
  pendingProjectId = null;
}
