// Setting Sprint 9: Advanced Security - Security Score
import React, { useState, useCallback } from 'react';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Loader2,
  Lock,
  Key,
  Users,
  Globe,
  FileText,
  Zap,
} from 'lucide-react';
import { tw } from '../../../styles/settings';
import SettingsSection from '../SettingsSection';
import type {
  SecurityScore as SecurityScoreType,
  SecurityScoreCategory,
  SecurityScoreItem,
  SecurityRecommendation,
} from '../../../types/settings';

interface SecurityScoreProps {
  onNavigate?: (section: string) => void;
}

// Mock security score data
function generateMockScore(): SecurityScoreType {
  return {
    totalScore: 72,
    maxScore: 100,
    categories: [
      {
        id: 'authentication',
        name: 'Authentication',
        description: 'Login and identity verification',
        maxPoints: 30,
        earnedPoints: 25,
        items: [
          { id: 'auth-1', name: 'Two-Factor Authentication', description: '2FA enabled for account', points: 10, isEnabled: true },
          { id: 'auth-2', name: 'Strong Password', description: 'Password meets complexity requirements', points: 5, isEnabled: true },
          { id: 'auth-3', name: 'Password Age', description: 'Password changed within last 90 days', points: 5, isEnabled: true },
          { id: 'auth-4', name: 'SSO Integration', description: 'Single Sign-On configured', points: 5, isEnabled: true },
          { id: 'auth-5', name: 'Backup Codes Generated', description: 'Recovery codes for 2FA', points: 5, isEnabled: false, recommendation: 'Generate backup codes to ensure account recovery if you lose your 2FA device.', actionUrl: '/settings/security' },
        ],
      },
      {
        id: 'sessions',
        name: 'Session Security',
        description: 'Active session management',
        maxPoints: 20,
        earnedPoints: 15,
        items: [
          { id: 'sess-1', name: 'Session Timeout', description: 'Sessions expire after inactivity', points: 5, isEnabled: true },
          { id: 'sess-2', name: 'Single Device Mode', description: 'Limit concurrent sessions', points: 5, isEnabled: false, recommendation: 'Enable single device mode to prevent unauthorized access from multiple devices.' },
          { id: 'sess-3', name: 'Session Monitoring', description: 'Actively monitoring sessions', points: 5, isEnabled: true },
          { id: 'sess-4', name: 'Idle Timeout', description: 'Logout after idle period', points: 5, isEnabled: true },
        ],
      },
      {
        id: 'api',
        name: 'API Security',
        description: 'API keys and access tokens',
        maxPoints: 20,
        earnedPoints: 12,
        items: [
          { id: 'api-1', name: 'API Key Rotation', description: 'Keys rotated regularly', points: 5, isEnabled: true },
          { id: 'api-2', name: 'Scoped API Keys', description: 'Keys have minimal permissions', points: 5, isEnabled: true },
          { id: 'api-3', name: 'Expired Keys Cleanup', description: 'No expired keys present', points: 5, isEnabled: false, recommendation: 'Remove or regenerate expired API keys to reduce security risk.' },
          { id: 'api-4', name: 'API Key Naming', description: 'Keys have descriptive names', points: 5, isEnabled: true },
        ],
      },
      {
        id: 'network',
        name: 'Network Security',
        description: 'IP restrictions and access control',
        maxPoints: 15,
        earnedPoints: 10,
        items: [
          { id: 'net-1', name: 'IP Whitelist', description: 'Restrict access by IP', points: 5, isEnabled: false, recommendation: 'Enable IP whitelisting to restrict account access to trusted networks.' },
          { id: 'net-2', name: 'Rate Limiting', description: 'API rate limits configured', points: 5, isEnabled: true },
          { id: 'net-3', name: 'Geographic Restrictions', description: 'Limit access by region', points: 5, isEnabled: true },
        ],
      },
      {
        id: 'compliance',
        name: 'Compliance & Audit',
        description: 'Regulatory compliance and logging',
        maxPoints: 15,
        earnedPoints: 10,
        items: [
          { id: 'comp-1', name: 'Audit Logging', description: 'Activity logging enabled', points: 5, isEnabled: true },
          { id: 'comp-2', name: 'Data Encryption', description: 'Data encrypted at rest', points: 5, isEnabled: true },
          { id: 'comp-3', name: 'Compliance Docs', description: 'Required documents on file', points: 5, isEnabled: false, recommendation: 'Upload required compliance documentation to maintain regulatory compliance.' },
        ],
      },
    ],
    recommendations: [
      {
        id: 'rec-1',
        title: 'Generate Backup Codes',
        description: 'Create backup codes for 2FA recovery in case you lose access to your authenticator app.',
        impact: 'high',
        points: 5,
        actionUrl: '/settings/security',
        category: 'Authentication',
      },
      {
        id: 'rec-2',
        title: 'Enable IP Whitelisting',
        description: 'Restrict account access to specific IP addresses or ranges for enhanced security.',
        impact: 'high',
        points: 5,
        actionUrl: '/settings/advanced-security',
        category: 'Network Security',
      },
      {
        id: 'rec-3',
        title: 'Limit Concurrent Sessions',
        description: 'Enable single device mode to prevent multiple simultaneous logins.',
        impact: 'medium',
        points: 5,
        actionUrl: '/settings/advanced-security',
        category: 'Session Security',
      },
      {
        id: 'rec-4',
        title: 'Clean Up Expired API Keys',
        description: 'Remove or rotate expired API keys to reduce potential security vulnerabilities.',
        impact: 'medium',
        points: 5,
        actionUrl: '/settings/security',
        category: 'API Security',
      },
      {
        id: 'rec-5',
        title: 'Upload Compliance Documents',
        description: 'Ensure all required compliance documentation is current and on file.',
        impact: 'low',
        points: 5,
        actionUrl: '/settings/advanced-security',
        category: 'Compliance & Audit',
      },
    ],
    lastCalculated: new Date(),
  };
}

