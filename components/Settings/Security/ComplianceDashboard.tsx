// Setting Sprint 9: Advanced Security - Compliance Dashboard
import React, { useState, useCallback } from 'react';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  FileText,
  Globe,
  Server,
  Award,
  Loader2,
  ExternalLink,
  Info,
  Calendar,
} from 'lucide-react';
import { tw } from '../../../styles/settings';
import SettingsSection from '../SettingsSection';
import type {
  ComplianceFramework,
  ComplianceStatus,
  ComplianceFrameworkStatus,
  ComplianceDocument,
  DataResidency,
  COMPLIANCE_FRAMEWORK_LABELS,
} from '../../../types/settings';

interface ComplianceDashboardProps {
  isEnterprise?: boolean;
}

// Framework labels
const FRAMEWORK_LABELS: Record<ComplianceFramework, { name: string; description: string }> = {
  soc2: {
    name: 'SOC 2 Type II',
    description: 'Security, availability, and confidentiality controls',
  },
  iso27001: {
    name: 'ISO 27001',
    description: 'Information security management system',
  },
  gdpr: {
    name: 'GDPR',
    description: 'EU General Data Protection Regulation',
  },
  hipaa: {
    name: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act',
  },
};

// Status config
const STATUS_CONFIG: Record<ComplianceStatus, { label: string; color: string; bgColor: string; Icon: typeof CheckCircle }> = {
  compliant: { label: 'Compliant', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', Icon: CheckCircle },
  partial: { label: 'Partial', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', Icon: AlertTriangle },
  non_compliant: { label: 'Non-Compliant', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', Icon: XCircle },
  not_applicable: { label: 'N/A', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)', Icon: Info },
};

// Mock compliance data
function generateMockData(): {
  frameworks: ComplianceFrameworkStatus[];
  dataResidency: DataResidency;
} {
  return {
    frameworks: [
      {
        framework: 'soc2',
        status: 'compliant',
        score: 95,
        lastAssessment: new Date('2025-11-15'),
        nextAssessment: new Date('2026-11-15'),
        documents: [
          {
            id: 'doc-1',
            framework: 'soc2',
            name: 'SOC 2 Type II Report',
            description: 'Annual SOC 2 Type II audit report',
            fileUrl: '/docs/soc2-report-2025.pdf',
            fileSize: 2450000,
            version: '2025.1',
            validFrom: new Date('2025-01-01'),
            validUntil: new Date('2026-01-01'),
            uploadedAt: new Date('2025-01-15'),
          },
          {
            id: 'doc-2',
            framework: 'soc2',
            name: 'SOC 2 Bridge Letter',
            description: 'Bridge letter for continuous compliance',
            fileUrl: '/docs/soc2-bridge-2025.pdf',
            fileSize: 150000,
            version: '2025.Q4',
            validFrom: new Date('2025-10-01'),
            uploadedAt: new Date('2025-10-15'),
          },
        ],
        requirements: { total: 120, met: 114, partial: 4, notMet: 2 },
      },
      {
        framework: 'iso27001',
        status: 'compliant',
        score: 98,
        lastAssessment: new Date('2025-09-01'),
        nextAssessment: new Date('2026-09-01'),
        documents: [
          {
            id: 'doc-3',
            framework: 'iso27001',
            name: 'ISO 27001 Certificate',
            description: 'ISO 27001:2022 certification',
            fileUrl: '/docs/iso27001-cert.pdf',
            fileSize: 850000,
            version: '2025',
            validFrom: new Date('2025-09-01'),
            validUntil: new Date('2028-09-01'),
            uploadedAt: new Date('2025-09-15'),
          },
        ],
        requirements: { total: 93, met: 91, partial: 2, notMet: 0 },
      },
      {
        framework: 'gdpr',
        status: 'compliant',
        score: 100,
        lastAssessment: new Date('2025-08-01'),
        documents: [
          {
            id: 'doc-4',
            framework: 'gdpr',
            name: 'GDPR Compliance Statement',
            description: 'Data protection compliance documentation',
            fileUrl: '/docs/gdpr-statement.pdf',
            fileSize: 420000,
            version: '3.2',
            validFrom: new Date('2025-08-01'),
            uploadedAt: new Date('2025-08-10'),
          },
          {
            id: 'doc-5',
            framework: 'gdpr',
            name: 'Data Processing Agreement',
            description: 'Standard DPA for customers',
            fileUrl: '/docs/dpa-template.pdf',
            fileSize: 180000,
            version: '2.1',
            validFrom: new Date('2025-06-01'),
            uploadedAt: new Date('2025-06-15'),
          },
        ],
        requirements: { total: 45, met: 45, partial: 0, notMet: 0 },
      },
      {
        framework: 'hipaa',
        status: 'partial',
        score: 75,
        lastAssessment: new Date('2025-10-01'),
        nextAssessment: new Date('2026-04-01'),
        documents: [
          {
            id: 'doc-6',
            framework: 'hipaa',
            name: 'BAA Template',
            description: 'Business Associate Agreement template',
            fileUrl: '/docs/baa-template.pdf',
            fileSize: 220000,
            version: '1.0',
            validFrom: new Date('2025-07-01'),
            uploadedAt: new Date('2025-07-20'),
          },
        ],
        requirements: { total: 50, met: 35, partial: 10, notMet: 5 },
      },
    ],
    dataResidency: {
      region: 'EU West (Amsterdam)',
      country: 'Netherlands',
      provider: 'AWS',
      certifications: ['ISO 27001', 'SOC 2', 'C5', 'ENS High'],
    },
  };
}

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Helper to format date
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function ComplianceDashboard({ isEnterprise = false }: ComplianceDashboardProps) {
  const [data] = useState(generateMockData);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [expandedFramework, setExpandedFramework] = useState<ComplianceFramework | null>(null);

  const handleDownload = useCallback(async (doc: ComplianceDocument) => {
    setDownloadingId(doc.id);
    try {
      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real app, this would trigger a file download
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.name;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const overallScore = Math.round(
    data.frameworks.reduce((acc, f) => acc + f.score, 0) / data.frameworks.length
  );

  const compliantCount = data.frameworks.filter(f => f.status === 'compliant').length;

  return (
    <div className="space-y-6">
      {/* Enterprise Notice */}
      {!isEnterprise && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-400">Enterprise Feature</p>
            <p className="text-xs text-gray-400 mt-1">
              Compliance documentation and certifications are available on Enterprise plans.
            </p>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Overall Score */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Overall Score</p>
              <p className="text-2xl font-bold text-white">{overallScore}%</p>
            </div>
          </div>
        </div>

        {/* Compliant Frameworks */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Compliant</p>
              <p className="text-2xl font-bold text-white">{compliantCount}/{data.frameworks.length}</p>
            </div>
          </div>
        </div>

        {/* Data Location */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Globe className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Data Region</p>
              <p className="text-lg font-bold text-white truncate">{data.dataResidency.region}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Frameworks */}
      <SettingsSection
        title="Compliance Frameworks"
        description="Status of security and privacy certifications"
      >
        <div className="space-y-3">
          {data.frameworks.map(framework => {
            const config = STATUS_CONFIG[framework.status];
            const labels = FRAMEWORK_LABELS[framework.framework];
            const isExpanded = expandedFramework === framework.framework;
            const StatusIcon = config.Icon;

            return (
              <div
                key={framework.framework}
                className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedFramework(isExpanded ? null : framework.framework)}
                  className="w-full p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: config.bgColor }}
                    >
                      <StatusIcon
                        className="w-5 h-5"
                        style={{ color: config.color }}
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{labels.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{labels.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span
                        className="inline-block px-2 py-0.5 text-xs rounded-full"
                        style={{ backgroundColor: config.bgColor, color: config.color }}
                      >
                        {config.label}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">Score: {framework.score}%</p>
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

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-4">
                    {/* Requirements Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                        <span>Requirements</span>
                        <span>{framework.requirements.met}/{framework.requirements.total} met</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${(framework.requirements.met / framework.requirements.total) * 100}%` }}
                        />
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${(framework.requirements.partial / framework.requirements.total) * 100}%` }}
                        />
                        <div
                          className="h-full bg-red-500"
                          style={{ width: `${(framework.requirements.notMet / framework.requirements.total) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          Met: {framework.requirements.met}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Partial: {framework.requirements.partial}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          Not Met: {framework.requirements.notMet}
                        </span>
                      </div>
                    </div>

                    {/* Assessment Dates */}
                    {(framework.lastAssessment || framework.nextAssessment) && (
                      <div className="flex items-center gap-4 mb-4 text-xs text-gray-400">
                        {framework.lastAssessment && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Last: {formatDate(framework.lastAssessment)}
                          </span>
                        )}
                        {framework.nextAssessment && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Next: {formatDate(framework.nextAssessment)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Documents */}
                    {framework.documents.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-400 mb-2">Available Documents</p>
                        <div className="space-y-2">
                          {framework.documents.map(doc => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="text-sm text-white">{doc.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(doc.fileSize)} • Version {doc.version}
                                    {doc.validUntil && ` • Valid until ${formatDate(doc.validUntil)}`}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDownload(doc)}
                                disabled={downloadingId === doc.id || !isEnterprise}
                                className={`${tw.buttonSecondary} inline-flex items-center gap-2 text-sm h-8 px-3 disabled:opacity-50`}
                              >
                                {downloadingId === doc.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SettingsSection>

      <div className="border-t border-white/10" />

      {/* Data Residency */}
      <SettingsSection
        title="Data Residency"
        description="Where your data is stored and processed"
      >
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Server className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{data.dataResidency.region}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {data.dataResidency.country} • Hosted on {data.dataResidency.provider}
              </p>

              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-2">Data Center Certifications</p>
                <div className="flex flex-wrap gap-2">
                  {data.dataResidency.certifications.map(cert => (
                    <span
                      key={cert}
                      className="px-2 py-1 text-xs bg-white/10 text-gray-300 rounded"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}

export default ComplianceDashboard;
