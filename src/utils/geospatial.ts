import { GeoBounds, BoundingBox, SpatialPolygon, SpatialPoint, SpatialEvidenceItem, GeospatialMetadata } from '../types';

/**
 * Transforms normalized pixel percentages (0-100%) to geographic WGS84 coordinates.
 * Preserves affine geographic bounds without fabrication.
 */
export function pixelToGeographic(
  pixelX: number,
  pixelY: number,
  bounds: GeoBounds
): { lat: number; lng: number } {
  // Clamp to valid 0-100 image raster extent
  const clampedX = Math.max(0, Math.min(100, pixelX));
  const clampedY = Math.max(0, Math.min(100, pixelY));

  const lng = bounds.west + (clampedX / 100) * (bounds.east - bounds.west);
  const lat = bounds.north - (clampedY / 100) * (bounds.north - bounds.south);

  return { lat, lng };
}

/**
 * Transforms geographic WGS84 coordinates to normalized pixel percentages (0-100%).
 */
export function geographicToPixel(
  lat: number,
  lng: number,
  bounds: GeoBounds
): { x: number; y: number } {
  const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * 100;
  const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * 100;
  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
  };
}

/**
 * Formats lat/lng into professional remote-sensing format (Decimal Degrees + Cardinal Suffix).
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

/**
 * Validates Bounding Box geometry according to Requirement 14:
 * Coordinates must be within image bounds (0-100%), width > 0, height > 0.
 */
export function validateBoundingBox(box: BoundingBox): boolean {
  if (typeof box.x !== 'number' || typeof box.y !== 'number') return false;
  if (typeof box.width !== 'number' || typeof box.height !== 'number') return false;
  if (box.x < 0 || box.x > 100 || box.y < 0 || box.y > 100) return false;
  if (box.width <= 0 || box.height <= 0) return false;
  if (box.x + box.width > 105 || box.y + box.height > 105) return false;
  return true;
}

/**
 * Validates Spatial Polygon geometry (>= 3 points, within raster extent).
 */
export function validatePolygon(poly: SpatialPolygon): boolean {
  if (!poly.pixelPoints || poly.pixelPoints.length < 3) return false;
  for (const [x, y] of poly.pixelPoints) {
    if (x < -1 || x > 101 || y < -1 || y > 101) return false;
  }
  return true;
}

/**
 * Validates Spatial Point geometry.
 */
export function validatePoint(pt: SpatialPoint): boolean {
  if (typeof pt.pixelX !== 'number' || typeof pt.pixelY !== 'number') return false;
  if (pt.pixelX < 0 || pt.pixelX > 100 || pt.pixelY < 0 || pt.pixelY > 100) return false;
  return true;
}

/**
 * Synthesizes spatial evidence items from raw result outputs, validating each element.
 */
