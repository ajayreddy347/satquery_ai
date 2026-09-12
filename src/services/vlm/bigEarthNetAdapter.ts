/**
 * SatQuery AI - BigEarthNet Dataset Adaptation Pipeline
 * Manages fine-tuning configurations, Corine Land Cover (CLC) label mappings,
 * VQA pair conversion, and checkpoint management for BigEarthNet-S2 and BigEarthNet-S1.
 */
import { BigEarthNetPipelineSpec } from '../../types';

export const BIGEARTHNET_19_CLASSES = [
  'Continuous urban fabric',
  'Discontinuous urban fabric',
  'Industrial or commercial units',
  'Arable land',
  'Permanent crops',
  'Pastures',
  'Complex cultivation patterns',
  'Land principally occupied by agriculture',
  'Broad-leaved forest',
  'Coniferous forest',
  'Mixed forest',
  'Natural grasslands and sclerophyllous vegetation',
  'Transitional woodland-shrub',
  'Beaches, dunes, sands',
  'Inland wetlands',
  'Coastal wetlands',
  'Inland waters',
  'Marine waters',
  'Bare rock and sparsely vegetated areas',
];

export interface BigEarthNetVQAPair {
  question: string;
  answer: string;
  questionType: 'land_cover' | 'built_up' | 'water_body' | 'agriculture';
  targetConcept: string;
}

export interface CheckpointMetadata {
  id: string;
  name: string;
  createdAt: string;
  dataset: string;
  modality: string;
  epoch: number;
  evalLoss?: number;
  macroF1?: number;
  status: 'Ready' | 'Training Required' | 'Error';
}

class BigEarthNetAdapterService {
  private config: BigEarthNetPipelineSpec = {
    datasetRoot: '/data/bigearthnet',
    splitDir: '/data/bigearthnet/splits',
    checkpointDir: '/data/checkpoints/vqa_bigearthnet',
    modality: 'S2',
    batchSize: 32,
    imageSize: 256,
    learningRate: 0.0001,
    weightDecay: 0.01,
    loraRank: 16,
    clcClassesCount: BIGEARTHNET_19_CLASSES.length,
    isMounted: false,
  };

  private checkpoints: CheckpointMetadata[] = [
    {
      id: 'chk-ben-s2-base',
      name: 'RS-VLM-BigEarthNet-S2-Adapter',
      createdAt: '2026-09-01 10:00 UTC',
      dataset: 'BigEarthNet-S2 (Sentinel-2 L2A)',
      modality: 'Multispectral (12-Band)',
      epoch: 5,
      status: 'Training Required',
    },
  ];

  public getConfig(): BigEarthNetPipelineSpec {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<BigEarthNetPipelineSpec>): BigEarthNetPipelineSpec {
    this.config = { ...this.config, ...updates };
    return this.getConfig();
  }

  public getCheckpoints(): CheckpointMetadata[] {
    return [...this.checkpoints];
  }

  /**
   * Generates benchmark VQA pairs from Corine Land Cover annotations.
   */
  public generateVQAPairs(patchId: string, labels: string[]): BigEarthNetVQAPair[] {
    const pairs: BigEarthNetVQAPair[] = [];

    // 1. Dominant Land Cover
    if (labels.length > 0) {
      pairs.push({
        question: 'What type of land cover dominates this image?',
        answer: `The remote-sensing scene contains ${labels.slice(0, 3).join(', ')}.`,
        questionType: 'land_cover',
        targetConcept: labels[0],
      });
    }

    // 2. Built-Up Verification
    const urban = labels.filter((l) => l.toLowerCase().includes('urban') || l.toLowerCase().includes('industrial'));
    if (urban.length > 0) {
      pairs.push({
        question: 'Are there visible built-up regions in this image?',
        answer: `Yes, built-up infrastructure is present, identified as ${urban[0]}.`,
        questionType: 'built_up',
        targetConcept: urban[0],
      });
    } else {
      pairs.push({
        question: 'Are there visible built-up regions in this image?',
        answer: 'No visible built-up or urban infrastructure is present in this remote-sensing observation.',
        questionType: 'built_up',
        targetConcept: 'None',
      });
    }

    // 3. Water Body Question
    const water = labels.filter((l) => l.toLowerCase().includes('water') || l.toLowerCase().includes('wetland'));
    if (water.length > 0) {
      pairs.push({
        question: 'Is there a water body visible?',
        answer: `Yes, surface water or aquatic wetland features are detected (${water.join(', ')}).`,
        questionType: 'water_body',
        targetConcept: water[0],
      });
    } else {
      pairs.push({
        question: 'Is there a water body visible?',
        answer: 'No surface water body is detected within this scene footprint.',
        questionType: 'water_body',
        targetConcept: 'None',
      });
    }

    return pairs;
  }
}

export const bigEarthNetAdapter = new BigEarthNetAdapterService();
