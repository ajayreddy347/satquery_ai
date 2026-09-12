export type BenchmarkDatasetId =
  | 'vrsbench'
  | 'rsvqa-hr'
  | 'rsvqa-lr'
  | 'cdvqa'
  | 'bigearthnet'
  | 'isro-sac';

export type EvaluationSplit = 'test' | 'val' | 'train-subset';

export type EvaluationTaskId =
  | 'Single-Image VQA'
  | 'Scene Captioning'
  | 'Text-Guided Grounding'
  | 'Bi-Temporal Change Understanding'
  | 'Change-Based VQA'
  | 'Optical + SAR Analysis'
  | 'Agent Routing Accuracy';

export type EvaluationRunStatus = 'Not Evaluated' | 'Running' | 'Completed' | 'Failed';

export type FailureCategory =
  | 'incorrect_answer'
  | 'unsupported_query'
  | 'poor_spatial_grounding'
  | 'incorrect_change_interpretation'
  | 'modality_issue'
  | 'preprocessing_failure'
  | 'model_failure'
  | 'insufficient_evidence';

export type IsolationTier =
  | 'Training'
  | 'Development'
  | 'Evaluation'
  | 'Final Evaluation (ISRO/SAC)';

export interface GroundTruthBox {
  label: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
}

export interface EvaluationSample {
  id: string;
  datasetId: BenchmarkDatasetId;
  task: EvaluationTaskId;
  split: EvaluationSplit;
  images: {
    name: string;
    url: string;
    modality: string;
    sensor?: string;
    resolution?: string;
    crs?: string;
    timestamp?: string;
  }[];
  query: string;
  groundTruth: {
    answer?: string;
    normalizedAnswer?: string;
    captions?: string[];
    boxes?: GroundTruthBox[];
    changeDirection?: string;
    netChangePct?: number;
    classes?: string[];
  };
}

export interface EvaluationSamplePrediction {
  sampleId: string;
  query: string;
  predictedAnswer: string;
  groundTruthText: string;
  images: { name: string; url: string; modality: string }[];
  predictedBoxes?: GroundTruthBox[];
  groundTruthBoxes?: GroundTruthBox[];
  evidence: string[];
  latencyMs: number;
  isCorrect: boolean;
  score: number; // 0.0 to 1.0 or IoU
  metricName: string;
  failureCategory?: FailureCategory;
  failureDetails?: string;
  manualInspectorNotes?: string;
}

export interface MetricEntry {
  name: string;
  value: number | string;
  formatted: string;
  unit?: string;
  description: string;
}

export interface EvaluationRunResult {
  runId: string;
  timestamp: string;
  datasetId: BenchmarkDatasetId;
  datasetName: string;
  datasetVersion: string;
  split: EvaluationSplit;
  taskId: EvaluationTaskId;
  modelId: string;
  modelName: string;
  modelVersion: string;
  sampleCount: number;
  batchSize: number;
  device: string;
  randomSeed: number;
  outputDirectory: string;
  executionTimeMs: number;
  failuresCount: number;
  isMeasuredResult: boolean;
  primaryMetricName: string;
  primaryMetricValue: number;
  detailedMetrics: MetricEntry[];
  samplePredictions: EvaluationSamplePrediction[];
  failureBreakdown: Record<FailureCategory, number>;
  reproducibility: {
    datasetConfig: string;
    modelCheckpoint: string;
    preprocessing: string;
    randomSeed: number;
    timestamp: string;
  };
}

export interface BenchmarkDatasetInfo {
  id: BenchmarkDatasetId;
  name: string;
  purpose: string;
  supportedTasks: EvaluationTaskId[];
  annotationFormat: string;
  metricsSupported: string[];
  isolationTier: IsolationTier;
  mountStatus: 'Mounted & Verified' | 'Manifest Configured' | 'Awaiting SAC Deployment';
  sampleCountTotal: number;
  description: string;
  version: string;
  citation: string;
}

export interface TaskEvaluationSummaryCard {
  taskId: EvaluationTaskId;
  datasetId: BenchmarkDatasetId;
  datasetName: string;
  status: EvaluationRunStatus;
  sampleCount: number;
  metricName: string;
  metricValue: string; // e.g. "Not Evaluated" or "84.2% Exact Match"
  lastRunTimestamp: string | null;
  modelUsed: string | null;
  isMeasuredResult: boolean;
}
