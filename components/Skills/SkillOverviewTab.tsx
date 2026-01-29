// SkillOverviewTab Component - Displays all skill properties
// Task 2_4: Skill Detail & Edit

import { Play, Calendar, Clock, Cpu, Settings2, FileText } from 'lucide-react';
import { cn } from '../../utils/cn';
import { CATEGORY_COLORS } from '../../hooks/useSkills';
import type { Skill } from '../../types/skills';

interface SkillOverviewTabProps {
  skill: Skill;
}

export function SkillOverviewTab({ skill }: SkillOverviewTabProps) {
  const categoryColors = CATEGORY_COLORS[skill.category];

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Category & Status */}
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg capitalize',
            categoryColors.bg,
            categoryColors.text
          )}
        >
          {skill.category}
        </span>
        {!skill.isActive && (
          <span className="px-3 py-1.5 text-sm font-medium rounded-lg bg-yellow-500/10 text-yellow-400">
            Inactive
          </span>
        )}
      </div>

      {/* Description */}
      {skill.description && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Description
          </h4>
          <p className="text-foreground">{skill.description}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={Play}
          label="Executions"
          value={skill.executionCount.toString()}
        />
        <StatCard
          icon={Calendar}
          label="Created"
          value={formatDate(skill.createdAt)}
          small
        />
        <StatCard
          icon={Clock}
          label="Last Run"
          value={formatDate(skill.lastExecutedAt)}
          small
        />
        <StatCard
          icon={Calendar}
          label="Updated"
          value={formatDate(skill.updatedAt)}
          small
        />
      </div>

      {/* Model Configuration */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Cpu size={14} />
          Model Configuration
        </h4>
        <div className="bg-secondary/50 border border-border rounded-lg p-4 space-y-3">
          <ConfigRow label="Model" value={skill.model} />
          <ConfigRow
            label="Temperature"
            value={skill.parameters.temperature?.toString() ?? '1.0'}
          />
          <ConfigRow
            label="Max Tokens"
            value={skill.parameters.max_tokens?.toString() ?? '4096'}
          />
          <ConfigRow label="Output Format" value={skill.outputFormat} />
        </div>
      </div>

      {/* Prompt Template Preview */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <FileText size={14} />
          Prompt Template
        </h4>
        <div className="bg-secondary/50 border border-border rounded-lg p-4">
          <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
            {skill.promptTemplate}
          </pre>
        </div>
      </div>

      {/* Input Schema */}
      {skill.inputSchema && skill.inputSchema.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Settings2 size={14} />
            Input Variables
          </h4>
          <div className="bg-secondary/50 border border-border rounded-lg divide-y divide-border">
            {skill.inputSchema.map((field, index) => (
              <div key={index} className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm text-foreground">
                    {`{{${field.name}}}`}
                  </span>
                  {field.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {field.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {field.type}
                  </span>
                  {field.required && (
                    <span className="text-xs text-destructive">required</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  small = false,
}: {
  icon: typeof Play;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="bg-secondary/50 border border-border rounded-lg p-3">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon size={14} />
        <span className="text-xs">{label}</span>
      </div>
      <p className={cn('font-medium text-foreground', small ? 'text-sm' : 'text-lg')}>
        {value}
      </p>
    </div>
  );
}

// Config Row Component
function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
