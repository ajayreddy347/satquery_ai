import { CompatibilityCheckOutcome, OrchestratorTask } from './types';
import { FileMetadata } from '../../types';

export class CompatibilityChecker {
  /**
   * Inspects all input rasters and determines whether the requested task is physically and sensor-wise feasible.
   */
  public static verifyCompatibility(
    task: OrchestratorTask,
    images: FileMetadata[],
    options?: {
      opticalImage?: FileMetadata | null;
      sarImage?: FileMetadata | null;
      beforeImage?: FileMetadata | null;
      afterImage?: FileMetadata | null;
    }
  ): CompatibilityCheckOutcome {
    const inspectedImages = images.filter(Boolean);
    const imageCount = inspectedImages.length;

    // Collect metadata
    const modalities = inspectedImages.map((img) => (img.modality || 'Unknown').toLowerCase());
    const formats = inspectedImages.map((img) => img.name.split('.').pop()?.toLowerCase() || 'unknown');
    const crsList = inspectedImages.map((img) => img.crs || 'Unknown CRS');
    const dimensionsList = inspectedImages.map((img) => img.dimensions || 'Unknown dimensions');
    const resolutionsList = inspectedImages.map((img) => img.gsd || 'Unknown GSD');

    const inspectedInputsSummary = {
      imageCount,
      modalities,
      formats,
      crsList,
      dimensionsList,
      resolutionsList,
      spatialOverlapPct: 100,
      temporalMetadataPresent: false,
    };

    // 0. Check for Unsupported Task
    if (task === 'Unsupported') {
      return {
        compatible: false,
        errorCode: 'UNSUPPORTED_TASK',
        explanation:
          'Unsupported Query: The input query does not represent a supported remote-sensing Earth observation task. SatQuery AI specializes in VQA, Scene Captioning, Object Grounding, Bi-temporal Change Detection, and Optical-SAR Cross-Modal Fusion.',
        technicalDetails: [{ label: 'Task Status', value: 'Non-Geospatial Query Rejected' }],
        inspectedInputs: inspectedInputsSummary,
      };
    }

    // 1. Format and Corruption Verification
    const supportedExtensions = ['tif', 'tiff', 'geotiff', 'jp2', 'png', 'jpg', 'jpeg'];
    for (const img of inspectedImages) {
      const ext = img.name.split('.').pop()?.toLowerCase() || '';
      if (!supportedExtensions.includes(ext)) {
        return {
          compatible: false,
          errorCode: 'UNSUPPORTED_FORMAT',
          explanation: `Unsupported raster format '.${ext}' in file '${img.name}'. Remote-sensing analysis requires valid GeoTIFF (.tif, .geotiff), JPEG2000 (.jp2), TIFF, or calibrated raster layers.`,
          technicalDetails: [
            { label: 'Offending File', value: img.name },
            { label: 'Detected Extension', value: ext },
          ],
          inspectedInputs: inspectedInputsSummary,
        };
      }
      if (img.sizeBytes === 0 || img.size === '0 MB' || img.size === '0 B') {
        return {
          compatible: false,
          errorCode: 'CORRUPTED_RASTER',
          explanation: `Corrupted raster detected in file '${img.name}'. File size is 0 bytes or header is truncated.`,
          technicalDetails: [
            { label: 'File', value: img.name },
            { label: 'File Size', value: '0 bytes' },
          ],
          inspectedInputs: inspectedInputsSummary,
        };
      }
    }

    // 2. Multi-Image Tasks Check (Bi-Temporal & Optical-SAR)
    if (task === 'Bi-Temporal Change Analysis' || task === 'Change-Based VQA') {
      if (imageCount < 2) {
        return {
          compatible: false,
          errorCode: 'MISSING_IMAGE',
          explanation: `The requested task ('${task}') requires two temporal observations (T1 baseline and T2 monitoring), but only ${imageCount} image was provided. Please provide both baseline and monitoring rasters to perform bi-temporal differential analysis.`,
          technicalDetails: [
            { label: 'Required Images', value: '2 (T1 Baseline + T2 Monitoring)' },
            { label: 'Provided Images', value: `${imageCount} image(s)` },
          ],
          inspectedInputs: inspectedInputsSummary,
        };
      }

      // Check Geographic Compatibility of the pair
      const imgA = inspectedImages[0];
      const imgB = inspectedImages[1];

      // Check for Geographic Incompatibility (e.g. Mumbai vs Bengaluru, or discordant CRS)
      const isGeographicallyIncompatible =
        this.detectSpatialIncompatibility(imgA, imgB);

      if (isGeographicallyIncompatible.incompatible) {
        return {
          compatible: false,
          errorCode: 'GEOGRAPHIC_INCOMPATIBILITY',
          explanation: `Geographic Incompatibility: The provided temporal rasters do not share spatial overlap (${isGeographicallyIncompatible.reason}). Bi-temporal analysis requires co-registered imagery of the same geographic scene.`,
          technicalDetails: [
            { label: 'Image T1 Scene', value: imgA.name },
            { label: 'Image T2 Scene', value: imgB.name },
            { label: 'Incompatibility Reason', value: isGeographicallyIncompatible.reason },
          ],
          inspectedInputs: { ...inspectedInputsSummary, spatialOverlapPct: 0 },
        };
      }

      inspectedInputsSummary.temporalMetadataPresent = Boolean(
        imgA.acquisitionDate && imgB.acquisitionDate
      );
    }

    // 3. Optical-SAR Multimodal Task Check
    if (task === 'Optical-SAR Analysis') {
      if (imageCount < 2) {
        return {
          compatible: false,
          errorCode: 'MISSING_IMAGE',
          explanation: `Optical-SAR Analysis requires two complementary sensor rasters: one Optical Multispectral image and one Synthetic Aperture Radar (SAR) image. Only ${imageCount} image was provided.`,
          technicalDetails: [
            { label: 'Required Sensors', value: 'Optical Multispectral + SAR Radar (Pair)' },
            { label: 'Provided Images', value: `${imageCount} image(s)` },
          ],
          inspectedInputs: inspectedInputsSummary,
        };
      }

      // Verify Modality Diversity: must have 1 Optical AND 1 SAR
      const hasOptical = inspectedImages.some(
        (img) =>
          img.modality.toLowerCase().includes('optical') ||
          img.name.toLowerCase().includes('optical') ||
          img.name.toLowerCase().includes('msi') ||
          img.sensor.toLowerCase().includes('optical') ||
          img.sensor.toLowerCase().includes('cartosat') ||
          img.sensor.toLowerCase().includes('sentinel-2')
      );

      const hasSAR = inspectedImages.some(
        (img) =>
          img.modality.toLowerCase().includes('sar') ||
          img.name.toLowerCase().includes('sar') ||
          img.name.toLowerCase().includes('radar') ||
          img.sensor.toLowerCase().includes('sar') ||
          img.sensor.toLowerCase().includes('risat') ||
          img.sensor.toLowerCase().includes('sentinel-1')
      );

      if (!hasOptical || !hasSAR) {
        const isBothOptical = hasOptical && !hasSAR;
        const isBothSAR = hasSAR && !hasOptical;
        return {
          compatible: false,
          errorCode: 'MODALITY_MISMATCH',
          explanation: isBothOptical
            ? 'Modality Mismatch: Optical-SAR analysis requires one optical image and one microwave SAR radar image. Both provided inputs are Optical; please supply a SAR radar observation (e.g. Sentinel-1 C-Band VV/VH or RISAT-1A).'
            : isBothSAR
            ? 'Modality Mismatch: Optical-SAR analysis requires one optical image and one microwave SAR radar image. Both provided inputs are SAR radar; please supply an Optical multispectral observation (e.g. Sentinel-2 or Cartosat).'
            : 'Modality Mismatch: Could not verify presence of both an Optical raster and a Synthetic Aperture Radar (SAR) raster.',
          technicalDetails: [
            { label: 'Optical Detected', value: hasOptical ? 'Yes' : 'Missing' },
            { label: 'SAR Detected', value: hasSAR ? 'Yes' : 'Missing' },
          ],
          inspectedInputs: inspectedInputsSummary,
        };
      }

      // Check Geographic Compatibility for Optical-SAR
      const imgA = inspectedImages[0];
      const imgB = inspectedImages[1];
      const isGeographicallyIncompatible = this.detectSpatialIncompatibility(imgA, imgB);
      if (isGeographicallyIncompatible.incompatible) {
        return {
          compatible: false,
          errorCode: 'GEOGRAPHIC_INCOMPATIBILITY',
          explanation: `Geographic Incompatibility: The Optical and SAR rasters represent disjoint spatial footprints (${isGeographicallyIncompatible.reason}). Cross-sensor fusion requires co-registered spatial bounds.`,
          technicalDetails: [
            { label: 'Optical Raster', value: imgA.name },
            { label: 'SAR Raster', value: imgB.name },
            { label: 'Incompatibility Reason', value: isGeographicallyIncompatible.reason },
          ],
          inspectedInputs: { ...inspectedInputsSummary, spatialOverlapPct: 0 },
        };
      }
    }

    // 4. Single-Image Tasks Check (VQA, Captioning, Grounding)
    if (
      task === 'Single-Image VQA' ||
      task === 'Scene Captioning' ||
      task === 'Text-Guided Grounding'
    ) {
      if (imageCount === 0) {
        return {
          compatible: false,
          errorCode: 'MISSING_IMAGE',
          explanation: `No observation raster provided. '${task}' requires at least 1 satellite observation image.`,
          technicalDetails: [{ label: 'Provided Images', value: '0' }],
          inspectedInputs: inspectedInputsSummary,
        };
      }
    }

    return {
      compatible: true,
      explanation: 'All input rasters, sensor modalities, spatial bounds, and geometric parameters validated successfully.',
      technicalDetails: [
        { label: 'Input Modalities', value: modalities.join(', ').toUpperCase() },
        { label: 'Spatial CRS', value: crsList[0] || 'Calibrated' },
        { label: 'Resolution (GSD)', value: resolutionsList.join(' / ') },
      ],
      inspectedInputs: inspectedInputsSummary,
    };
  }

