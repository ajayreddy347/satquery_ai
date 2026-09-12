/**
 * SatQuery AI - Modality-Aware Remote Sensing Preprocessor
 * Distinguishes Optical/Multispectral from Synthetic Aperture Radar (SAR).
 * Never treats microwave SAR as an ordinary RGB photograph.
 */

export interface OpticalPreprocessingProfile {
  modality: 'Optical' | 'Multispectral';
  calibration: string;
  bandsUsed: string[];
  radiometricCorrection: string;
  indicesSupported: string[];
  description: string;
}

export interface SARPreprocessingProfile {
  modality: 'SAR';
  polarizations: string[];
  calibration: string;
  dynamicRangeDb: string;
  speckleFilter: string;
  compositeTensor: string;
  physicalInterpretation: {
    water: string;
    urban: string;
    vegetation: string;
  };
}

export type ModalityProfile = OpticalPreprocessingProfile | SARPreprocessingProfile;

export function detectModality(
  filename: string,
  metadata?: { modality?: string; sensor?: string }
): 'Optical' | 'SAR' | 'Multispectral' {
  const fn = filename.toLowerCase();
  const metaModality = (metadata?.modality || '').toLowerCase();
  const metaSensor = (metadata?.sensor || '').toLowerCase();

  if (
    metaModality.includes('sar') ||
    metaSensor.includes('sar') ||
    metaSensor.includes('sentinel-1') ||
    metaSensor.includes('risat') ||
    metaModality.includes('c-band') ||
    fn.includes('sar') ||
    fn.includes('s1') ||
    fn.includes('vv_vh')
  ) {
    return 'SAR';
  }

  if (
    metaModality.includes('multispectral') ||
    metaModality.includes('12-band') ||
    metaSensor.includes('sentinel-2') ||
    fn.includes('msi') ||
    fn.includes('s2')
  ) {
    return 'Multispectral';
  }

  return 'Optical';
}

export function getModalityPreprocessing(
  filename: string,
  metadata?: { modality?: string; sensor?: string; gsd?: string; crs?: string }
): ModalityProfile {
  const detected = detectModality(filename, metadata);

  if (detected === 'SAR') {
    return {
      modality: 'SAR',
      polarizations: ['VV (Co-polarization)', 'VH (Cross-polarization)'],
      calibration: 'Radiometric Sigma-Nought (σ° dB) Backscatter Cross-Section',
      dynamicRangeDb: '[-30.0 dB, 0.0 dB] mapped to [0.0, 1.0]',
      speckleFilter: 'Refined Lee Adaptive Spatial Filter (5×5 window)',
      compositeTensor: '3-Channel Polarimetric Representation [VV, VH, |VV - VH|]',
      physicalInterpretation: {
        water: 'Smooth surface specular reflection → extremely low backscatter (σ° < -22 dB)',
        urban: 'Corner reflector double-bounce → high radar backscatter (σ° > -6 dB)',
        vegetation: 'Canopy volume scattering → moderate VV with elevated cross-polarization VH',
      },
    };
  }

  return {
    modality: detected === 'Multispectral' ? 'Multispectral' : 'Optical',
    calibration: 'Bottom-of-Atmosphere (BOA) Surface Reflectance (Level-2A)',
    bandsUsed: ['B2 (Blue 490nm)', 'B3 (Green 560nm)', 'B4 (Red 665nm)', 'B8 (NIR 842nm)'],
    radiometricCorrection: 'Reflectance scaling factor 1/10000 to standard [0.0, 1.0] interval',
    indicesSupported: [
      'NDWI (Normalized Difference Water Index: (Green - NIR)/(Green + NIR))',
      'NDVI (Normalized Difference Vegetation Index: (NIR - Red)/(NIR + Red))',
      'NDBI (Normalized Difference Built-up Index: (SWIR - NIR)/(SWIR + NIR))',
    ],
    description: 'Calibrated multispectral radiance with atmospheric absorption correction applied.',
  };
}
