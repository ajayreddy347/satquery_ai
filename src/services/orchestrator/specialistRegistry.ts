import { SpecialistDescriptor, SpecialistId, OrchestratorTask } from './types';
import { ModelInfo } from '../../types';

export const SPECIALIST_REGISTRY: SpecialistDescriptor[] = [
  {
    id: 'rs-vqa',
    name: 'Remote-Sensing VQA (RS-VLM)',
    version: '2.4.0',
    category: 'Visual Question Answering',
    architecture: 'Dual-Encoder Hierarchical Transformer (Swin-L + RoBERTa-RS)',
    checkpoint: 'checkpoints/rs_vlm_swin_roberta_v2.4.pth',
    evidenceCapability: 'Confidence scoring, spatial centroids, visual feature saliency, terrain attributes',
    status: 'Integrated',
    availability: 'Active In-Memory (Integrated)',
    supportedTasks: ['Single-Image VQA'],
    supportedModalities: ['Optical RGB', 'Multispectral', 'Panchromatic', 'SAR'],
    inputRequirements: '1 satellite observation raster (GeoTIFF/PNG/TIFF) + natural-language question',
    description:
      'Specialized vision-language model trained for remote-sensing single-image question answering, land-cover understanding, object recognition, and terrain evaluation.',
    minImages: 1,
    maxImages: 1,
    requiresCoRegistration: false,
    requiresCrossModal: false,
    parameters: '480 Million',
    benchmarkStatus: 'RSVQA-HR / RSVQA-LR: Benchmark Interface Ready',
  },
  {
    id: 'rs-captioning',
    name: 'Scene Captioning Specialist',
    version: '2.4.1',
    category: 'Vision-Language Generation',
    architecture: 'Encoder-Decoder Spatial Cross-Attention Transformer (RS-Captioner-v2.4)',
    checkpoint: 'checkpoints/rs_captioner_transformer_v2.4.pth',
    evidenceCapability: 'Land-cover taxonomy breakdown, Corine class fractions, spectral index verification, feature topology',
    status: 'Integrated',
    availability: 'Active In-Memory (Integrated)',
    supportedTasks: ['Scene Captioning'],
    supportedModalities: ['Optical RGB', 'Multispectral (12-Band)'],
    inputRequirements: '1 High-resolution optical or multispectral raster image',
    description:
      'Synthesizes rich, grammatically coherent remote-sensing intelligence descriptions detailing spatial distribution, density, infrastructure layout, and natural land-cover taxonomy.',
    minImages: 1,
    maxImages: 1,
    requiresCoRegistration: false,
    requiresCrossModal: false,
    parameters: '350 Million',
    benchmarkStatus: 'NWPU-RESISC45 / VRSBench: Benchmark Ready',
  },
  {
    id: 'rs-grounding',
    name: 'Text-Guided Grounding Specialist',
    version: '1.8.0',
    category: 'Spatial Localization',
    architecture: 'Query-Conditioned Mask-RCNN + Deformable DETR-RS',
    checkpoint: 'checkpoints/rs_grounding_detr_v1.8.pth',
    evidenceCapability: 'Pixel-level bounding boxes, multi-vertex polygons, centroid coordinates, WGS84 geographic boundaries',
    status: 'Integrated',
    availability: 'Active In-Memory (Integrated)',
    supportedTasks: ['Text-Guided Grounding'],
    supportedModalities: ['Optical RGB', 'Panchromatic', 'SAR Intensity'],
    inputRequirements: '1 satellite raster image + natural language target query (e.g., "Highlight the water body")',
    description:
      'Locates and bounds specific geospatial features or structures mentioned in natural-language queries with pixel-precise coordinates and bounding polygons.',
    minImages: 1,
    maxImages: 1,
    requiresCoRegistration: false,
    requiresCrossModal: false,
    parameters: '520 Million',
    benchmarkStatus: 'DIOR-RSVG / VRSBench: Verified Testbed Ready',
  },
  {
    id: 'rs-change',
    name: 'Bi-Temporal Change Specialist',
    version: '2.1.0',
    category: 'Bi-Temporal Difference Modeling',
    architecture: 'Siamese Vision Transformer (ChangeFormer-V2) with Temporal Difference Head',
    checkpoint: 'checkpoints/changeformer_v2_temporal.pth',
    evidenceCapability: 'Pixel-level binary change masks, transition clustering, area differential metrics in hectares',
    status: 'Available',
    availability: 'Bi-Temporal Engine Available',
    supportedTasks: ['Bi-Temporal Change Analysis'],
    supportedModalities: ['Optical RGB Pair', 'Multispectral Pair', 'SAR Intensity Pair'],
    inputRequirements: '2 co-registered temporal images (T1 baseline earlier date, T2 monitoring later date)',
    description:
      'Performs pixel-level bi-temporal change detection, differentiating natural seasonal variance from anthropogenic construction, deforestation, urbanization, and disaster damage.',
    minImages: 2,
    maxImages: 2,
    requiresCoRegistration: true,
    requiresCrossModal: false,
    parameters: '410 Million',
    benchmarkStatus: 'LEVIR-CD / CDVQA: Checkpoint Available',
  },
  {
    id: 'rs-change-vqa',
    name: 'Change-Based VQA Specialist',
    version: '2.0.0',
    category: 'Bi-Temporal Question Answering',
    architecture: 'Dual-Branch Temporal Difference Cross-Attention Reasoner',
    checkpoint: 'checkpoints/change_vqa_dual_branch.pth',
    evidenceCapability: 'Categorical change trend verification, directional delta classification, spatial bounding',
    status: 'Available',
    availability: 'Bi-Temporal Engine Available',
    supportedTasks: ['Change-Based VQA'],
    supportedModalities: ['Optical RGB Pair', 'Multispectral Pair', 'SAR Intensity Pair'],
    inputRequirements: '2 co-registered temporal images (T1 & T2) + interrogative question regarding change',
    description:
      'Answers specific categorical questions and trends regarding temporal differences between two observation dates (e.g., "Has the built-up area increased, decreased, or remained unchanged?").',
    minImages: 2,
    maxImages: 2,
    requiresCoRegistration: true,
    requiresCrossModal: false,
    parameters: '460 Million',
    benchmarkStatus: 'CDVQA (Change Detection VQA): Testbed Ready',
  },
  {
    id: 'rs-optsar',
    name: 'Optical-SAR Specialist',
    version: '2.3.0',
    category: 'Cross-Modal Fusion',
    architecture: 'Dual-Stream Cross-Attention (ResNet-101 + U-Net SAR Backscatter Encoder)',
    checkpoint: 'checkpoints/cross_sens_fusion_v2.3.pth',
    evidenceCapability: 'Decibel backscatter profiles (σ° VV/VH), dielectric constant mapping, cross-modal agreement confidence',
    status: 'Available',
    availability: 'Cross-Modal Engine Available',
    supportedTasks: ['Optical-SAR Analysis'],
    supportedModalities: ['Optical Multispectral (RGB + NIR + SWIR)', 'SAR Dual-Pol (Sentinel-1 C-Band VV/VH)'],
    inputRequirements: '1 Optical multispectral raster + 1 SAR microwave radar raster (co-registered spatial footprint)',
    description:
      'Specialized neural architecture designed for genuine joint multimodal reasoning across Optical reflectance and SAR radar backscatter. Integrates microwave physics with multispectral unmixing.',
    minImages: 2,
    maxImages: 2,
    requiresCoRegistration: true,
    requiresCrossModal: true,
    parameters: '620 Million',
    benchmarkStatus: 'Multimodal Setting: Verified',
  },
];

