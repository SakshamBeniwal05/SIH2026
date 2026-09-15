/**
 * Uttarakhand Boundary & World Inverse Mask
 *
 * GOOGLE MAPS POLYGON CONVENTION:
 * - Outer boundary MUST be oriented CLOCKWISE (CW)
 * - Inner hole (cutout) MUST be oriented COUNTER-CLOCKWISE (CCW)
 * This creates a true "donut" mask where everything across the globe is covered
 * and ONLY Uttarakhand remains visible/unmasked.
 */
import boundaryData from './uttarakhandBoundary.json';

// Outer bounding ring surrounding the Indian subcontinent / Himalayan region (CW)
// Sized 8x larger than Uttarakhand view so all exterior territory is masked without antimeridian or polar clipping
const WORLD_OUTER_GOOGLE = [
  { lat: 75, lng: 35 },
  { lat: 75, lng: 125 },
  { lat: -15, lng: 125 },
  { lat: -15, lng: 35 },
  { lat: 75, lng: 35 }
];

const WORLD_OUTER_LEAFLET = [
  [75, 35],
  [75, 125],
  [-15, 125],
  [-15, 35],
  [75, 35]
];

// Raw coordinates from official GeoJSON [lng, lat] (natural CW winding)
const rawRing = boundaryData.geometry.coordinates[0];

// Boundary perimeter (for glowing cyan state outline)
export const UTTARAKHAND_PERIMETER_GOOGLE = rawRing.map(([lng, lat]) => ({ lat, lng }));
export const UTTARAKHAND_PERIMETER_LEAFLET = rawRing.map(([lng, lat]) => [lat, lng]);

// Cutout hole: MUST be reversed to COUNTER-CLOCKWISE (CCW) so Google Maps and Leaflet
// treat it as an interior hole to cut out rather than an exterior polygon to fill
const UTTARAKHAND_HOLE_GOOGLE = [...rawRing].reverse().map(([lng, lat]) => ({ lat, lng }));
const UTTARAKHAND_HOLE_LEAFLET = [...rawRing].reverse().map(([lng, lat]) => [lat, lng]);

// Multi-path inverse masks (Outer world ring minus inner Uttarakhand hole)
export const GOOGLE_MASK_PATHS = [
  WORLD_OUTER_GOOGLE,
  UTTARAKHAND_HOLE_GOOGLE
];

export const LEAFLET_MASK_POSITIONS = [
  WORLD_OUTER_LEAFLET,
  UTTARAKHAND_HOLE_LEAFLET
];
