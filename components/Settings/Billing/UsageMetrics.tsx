// UsageMetrics component - Display usage and limits
// Setting Sprint 7: Billing and Usage

import React from 'react';
import {
  Activity,
  Database,
  HardDrive,
  Users,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { tw } from '../../../styles/settings';
import type { UsageMetricsProps, UsageMetric, UsageMetricType, Subscription } from '../../../types/settings';
import { USAGE_METRIC_LABELS, PLANS } from '../../../types/settings';

// Icon mapping for metrics
const metricIcons: Record<UsageMetricType, React.ReactNode> = {
  api_calls: <Activity className="w-5 h-5" />,
  ingestions: <Database className="w-5 h-5" />,
  storage: <HardDrive className="w-5 h-5" />,
  seats: <Users className="w-5 h-5" />,
  oracle_queries: <Sparkles className="w-5 h-5" />,
};

interface UsageProgressBarProps {
  metric: UsageMetric;
  showTrend?: boolean;
}

function UsageProgressBar({ metric, showTrend = false }: UsageProgressBarProps) {
  const label = USAGE_METRIC_LABELS[metric.type];
  const icon = metricIcons[metric.type];
  const isUnlimited = metric.limit === -1;

  // Determine status color based on percentage
  const getStatusColor = () => {
    if (isUnlimited) return 'bg-accent';
    if (metric.percentage >= 100) return 'bg-destructive';
    if (metric.percentage >= 80) return 'bg-warning';
    return 'bg-primary';
  };

  const getStatusIcon = () => {
    if (isUnlimited) return null;
    if (metric.percentage >= 100) {
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
    if (metric.percentage >= 80) {
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    }
    return null;
  };

  // Calculate trend (last point vs first point)
  const getTrendPercentage = () => {
    if (metric.trend.length < 2) return null;
    const first = metric.trend[0].value;
    const last = metric.trend[metric.trend.length - 1].value;
    if (first === 0) return null;
    return Math.round(((last - first) / first) * 100);
  };

  const trendPercentage = showTrend ? getTrendPercentage() : null;

  // Format value for display
  const formatValue = (value: number) => {
    if (metric.type === 'storage') {
      return `${value.toFixed(1)} GB`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  return (
    <div className={`${tw.card} space-y-3`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary rounded-lg text-muted-foreground">
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground">{label.label}</h4>
            <p className="text-xs text-muted-foreground">
              {isUnlimited ? (
                'Unlimited'
              ) : (
                <>
                  {formatValue(metric.current)} of {formatValue(metric.limit)} {label.unit}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {trendPercentage !== null && (
            <div className={`flex items-center gap-1 text-xs ${
              trendPercentage >= 0 ? 'text-warning' : 'text-accent'
            }`}>
              <TrendingUp className="w-3 h-3" />
              {trendPercentage >= 0 ? '+' : ''}{trendPercentage}%
            </div>
          )}
          {getStatusIcon()}
        </div>
      </div>

      {/* Progress Bar */}
      {!isUnlimited && (
        <div className="space-y-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getStatusColor()}`}
              style={{ width: `${Math.min(metric.percentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{metric.percentage}% used</span>
            {metric.percentage >= 80 && metric.percentage < 100 && (
              <span className="text-warning">Approaching limit</span>
            )}
            {metric.percentage >= 100 && (
              <span className="text-destructive">Limit reached</span>
            )}
          </div>
        </div>
      )}

      {/* Mini Trend Chart */}
      {showTrend && metric.trend.length > 1 && (
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-end gap-1 h-8">
            {metric.trend.map((point, i) => {
              const maxValue = Math.max(...metric.trend.map(p => p.value));
              const height = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
              return (
                <div
                  key={i}
                  className="flex-1 bg-primary/40 rounded-t transition-all hover:bg-primary/60"
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`${formatValue(point.value)} on ${point.date.toLocaleDateString()}`}
                />
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">Last 7 days</p>
        </div>
      )}
    </div>
  );
}

export function UsageMetrics({ metrics, subscription }: UsageMetricsProps) {
  const currentPlan = PLANS.find(p => p.id === (subscription?.planId || 'free')) || PLANS[0];

  // Check if any metric is at warning level
  const hasWarnings = metrics.some(m => m.percentage >= 80 && m.limit !== -1);
  const hasLimitsReached = metrics.some(m => m.percentage >= 100 && m.limit !== -1);

  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      {hasLimitsReached && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-destructive">Usage limit reached</h4>
            <p className="text-xs text-muted-foreground mt-1">
              You've reached one or more usage limits. Upgrade your plan to continue using all features.
            </p>
          </div>
        </div>
      )}

      {hasWarnings && !hasLimitsReached && (
        <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-warning">Approaching usage limits</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Some metrics are at 80% or higher. Consider upgrading to avoid service interruptions.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map(metric => (
          <UsageProgressBar
            key={metric.type}
            metric={metric}
            showTrend={metric.trend.length > 1}
          />
        ))}
      </div>

      {/* Plan Limits Reference */}
      <div className={`${tw.card} bg-secondary/50`}>
        <h4 className="text-sm font-medium text-foreground mb-3">
          {currentPlan.name} Plan Limits
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold text-foreground">
              {currentPlan.limits.apiCalls === -1 ? '∞' : currentPlan.limits.apiCalls.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">API Calls/mo</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {currentPlan.limits.ingestions === -1 ? '∞' : currentPlan.limits.ingestions.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Ingestions</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {currentPlan.limits.storageGb === -1 ? '∞' : `${currentPlan.limits.storageGb} GB`}
            </p>
            <p className="text-xs text-muted-foreground">Storage</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {currentPlan.limits.seats === -1 ? '∞' : currentPlan.limits.seats}
            </p>
            <p className="text-xs text-muted-foreground">Seats</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {currentPlan.limits.oracleQueries === -1 ? '∞' : currentPlan.limits.oracleQueries}
            </p>
            <p className="text-xs text-muted-foreground">Oracle/day</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UsageMetrics;
