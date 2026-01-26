import React, { useState } from 'react';
import { Globe, MoreVertical, Calendar, FileText } from 'lucide-react';
import { Project, ProjectLastActiveUser } from '../../types';
import { cn } from '../../utils/cn';

interface ProjectCardProps {
  project: Project;
  viewMode: 'grid' | 'list';
  onClick: () => void;
  onMenuClick: (e: React.MouseEvent) => void;
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

export function ProjectCard({ project, viewMode, onClick, onMenuClick }: ProjectCardProps) {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onMenuClick(e);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/projectId', project.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  if (viewMode === 'list') {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all cursor-pointer "
      >
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
      className="group relative flex flex-col p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all cursor-pointer "
    >
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
