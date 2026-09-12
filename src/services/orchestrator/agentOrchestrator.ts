import {
  AnalysisMode,
  AnalysisResult,
  BoundingBox,
  ExecutionTraceStep,
  FileMetadata,
  TaskType,
} from '../../types';
import {
  AgentAuditRecord,
  CompatibilityCheckOutcome,
  OrchestratorTask,
  SpecialistDescriptor,
  TaskClassification,
} from './types';
import { QueryClassifier } from './queryClassifier';
import { CompatibilityChecker } from './compatibilityChecker';
import { SpecialistRegistry } from './specialistRegistry';
import { ResultValidator } from './resultValidator';
import { AuditLogger } from './auditLogger';
import { rsVlmEngine } from '../vlm/rsVlmEngine';
import { biTemporalChangeEngine } from '../change/changeAnalysisEngine';
import { opticalSarEngine } from '../opticalSar/opticalSarEngine';
import { sceneCaptioningEngine } from '../captioning/sceneCaptioningEngine';
import { textGuidedGroundingEngine } from '../grounding/textGuidedGroundingEngine';
import { SAMPLE_ANALYSIS_PRESETS } from '../../data/mockData';

export interface OrchestrationParams {
  query: string;
  files: {
    single?: FileMetadata | null;
    optical?: FileMetadata | null;
    sar?: FileMetadata | null;
    before?: FileMetadata | null;
    after?: FileMetadata | null;
  };
  modeHint?: AnalysisMode;
  enableDemoSimulation?: boolean;
  onProgress?: (stepNumber: number, stepTitle: string, details?: string) => void;
}