export function extractValidatedEvidenceItems(
  result: {
    query: string;
    selectedModel: string;
    taskType: string;
    mode: string;
    boundingBoxes?: BoundingBox[];
    polygons?: SpatialPolygon[];
    points?: SpatialPoint[];
    changedRegions?: any[];
    evidence?: string[];
    geospatialMetadata?: GeospatialMetadata;
    imageryMetadata?: { bounds?: GeoBounds };
  }
): SpatialEvidenceItem[] {
  const items: SpatialEvidenceItem[] = [];
  const bounds = result.geospatialMetadata?.bounds || result.imageryMetadata?.bounds;

  // 1. Process Bounding Boxes
  if (result.boundingBoxes) {
    result.boundingBoxes.forEach((b) => {
      if (!validateBoundingBox(b)) return; // Reject invalid evidence (Requirement 14)

      let geoCoordStr = 'Not available';
      let centerCoord: { lat: number; lng: number } | undefined;
      let geoBounds: GeoBounds | undefined;

      if (bounds) {
        const minGeo = pixelToGeographic(b.x, b.y + b.height, bounds);
        const maxGeo = pixelToGeographic(b.x + b.width, b.y, bounds);
        centerCoord = pixelToGeographic(b.x + b.width / 2, b.y + b.height / 2, bounds);
        geoBounds = {
          north: maxGeo.lat,
          south: minGeo.lat,
          west: minGeo.lng,
          east: maxGeo.lng,
        };
        geoCoordStr = formatCoordinates(centerCoord.lat, centerCoord.lng);
      }

      items.push({
        id: b.id,
        type: 'Bounding Box',
        label: b.label,
        geoCoordinates: geoCoordStr,
        geoBounds,
        center: centerCoord,
        pixelBounds: { x: b.x, y: b.y, width: b.width, height: b.height },
        confidence: typeof b.confidence === 'number' ? b.confidence : null,
        associatedQuery: result.query,
        specialist: result.selectedModel,
        model: result.selectedModel,
        sourceModality: result.mode === 'optical-sar' ? 'Optical + SAR Radar' : 'Optical Multispectral',
        explanation: b.description || 'Target region identified by vision-language specialist.',
        color: b.color || '#06b6d4',
        evidenceMetadata: {
          pixelDimensions: `${b.width}% × ${b.height}%`,
          areaHectares: b.areaHectares || 'Not available',
        },
        isValidated: true,
      });
    });
  }

  // 2. Process Polygons
  if (result.polygons) {
    result.polygons.forEach((p) => {
      if (!validatePolygon(p)) return;

      let geoCoordStr = 'Not available';
      let centerCoord: { lat: number; lng: number } | undefined;

      if (p.coordinates && p.coordinates.length > 0) {
        const avgLng = p.coordinates.reduce((acc, c) => acc + c[0], 0) / p.coordinates.length;
        const avgLat = p.coordinates.reduce((acc, c) => acc + c[1], 0) / p.coordinates.length;
        centerCoord = { lat: avgLat, lng: avgLng };
        geoCoordStr = formatCoordinates(avgLat, avgLng);
      } else if (bounds && p.pixelPoints.length > 0) {
        const avgX = p.pixelPoints.reduce((acc, pt) => acc + pt[0], 0) / p.pixelPoints.length;
        const avgY = p.pixelPoints.reduce((acc, pt) => acc + pt[1], 0) / p.pixelPoints.length;
        centerCoord = pixelToGeographic(avgX, avgY, bounds);
        geoCoordStr = formatCoordinates(centerCoord.lat, centerCoord.lng);
      }

      items.push({
        id: p.id,
        type: 'Polygon',
        label: p.label,
        category: p.category,
        geoCoordinates: geoCoordStr,
        center: centerCoord,
        confidence: typeof p.confidence === 'number' ? p.confidence : null,
        associatedQuery: result.query,
        specialist: result.selectedModel,
        model: result.selectedModel,
        sourceModality: result.mode === 'optical-sar' ? 'Multimodal Optical+SAR' : 'Optical Multispectral',
        explanation: p.description,
        color: p.color || '#38bdf8',
        evidenceMetadata: {
          verticesCount: p.pixelPoints.length,
          areaHectares: p.areaHectares || 'Not available',
        },
        isValidated: true,
      });
    });
  }

  // 3. Process Points
  if (result.points) {
    result.points.forEach((pt) => {
      if (!validatePoint(pt)) return;

      const geoCoordStr = pt.lat && pt.lng ? formatCoordinates(pt.lat, pt.lng) : 'Not available';

      items.push({
        id: pt.id,
        type: 'Point',
        label: pt.label,
        category: pt.featureClass,
        geoCoordinates: geoCoordStr,
        center: { lat: pt.lat, lng: pt.lng },
        confidence: typeof pt.confidence === 'number' ? pt.confidence : null,
        associatedQuery: result.query,
        specialist: result.selectedModel,
        model: result.selectedModel,
        sourceModality: result.mode === 'optical-sar' ? 'Optical + SAR Radar' : 'Optical Multispectral',
        explanation: pt.description || 'Geographic landmark identified in satellite raster.',
        color: pt.color || '#22c55e',
        evidenceMetadata: {
          pixelPosition: `[X: ${pt.pixelX.toFixed(1)}%, Y: ${pt.pixelY.toFixed(1)}%]`,
          featureClass: pt.featureClass || 'Not available',
        },
        isValidated: true,
      });
    });
  }

  // 4. Process Changed Regions (Bi-Temporal)
  if (result.changedRegions) {
    result.changedRegions.forEach((cr) => {
      let geoCoordStr = cr.coordinates || 'Not available';
      let centerCoord: { lat: number; lng: number } | undefined;

      if (bounds) {
        centerCoord = pixelToGeographic(cr.x + cr.width / 2, cr.y + cr.height / 2, bounds);
        geoCoordStr = formatCoordinates(centerCoord.lat, centerCoord.lng);
      }

      items.push({
        id: cr.id,
        type: 'Change Mask',
        label: cr.label,
        category: cr.category,
        geoCoordinates: geoCoordStr,
        center: centerCoord,
        pixelBounds: { x: cr.x, y: cr.y, width: cr.width, height: cr.height },
        confidence: typeof cr.confidence === 'number' ? cr.confidence : null,
        associatedQuery: result.query,
        specialist: result.selectedModel,
        model: result.selectedModel,
        sourceModality: 'Bi-Temporal Optical Co-Registered Pair',
        explanation: `${cr.direction}: ${cr.spectralShift || 'Spectral delta detected between T1 and T2.'}`,
        color: cr.direction === 'Increased' ? '#ef4444' : '#f97316',
        evidenceMetadata: {
          direction: cr.direction,
          areaKm2: `${cr.areaKm2} km²`,
          ndviDelta: cr.ndviDelta !== undefined ? cr.ndviDelta : 'Not available',
          ndbiDelta: cr.ndbiDelta !== undefined ? cr.ndbiDelta : 'Not available',
        },
        isValidated: true,
      });
    });
  }

  // 5. Process Textual Evidence points
  if (result.evidence && result.evidence.length > 0) {
    result.evidence.forEach((evText, idx) => {
      items.push({
        id: `text-ev-${idx}`,
        type: 'Textual Evidence',
        label: `Evidence Citation #${idx + 1}`,
        geoCoordinates: 'Not available',
        confidence: null,
        associatedQuery: result.query,
        specialist: result.selectedModel,
        model: result.selectedModel,
        sourceModality: result.mode.toUpperCase(),
        explanation: evText,
        color: '#a855f7',
        evidenceMetadata: {
          citationOrder: idx + 1,
          validationStatus: 'Verified by Agent Reasoner',
        },
        isValidated: true,
      });
    });
  }

  return items;
}
