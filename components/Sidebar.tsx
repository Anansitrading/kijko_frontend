import { cn } from "../utils/cn";
import {
  KijkoHeader,
  NewIngestionButton,
  SourceFilesList,
  AddFilesButton,
  SystemFooter,
} from "./LeftSidebar";

interface SidebarProps {
  onOpenSettings: () => void;
  onNewIngestion: () => void;
  onAddFiles: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  onOpenSettings,
  onNewIngestion,
  onAddFiles,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const sidebarClasses = cn(
    "bg-sidebar border-r border-sidebar-border flex flex-col h-full flex-shrink-0",
    "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out",
    "md:translate-x-0 md:static",
    isOpen ? "translate-x-0" : "-translate-x-full"
  );

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar Content */}
      <aside className={sidebarClasses}>
        {/* Header / Brand */}
        <KijkoHeader onClose={onClose} showCloseButton />

        {/* New Ingestion Button */}
        <NewIngestionButton onClick={onNewIngestion} className="mb-4" />

        {/* Source Files Section */}
        <SourceFilesList className="flex-1 min-h-0" />

        {/* Add Files Button */}
        <AddFilesButton onClick={onAddFiles} />

        {/* System Footer */}
        <SystemFooter onOpenSettings={onOpenSettings} />
      </aside>
    </>
  );
}
