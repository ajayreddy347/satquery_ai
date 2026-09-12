import { FileMetadata } from '../../types';
import { OrchestratorTask, SpecialistId, CompatibilityErrorCode } from './types';
import { QueryClassifier } from './queryClassifier';
import { CompatibilityChecker } from './compatibilityChecker';
import { SpecialistRegistry } from './specialistRegistry';
import { DEMO_PRESETS } from '../../data/mockData';

export interface RouterTestCase {
  id: string;
  name: string;
  description: string;
  query: string;
  mockImages: FileMetadata[];
  expectedTask: OrchestratorTask;
  expectedSpecialistId?: SpecialistId;
  expectedCompatibility: boolean;
  expectedErrorCode?: CompatibilityErrorCode;
  expectedSelectionReasonSnippet?: string;
}

export interface RouterTestResult {
  testId: string;
  name: string;
  passed: boolean;
  classifiedTask: OrchestratorTask;
  expectedTask: OrchestratorTask;
  compatibilityPassed: boolean;
  expectedCompatibility: boolean;
  detectedErrorCode?: CompatibilityErrorCode;
  selectedSpecialistId?: string;
  expectedSpecialistId?: string;
  details: string;
  latencyMs: number;
}

const mockMumbaiOptical: FileMetadata = {
  id: 'test-mumbai-opt',
  name: 'MUMBAI_HARBOR_MSI_20240315.tif',
  size: '142.8 MB',
  modality: 'Optical (RGB)',
  dimensions: '2048 × 2048 px',
  gsd: '0.5 m/px',
  acquisitionDate: '2024-03-15 05:42:18 UTC',
  crs: 'EPSG:32643 (UTM 43N)',
  sensor: 'Sentinel-2B / MSI',
  previewUrl: '',
};

const mockMangaloreOptical: FileMetadata = {
  id: 'test-mangalore-opt',
  name: 'MANGALORE_OPTICAL_20231110.tif',
  size: '184.2 MB',
  modality: 'Optical (RGB)',
  dimensions: '2048 × 2048 px',
  gsd: '0.6 m/px',
  acquisitionDate: '2023-11-10 04:30:12 UTC',
  crs: 'EPSG:32643 (UTM 43N)',
  sensor: 'CartoSat-3 MX (Optical)',
  previewUrl: '',
};

const mockMangaloreSar: FileMetadata = {
  id: 'test-mangalore-sar',
  name: 'MANGALORE_SAR_VV_VH_20231110.tif',
  size: '210.5 MB',
  modality: 'SAR (C-Band VV/VH)',
  dimensions: '2048 × 2048 px',
  gsd: '1.0 m/px',
  acquisitionDate: '2023-11-10 04:32:45 UTC',
  crs: 'EPSG:32643 (UTM 43N)',
  sensor: 'RISAT-1A / C-Band SAR',
  previewUrl: '',
};

const mockBengaluruT1: FileMetadata = {
  id: 'test-blr-t1',
  name: 'BENGALURU_NORTH_T1_20220210.tif',
  size: '156.4 MB',
  modality: 'Optical (RGB)',
  dimensions: '2048 × 2048 px',
  gsd: '0.8 m/px',
  acquisitionDate: '2022-02-10 05:15:00 UTC',
  crs: 'EPSG:32643 (UTM 43N)',
  sensor: 'Sentinel-2A MSI',
  previewUrl: '',
};

const mockBengaluruT2: FileMetadata = {
  id: 'test-blr-t2',
  name: 'BENGALURU_NORTH_T2_20240212.tif',
  size: '162.1 MB',
  modality: 'Optical (RGB)',
  dimensions: '2048 × 2048 px',
  gsd: '0.8 m/px',
  acquisitionDate: '2024-02-12 05:18:22 UTC',
  crs: 'EPSG:32643 (UTM 43N)',
  sensor: 'Sentinel-2B MSI',
  previewUrl: '',
};

