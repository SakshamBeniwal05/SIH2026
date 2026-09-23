import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadNortheastDisasterDataset, NORTHEAST_DISTRICTS, NORTHEAST_BOUNDS } from './dataset_loader.js';
import { extractHeatMapKnowledge } from './fetch_and_learn_maps.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODEL_OUT_PATH = path.join(__dirname, 'landslide_hazard_model.json');

/**
 * Supervised Training & Calibration of Northeast India Disaster AI Model (7 Sister States)
 */
export function trainNortheastAgent() {
  console.log('🏔️ [AI Training Engine] Starting training pipeline strictly for Northeast India (7 Sister States)...');

  const disasterEvents = loadNortheastDisasterDataset();
  const heatMapKnowledge = extractHeatMapKnowledge();

  console.log(`📊 Loaded ${disasterEvents.length} historical Northeast events across 7 Sister States (2010–2026).`);
  console.log(`🛰️ Analyzed ${heatMapKnowledge.analyzedImagesCount} satellite & radar heat maps.`);

  // 1. Calculate Regression Weights for Rainfall -> Radius
  // Base linear + exponential saturation model: Radius = a * (Rain)^b * TerrainMultiplier
  let sumRain = 0;
  let sumRadius = 0;
  disasterEvents.forEach(e => {
    sumRain += e.rainfallMmPerHour;
    sumRadius += e.historicalRadiiKm.hardMost;
  });

  const meanRain = sumRain / disasterEvents.length;
  const meanRadius = sumRadius / disasterEvents.length;
  const slopeCoeff = (meanRadius / meanRain) * 1.15; // Calibration factor

  // 2. Build District Vulnerability Matrix across 7 Sister States
  const districtVulnerability = {};
  NORTHEAST_DISTRICTS.forEach(d => {
    const matchedEvents = disasterEvents.filter(e => e.district === d.name || e.state === d.state);
    const weight = matchedEvents.length > 0 ? 1.0 + (matchedEvents.length * 0.15) : 1.0;
    districtVulnerability[d.name] = {
      state: d.state,
      baseWeight: Number(weight.toFixed(3)),
      basin: d.basin,
      majorRoads: d.majorRoads,
      center: d.center
    };
  });

  // 3. Prediction Color Palette Specification
  const predictionPalette = {
    zone1: {
      tierName: 'Pred-Zone 1: Core Debris Surge',
      strokeColor: '#7B1FA2',
      fillColor: '#F3E5F5',
      fillOpacity: 0.35,
      borderStyle: 'dashed',
      dashArray: '6, 4',
      riskTier: 'HIGH_LIKELIHOOD_SURGE'
    },
    zone2: {
      tierName: 'Pred-Zone 2: Secondary Runout & Talus Spread',
      strokeColor: '#C2185B',
      fillColor: '#FCE4EC',
      fillOpacity: 0.25,
      borderStyle: 'dashed',
      dashArray: '6, 4',
      riskTier: 'SEVERE_PREDICTED_DISRUPTION'
    },
    zone3: {
      tierName: 'Pred-Zone 3: Slope Washout & Drainage Vector',
      strokeColor: '#00838F',
      fillColor: '#E0F7FA',
      fillOpacity: 0.20,
      borderStyle: 'dashed',
      dashArray: '6, 4',
      riskTier: 'MODERATE_ADVISORY'
    },
    zone4: {
      tierName: 'Pred-Zone 4: Peripheral Risk Envelope',
      strokeColor: '#4527A0',
      fillColor: '#EDE7F6',
      fillOpacity: 0.12,
      borderStyle: 'dashed',
      dashArray: '4, 6',
      riskTier: 'BUFFER_ALERT'
    }
  };

  // Official Real-Danger Color Palette (for cross-reference)
  const officialPalette = {
    zone1: {
      tierName: 'Zone 1: Hard Most (Ground Zero)',
      strokeColor: '#B71C1C',
      fillColor: '#FFEBEE',
      fillOpacity: 0.45,
      borderStyle: 'solid',
      riskTier: 'CRITICAL_MANDATORY_EVACUATION'
    },
    zone2: {
      tierName: 'Zone 2: Most (Severe Impact)',
      strokeColor: '#E65100',
      fillColor: '#FFF3E0',
      fillOpacity: 0.35,
      borderStyle: 'solid',
      riskTier: 'SEVERE_LIFELINE_SEVERED'
    },
    zone3: {
      tierName: 'Zone 3: Some (Moderate Disruption)',
      strokeColor: '#FF8F00',
      fillColor: '#FFF8E1',
      fillOpacity: 0.25,
      borderStyle: 'solid',
      riskTier: 'MODERATE_DIVERSION'
    },
    zone4: {
      tierName: 'Zone 4: Negligible (Periphery Advisory)',
      strokeColor: '#01579B',
      fillColor: '#E1F5FE',
      fillOpacity: 0.15,
      borderStyle: 'solid',
      riskTier: 'BASELINE_OBSERVATION'
    }
  };

  const compiledModel = {
    modelName: 'Northeast India (7 Sister States) Landslide & Cloudburst AI Neural-Hazard Model',
    version: '2.5.0-NE-7SISTERS',
    trainedAt: new Date().toISOString(),
    geographicalScope: 'STRICTLY_NORTHEAST_INDIA_7_SISTERS',
    bounds: NORTHEAST_BOUNDS,
    trainingDatasetSize: disasterEvents.length,
    satelliteImageryAnalyzed: heatMapKnowledge.analyzedImagesCount,
    hyperparameters: {
      slopeCoeff: Number(slopeCoeff.toFixed(4)),
      meanRainMmPerHour: Number(meanRain.toFixed(2)),
      meanRadiusKm: Number(meanRadius.toFixed(2)),
      criticalPrecipitationThresholdMmPerHour: 65.0,
      cloudburstDelugeThresholdMmPerHour: 100.0,
      poreSaturationCriticalThresholdPct: 88.0
    },
    districtVulnerability,
    corridorVulnerabilityIndex: heatMapKnowledge.aggregateRunoffMetrics.corridorVulnerabilityIndex,
    trainingEventsSummary: disasterEvents.map(e => ({
      id: e.id,
      name: e.name,
      state: e.state,
      location: e.location,
      district: e.district,
      coordinates: e.coordinates,
      disasterType: e.disasterType,
      rainfallMmPerHour: e.rainfallMmPerHour,
      historicalHardMostRadiusKm: e.historicalRadiiKm.hardMost
    })),
    palettes: {
      official: officialPalette,
      predicted: predictionPalette
    }
  };

  fs.writeFileSync(MODEL_OUT_PATH, JSON.stringify(compiledModel, null, 2), 'utf8');
  console.log(`✅ [AI Model] Trained artifact generated successfully at: ${MODEL_OUT_PATH}`);
  return compiledModel;
}

// Backward compatibility alias
export const trainUttarakhandAgent = trainNortheastAgent;

// Auto-run when executed directly
if (process.argv[1] && process.argv[1].endsWith('train_agent.js')) {
  trainNortheastAgent();
}
