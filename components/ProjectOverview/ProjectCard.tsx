import React, { useState } from 'react';
import { Globe, MoreVertical, Calendar, FileText, Upload } from 'lucide-react';
import { Project, ProjectLastActiveUser } from '../../types';
import { cn } from '../../utils/cn';

interface ProjectCardProps {
  project: Project;
  viewMode: 'grid' | 'list';
  onClick: () => void;
  onMenuClick: (e: React.MouseEvent) => void;
  onFileDrop?: (projectId: string, file: File) => void;
}

function ProjectIcon({ icon }: { icon: Project['icon'] }) {
  const baseClasses = 'flex items-center justify-center rounded-lg';

  if (icon.type === 'emoji') {
    return (
      <div
        className={cn(baseClasses, 'w-12 h-12 text-2xl')}
        style={{ backgroundColor: icon.backgroundColor || '#3b82f6' }}
      >
        {icon.value}
      </div>
    );
  }

  if (icon.type === 'initials') {
    return (
      <div
        className={cn(baseClasses, 'w-12 h-12 text-lg font-bold text-white')}
        style={{ backgroundColor: icon.backgroundColor || '#3b82f6' }}
      >
        {icon.value}
      </div>
    );
  }

  return (
    <div className={cn(baseClasses, 'w-12 h-12 overflow-hidden')}>
      <img src={icon.value} alt="" className="w-full h-full object-cover" />
    </div>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// User Preview Component with Tooltip
function UserPreview({ user }: { user: ProjectLastActiveUser }) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Generate initials from first and last name
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <div
      className="relative cursor-pointer"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Avatar */}
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={fullName}
          className="w-7 h-7 rounded-full object-cover border-2 border-primary/30"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-semibold text-white border-2 border-primary/30 shadow-sm">
          {initials}
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md shadow-lg whitespace-nowrap">
            {fullName}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}

export function ProjectCard({ project, viewMode, onClick, onMenuClick, onFileDrop }: ProjectCardProps) {
  const [isFileDropTarget, setIsFileDropTarget] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onMenuClick(e);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/projectId', project.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Detect OS file drag (not internal project card drag)
  const isExternalFileDrag = (e: React.DragEvent): boolean => {
    return e.dataTransfer.types.includes('Files') &&
      !e.dataTransfer.types.includes('text/projectId');
  };

  const handleFileDragOver = (e: React.DragEvent) => {
    if (isExternalFileDrag(e)) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleFileDragEnter = (e: React.DragEvent) => {
    if (isExternalFileDrag(e)) {
      e.preventDefault();
      e.stopPropagation();
      setIsFileDropTarget(true);
    }
  };

  const handleFileDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsFileDropTarget(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    if (isExternalFileDrag(e)) {
      e.preventDefault();
      e.stopPropagation();
      setIsFileDropTarget(false);
      const files = e.dataTransfer.files;
      if (files.length > 0 && onFileDrop) {
        onFileDrop(project.id, files[0]);
      }
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        onDragOver={handleFileDragOver}
        onDragEnter={handleFileDragEnter}
        onDragLeave={handleFileDragLeave}
        onDrop={handleFileDrop}
        className={cn(
          "group relative flex items-center gap-4 p-4 rounded-xl border bg-card/50 hover:bg-card transition-all cursor-pointer",
          isFileDropTarget
            ? 'border-primary ring-2 ring-primary bg-primary/5'
            : 'border-border hover:border-primary/30'
        )}
      >
        {isFileDropTarget && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-xl pointer-events-none z-10">
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <Upload size={18} />
              <span>Drop to ingest</span>
            </div>
          </div>
        )}
        <ProjectIcon icon={project.icon} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            {project.label && (
              <span
                className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0"
                style={{
                  backgroundColor: `${project.color || '#3b82f6'}20`,
                  color: project.color || '#3b82f6',
                }}
              >
                {project.label}
              </span>
            )}
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {project.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span>{formatDate(project.updatedAt)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <FileText size={14} />
            <span>{project.sourceCount} sources</span>
          </div>

          {/* User Preview */}
          {project.lastActiveUser && (
            <UserPreview user={project.lastActiveUser} />
          )}

          {project.isShared && (
            <div className="flex items-center gap-1.5 text-primary">
              <Globe size={14} />
            </div>
          )}

          <button
            onClick={onMenuClick}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      onContextMenu={handleContextMenu}
      onDragOver={handleFileDragOver}
      onDragEnter={handleFileDragEnter}
      onDragLeave={handleFileDragLeave}
      onDrop={handleFileDrop}
      className={cn(
        "group relative flex flex-col p-4 rounded-xl border bg-card/50 hover:bg-card transition-all cursor-pointer",
        isFileDropTarget
          ? 'border-primary ring-2 ring-primary bg-primary/5'
          : 'border-border hover:border-primary/30'
      )}
    >
      {isFileDropTarget && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-xl pointer-events-none z-10">
          <div className="flex items-center gap-2 text-primary font-medium text-sm">
            <Upload size={18} />
            <span>Drop to ingest</span>
          </div>
        </div>
      )}
      {/* Menu Button */}
      <button
        onClick={onMenuClick}
        className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors opacity-0 group-hover:opacity-100"
      >
        <MoreVertical size={16} />
      </button>

      {/* Top section: Icon + Title/Label */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <ProjectIcon icon={project.icon} />

        {/* Title and Label */}
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
            {project.name}
          </h3>
          {project.label && (
            <span
              className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-medium rounded-full"
              style={{
                backgroundColor: `${project.color || '#3b82f6'}20`,
                color: project.color || '#3b82f6',
              }}
            >
              {project.label}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-xs text-muted-foreground">
          {formatDate(project.updatedAt)} · {project.sourceCount} sources
        </div>

        <div className="flex items-center gap-2">
          {/* User Preview */}
          {project.lastActiveUser && (
            <UserPreview user={project.lastActiveUser} />
          )}

          {project.isShared && (
            <Globe size={14} className="text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );
}
