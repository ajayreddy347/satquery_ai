import { TaskClassification, OrchestratorTask } from './types';
import { TaskType } from '../../types';

export class QueryClassifier {
  /**
   * Classifies user natural-language queries into canonical Remote-Sensing tasks.
   */
  public static classify(query: string, imageCountHint: number = 1): TaskClassification {
    const q = query.trim().toLowerCase();

    // 0. Check for unsupported / non-remote-sensing inquiries
    const nonRemoteSensingTerms = [
      'recipe',
      'weather tomorrow',
      'python script',
      'javascript code',
      'write a poem',
      'who won',
      'stock price',
      'tell me a joke',
      'translate to french',
      'play music',
    ];
    if (nonRemoteSensingTerms.some((t) => q.includes(t)) && !q.includes('satellite') && !q.includes('image')) {
      return {
        task: 'Unsupported',
        canonicalTaskType: 'vqa',
        confidenceScore: 99.0,
        reasoning: 'The query does not pertain to remote sensing Earth observation, satellite imagery, or geospatial analysis.',
        targetEntities: [],
        temporalIntent: false,
        crossModalIntent: false,
        groundingIntent: false,
        captioningIntent: false,
        isMultiStepCandidate: false,
      };
    }

    // 1. Check for Optical-SAR Multimodal Fusion
    const opticalSarPatterns = [
      'optical and sar',
      'sar and optical',
      'optical & sar',
      'radar and optical',
      'optical and radar',
      'use the optical and sar',
      'jointly analyze optical',
      'backscatter and reflectance',
      'microwave and optical',
      'cross-modal',
      'optical-sar',
      'optical+sar',
      'together to identify',
      'both optical and sar',
    ];
    if (opticalSarPatterns.some((p) => q.includes(p))) {
      return {
        task: 'Optical-SAR Analysis',
        canonicalTaskType: 'optical-sar-analysis',
        confidenceScore: 98.2,
        reasoning: 'Detected explicit cross-modal joint reasoning directives targeting both Optical reflectance and SAR radar backscatter.',
        targetEntities: this.extractEntities(q),
        temporalIntent: false,
        crossModalIntent: true,
        groundingIntent: q.includes('locate') || q.includes('highlight'),
        captioningIntent: false,
        isMultiStepCandidate: false,
      };
    }

    // 2. Check for Temporal / Change Intent
    const temporalKeywords = [
      'change',
      'changed',
      'between these two',
      'two dates',
      't1',
      't2',
      'over time',
      'temporal',
      'difference',
      'transition',
      'earlier and later',
      'expansion',
      'loss',
      'newly built',
      'newly developed',
      'demolished',
    ];
    const isTemporal = temporalKeywords.some((k) => q.includes(k));

    if (isTemporal || imageCountHint === 2) {
      // Differentiate between Change-Based VQA vs Bi-Temporal Change Analysis
      const isQuestionPattern =
        q.startsWith('has') ||
        q.startsWith('have') ||
        q.startsWith('did') ||
        q.startsWith('is') ||
        q.startsWith('are') ||
        q.startsWith('can') ||
        q.includes('increased or decreased') ||
        q.includes('increased, decreased') ||
        q.includes('increased?') ||
        q.includes('decreased?') ||
        q.includes('remained unchanged');

      // Multi-step detection: e.g. "Identify newly built-up areas and describe what changed."
      const isMultiStep =
        (q.includes('identify') || q.includes('locate')) &&
        (q.includes('and describe') || q.includes('and explain') || q.includes('what changed'));

      if (isQuestionPattern) {
        return {
          task: 'Change-Based VQA',
          canonicalTaskType: 'change-based-vqa',
          confidenceScore: 96.5,
          reasoning: 'Interrogative closed-domain question inquiring about categorical temporal trend/delta between observation dates.',
          targetEntities: this.extractEntities(q),
          temporalIntent: true,
          crossModalIntent: false,
          groundingIntent: false,
          captioningIntent: false,
          isMultiStepCandidate: isMultiStep,
        };
      }

      if (isTemporal) {
        return {
          task: 'Bi-Temporal Change Analysis',
          canonicalTaskType: 'change-analysis',
          confidenceScore: 97.4,
          reasoning: 'Query requests spatial and quantitative differential analysis of land-cover transition between two dates.',
          targetEntities: this.extractEntities(q),
          temporalIntent: true,
          crossModalIntent: false,
          groundingIntent: q.includes('where'),
          captioningIntent: q.includes('describe'),
          isMultiStepCandidate: isMultiStep,
        };
      }
    }

    // 3. Check for Text-Guided Grounding & Scene Captioning Keywords
    const groundingKeywords = [
      'highlight',
      'locate',
      'bound',
      'draw a box',
      'bounding box',
      'pinpoint',
      'find the',
      'segment the',
      'where is',
      'where are',
      'show where',
      'show the location of',
      'highlight the water',
      'highlight the agricultural',
      'locate the largest',
    ];

    const captioningKeywords = [
      'describe',
      'caption',
      'overview',
      'summary of this image',
      'what is visible in this scene',
      'describe the land-cover',
      'describe the scene',
      'describe the overall scene',
      'what are the major features visible',
      'what type of environment is represented',
      'scene description',
      'generate a caption',
      'report on the scene',
      'major objects visible',
    ];

    const isGrounding = groundingKeywords.some((k) => q.includes(k));
    const isCaptioning = captioningKeywords.some((k) => q.includes(k));

    // Multi-Step Single-Image Workflow Candidate:
    // e.g. "Describe the scene and highlight the major water body."
    if (isGrounding && isCaptioning) {
      return {
        task: 'Scene Captioning',
        canonicalTaskType: 'captioning',
        confidenceScore: 97.5,
        reasoning: 'Multi-step workflow: Combines Remote-Sensing Scene Captioning and Text-Guided Spatial Grounding.',
        targetEntities: this.extractEntities(q),
        temporalIntent: false,
        crossModalIntent: false,
        groundingIntent: true,
        captioningIntent: true,
        isMultiStepCandidate: true,
      };
    }

    if (isGrounding) {
      return {
        task: 'Text-Guided Grounding',
        canonicalTaskType: 'grounding',
        confidenceScore: 96.0,
        reasoning: 'Query requests spatial localization and bounding box delineation of specific textual entities or features.',
        targetEntities: this.extractEntities(q),
        temporalIntent: false,
        crossModalIntent: false,
        groundingIntent: true,
        captioningIntent: false,
        isMultiStepCandidate: false,
      };
    }

    if (isCaptioning) {
      return {
        task: 'Scene Captioning',
        canonicalTaskType: 'captioning',
        confidenceScore: 95.8,
        reasoning: 'Query seeks a comprehensive, cohesive natural-language narrative describing land-cover taxonomy and visible assets.',
        targetEntities: this.extractEntities(q),
        temporalIntent: false,
        crossModalIntent: false,
        groundingIntent: false,
        captioningIntent: true,
        isMultiStepCandidate: false,
      };
    }

    // 5. Default to Single-Image VQA
    return {
      task: 'Single-Image VQA',
      canonicalTaskType: 'vqa',
      confidenceScore: 94.2,
      reasoning: 'Inquiry targeting visual features, counting, classification, or spatial attributes within a single observation image.',
      targetEntities: this.extractEntities(q),
      temporalIntent: false,
      crossModalIntent: false,
      groundingIntent: false,
      captioningIntent: false,
      isMultiStepCandidate: false,
    };
  }

  private static extractEntities(query: string): string[] {
    const candidates = [
      'water body',
      'water',
      'river',
      'lake',
      'harbor',
      'ocean',
      'reservoir',
      'built-up area',
      'buildings',
      'urban',
      'infrastructure',
      'cargo ships',
      'vessels',
      'ships',
      'boats',
      'storage tanks',
      'silos',
      'oil tanks',
      'runway',
      'airport',
      'aircraft',
      'vegetation',
      'forest',
      'cropland',
      'agricultural fields',
      'roads',
      'highway',
      'bridge',
    ];
    return candidates.filter((c) => query.includes(c));
  }
}
