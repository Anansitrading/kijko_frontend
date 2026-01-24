import React from 'react';
import { Globe, MoreVertical, Calendar, FileText } from 'lucide-react';
import { Project } from '../../types';
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

export function ProjectCard({ project, viewMode, onClick, onMenuClick }: ProjectCardProps) {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onMenuClick(e);
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        onContextMenu={handleContextMenu}
        className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all cursor-pointer"
      >
        <ProjectIcon icon={project.icon} />

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {project.name}
          </h3>
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
      onClick={onClick}
      onContextMenu={handleContextMenu}
      className="group relative flex flex-col p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all cursor-pointer min-h-[160px]"
    >
      {/* Menu Button */}
      <button
        onClick={onMenuClick}
        className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors opacity-0 group-hover:opacity-100"
      >
        <MoreVertical size={16} />
      </button>

      {/* Icon */}
      <div className="mb-4">
        <ProjectIcon icon={project.icon} />
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
          {project.name}
        </h3>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <div className="text-xs text-muted-foreground">
          {formatDate(project.updatedAt)} · {project.sourceCount} sources
        </div>

        {project.isShared && (
          <Globe size={14} className="text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
