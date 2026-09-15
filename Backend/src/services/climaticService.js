import { UTTARAKHAND_DISTRICTS } from '../../../AI model/dataset_loader.js';
import { generateAiClimaticPrediction, generateOfficialGovtAlert } from '../../../AI model/agent_predictor.js';

/**
 * Real-Time Climatic & Weather Intelligence Engine strictly for Uttarakhand, India
 */
export class UttarakhandClimaticService {
  constructor() {
    // Current district climatic baselines across Uttarakhand
    this.districtWeather = UTTARAKHAND_DISTRICTS.map(d => ({
      district: d.name,
      center: d.center,
      basin: d.basin,
      majorRoads: d.majorRoads,
      rainfallRateMmPerHour: d.name === 'Chamoli' ? 165 : d.name === 'Rudraprayag' ? 140 : d.name === 'Uttarkashi' ? 115 : 45,
      poreSaturationPct: d.name === 'Chamoli' ? 94.2 : d.name === 'Rudraprayag' ? 89.6 : 72.0,
      temperatureC: 18.5,
      humidityPct: 92,
      synopticStatus: 'ACTIVE_MONSOON_TROUGH_OVER_GARHWAL'
    }));
  }

  /**
   * Retrieves all district weather conditions strictly within Uttarakhand
   */
  getUttarakhandClimaticState() {
    return {
      scope: 'STRICTLY_UTTARAKHAND_INDIA',
      timestamp: new Date().toISOString(),
      districts: this.districtWeather
    };
  }

  /**
   * Evaluates current climatic conditions and produces AI predictions
   * Output schema strictly matches user demo format:
   * { alertType: 'predicted', location, radius, issued, ... }
   */
  generateLiveClimaticPredictions() {
    const predictions = [];

    this.districtWeather.forEach(dw => {
      // If rainfall >= 65 mm/h or pore saturation >= 85%, generate critical prediction
      if (dw.rainfallRateMmPerHour >= 65 || dw.poreSaturationPct >= 85) {
        const pred = generateAiClimaticPrediction({
          locationName: `${dw.basin} (${dw.district} Corridor)`,
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
  updateDistrictWeather(districtName, rainfallRate, poreSaturation) {
    const found = this.districtWeather.find(d => d.district.toLowerCase() === districtName.toLowerCase());
    if (found) {
      if (rainfallRate !== undefined) found.rainfallRateMmPerHour = Number(rainfallRate);
      if (poreSaturation !== undefined) found.poreSaturationPct = Number(poreSaturation);
    }
  }
}

export const climaticService = new UttarakhandClimaticService();
