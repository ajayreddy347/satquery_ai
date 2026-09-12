import { OrchestrationValidationResult, OrchestratorTask, ValidationCheckItem } from './types';
import { AnalysisResult } from '../../types';

export class ResultValidator {
  /**
   * Validates specialist output against required constraints.
   */
  public static validate(
    task: OrchestratorTask,
    result: AnalysisResult | null | undefined
  ): OrchestrationValidationResult {
    const checks: ValidationCheckItem[] = [];
    const notes: string[] = [];

    // 1. Check if output exists
    if (!result || !result.answer || result.answer.trim().length === 0) {
      checks.push({
        check: 'Output Existence',
        passed: false,
        message: 'Specialist returned null, empty, or missing answer payload.',
      });
      return {
        valid: false,
        status: 'FAILED',
        checks,
        notes: ['Execution failed: no specialist response was produced.'],
        confidenceAssessment: 'UNAVAILABLE',
      };
    }
    checks.push({
      check: 'Output Existence',
      passed: true,
      message: `Answer generated (${result.answer.length} characters).`,
    });

    // 2. Output corresponds to requested task
    let taskCorrespondencePassed = true;
    if (task === 'Scene Captioning') {
      // Must be descriptive narrative
      if (result.answer.length < 50) {
        taskCorrespondencePassed = false;
        notes.push('Scene caption output is too brief for descriptive remote sensing analysis.');
      }
    } else if (task === 'Text-Guided Grounding') {
      // Must contain spatial bounds or validly report "Spatial grounding unavailable"
      if (result.groundingStatus === 'unavailable' || result.spatialEvidenceAvailable === false) {
        taskCorrespondencePassed = true;
        checks.push({
          check: 'Non-Fabrication Policy',
          passed: true,
          message: 'Spatial grounding unavailable: Model correctly adhered to non-fabrication policy.',
        });
      } else if (!result.boundingBoxes || result.boundingBoxes.length === 0) {
        taskCorrespondencePassed = false;
        notes.push('Grounding output did not delineate target spatial bounding coordinates.');
      }
    } else if (task === 'Bi-Temporal Change Analysis') {
      // Must contain change metrics or changed regions
      if (!result.changeMetric && (!result.changedRegions || result.changedRegions.length === 0)) {
        taskCorrespondencePassed = false;
        notes.push('Bi-temporal change output lacks quantitative delta metrics or segmented regions.');
      }
    } else if (task === 'Optical-SAR Analysis') {
      // Must contain cross-modal evidence or multimodal regions
      if (!result.crossModalEvidence && (!result.multimodalRegions || result.multimodalRegions.length === 0)) {
        taskCorrespondencePassed = false;
        notes.push('Optical-SAR output lacks cross-modal evidence segregation or fused multimodal regions.');
      }
    }

    checks.push({
      check: 'Task Correspondence',
      passed: taskCorrespondencePassed,
      message: taskCorrespondencePassed
        ? `Output correctly corresponds to ${task} specifications.`
        : `Output failed semantic task correspondence checks for ${task}.`,
    });

    // 3. Evidence is available where expected
    const evidenceCount = result.evidence ? result.evidence.length : 0;
    const hasSufficientEvidence = evidenceCount >= 2;
    checks.push({
      check: 'Evidence Completeness',
      passed: hasSufficientEvidence,
      message: `${evidenceCount} grounded evidence citation(s) extracted.`,
    });
    if (!hasSufficientEvidence) {
      notes.push(`Evidence count (${evidenceCount}) is lower than expected baseline (minimum 2).`);
    }

    // 4. Confidence validity check
    let confidenceAssessment: 'CALIBRATED' | 'UNAVAILABLE' | 'INVALID' = 'CALIBRATED';
    if (result.confidence === null || result.confidence === undefined) {
      confidenceAssessment = 'UNAVAILABLE';
      checks.push({
        check: 'Confidence Calibration',
        passed: true,
        message: 'Non-fabricated policy: Model confidence is marked unavailable (uncalibrated).',
      });
    } else if (typeof result.confidence === 'number' && (result.confidence < 0 || result.confidence > 100)) {
      confidenceAssessment = 'INVALID';
      checks.push({
        check: 'Confidence Calibration',
        passed: false,
        message: `Confidence score (${result.confidence}) is out of physical range [0, 100].`,
      });
      notes.push('Confidence score violated valid probability boundaries.');
    } else {
      checks.push({
        check: 'Confidence Calibration',
        passed: true,
        message: `Calibrated confidence: ${result.confidence}%.`,
      });
    }

    // 5. Spatial coordinates validity
    let spatialCoordsValid = true;
    if (result.boundingBoxes && result.boundingBoxes.length > 0) {
      for (const box of result.boundingBoxes) {
        if (
          box.x < 0 ||
          box.x > 100 ||
          box.y < 0 ||
          box.y > 100 ||
          box.width <= 0 ||
          box.height <= 0 ||
          box.x + box.width > 100.5 ||
          box.y + box.height > 100.5
        ) {
          spatialCoordsValid = false;
          notes.push(`Bounding box '${box.label}' has invalid coordinate bounds (x: ${box.x}, y: ${box.y}, w: ${box.width}, h: ${box.height}).`);
          break;
        }
      }
    }
    checks.push({
      check: 'Spatial Coordinates Validity',
      passed: spatialCoordsValid,
      message: spatialCoordsValid
        ? 'All spatial target coordinates reside within valid normalized raster bounds.'
        : 'Invalid bounding box geometry detected.',
    });

    const allPassed = checks.every((c) => c.passed);
    const hasWarnings = notes.length > 0;

    return {
      valid: allPassed,
      status: allPassed ? (hasWarnings ? 'WARNING' : 'PASSED') : 'UNCERTAIN',
      checks,
      notes,
      confidenceAssessment,
    };
  }
}