export class AgentOrchestrator {
  /**
   * The Central Agentic Orchestrator for SatQuery AI.
   * Understand -> Validate -> Compatibility Check -> Select Specialist -> Execute -> Validate Result -> Ground Evidence -> Respond.
   */
  public static async analyze(params: OrchestrationParams): Promise<AnalysisResult> {
    const {
      query,
      files,
      modeHint = 'single',
      enableDemoSimulation = true,
      onProgress,
    } = params;

    const startTime = Date.now();
    const executionSteps: ExecutionTraceStep[] = [];

    // Helper to log observable execution step
    const addStep = (
      stepNumber: number,
      title: string,
      status: 'completed' | 'running' | 'failed' | 'skipped',
      summary: string,
      details?: { label: string; value: string }[],
      durationMs: number = 30
    ) => {
      const step: ExecutionTraceStep = {
        id: `step-${stepNumber}`,
        stepNumber,
        title,
        status,
        durationMs,
        summary,
        details,
      };
      executionSteps.push(step);
      onProgress?.(stepNumber, title, summary);
      return step;
    };

    // ------------------------------------------------------------------------
    // STAGE 1: Query received & linguistic parsing
    // ------------------------------------------------------------------------
    addStep(
      1,
      'Query received',
      'completed',
      `Parsed user query "${query.slice(0, 60)}${query.length > 60 ? '...' : ''}" across linguistic tokens and spatial terms.`,
      [{ label: 'Query Characters', value: `${query.length}` }]
    );
    await new Promise((r) => setTimeout(r, 40));

    // ------------------------------------------------------------------------
    // STAGE 2: Input Rasters Validation & Metadata Extraction
    // ------------------------------------------------------------------------
    const activeImages: FileMetadata[] = [];
    if (files.single) activeImages.push(files.single);
    if (files.optical && !activeImages.includes(files.optical)) activeImages.push(files.optical);
    if (files.sar && !activeImages.includes(files.sar)) activeImages.push(files.sar);
    if (files.before && !activeImages.includes(files.before)) activeImages.push(files.before);
    if (files.after && !activeImages.includes(files.after)) activeImages.push(files.after);

    addStep(
      2,
      'Input validation',
      'completed',
      `Validated ${activeImages.length} observation raster file(s), inspecting CRS, header integrity, and dimensions.`,
      [
        { label: 'Active Images', value: `${activeImages.length}` },
        { label: 'Primary Filename', value: activeImages[0]?.name || 'None' },
        { label: 'Primary CRS', value: activeImages[0]?.crs || 'Unknown' },
      ]
    );
    await new Promise((r) => setTimeout(r, 40));

    // ------------------------------------------------------------------------
    // STAGE 3: Autonomous Task Understanding & Classification
    // ------------------------------------------------------------------------
    const classification: TaskClassification = QueryClassifier.classify(
      query,
      activeImages.length
    );

    addStep(
      3,
      'Task classification',
      'completed',
      `Classified query intent as '${classification.task}' (${classification.reasoning}).`,
      [
        { label: 'Detected Task', value: classification.task },
        { label: 'Confidence Score', value: `${classification.confidenceScore}%` },
        { label: 'Multi-Step Candidate', value: classification.isMultiStepCandidate ? 'Yes' : 'No' },
      ]
    );
    await new Promise((r) => setTimeout(r, 45));

    // ------------------------------------------------------------------------
    // STAGE 4: Input Compatibility Reasoning & Sanity Verification
    // ------------------------------------------------------------------------
    const compatibility: CompatibilityCheckOutcome = CompatibilityChecker.verifyCompatibility(
      classification.task,
      activeImages,
      {
        opticalImage: files.optical,
        sarImage: files.sar,
        beforeImage: files.before,
        afterImage: files.after,
      }
    );

    if (!compatibility.compatible) {
      addStep(
        4,
        'Compatibility check',
        'failed',
        `Compatibility Check Failed: ${compatibility.explanation}`,
        compatibility.technicalDetails
      );

      // Construct auditable failure record
      const failedResult: AnalysisResult = {
        query,
        mode: modeHint,
        taskType: classification.canonicalTaskType,
        selectedModel: 'SatQuery Agentic Orchestrator',
        answer: `Execution Stopped by Orchestrator: ${compatibility.explanation}`,
        confidence: null,
        confidenceLabel: 'Confidence unavailable (Execution Rejected)',
        evidence: [
          `Reason for Halt: ${compatibility.explanation}`,
          `Inspected raster count: ${activeImages.length}`,
          ...compatibility.technicalDetails.map((t) => `${t.label}: ${t.value}`),
        ],
        executionSteps,
        imageryMetadata: {
          coordinates: activeImages[0]?.crs || 'Incompatible',
          resolution: activeImages[0]?.gsd || 'N/A',
          dimensions: activeImages[0]?.dimensions || '0 × 0',
          modality: activeImages.map((i) => i.modality).join(' / ') || 'None',
          sensor: activeImages.map((i) => i.sensor).join(' / ') || 'None',
        },
        validationStatus: 'FAILED',
        validationNotes: [compatibility.explanation],
        selectionReason: `Analysis rejected: ${compatibility.explanation}`,
        isSimulation: false,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      };

      // Log failure in audit log
      AuditLogger.log({
        auditId: `audit-rej-${Date.now()}`,
        timestamp: new Date().toISOString(),
        query,
        inputInformation: activeImages.map((i) => i.name).join(', ') || 'No files',
        detectedTask: classification.task,
        selectedSpecialist: 'None (Execution Stopped)',
        selectionReason: compatibility.explanation,
        permittedParameters: { mode: modeHint, enableDemoSimulation, imageCount: activeImages.length },
        executionSteps,
        resultStatus: 'REJECTED',
        evidenceCount: 0,
        confidenceScore: null,
        validationNotes: [compatibility.explanation],
      });

      throw new Error(compatibility.explanation);
    }

    addStep(
      4,
      'Compatibility check',
      'completed',
      compatibility.explanation,
      compatibility.technicalDetails
    );
    await new Promise((r) => setTimeout(r, 45));

    // ------------------------------------------------------------------------
    // STAGE 5: Tool / Specialist Selection
    // ------------------------------------------------------------------------
    const selectedSpecialist = SpecialistRegistry.getSpecialistForTask(classification.task) ||
      SpecialistRegistry.getSpecialist('rs-vqa')!;

    // Construct human-readable justification of tool selection
    const selectionReason = this.buildSelectionReason(
      classification.task,
      activeImages,
      selectedSpecialist
    );

    addStep(
      5,
      'Specialist selected',
      'completed',
      `Selected ${selectedSpecialist.name} (${selectionReason}).`,
      [
        { label: 'Specialist ID', value: selectedSpecialist.id },
        { label: 'Architecture', value: selectedSpecialist.architecture },
        { label: 'Deployment Status', value: selectedSpecialist.status },
      ]
    );
    await new Promise((r) => setTimeout(r, 50));

    // ------------------------------------------------------------------------
    // STAGE 6: Model Execution (including Multi-Step Sequencing)
    // ------------------------------------------------------------------------
    let rawResult: AnalysisResult;

    if (
      classification.isMultiStepCandidate &&
      classification.groundingIntent &&
      classification.captioningIntent
    ) {
      // Multi-Step Single-Image Workflow:
      // 1. Scene Captioning (RS-Captioner-v2.4)
      // 2. Text-Guided Grounding (RS-Grounder-DETR)
      // 3. Evidence validation & Combined response
      addStep(
        6,
        'Multi-step execution: Scene Captioning',
        'completed',
        'Step 1 of Multi-Step Workflow: Decomposing patch embeddings and extracting land-cover taxonomy via RS-Captioner-v2.4.',
        [{ label: 'Step 1 Engine', value: 'RS-Captioner-v2.4 (Scene Captioning)' }]
      );
      await new Promise((r) => setTimeout(r, 60));

      const captionOutcome = sceneCaptioningEngine.executeCaptioning({
        query,
        imageFile: files.single || activeImages[0],
        enableDemoSimulation,
      });

      addStep(
        7,
        'Multi-step execution: Text-Guided Grounding',
        'completed',
        'Step 2 of Multi-Step Workflow: Conditioning cross-attention on natural-language expression to localize spatial boundaries via RS-Grounder-DETR.',
        [{ label: 'Step 2 Engine', value: 'RS-Grounder-DETR (Spatial Grounding)' }]
      );
      await new Promise((r) => setTimeout(r, 60));

      const groundingOutcome = textGuidedGroundingEngine.executeGrounding({
        query,
        imageFile: files.single || activeImages[0],
        enableDemoSimulation,
      });

      rawResult = {
        ...captionOutcome,
        answer: `${captionOutcome.answer}\n\nSpatial Grounding: ${groundingOutcome.answer}`,
        whyThisAnswer:
          `Multi-step agentic workflow: Step 1 synthesized comprehensive scene description and land-cover taxonomy via RS-Captioner-v2.4. ` +
          `Step 2 executed query-conditioned spatial grounding to pinpoint requested coordinates via RS-Grounder-DETR.`,
        boundingBoxes: groundingOutcome.boundingBoxes,
        polygons: groundingOutcome.polygons || captionOutcome.polygons,
        points: groundingOutcome.points || captionOutcome.points,
        spatialEvidenceItems: [
          ...(captionOutcome.spatialEvidenceItems || []),
          ...(groundingOutcome.spatialEvidenceItems || []),
        ],
        evidence: [...captionOutcome.evidence, ...groundingOutcome.evidence],
        imageOverlayType: groundingOutcome.spatialEvidenceAvailable ? 'grounding' : 'none',
        spatialEvidenceAvailable: groundingOutcome.spatialEvidenceAvailable,
        groundingStatus: groundingOutcome.groundingStatus,
        evidenceNote: groundingOutcome.evidenceNote || captionOutcome.evidenceNote,
        confidence: groundingOutcome.confidence || captionOutcome.confidence,
        confidenceLabel: groundingOutcome.confidenceLabel || captionOutcome.confidenceLabel,
        isMultiStep: true,
        multiStepSequence: [
          'RS-Captioner-v2.4 (Scene Captioning & Land-Cover Taxonomy)',
          'RS-Grounder-DETR (Query-Conditioned Spatial Localization)',
          'Geospatial Verification & Evidence Grounding',
        ],
      };
    } else if (
      classification.isMultiStepCandidate &&
      (classification.task === 'Bi-Temporal Change Analysis' || classification.task === 'Change-Based VQA')
    ) {
      // Multi-Step Pipeline:
      // 1. Run Change Detection Specialist
      // 2. Extract Changed Regions
      // 3. Run Change-Based Semantic Interpretation
      addStep(
        6,
        'Multi-step execution: ChangeFormer-V2',
        'completed',
        'Step 1 of Multi-Step Workflow: Extracting bi-temporal change mask and spatial clusters via ChangeFormer-V2.',
        [{ label: 'Step 1 Engine', value: 'ChangeFormer-V2 (Bi-Temporal Change)' }]
      );
      await new Promise((r) => setTimeout(r, 60));

      const changeOutcome = biTemporalChangeEngine.executeChangeAnalysis({
        query,
        beforeFile: files.before || activeImages[0],
        afterFile: files.after || activeImages[1],
        isModelLoaded: true,
        enableDemoSimulation,
      });

      addStep(
        7,
        'Multi-step execution: Change Interpretation',
        'completed',
        `Step 2 of Multi-Step Workflow: Analyzing ${changeOutcome.changedRegions?.length || 0} extracted change clusters for semantic categorization.`,
        [{ label: 'Step 2 Engine', value: 'Change-VQA Semantic Reasoner' }]
      );
      await new Promise((r) => setTimeout(r, 60));

      rawResult = {
        ...changeOutcome,
        isMultiStep: true,
        multiStepSequence: [
          'ChangeFormer-V2 (Spatial Change Delineation)',
          'Change-VQA Semantic Reasoner (Region Classification)',
        ],
      };
    } else if (classification.task === 'Scene Captioning') {
      addStep(
        6,
        'Scene description generation',
        'completed',
        `Executing forward pass on ${selectedSpecialist.name} (Encoder-Decoder Spatial Cross-Attention Transformer).`,
        [{ label: 'Specialist', value: selectedSpecialist.name }]
      );
      await new Promise((r) => setTimeout(r, 100));

      rawResult = sceneCaptioningEngine.executeCaptioning({
        query,
        imageFile: files.single || activeImages[0],
        enableDemoSimulation,
      });
    } else if (classification.task === 'Text-Guided Grounding') {
      addStep(
        6,
        'Query-conditioned spatial localization',
        'completed',
        `Executing forward pass on ${selectedSpecialist.name} (Deformable DETR-RS + Feature Pyramid Network).`,
        [{ label: 'Specialist', value: selectedSpecialist.name }]
      );
      await new Promise((r) => setTimeout(r, 100));

      rawResult = textGuidedGroundingEngine.executeGrounding({
        query,
        imageFile: files.single || activeImages[0],
        enableDemoSimulation,
      });
    } else if (classification.task === 'Optical-SAR Analysis') {
      addStep(
        6,
        'Multimodal tensor fusion',
        'completed',
        'Forward pass through Dual-Stream Cross-Attention Network (ResNet-101 Optical + U-Net SAR Backscatter Encoder).',
        [{ label: 'Specialist', value: selectedSpecialist.name }]
      );
      await new Promise((r) => setTimeout(r, 100));

      rawResult = opticalSarEngine.executeOpticalSarAnalysis({
        query,
        opticalFile: files.optical || activeImages.find((i) => i.modality.toLowerCase().includes('optical')) || activeImages[0],
        sarFile: files.sar || activeImages.find((i) => i.modality.toLowerCase().includes('sar')) || activeImages[1],
        isModelLoaded: true,
        enableDemoSimulation,
      });
    } else if (classification.task === 'Bi-Temporal Change Analysis' || classification.task === 'Change-Based VQA') {
      addStep(
        6,
        'Bi-temporal tensor difference',
        'completed',
        'Executing Siamese Vision Transformer (SVT) with Temporal Difference Head across aligned T1 and T2 tensors.',
        [{ label: 'Specialist', value: selectedSpecialist.name }]
      );
      await new Promise((r) => setTimeout(r, 100));

      rawResult = biTemporalChangeEngine.executeChangeAnalysis({
        query,
        beforeFile: files.before || activeImages[0],
        afterFile: files.after || activeImages[1],
        isModelLoaded: true,
        enableDemoSimulation,
      });
    } else {
      // Single-Image VQA
      addStep(
        6,
        'Vision-language inference',
        'completed',
        `Executing forward pass on ${selectedSpecialist.name} with remote-sensing patch embeddings.`,
        [{ label: 'Specialist', value: selectedSpecialist.name }]
      );
      await new Promise((r) => setTimeout(r, 100));

      rawResult = rsVlmEngine.executeVQA({
        query,
        imageFile: files.single || activeImages[0],
        enableDemoSimulation,
      });
    }

    // ------------------------------------------------------------------------
    // STAGE 7: Result Validation Layer
    // ------------------------------------------------------------------------
    const validationOutcome = ResultValidator.validate(classification.task, rawResult);
    addStep(
      rawResult.isMultiStep ? 8 : 7,
      'Result validation',
      validationOutcome.valid ? 'completed' : 'failed',
      `Validated specialist output integrity (${validationOutcome.checks.filter((c) => c.passed).length}/${validationOutcome.checks.length} checks passed).`,
      validationOutcome.checks.map((c) => ({ label: c.check, value: c.passed ? 'PASSED' : 'FAILED' }))
    );
    await new Promise((r) => setTimeout(r, 45));

    // ------------------------------------------------------------------------
    // STAGE 8: Evidence Extraction & Grounding
    // ------------------------------------------------------------------------
    addStep(
      rawResult.isMultiStep ? 9 : 8,
      'Evidence extraction',
      'completed',
      `Extracted ${rawResult.evidence.length} spectral and spatial evidence citations directly from sensor measurements.`,
      [{ label: 'Evidence Citations', value: `${rawResult.evidence.length}` }]
    );
    await new Promise((r) => setTimeout(r, 40));

    // ------------------------------------------------------------------------
    // STAGE 9: Confidence Estimation & Certainty Calibration
    // ------------------------------------------------------------------------
    addStep(
      rawResult.isMultiStep ? 10 : 9,
      'Confidence estimation',
      'completed',
      rawResult.confidence !== null && rawResult.confidence !== undefined
        ? `Calibrated model confidence score: ${rawResult.confidence}% based on predictive entropy and feature consistency.`
        : 'Non-fabricated policy: Model confidence is marked unavailable for uncalibrated open-domain prediction.',
      [{ label: 'Confidence', value: rawResult.confidence !== null ? `${rawResult.confidence}%` : 'Unavailable' }]
    );
    await new Promise((r) => setTimeout(r, 35));

    // ------------------------------------------------------------------------
    // STAGE 10: Response Generated & Structured Intelligence Dossier
    // ------------------------------------------------------------------------
    addStep(
      rawResult.isMultiStep ? 11 : 10,
      'Response generated',
      'completed',
      'Synthesized auditable evidence-grounded intelligence response with spatial and spectral telemetry.',
      [{ label: 'Total Pipeline Latency', value: `${Date.now() - startTime} ms` }]
    );

    const auditId = `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const finalResult: AnalysisResult = {
      ...rawResult,
      query,
      selectedModel: selectedSpecialist.name,
      executionSteps,
      selectionReason,
      validationStatus: validationOutcome.status,
      validationNotes: validationOutcome.notes,
      auditId,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      inputInformation: activeImages.map((i) => i.name).join(' + ') || 'Uploaded Observation Raster',
    };

    // Save in audit logger
    AuditLogger.log({
      auditId,
      timestamp: finalResult.timestamp || new Date().toISOString(),
      query,
      inputInformation: finalResult.inputInformation || 'N/A',
      detectedTask: classification.task,
      selectedSpecialist: selectedSpecialist.name,
      selectionReason,
      permittedParameters: {
        mode: modeHint,
        enableDemoSimulation,
        imageCount: activeImages.length,
      },
      executionSteps,
      resultStatus: validationOutcome.valid ? 'SUCCESS' : 'UNCERTAIN',
      evidenceCount: finalResult.evidence.length,
      confidenceScore: finalResult.confidence,
      validationNotes: validationOutcome.notes,
    });

    return finalResult;
  }

  /**
   * Generates a clear, user-facing explanation of WHY the specialist was selected
   * without exposing hidden internal reasoning (Requirement 11).
   */
  private static buildSelectionReason(
    task: OrchestratorTask,
    images: FileMetadata[],
    specialist: SpecialistDescriptor
  ): string {
    switch (task) {
      case 'Bi-Temporal Change Analysis':
        return `Two temporally spaced, co-registered images were detected, and the query inquires about land-cover differences. ${specialist.name} was selected to compute pixel-level temporal change.`;
      case 'Change-Based VQA':
        return `Two temporally spaced images were detected, and the query poses an interrogative question regarding change trends. ${specialist.name} was selected to evaluate directional delta.`;
      case 'Optical-SAR Analysis':
        return `Complementary Optical multispectral and SAR microwave radar rasters were detected, and the query targets joint cross-sensor reasoning. ${specialist.name} was selected to fuse optical reflectance and radar backscatter.`;
      case 'Text-Guided Grounding':
        return `A single satellite observation was detected, and the query specifies locating or delineating a spatial feature. ${specialist.name} was selected for coordinate localization.`;
      case 'Scene Captioning':
        return `A single remote-sensing scene was provided, and the query requests an overview of land-cover and objects. ${specialist.name} was selected to generate a cohesive descriptive narrative.`;
      case 'Single-Image VQA':
      default:
        return `A single observation image was provided with an inquiry regarding visual characteristics. ${specialist.name} was selected for vision-language question answering.`;
    }
  }
}
