import { useState, useEffect, useCallback, useReducer } from 'react';
import { X, Minus, AlertTriangle, FolderGit2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { PhaseIndicator } from './PhaseIndicator';
import { Phase1Fetching, createMockPhase1Data } from './Phase1Fetching';
import { Phase2Analysis, createMockPhase2Data } from './Phase2Analysis';
import { Phase3Chunking, createMockPhase3Data } from './Phase3Chunking';
import { Phase4Optimization, createMockPhase4Data } from './Phase4Optimization';
import { MetricsSidebar, createMockMetrics } from './MetricsSidebar';
import type {
  IngestionProgressContainerProps,
  IngestionProgressState,
  PhaseInfo,
  IngestionError,
  Phase1FetchingData,
  Phase2AnalysisData,
  Phase3ChunkingData,
  Phase4OptimizationData,
  IngestionMetricsSidebar,
} from '../../types/ingestionProgress';
import { INGESTION_PHASES_ORDER, PHASE_CONFIG, PRO_TIPS } from '../../types/ingestionProgress';
import type { IngestionPhase } from '../../types/project';

// =============================================================================
// State Management
// =============================================================================

type ProgressAction =
  | { type: 'SET_PHASE'; phase: IngestionPhase }
  | { type: 'UPDATE_PHASE1'; data: Partial<Phase1FetchingData> }
  | { type: 'UPDATE_PHASE2'; data: Partial<Phase2AnalysisData> }
  | { type: 'UPDATE_PHASE3'; data: Partial<Phase3ChunkingData> }
  | { type: 'UPDATE_PHASE4'; data: Partial<Phase4OptimizationData> }
  | { type: 'UPDATE_METRICS'; metrics: Partial<IngestionMetricsSidebar> }
  | { type: 'SET_MINIMIZED'; minimized: boolean }
  | { type: 'SET_ERROR'; error: IngestionError }
  | { type: 'CLEAR_ERROR' }
  | { type: 'COMPLETE_PHASE'; phase: IngestionPhase }
  | { type: 'SET_PHASE_ERROR'; phase: IngestionPhase; error: string };

function createInitialState(projectName: string): IngestionProgressState {
  const phases: PhaseInfo[] = INGESTION_PHASES_ORDER.map((phase) => ({
    phase,
    status: phase === 'repository_fetch' ? 'active' : 'pending',
    label: PHASE_CONFIG[phase].label,
    shortLabel: PHASE_CONFIG[phase].shortLabel,
    icon: PHASE_CONFIG[phase].icon,
  }));

  return {
    currentPhase: 'repository_fetch',
    phases,
    phase1Data: createMockPhase1Data(),
    phase2Data: null,
    phase3Data: null,
    phase4Data: null,
    sidebarMetrics: {
      originalTokens: 0,
      currentTokens: 0,
      reductionPercent: 0,
      timeElapsedSeconds: 0,
      filesProcessed: 0,
      totalFiles: 0,
      currentPhaseName: PHASE_CONFIG['repository_fetch'].label,
    },
    isMinimized: false,
    startedAt: new Date(),
    error: null,
  };
}

function progressReducer(state: IngestionProgressState, action: ProgressAction): IngestionProgressState {
  switch (action.type) {
    case 'SET_PHASE': {
      const phaseIndex = INGESTION_PHASES_ORDER.indexOf(action.phase);
      const newPhases = state.phases.map((p, i) => ({
        ...p,
        status:
          INGESTION_PHASES_ORDER.indexOf(p.phase) < phaseIndex
            ? 'completed'
            : p.phase === action.phase
            ? 'active'
            : 'pending',
      })) as PhaseInfo[];

      return {
        ...state,
        currentPhase: action.phase,
        phases: newPhases,
        sidebarMetrics: {
          ...state.sidebarMetrics,
          currentPhaseName: PHASE_CONFIG[action.phase].label,
        },
      };
    }

    case 'UPDATE_PHASE1':
      return {
        ...state,
        phase1Data: state.phase1Data ? { ...state.phase1Data, ...action.data } : null,
      };

    case 'UPDATE_PHASE2':
      return {
        ...state,
        phase2Data: state.phase2Data ? { ...state.phase2Data, ...action.data } : createMockPhase2Data(action.data),
      };

    case 'UPDATE_PHASE3':
      return {
        ...state,
        phase3Data: state.phase3Data ? { ...state.phase3Data, ...action.data } : createMockPhase3Data(action.data),
      };

    case 'UPDATE_PHASE4':
      return {
        ...state,
        phase4Data: state.phase4Data ? { ...state.phase4Data, ...action.data } : createMockPhase4Data(action.data),
      };

    case 'UPDATE_METRICS':
      return {
        ...state,
        sidebarMetrics: { ...state.sidebarMetrics, ...action.metrics },
      };

    case 'SET_MINIMIZED':
      return { ...state, isMinimized: action.minimized };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
        phases: state.phases.map((p) =>
          p.phase === action.error.phase ? { ...p, status: 'error', errorMessage: action.error.message } : p
        ) as PhaseInfo[],
      };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'COMPLETE_PHASE':
      return {
        ...state,
        phases: state.phases.map((p) =>
          p.phase === action.phase ? { ...p, status: 'completed', completedAt: new Date() } : p
        ) as PhaseInfo[],
      };

    case 'SET_PHASE_ERROR':
      return {
        ...state,
        phases: state.phases.map((p) =>
          p.phase === action.phase ? { ...p, status: 'error', errorMessage: action.error } : p
        ) as PhaseInfo[],
      };

    default:
      return state;
  }
}