// Helper to get score color
function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

// Helper to get score label
function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Needs Improvement';
  return 'Critical';
}

// Helper to get impact badge config
function getImpactConfig(impact: 'high' | 'medium' | 'low') {
  switch (impact) {
    case 'high':
      return { label: 'High Impact', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' };
    case 'medium':
      return { label: 'Medium Impact', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' };
    case 'low':
      return { label: 'Low Impact', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' };
  }
}

// Helper to get category icon
function getCategoryIcon(categoryId: string) {
  switch (categoryId) {
    case 'authentication':
      return Lock;
    case 'sessions':
      return Users;
    case 'api':
      return Key;
    case 'network':
      return Globe;
    case 'compliance':
      return FileText;
    default:
      return Shield;
  }
}

export function SecurityScore({ onNavigate }: SecurityScoreProps) {
  const [score, setScore] = useState<SecurityScoreType>(generateMockScore);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Simulate score recalculation
      await new Promise(resolve => setTimeout(resolve, 1500));
      setScore(generateMockScore());
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleActionClick = useCallback((actionUrl: string) => {
    if (onNavigate) {
      onNavigate(actionUrl);
    }
  }, [onNavigate]);

  const scoreColor = getScoreColor(score.totalScore);
  const scoreLabel = getScoreLabel(score.totalScore);

  // Calculate potential improvement
  const potentialPoints = score.recommendations.reduce((acc, rec) => acc + rec.points, 0);

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Security Score</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Based on your current security configuration
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`${tw.buttonSecondary} inline-flex items-center gap-2 text-sm h-8 px-3`}
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
        </div>

        {/* Score Circle */}
        <div className="flex items-center gap-8">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke={scoreColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(score.totalScore / 100) * 352} 352`}
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{score.totalScore}</span>
              <span className="text-xs text-gray-400">out of {score.maxScore}</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-lg font-semibold"
                style={{ color: scoreColor }}
              >
                {scoreLabel}
              </span>
              {score.totalScore < 80 && (
                <span className="text-xs text-gray-400">
                  (+{potentialPoints} points available)
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {score.totalScore >= 80
                ? "Your security configuration is strong. Keep it up!"
                : score.totalScore >= 60
                ? "Your security is good, but there's room for improvement."
                : "Consider addressing the recommendations below to improve your security posture."}
            </p>

            {/* Category Summary */}
            <div className="flex flex-wrap gap-2">
              {score.categories.map(category => {
                const percentage = Math.round((category.earnedPoints / category.maxPoints) * 100);
                const categoryColor = getScoreColor(percentage);

                return (
                  <div
                    key={category.id}
                    className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded text-xs"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: categoryColor }}
                    />
                    <span className="text-gray-300">{category.name}</span>
                    <span className="text-gray-500">{category.earnedPoints}/{category.maxPoints}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {score.recommendations.length > 0 && (
        <SettingsSection
          title="Recommendations"
          description="Actions to improve your security score"
        >
          <div className="space-y-2">
            {score.recommendations.map(rec => {
              const impactConfig = getImpactConfig(rec.impact);

              return (
                <div
                  key={rec.id}
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-amber-500/20 flex-shrink-0">
                        <Zap className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-white">{rec.title}</span>
                          <span
                            className="px-2 py-0.5 text-xs rounded-full"
                            style={{ backgroundColor: impactConfig.bgColor, color: impactConfig.color }}
                          >
                            {impactConfig.label}
                          </span>
                          <span className="text-xs text-green-400">+{rec.points} pts</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{rec.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Category: {rec.category}</p>
                      </div>
                    </div>

                    {rec.actionUrl && (
                      <button
                        onClick={() => handleActionClick(rec.actionUrl!)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline flex-shrink-0"
                      >
                        Fix Now
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </SettingsSection>
      )}

      <div className="border-t border-white/10" />

      {/* Detailed Breakdown */}
      <SettingsSection
        title="Detailed Breakdown"
        description="Security score by category"
      >
        <div className="space-y-3">
          {score.categories.map(category => {
            const CategoryIcon = getCategoryIcon(category.id);
            const percentage = Math.round((category.earnedPoints / category.maxPoints) * 100);
            const categoryColor = getScoreColor(percentage);
            const isExpanded = expandedCategory === category.id;

            return (
              <div
                key={category.id}
                className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  className="w-full p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${categoryColor}20` }}
                    >
                      <CategoryIcon
                        className="w-5 h-5"
                        style={{ color: categoryColor }}
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{category.name}</p>
                      <p className="text-xs text-gray-400">{category.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {category.earnedPoints}/{category.maxPoints}
                      </p>
                      <p className="text-xs text-gray-500">{percentage}%</p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded Items */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-4">
                    <div className="space-y-2">
                      {category.items.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {item.isEnabled ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                            <div>
                              <p className="text-sm text-white">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs ${item.isEnabled ? 'text-green-400' : 'text-gray-500'}`}>
                              {item.isEnabled ? `+${item.points}` : `0/${item.points}`} pts
                            </span>
                            {!item.isEnabled && item.actionUrl && (
                              <button
                                onClick={() => handleActionClick(item.actionUrl!)}
                                className="text-xs text-primary hover:underline"
                              >
                                Enable
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SettingsSection>

      {/* Last Calculated */}
      <p className="text-xs text-gray-500 text-center">
        Last calculated: {new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(score.lastCalculated)}
      </p>
    </div>
  );
}

export default SecurityScore;
