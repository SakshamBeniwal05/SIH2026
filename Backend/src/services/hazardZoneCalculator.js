/**
 * Calibrated Hazard Zone Calculator
 * Translates precipitation intensity (mm/hr) and terrain sensitivity into
 * a 4-tier concentric ontology according to SIH 2026 specifications.
 */
export function calculateHazardTiers(rainfallMmPerHour, multiplier = 1.0) {
  // Base radii in meters depending on rainfall accumulation
  const rain = Math.max(10, Number(rainfallMmPerHour) || 50);

  // Scaled radii:
  // Light (10-30 mm/h) -> Zone 1 ~ 800m - 1.5km
  // Heavy (65 mm/h) -> Zone 1 ~ 2.5km
  // Cloudburst (>100 mm/h) -> Zone 1 ~ 4.5km - 8km
  const z1Meters = Math.round((rain * 28 + 600) * multiplier);
  const z2Meters = Math.round(z1Meters * 1.95);
  const z3Meters = Math.round(z1Meters * 3.45);
  const z4Meters = Math.round(z1Meters * 5.8);

  return [
    {
      tierName: 'Hard Most',
      radiusMeters: z1Meters,
      radiusKm: Number((z1Meters / 1000).toFixed(2)),
      strokeColor: '#B71C1C',
      fillColor: '#FFEBEE',
      fillOpacity: 0.45,
      evacuationMandated: true,
      description: 'Ground Zero — Critical structural failure & active debris flow. Mandates immediate evacuation.'
    },
    {
      tierName: 'Most',
      radiusMeters: z2Meters,
      radiusKm: Number((z2Meters / 1000).toFixed(2)),
      strokeColor: '#E65100',
      fillColor: '#FFF3E0',
      fillOpacity: 0.35,
      evacuationMandated: true,
      description: 'Severe Impact — Lifeline road severed, high velocity talus movement. Direct detour.'
    },
    {
      tierName: 'Some',
      radiusMeters: z3Meters,
      radiusKm: Number((z3Meters / 1000).toFixed(2)),
      strokeColor: '#FF8F00',
      fillColor: '#FFF8E1',
      fillOpacity: 0.25,
      evacuationMandated: false,
      description: 'Moderate Disruption — Slope creep, agricultural washouts, advisory diversion.'
    },
    {
      tierName: 'Negligible',
      radiusMeters: z4Meters,
      radiusKm: Number((z4Meters / 1000).toFixed(2)),
      strokeColor: '#01579B',
      fillColor: '#E1F5FE',
      fillOpacity: 0.15,
      evacuationMandated: false,
      description: 'Periphery / Advisory — General caution, radar observation sector.'
    }
  ];
}
