import React, { useState, useReducer, useRef } from "react";
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Database,
  Upload,
  Package,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { IngestionConfig } from "../../types";

// ============================================================================
// Types
// ============================================================================

interface IngestionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: string;
    name: string;
    size: string;
  };
  onSubmit: (config: IngestionConfig) => Promise<void>;
}

interface WizardState {
  currentStep: 1 | 2 | 3;
  config: IngestionConfig;
  isProcessing: boolean;
  validationErrors: Record<string, string>;
  transitionDirection: "forward" | "backward";
}

type WizardAction =
  | { type: "SET_STEP"; step: 1 | 2 | 3 }
  | { type: "UPDATE_CONFIG"; payload: Partial<IngestionConfig> }
  | { type: "SET_PROCESSING"; isProcessing: boolean }
  | { type: "SET_VALIDATION_ERROR"; field: string; error: string }
  | { type: "CLEAR_VALIDATION_ERRORS" }
  | { type: "SET_DIRECTION"; direction: "forward" | "backward" }
  | { type: "RESET" };

// ============================================================================
// Reducer
// ============================================================================

function getInitialState(file: { id: string; name: string }): WizardState {
  return {
    currentStep: 1,
    config: {
      fileId: file.id,
      fileName: file.name,
      displayName: file.name,
      processingMode: "compress",
      codebase: { type: "existing", name: "" },
      tags: [],
      description: "",
    },
    isProcessing: false,
    validationErrors: {},
    transitionDirection: "forward",
  };
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.step };
    case "UPDATE_CONFIG":
      return {
        ...state,
        config: { ...state.config, ...action.payload },
        validationErrors: {},
      };
    case "SET_PROCESSING":
      return { ...state, isProcessing: action.isProcessing };
    case "SET_VALIDATION_ERROR":
      return {
        ...state,
        validationErrors: {
          ...state.validationErrors,
          [action.field]: action.error,
        },
      };
    case "CLEAR_VALIDATION_ERRORS":
      return { ...state, validationErrors: {} };
    case "SET_DIRECTION":
      return { ...state, transitionDirection: action.direction };
    case "RESET":
      return getInitialState({ id: state.config.fileId, name: state.config.fileName });
    default:
      return state;
  }
}

// ============================================================================
// Validation
// ============================================================================

function canProceed(
  step: number,
  config: IngestionConfig
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  switch (step) {
    case 1:
      // Step 1 always valid - radio has default selection
      break;
    case 2:
      if (!config.displayName.trim()) {
        errors.displayName = "Display name is required";
      }
      break;
    case 3:
      // Confirmation step - no validation needed
      break;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ============================================================================
// Step Indicator
// ============================================================================

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { number: 1, label: "Processing" },
    { number: 2, label: "Metadata" },
    { number: 3, label: "Confirm" },
  ];

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-slate-800/30">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          {/* Step Circle */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all duration-300",
                currentStep === step.number
                  ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30"
                  : currentStep > step.number
                  ? "bg-emerald-600 border-emerald-500 text-white"
                  : "bg-slate-800 border-slate-600 text-slate-400"
              )}
            >
              {currentStep > step.number ? <Check size={16} /> : step.number}
            </div>
            <span
              className={cn(
                "text-[10px] mt-1 font-mono uppercase tracking-wide",
                currentStep >= step.number ? "text-slate-300" : "text-slate-500"
              )}
            >
              {step.label}
            </span>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                "flex-1 h-0.5 mx-2 transition-colors duration-300",
                currentStep > step.number ? "bg-emerald-500" : "bg-slate-700"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================================
// Tag Input
// ============================================================================

function TagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="min-h-[42px] flex flex-wrap gap-2 p-2 bg-slate-800 border border-slate-700 rounded-lg cursor-text focus-within:border-blue-500 transition-colors"
    >
      {value.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded-md"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(index);
            }}
            className="text-slate-400 hover:text-red-400"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => inputValue && addTag(inputValue)}
        placeholder={value.length === 0 ? "Type and press Enter..." : ""}
        className="flex-1 min-w-[100px] bg-transparent border-none text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
      />
    </div>
  );
}