export class SpecialistRegistry {
  public static getAllSpecialists(): SpecialistDescriptor[] {
    return SPECIALIST_REGISTRY;
  }

  public static getSpecialist(id: SpecialistId): SpecialistDescriptor | undefined {
    return SPECIALIST_REGISTRY.find((s) => s.id === id);
  }

  public static getSpecialistForTask(task: OrchestratorTask): SpecialistDescriptor | undefined {
    return SPECIALIST_REGISTRY.find((s) => s.supportedTasks.includes(task));
  }

  public static toModelInfoList(): ModelInfo[] {
    return SPECIALIST_REGISTRY.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      architecture: s.architecture,
      modalities: s.supportedModalities,
      gsdRange: s.id === 'rs-optsar' ? '0.5 m - 20.0 m' : s.id === 'rs-grounding' ? '0.25 m - 5.0 m' : '0.3 m - 15.0 m',
      parameters: s.parameters,
      inputResolution: s.minImages === 2 ? '2048 × 2048 px (Dual Pair)' : '2048 × 2048 px',
      description: s.description,
      status: s.status,
      supportedTasks: s.supportedTasks.map(String),
      benchmarkStatus: s.benchmarkStatus,
      version: s.version,
      availability: s.availability,
      inputRequirements: s.inputRequirements,
      checkpoint: s.checkpoint,
      evidenceCapability: s.evidenceCapability,
    }));
  }
}
