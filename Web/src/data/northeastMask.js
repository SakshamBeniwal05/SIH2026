/**
 * Northeast India Boundary & World Inverse Mask (7 Sister States)
 * Covering: Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Tripura
 *
 * GOOGLE MAPS POLYGON CONVENTION:
 * - Outer boundary MUST be oriented CLOCKWISE (CW)
 * - Inner holes (cutouts) MUST be oriented COUNTER-CLOCKWISE (CCW)
 * This creates a true "donut" mask where exterior territory is masked
 * and the 7 Sister States remain illuminated.
 */
import boundaryData from './northeastBoundary.json';

// Outer bounding ring covering the subcontinent and surrounding region (CW)
const WORLD_OUTER_GOOGLE = [
  { lat: 75, lng: 35 },
  { lat: 75, lng: 135 },
  { lat: -15, lng: 135 },
  { lat: -15, lng: 35 },
  { lat: 75, lng: 35 }
];

const WORLD_OUTER_LEAFLET = [
  [75, 35],
  [75, 135],
  [-15, 135],
  [-15, 35],
  [75, 35]
];

export const NORTHEAST_STATE_PERIMETERS = [];
const holesGoogle = [];
const holesLeaflet = [];

boundaryData.features.forEach((feature) => {
  const stateName = feature.properties.name;
  const stateCode = feature.properties.code;

  const processRing = (rawRing, subIdx = 0) => {
    const perimeterGoogle = rawRing.map(([lng, lat]) => ({ lat, lng }));
    const perimeterLeaflet = rawRing.map(([lng, lat]) => [lat, lng]);

    // Cutout hole: MUST be reversed to COUNTER-CLOCKWISE (CCW)
    const holeGoogle = [...rawRing].reverse().map(([lng, lat]) => ({ lat, lng }));
    const holeLeaflet = [...rawRing].reverse().map(([lng, lat]) => [lat, lng]);

    NORTHEAST_STATE_PERIMETERS.push({
      id: `${stateCode}-${subIdx}`,
      state: stateName,
      code: stateCode,
      googlePath: perimeterGoogle,
      leafletPositions: perimeterLeaflet
    });

    holesGoogle.push(holeGoogle);
    holesLeaflet.push(holeLeaflet);
  };

  if (feature.geometry.type === 'Polygon') {
    processRing(feature.geometry.coordinates[0], 0);
  } else if (feature.geometry.type === 'MultiPolygon') {
    feature.geometry.coordinates.forEach((poly, idx) => {
      processRing(poly[0], idx);
    });
  }
});

// Multi-path inverse masks (Outer world ring minus 7 Sister State cutout holes)
export const GOOGLE_MASK_PATHS = [
  WORLD_OUTER_GOOGLE,
  ...holesGoogle
];

export const LEAFLET_MASK_POSITIONS = [
  WORLD_OUTER_LEAFLET,
  ...holesLeaflet
];

// Primary perimeters for single-path consumers
export const NORTHEAST_PERIMETER_GOOGLE = NORTHEAST_STATE_PERIMETERS.flatMap(p => p.googlePath);
export const NORTHEAST_PERIMETER_LEAFLET = NORTHEAST_STATE_PERIMETERS.flatMap(p => p.leafletPositions);

// Backward compatibility aliases
export const UTTARAKHAND_PERIMETER_GOOGLE = NORTHEAST_PERIMETER_GOOGLE;
export const UTTARAKHAND_PERIMETER_LEAFLET = NORTHEAST_PERIMETER_LEAFLET;