// =============================================================================
// Close Warning Modal
// =============================================================================

function CloseWarningModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
        <div className="flex items-center gap-3 text-amber-400">
          <AlertTriangle size={24} />
          <h3 className="text-lg font-semibold">Ingestion in Progress</h3>
        </div>
        <p className="text-sm text-slate-300">
          Closing this dialog will cancel the current ingestion process. Are you sure you want to cancel?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Continue Ingestion
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
          >
            Cancel Ingestion
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function IngestionProgressContainer({
  projectId,
  projectName,
  onComplete,
  onError,
  onMinimize,
}: IngestionProgressContainerProps) {
  const [state, dispatch] = useReducer(progressReducer, projectName, createInitialState);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Time elapsed counter
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
      dispatch({ type: 'UPDATE_METRICS', metrics: { timeElapsedSeconds: elapsedTime + 1 } });
    }, 1000);

    return () => clearInterval(interval);
  }, [elapsedTime]);

  // Handle close attempt
  const handleCloseAttempt = useCallback(() => {
    setShowCloseWarning(true);
  }, []);

  // Handle confirmed close
  const handleConfirmClose = useCallback(() => {
    setShowCloseWarning(false);
    onError({
      code: 'USER_CANCELLED',
      message: 'Ingestion cancelled by user',
      phase: state.currentPhase,
      recoverable: false,
    });
  }, [state.currentPhase, onError]);

  // Handle minimize
  const handleMinimize = useCallback(() => {
    dispatch({ type: 'SET_MINIMIZED', minimized: true });
    onMinimize?.();
  }, [onMinimize]);

  // Get current phase index
  const currentPhaseIndex = INGESTION_PHASES_ORDER.indexOf(state.currentPhase);

  // Render current phase content
  const renderPhaseContent = () => {
    switch (state.currentPhase) {
      case 'repository_fetch':
        return state.phase1Data && <Phase1Fetching data={state.phase1Data} />;
      case 'parsing':
        return state.phase2Data && <Phase2Analysis data={state.phase2Data} />;
      case 'chunking':
        return state.phase3Data && <Phase3Chunking data={state.phase3Data} />;
      case 'optimization':
        return state.phase4Data && <Phase4Optimization data={state.phase4Data} />;
      default:
        return null;
    }
  };

  // Minimized state
  if (state.isMinimized) {
    return (
      <button
        onClick={() => dispatch({ type: 'SET_MINIMIZED', minimized: false })}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl hover:border-blue-500 transition-colors"
      >
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
        <span className="text-sm text-slate-200">
          Ingesting: {projectName}
        </span>
        <span className="text-xs text-slate-400">
          {state.sidebarMetrics.currentPhaseName}
        </span>
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" />

        {/* Modal */}
        <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700 shrink-0">
            <div className="flex items-center gap-3">
              <FolderGit2 size={20} className="text-blue-400" />
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Processing: {projectName}
                </h2>
                <p className="text-xs text-slate-400">
                  Project ID: {projectId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onMinimize && (
                <button
                  onClick={handleMinimize}
                  className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Minimize"
                >
                  <Minus size={18} />
                </button>
              )}
              <button
                onClick={handleCloseAttempt}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Cancel Ingestion"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Phase Indicator */}
          <PhaseIndicator
            phases={state.phases}
            currentPhaseIndex={currentPhaseIndex}
            className="shrink-0"
          />

          {/* Main Content Area */}
          <div className="flex flex-1 min-h-0">
            {/* Phase Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {renderPhaseContent()}
            </div>

            {/* Metrics Sidebar */}
            <MetricsSidebar
              metrics={state.sidebarMetrics}
              layout="sidebar"
              className="shrink-0 hidden lg:block"
            />
          </div>

          {/* Footer Metrics (mobile) */}
          <div className="lg:hidden shrink-0">
            <MetricsSidebar metrics={state.sidebarMetrics} layout="footer" />
          </div>
        </div>
      </div>

      {/* Close Warning Modal */}
      {showCloseWarning && (
        <CloseWarningModal
          onConfirm={handleConfirmClose}
          onCancel={() => setShowCloseWarning(false)}
        />
      )}
    </>
  );
}

// =============================================================================
// Export Hook for External Control
// =============================================================================

export function useIngestionProgress() {
  const [isVisible, setIsVisible] = useState(false);
  const [projectInfo, setProjectInfo] = useState<{ id: string; name: string } | null>(null);

  const startIngestion = useCallback((projectId: string, projectName: string) => {
    setProjectInfo({ id: projectId, name: projectName });
    setIsVisible(true);
  }, []);

  const stopIngestion = useCallback(() => {
    setIsVisible(false);
    setProjectInfo(null);
  }, []);

  return {
    isVisible,
    projectInfo,
    startIngestion,
    stopIngestion,
  };
}