// ============================================================================
// Step 1: Processing Mode
// ============================================================================

function Step1ProcessingMode({
  value,
  onChange,
}: {
  value: "compress" | "compress_enrich";
  onChange: (mode: "compress" | "compress_enrich") => void;
}) {
  const options = [
    {
      id: "compress" as const,
      icon: Package,
      title: "Compress Only",
      description: "Basic compression for context efficiency",
    },
    {
      id: "compress_enrich" as const,
      icon: Sparkles,
      title: "Compress + Enrich",
      description: "AI-powered metadata extraction, summaries, tags, and key concepts",
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-100">Processing Mode</h3>
        <p className="text-sm text-slate-400 mt-1">
          Choose how the file should be processed for the context store.
        </p>
      </div>

      <div className="space-y-3">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.id;
          const colorClass = option.id === "compress" ? "blue" : "emerald";

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left",
                isSelected
                  ? colorClass === "blue"
                    ? "border-blue-500 bg-blue-600/10"
                    : "border-emerald-500 bg-emerald-600/10"
                  : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
              )}
            >
              <div
                className={cn(
                  "p-3 rounded-lg",
                  isSelected
                    ? colorClass === "blue"
                      ? "bg-blue-600/20 text-blue-400"
                      : "bg-emerald-600/20 text-emerald-400"
                    : "bg-slate-700 text-slate-400"
                )}
              >
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-200">
                  {option.title}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {option.description}
                </div>
              </div>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  isSelected
                    ? colorClass === "blue"
                      ? "border-blue-500 bg-blue-500"
                      : "border-emerald-500 bg-emerald-500"
                    : "border-slate-600"
                )}
              >
                {isSelected && <Check size={12} className="text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Step 2: File Metadata
// ============================================================================

function Step2FileMetadata({
  displayName,
  tags,
  description,
  onDisplayNameChange,
  onTagsChange,
  onDescriptionChange,
  errors,
}: {
  displayName: string;
  tags: string[];
  description: string;
  onDisplayNameChange: (name: string) => void;
  onTagsChange: (tags: string[]) => void;
  onDescriptionChange: (desc: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="p-6 space-y-5">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-100">File Metadata</h3>
        <p className="text-sm text-slate-400 mt-1">
          Customize how this file appears in the context store.
        </p>
      </div>

      {/* Display Name */}
      <div className="space-y-1.5">
        <label className="text-xs text-slate-300 font-medium">Display Name *</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder="Enter display name..."
          className={cn(
            "w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none transition-colors",
            errors.displayName
              ? "border-red-500 focus:border-red-500"
              : "border-slate-700 focus:border-blue-500"
          )}
        />
        {errors.displayName && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertTriangle size={12} />
            {errors.displayName}
          </p>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <label className="text-xs text-slate-300 font-medium">
          Tags <span className="text-slate-500">(optional)</span>
        </label>
        <TagInput value={tags} onChange={onTagsChange} />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-xs text-slate-300 font-medium">
          Description <span className="text-slate-500">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Add a brief description..."
          rows={3}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none resize-none"
        />
      </div>
    </div>
  );
}

// ============================================================================
// Step 3: Confirmation
// ============================================================================

function Step3Confirmation({
  config,
  isProcessing,
  onStartIngestion,
}: {
  config: IngestionConfig;
  isProcessing: boolean;
  onStartIngestion: () => void;
}) {
  const summaryItems = [
    { label: "File", value: config.fileName },
    { label: "Display Name", value: config.displayName },
    {
      label: "Processing",
      value:
        config.processingMode === "compress"
          ? "Compress Only"
          : "Compress + Enrich",
    },
    {
      label: "Codebase",
      value:
        config.codebase.type === "new"
          ? `New: ${config.codebase.name}`
          : config.codebase.name,
    },
    { label: "Tags", value: config.tags?.join(", ") || "None" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-100">Confirm Ingestion</h3>
        <p className="text-sm text-slate-400 mt-1">
          Review your configuration before starting the ingestion process.
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
        {summaryItems.map((item) => (
          <div key={item.label} className="flex justify-between items-start">
            <span className="text-xs text-slate-400 font-mono uppercase">
              {item.label}
            </span>
            <span className="text-sm text-slate-200 text-right max-w-[60%] break-words">
              {item.value}
            </span>
          </div>
        ))}

        {config.description && (
          <div className="pt-2 border-t border-slate-700">
            <span className="text-xs text-slate-400 font-mono uppercase block mb-1">
              Description
            </span>
            <p className="text-sm text-slate-300">{config.description}</p>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      {isProcessing && (
        <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-blue-400">Processing ingestion...</span>
          </div>
          <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      )}

      {/* Start Button */}
      {!isProcessing && (
        <button
          onClick={onStartIngestion}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
        >
          <Upload size={18} />
          Start Ingestion
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Main Wizard Component
// ============================================================================

export function IngestionWizard({
  isOpen,
  onClose,
  file,
  onSubmit,
}: IngestionWizardProps) {
  const [state, dispatch] = useReducer(
    wizardReducer,
    file,
    getInitialState
  );

  const handleNext = () => {
    const { valid, errors } = canProceed(state.currentStep, state.config);
    if (valid) {
      dispatch({ type: "CLEAR_VALIDATION_ERRORS" });
      dispatch({ type: "SET_DIRECTION", direction: "forward" });
      dispatch({
        type: "SET_STEP",
        step: (state.currentStep + 1) as 1 | 2 | 3,
      });
    } else {
      Object.entries(errors).forEach(([field, error]) => {
        dispatch({ type: "SET_VALIDATION_ERROR", field, error });
      });
    }
  };

  const handleBack = () => {
    dispatch({ type: "SET_DIRECTION", direction: "backward" });
    dispatch({
      type: "SET_STEP",
      step: (state.currentStep - 1) as 1 | 2 | 3,
    });
  };

  const handleSubmit = async () => {
    dispatch({ type: "SET_PROCESSING", isProcessing: true });
    try {
      await onSubmit(state.config);
      onClose();
    } catch (error) {
      console.error("Ingestion failed:", error);
    } finally {
      dispatch({ type: "SET_PROCESSING", isProcessing: false });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={!state.isProcessing ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Database size={20} className="text-blue-400" />
            Configure Ingestion
          </h2>
          <button
            onClick={onClose}
            disabled={state.isProcessing}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={state.currentStep} />

        {/* Step Content */}
        <div className="min-h-[320px]">
          {state.currentStep === 1 && (
            <Step1ProcessingMode
              value={state.config.processingMode}
              onChange={(mode) =>
                dispatch({ type: "UPDATE_CONFIG", payload: { processingMode: mode } })
              }
            />
          )}
          {state.currentStep === 2 && (
            <Step2FileMetadata
              displayName={state.config.displayName}
              tags={state.config.tags || []}
              description={state.config.description || ""}
              onDisplayNameChange={(displayName) =>
                dispatch({ type: "UPDATE_CONFIG", payload: { displayName } })
              }
              onTagsChange={(tags) =>
                dispatch({ type: "UPDATE_CONFIG", payload: { tags } })
              }
              onDescriptionChange={(description) =>
                dispatch({ type: "UPDATE_CONFIG", payload: { description } })
              }
              errors={state.validationErrors}
            />
          )}
          {state.currentStep === 3 && (
            <Step3Confirmation
              config={state.config}
              isProcessing={state.isProcessing}
              onStartIngestion={handleSubmit}
            />
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/30 flex justify-between">
          <button
            onClick={handleBack}
            disabled={state.currentStep === 1 || state.isProcessing}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {state.currentStep < 3 && (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              Next
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