export const ROUTER_TEST_CASES: RouterTestCase[] = [
  // 1. Single-image VQA
  {
    id: 'tc-01',
    name: '1. Single-Image VQA',
    description: 'Directs single observation and counting inquiry to RS-VLM Dual-Encoder.',
    query: 'How many cargo vessels are docked along the concrete wharf?',
    mockImages: [mockMumbaiOptical],
    expectedTask: 'Single-Image VQA',
    expectedSpecialistId: 'rs-vqa',
    expectedCompatibility: true,
  },
  // 2. Scene description
  {
    id: 'tc-02',
    name: '2. Scene Description (Captioning)',
    description: 'Directs comprehensive overview request to RS-Captioner specialist.',
    query: 'Describe the land-cover and major objects visible in this image.',
    mockImages: [mockMumbaiOptical],
    expectedTask: 'Scene Captioning',
    expectedSpecialistId: 'rs-captioning',
    expectedCompatibility: true,
  },
  // 3. Text-guided grounding
  {
    id: 'tc-03',
    name: '3. Text-Guided Grounding',
    description: 'Identifies spatial localization intent and routes to DETR-RS Grounding.',
    query: 'Highlight the water body referred to in the query.',
    mockImages: [mockMumbaiOptical],
    expectedTask: 'Text-Guided Grounding',
    expectedSpecialistId: 'rs-grounding',
    expectedCompatibility: true,
  },
  // 4. Bi-temporal change analysis
  {
    id: 'tc-04',
    name: '4. Bi-Temporal Change Analysis',
    description: 'Recognizes temporal pair difference inquiry and selects ChangeFormer-V2.',
    query: 'What changed between these two dates and where did the change occur?',
    mockImages: [mockBengaluruT1, mockBengaluruT2],
    expectedTask: 'Bi-Temporal Change Analysis',
    expectedSpecialistId: 'rs-change',
    expectedCompatibility: true,
  },
  // 5. Change-based VQA
  {
    id: 'tc-05',
    name: '5. Change-Based VQA',
    description: 'Differentiates trend question over time and routes to Change-VQA reasoner.',
    query: 'Has the built-up area increased, decreased, or remained unchanged?',
    mockImages: [mockBengaluruT1, mockBengaluruT2],
    expectedTask: 'Change-Based VQA',
    expectedSpecialistId: 'rs-change-vqa',
    expectedCompatibility: true,
  },
  // 6. Optical-SAR analysis
  {
    id: 'tc-06',
    name: '6. Optical-SAR Multimodal Fusion',
    description: 'Routes joint optical reflectance + SAR backscatter query to CrossSens-Fusion.',
    query: 'Use the optical and SAR images together to identify built-up and water-covered regions.',
    mockImages: [mockMangaloreOptical, mockMangaloreSar],
    expectedTask: 'Optical-SAR Analysis',
    expectedSpecialistId: 'rs-optsar',
    expectedCompatibility: true,
  },
  // 7. Missing image (Bi-temporal query with only 1 image)
  {
    id: 'tc-07',
    name: '7. Missing Image Error Handling',
    description: 'Stops execution and explains missing monitoring raster for bi-temporal task.',
    query: 'What changed between these two dates?',
    mockImages: [mockBengaluruT1],
    expectedTask: 'Bi-Temporal Change Analysis',
    expectedCompatibility: false,
    expectedErrorCode: 'MISSING_IMAGE',
  },
  // 8. Modality mismatch (Optical-SAR query with two optical images)
  {
    id: 'tc-08',
    name: '8. Modality Mismatch Error Handling',
    description: 'Rejects Optical-SAR workflow when both inputs are optical, requesting SAR.',
    query: 'Use the optical and SAR images together to penetrate clouds.',
    mockImages: [mockMumbaiOptical, mockMangaloreOptical],
    expectedTask: 'Optical-SAR Analysis',
    expectedCompatibility: false,
    expectedErrorCode: 'MODALITY_MISMATCH',
  },
  // 9. Incompatible geographic inputs (Mumbai vs Bengaluru)
  {
    id: 'tc-09',
    name: '9. Geographic Incompatibility',
    description: 'Stops execution when two rasters originate from disjoint geographic scenes.',
    query: 'What changed between these two dates?',
    mockImages: [mockMumbaiOptical, mockBengaluruT2],
    expectedTask: 'Bi-Temporal Change Analysis',
    expectedCompatibility: false,
    expectedErrorCode: 'GEOGRAPHIC_INCOMPATIBILITY',
  },
  // 10. Unsupported query (Non-remote-sensing request)
  {
    id: 'tc-10',
    name: '10. Unsupported Query Rejection',
    description: 'Rejects non-remote-sensing inquiries politely with task scope guidance.',
    query: 'Write a python script to analyze financial market trends.',
    mockImages: [mockMumbaiOptical],
    expectedTask: 'Unsupported',
    expectedCompatibility: false,
    expectedErrorCode: 'UNSUPPORTED_TASK',
  },
];

export class RouterTestSuite {
  public static getTestCases(): RouterTestCase[] {
    return ROUTER_TEST_CASES;
  }

  /**
   * Executes the automated 10-suite validation suite.
   */
  public static runTests(): RouterTestResult[] {
    return ROUTER_TEST_CASES.map((tc) => {
      const t0 = performance.now();

      // 1. Run Classification
      const classification = QueryClassifier.classify(tc.query, tc.mockImages.length);

      // 2. Run Compatibility Verification
      const compatibility = CompatibilityChecker.verifyCompatibility(
        classification.task,
        tc.mockImages
      );

      // 3. Specialist Selection if compatible
      let selectedSpecialist = undefined;
      if (compatibility.compatible) {
        selectedSpecialist = SpecialistRegistry.getSpecialistForTask(classification.task);
      }

      const latencyMs = Math.round(performance.now() - t0);

      // Verify Assertions
      const taskMatch = classification.task === tc.expectedTask;
      const compatMatch = compatibility.compatible === tc.expectedCompatibility;
      const errorCodeMatch =
        tc.expectedErrorCode === undefined || compatibility.errorCode === tc.expectedErrorCode;
      const specialistMatch =
        tc.expectedSpecialistId === undefined || selectedSpecialist?.id === tc.expectedSpecialistId;

      const passed = taskMatch && compatMatch && errorCodeMatch && specialistMatch;

      const details = passed
        ? `Verification Passed: Task '${classification.task}' matched, compatibility ${
            compatibility.compatible ? 'VALID' : `REJECTED (${compatibility.errorCode})`
          }`
        : `Assertion Failure: Task=${classification.task} (expected ${tc.expectedTask}), Compat=${compatibility.compatible} (expected ${tc.expectedCompatibility}), Code=${compatibility.errorCode} (expected ${tc.expectedErrorCode})`;

      return {
        testId: tc.id,
        name: tc.name,
        passed,
        classifiedTask: classification.task,
        expectedTask: tc.expectedTask,
        compatibilityPassed: compatibility.compatible,
        expectedCompatibility: tc.expectedCompatibility,
        detectedErrorCode: compatibility.errorCode,
        selectedSpecialistId: selectedSpecialist?.id,
        expectedSpecialistId: tc.expectedSpecialistId,
        details,
        latencyMs,
      };
    });
  }
}
