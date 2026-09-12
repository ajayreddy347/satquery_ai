import {
  AnalysisMode,
  AnalysisResult,
  BoundingBox,
  ExecutionTraceStep,
  FileMetadata,
  ModelDeploymentStatus,
  TaskType,
} from '../../types';

export type OrchestratorTask =
  | 'Single-Image VQA'
  | 'Scene Captioning'
  | 'Text-Guided Grounding'
  | 'Bi-Temporal Change Analysis'
  | 'Change-Based VQA'
  | 'Optical-SAR Analysis'
  | 'Unsupported';

export type SpecialistId =
  | 'rs-vqa'
  | 'rs-captioning'
  | 'rs-grounding'
  | 'rs-change'
  | 'rs-change-vqa'
  | 'rs-optsar';

export interface SpecialistDescriptor {
  id: SpecialistId;
  name: string;
  version: string;
  category: string;
  architecture: string;
  checkpoint: string;
  evidenceCapability: string;
  status: ModelDeploymentStatus;
  availability: string;
  supportedTasks: OrchestratorTask[];
  supportedModalities: string[];
  inputRequirements: string;
  description: string;
  minImages: number;
  maxImages: number;
  requiresCoRegistration: boolean;
  requiresCrossModal: boolean;
  parameters: string;
  benchmarkStatus: string;
}

export interface TaskClassification {
  task: OrchestratorTask;
  canonicalTaskType: TaskType;
  confidenceScore: number;
  reasoning: string;
  targetEntities: string[];
  temporalIntent: boolean;
  crossModalIntent: boolean;
  groundingIntent: boolean;
  captioningIntent: boolean;
  isMultiStepCandidate: boolean;
}

export type CompatibilityErrorCode =
  | 'MISSING_IMAGE'
  | 'MODALITY_MISMATCH'
  | 'GEOGRAPHIC_INCOMPATIBILITY'
  | 'UNSUPPORTED_FORMAT'
  | 'CORRUPTED_RASTER'
  | 'UNSUPPORTED_TASK';

export interface CompatibilityCheckOutcome {
  compatible: boolean;
  errorCode?: CompatibilityErrorCode;
  explanation: string;
  technicalDetails: { label: string; value: string }[];
  inspectedInputs: {
    imageCount: number;
    modalities: string[];
    formats: string[];
    crsList: string[];
    dimensionsList: string[];
    resolutionsList: string[];
    spatialOverlapPct: number;
    temporalMetadataPresent: boolean;
  };
}

export interface SpecialistSelection {
  specialist: SpecialistDescriptor;
  selectionReason: string;
  isMultiStep: boolean;
  pipelineSequence: SpecialistDescriptor[];
}

export interface ValidationCheckItem {
  check: string;
  passed: boolean;
  message: string;
}

export interface OrchestrationValidationResult {
  valid: boolean;
  status: 'PASSED' | 'FAILED' | 'UNCERTAIN' | 'WARNING';
  checks: ValidationCheckItem[];
  notes: string[];
  confidenceAssessment: 'CALIBRATED' | 'UNAVAILABLE' | 'INVALID';
}

export interface AgentAuditRecord {
  auditId: string;
  timestamp: string;
  query: string;
  inputInformation: string;
  detectedTask: OrchestratorTask;
  selectedSpecialist: string;
  selectionReason: string;
  permittedParameters: {
    mode: AnalysisMode;
    enableDemoSimulation: boolean;
    imageCount: number;
  };
  executionSteps: ExecutionTraceStep[];
  resultStatus: 'SUCCESS' | 'FAILED' | 'REJECTED' | 'UNCERTAIN';
  evidenceCount: number;
  confidenceScore: number | null;
  validationNotes: string[];
}