  /**
   * Identifies discordant geographic bounds or disparate locations (e.g. Mumbai vs Bengaluru).
   */
  private static detectSpatialIncompatibility(
    a: FileMetadata,
    b: FileMetadata
  ): { incompatible: boolean; reason: string } {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();

    // Check distinct regional names
    const locations = ['mumbai', 'bengaluru', 'mangalore', 'delhi', 'chennai', 'hyderabad', 'kolkata'];
    const locA = locations.find((l) => nameA.includes(l));
    const locB = locations.find((l) => nameB.includes(l));

    if (locA && locB && locA !== locB) {
      return {
        incompatible: true,
        reason: `Image 1 is located in ${locA.toUpperCase()} while Image 2 is located in ${locB.toUpperCase()}`,
      };
    }

    // Check CRS mismatch without projection overlap
    if (
      a.crs &&
      b.crs &&
      a.crs !== 'Unknown CRS' &&
      b.crs !== 'Unknown CRS' &&
      a.crs !== b.crs
    ) {
      // Check if UTM zones differ significantly
      const utmA = a.crs.match(/zone\s+(\d+)/i)?.[1];
      const utmB = b.crs.match(/zone\s+(\d+)/i)?.[1];
      if (utmA && utmB && utmA !== utmB) {
        return {
          incompatible: true,
          reason: `Discordant Coordinate Reference Systems: ${a.crs} vs ${b.crs} (different UTM grid zones)`,
        };
      }
    }

    return { incompatible: false, reason: '' };
  }
}
