/**
 * Maya Persona Completion CTA
 * Sprint PC6: Team-focused completion screen for enterprise users
 */

import React from 'react';
import { CheckCircle2, UserPlus, BarChart3, FileText, Shield, Users, Clock, TrendingUp, ArrowUpRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { trackConversionSignal } from '@/services/analytics';
import type { MayaCompletionMetrics, MayaNextStep } from '@/types/project';

interface MayaCompletionCTAProps {
  projectId: string;
  projectName: string;
  metrics: MayaCompletionMetrics;
  nextSteps?: MayaNextStep[];
  onInviteMore: () => void;
  onViewResults: () => void;
  onViewReport: () => void;
  onNextStepClick?: (step: MayaNextStep) => void;
  className?: string;
}

// Default next steps
const DEFAULT_NEXT_STEPS: MayaNextStep[] = [
  {
    id: 'team-permissions',
    label: 'Set up team permissions',
    description: 'Configure role-based access control',
    priority: 'high',
    action: 'setup_permissions'
  },
  {
    id: 'team-demo',
    label: 'Schedule team demo',
    description: 'Onboard your team with a live walkthrough',
    priority: 'medium',
    action: 'schedule_demo'
  },
  {
    id: 'roi-report',
    label: 'Generate ROI report',
    description: 'Create a business case for stakeholders',
    priority: 'medium',
    action: 'generate_roi'
  }
];

export function MayaCompletionCTA({
  projectId,
  projectName,
  metrics,
  nextSteps = DEFAULT_NEXT_STEPS,
  onInviteMore,
  onViewResults,
  onViewReport,
  onNextStepClick,
  className
}: MayaCompletionCTAProps) {
  const handleInviteMore = () => {
    trackConversionSignal('invite_team', { project_id: projectId });
    onInviteMore();
  };

  const handleViewResults = () => {
    trackConversionSignal('view_project', { project_id: projectId });
    onViewResults();
  };

  const handleViewReport = () => {
    trackConversionSignal('view_project', {
      project_id: projectId,
      view_type: 'report'
    });
    onViewReport();
  };

  const handleNextStep = (step: MayaNextStep) => {
    trackConversionSignal('view_project', {
      project_id: projectId,
      next_step: step.id
    });
    onNextStepClick?.(step);
  };

  const getPriorityColor = (priority: MayaNextStep['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-600 dark:text-red-400';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'low':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStepIcon = (step: MayaNextStep) => {
    switch (step.action) {
      case 'setup_permissions':
        return <Shield className="w-4 h-4" />;
      case 'schedule_demo':
        return <Users className="w-4 h-4" />;
      case 'generate_roi':
        return <FileText className="w-4 h-4" />;
      default:
        return <ArrowUpRight className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-blue-500/30 bg-gradient-to-b from-blue-500/5 to-background',
        'p-6 space-y-6',
        className
      )}
    >
      {/* Success Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full bg-blue-500/10">
          <CheckCircle2 className="w-8 h-8 text-blue-500" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground">
            Team workspace created!
          </h2>
          <p className="text-muted-foreground mt-1">
            {projectName} is ready for your team.
          </p>
        </div>
      </div>

      {/* Team Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Repositories Processing */}
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs">Repositories</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {metrics.repositoriesProcessing}
          </p>
          <p className="text-xs text-muted-foreground">processing</p>
        </div>

        {/* Members Invited */}
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs">Team</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {metrics.membersInvited}
          </p>
          <p className="text-xs text-muted-foreground">members invited</p>
        </div>

        {/* Projected Hours Saved */}
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Projected impact</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {metrics.projectedHoursSavedPerMonth}
          </p>
          <p className="text-xs text-muted-foreground">hrs/month saved</p>
        </div>

        {/* ROI */}
        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">ROI</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {metrics.roiMultiplier}x
          </p>
          <p className="text-xs text-muted-foreground">return on investment</p>
        </div>
      </div>

      {/* Primary CTAs */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleInviteMore}
          className={cn(
            'flex-1 min-w-[140px] flex items-center justify-center gap-2',
            'px-4 py-3 rounded-lg',
            'bg-primary text-primary-foreground font-medium',
            'hover:bg-primary/90 transition-colors'
          )}
        >
          <UserPlus className="w-4 h-4" />
          Invite more
        </button>
        <button
          onClick={handleViewResults}
          className={cn(
            'flex items-center justify-center gap-2',
            'px-4 py-3 rounded-lg',
            'bg-muted text-foreground font-medium',
            'hover:bg-muted/80 transition-colors'
          )}
        >
          <BarChart3 className="w-4 h-4" />
          View results
        </button>
        <button
          onClick={handleViewReport}
          className={cn(
            'flex items-center justify-center gap-2',
            'px-4 py-3 rounded-lg',
            'bg-muted text-foreground font-medium',
            'hover:bg-muted/80 transition-colors'
          )}
        >
          <FileText className="w-4 h-4" />
          Report
        </button>
      </div>

      {/* Next Steps Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">
          Setup next
        </h3>
        <div className="space-y-2">
          {nextSteps.map((step) => (
            <button
              key={step.id}
              onClick={() => handleNextStep(step)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg',
                'border border-border hover:border-primary/30',
                'hover:bg-muted/50 transition-all text-left group'
              )}
            >
              <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
                {getStepIcon(step)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {step.label}
                  </span>
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded capitalize',
                    getPriorityColor(step.priority)
                  )}>
                    {step.priority}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {step.description}
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
