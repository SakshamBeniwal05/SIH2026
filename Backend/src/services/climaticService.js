import { NORTHEAST_DISTRICTS } from '../../../AI model/dataset_loader.js';
import { generateAiClimaticPrediction, generateOfficialGovtAlert } from '../../../AI model/agent_predictor.js';

/**
 * Real-Time Climatic & Weather Intelligence Engine strictly for Northeast India (7 Sister States)
 */
export class NortheastClimaticService {
  constructor() {
    // Current district climatic baselines across 7 Sister States
    this.districtWeather = NORTHEAST_DISTRICTS.map(d => ({
      district: d.name,
      state: d.state,
      center: d.center,
      basin: d.basin,
      majorRoads: d.majorRoads,
      rainfallRateMmPerHour:
        d.name === 'East Khasi Hills' || d.name === 'Sohra' ? 210 :
        d.name === 'Aizawl' ? 165 :
        d.name === 'Noney' ? 175 :
        d.name === 'Dima Hasao' ? 155 :
        d.name === 'Kamrup Metropolitan' ? 110 :
        d.name === 'Kohima' ? 125 :
        d.name === 'Upper Siang' ? 140 : 55,
      poreSaturationPct:
        d.name === 'East Khasi Hills' || d.name === 'Sohra' ? 96.5 :
        d.name === 'Aizawl' ? 94.2 :
        d.name === 'Noney' ? 93.8 :
        d.name === 'Dima Hasao' ? 91.0 :
        d.name === 'Kamrup Metropolitan' ? 86.5 :
        d.name === 'Kohima' ? 88.0 : 76.0,
      temperatureC: 22.4,
      humidityPct: 94,
      synopticStatus: 'ACTIVE_MONSOON_TROUGH_OVER_NORTHEAST_AND_BAY_OF_BENGAL'
    }));
  }

  /**
   * Retrieves all district weather conditions strictly within Northeast India (7 Sister States)
   */
  getNortheastClimaticState() {
    return {
      scope: 'STRICTLY_NORTHEAST_INDIA_7_SISTERS',
      timestamp: new Date().toISOString(),
      districts: this.districtWeather
    };
  }

  // Backward compatibility alias
  getUttarakhandClimaticState() {
    return this.getNortheastClimaticState();
  }

  /**
   * Evaluates current climatic conditions and produces AI predictions
   * Output schema: { alertType: 'predicted', location, radius, issued, ... }
   */
  generateLiveClimaticPredictions() {
    const predictions = [];

    this.districtWeather.forEach(dw => {
      // If rainfall >= 65 mm/h or pore saturation >= 85%, generate critical prediction
      if (dw.rainfallRateMmPerHour >= 65 || dw.poreSaturationPct >= 85) {
        const pred = generateAiClimaticPrediction({
          locationName: `${dw.basin} (${dw.district}, ${dw.state})`,
          coordinates: dw.center,
          currentRainfallRate: dw.rainfallRateMmPerHour,
          soilPoreSaturation: dw.poreSaturationPct,
          leadTimeHours: 3
        });
        predictions.push(pred);
      }
    });

    return predictions;
  }

  /**
   * Updates climatic conditions dynamically (e.g. from telemetry or rain slider)
   */
  updateDistrictWeather(districtName, updates) {
    const target = this.districtWeather.find(d => d.district.toLowerCase() === districtName.toLowerCase());
    if (target) {
      Object.assign(target, updates);
      return target;
    }
    return null;
  }
}

// Backward compatibility alias
export const UttarakhandClimaticService = NortheastClimaticService;

export const climaticService = new NortheastClimaticService();
