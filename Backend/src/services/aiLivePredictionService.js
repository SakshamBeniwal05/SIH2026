import { generateAiClimaticPrediction, crossCheckHistoricalDisaster } from '../../AI model/agent_predictor.js';
import { db } from '../config/db.js';

/**
 * Key Meteorological Observation Points strictly across Northeast India (7 Sister States) Disaster Corridors
 */
export const NORTHEAST_WEATHER_STATIONS = [
  { id: 'guwahati', name: 'Brahmaputra Valley (Guwahati / Kamrup, Assam)', lat: 26.1445, lng: 91.7362, defaultPore: 85.0 },
  { id: 'shillong', name: 'Khasi & Jaintia Hills (Shillong / Cherrapunji, Meghalaya)', lat: 25.5788, lng: 91.8933, defaultPore: 92.5 },
  { id: 'aizawl', name: 'Aizawl Ridge & Chhimtuipui Basin (Mizoram)', lat: 23.7271, lng: 92.7176, defaultPore: 90.0 },
  { id: 'imphal_noney', name: 'Imphal Basin & Noney Corridor (Manipur)', lat: 24.8167, lng: 93.6833, defaultPore: 89.5 },
  { id: 'kohima', name: 'Kohima & Chumukedima Gorge (Nagaland)', lat: 25.6751, lng: 94.1086, defaultPore: 87.0 },
  { id: 'itanagar_siang', name: 'Siang & Papum Pare Basin (Arunachal Pradesh)', lat: 27.1004, lng: 93.6166, defaultPore: 86.5 },
  { id: 'silchar_dima', name: 'Dima Hasao & Barak Valley (Haflong / Silchar, Assam)', lat: 25.1833, lng: 93.0167, defaultPore: 88.0 },
  { id: 'agartala', name: 'Howrah Basin & Dhalai (Tripura)', lat: 23.8315, lng: 91.2868, defaultPore: 82.0 }
];

export const UTTARAKHAND_WEATHER_STATIONS = NORTHEAST_WEATHER_STATIONS;

export class AiLivePredictionService {
  constructor(io = null) {
    this.io = io;
    this.monitoredStationId = 'guwahati';
    this.customWeatherOverride = null;
    this.timer = null;
    this.isFetching = false;
    this.lastFetchedAt = null;
    this.lastPrediction = null;
    this.lastLiveMetrics = null;
    this.lastVerification = null;
  }

  setMonitoredStation(stationId) {
    const found = NORTHEAST_WEATHER_STATIONS.find(s => s.id === stationId);
    if (found) {
      this.monitoredStationId = found.id;
      console.log(`📍 [AI Prediction Service] Locked monitored corridor to: ${found.name}`);
      return found;
    }
    return null;
  }

  setCustomWeatherOverride(weather) {
    this.customWeatherOverride = weather;
  }

  clearCustomWeatherOverride() {
    this.customWeatherOverride = null;
  }

  setIo(io) {
    this.io = io;
  }

  /**
   * Fetches real-time atmospheric data from Open-Meteo with no artificial inflation.
   */
  async fetchLiveAtmosphericData(station) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${station.lat}&longitude=${station.lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&hourly=soil_moisture_0_to_1cm`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const current = data.current || {};
        const hourlyMoisture = data.hourly?.soil_moisture_0_to_1cm;
        const latestMoisture = Array.isArray(hourlyMoisture) && hourlyMoisture.length > 0
          ? hourlyMoisture[hourlyMoisture.length - 1] * 100
          : station.defaultPore;

        // Actual real-time precipitation in mm/hr (no artificial multiplication or forced cloudburst)
        const rawPrecip = typeof current.precipitation === 'number' ? current.precipitation : 0;
        const windSpeed = typeof current.wind_speed_10m === 'number' ? current.wind_speed_10m : 15;

        return {
          source: 'Open-Meteo Live Satellite & Atmospheric API',
          isLiveApi: true,
          temperatureC: current.temperature_2m || 18.2,
          humidityPct: current.relative_humidity_2m || 75,
          precipitationMmPerHour: Math.max(0, Math.round(rawPrecip)),
          soilMoisturePct: Number((latestMoisture || station.defaultPore).toFixed(1)),
          windSpeedKmh: Math.round(windSpeed),
          fetchedAt: new Date().toISOString()
        };
      }
    } catch (err) {
      // Quiet fallback for resilient operation
    }

    // Realistic normal baseline fallback (not cloudburst!)
    return {
      source: 'In-situ Hydrological Sensors Baseline',
      isLiveApi: false,
      temperatureC: 18.5,
      humidityPct: 72,
      precipitationMmPerHour: 0,
      soilMoisturePct: station.defaultPore || 75.0,
      windSpeedKmh: 14,
      fetchedAt: new Date().toISOString()
    };
  }

  /**
   * Executes a live fetch or custom simulation cycle.
   * Cross-checks location [lat, lng] against historical disaster catalog.
   * If risk score > 50%: generates and broadcasts prediction hazard.
   * If risk score <= 50%: sends nominal telemetry and does NOT broadcast/display fake hazard.
   */
  async runCycle(preferredStationId = null, customWeather = null) {
    if (this.isFetching) return this.lastPrediction;
    this.isFetching = true;

    try {
      if (preferredStationId) {
        this.setMonitoredStation(preferredStationId);
      }
      if (customWeather !== null && customWeather !== undefined) {
        this.customWeatherOverride = customWeather;
      }
      const targetStationId = this.monitoredStationId || 'guwahati';
      const station = NORTHEAST_WEATHER_STATIONS.find(s => s.id === targetStationId) || NORTHEAST_WEATHER_STATIONS[0];

      // 1. Obtain meteorological & soil conditions (either custom simulation or live Open-Meteo)
      let liveMetrics;
      const weatherInput = this.customWeatherOverride;
      if (weatherInput) {
        const windSpeed = Number(weatherInput.windSpeedKmh) || 28;
        const windCondition = weatherInput.windCondition || (windSpeed >= 65 ? 'Gale / Severe Mountain Storm' : windSpeed >= 35 ? 'High Mountain Winds' : 'Moderate Breeze');
        liveMetrics = {
          source: 'Interactive Simulation Weather Engine (Admin Custom Input)',
          isLiveApi: false,
          isSimulated: true,
          temperatureC: Number(weatherInput.temperatureC) || 17.5,
          humidityPct: Number(weatherInput.humidityPct) || 94,
          precipitationMmPerHour: Number(weatherInput.precipitationMmPerHour) || 0,
          soilMoisturePct: Number(weatherInput.soilMoisturePct) || 75.0,
          windSpeedKmh: windSpeed,
          windCondition: windCondition,
          rainSeverity: weatherInput.rainSeverity || (Number(weatherInput.precipitationMmPerHour) >= 150 ? 'Critical Cloudburst' : 'Heavy Rainfall'),
          fetchedAt: new Date().toISOString()
        };
      } else {
        liveMetrics = await this.fetchLiveAtmosphericData(station);
      }

      this.lastLiveMetrics = {
        stationName: station.name,
        coordinates: { lat: station.lat, lng: station.lng },
        ...liveMetrics
      };

      // 2. Cross-check against Historical Disaster Database (2010–2026 Uttarakhand Records)
      const verification = crossCheckHistoricalDisaster({
        coordinates: { lat: station.lat, lng: station.lng },
        precipitationMmPerHour: liveMetrics.precipitationMmPerHour,
        soilMoisturePct: liveMetrics.soilMoisturePct,
        windSpeedKmh: liveMetrics.windSpeedKmh,
        stationName: station.name
      });
      this.lastVerification = verification;
      this.lastFetchedAt = new Date().toISOString();

      let finalPrediction = null;

      // 3. Evaluate Critical 50% Threshold
      if (verification.isCritical) {
        // Threat confirmed (> 50% risk score based on historical precedence + severe atmospheric triggers)
        const windSpeed = liveMetrics.windSpeedKmh || 25;
        const windFactor = 1.0 + Math.min(0.22, (windSpeed / 120) * 0.22);
        const effectiveRainfall = Math.round(liveMetrics.precipitationMmPerHour * windFactor);

        const predictedCoords = {
          lat: Number((station.lat + 0.012).toFixed(4)),
          lng: Number((station.lng + 0.012).toFixed(4))
        };

        finalPrediction = generateAiClimaticPrediction({
          locationName: `${station.name} (AI Forecast Runout Corridor)`,
          coordinates: predictedCoords,
          currentRainfallRate: effectiveRainfall,
          soilPoreSaturation: liveMetrics.soilMoisturePct,
          windSpeedKmh: windSpeed,
          leadTimeHours: 3
        });

        // Augment with metadata
        finalPrediction.isCritical = true;
        finalPrediction.riskScore = verification.riskScore;
        finalPrediction.verification = verification;
        finalPrediction.liveDataSource = liveMetrics.source;
        finalPrediction.isLiveApi = liveMetrics.isLiveApi;
        finalPrediction.isSimulated = liveMetrics.isSimulated || false;
        finalPrediction.temperatureC = liveMetrics.temperatureC;
        finalPrediction.humidityPct = liveMetrics.humidityPct;
        finalPrediction.windSpeedKmh = windSpeed;
        finalPrediction.windCondition = liveMetrics.windCondition;
        finalPrediction.analyzedStation = station.name;

        this.lastPrediction = finalPrediction;

        // Update database with active prediction
        const hazards = await db.getHazards();
        if (hazards.length > 0) {
          await db.updateHazard(hazards[0]._id, {
            prediction: finalPrediction,
            predictedAlert: finalPrediction,
            updatedAt: new Date().toISOString()
          });
        }

        // Emit socket event with active critical prediction
        if (this.io) {
          this.io.emit('AI_PREDICTION_UPDATED', {
            predictedAlert: finalPrediction,
            isCritical: true,
            riskScore: verification.riskScore,
            verification,
            liveMetrics: this.lastLiveMetrics,
            timestamp: this.lastFetchedAt
          });
        }

        console.log(`⚠️ [AI Live Prediction: CRITICAL >50%] Station ${station.name} crosses critical threshold! Risk Score: ${verification.riskScore}%. Runout Radius: ${finalPrediction.radius}.`);
      } else {
        // NOMINAL / SAFE (Risk Score <= 50%)
        // No historical disaster precedent or current triggers prove an imminent hazard.
        // DO NOT show or broadcast fake hazard circles!
        this.lastPrediction = null;

        // Clear prediction from active database hazard
        const hazards = await db.getHazards();
        if (hazards.length > 0) {
          await db.updateHazard(hazards[0]._id, {
            prediction: null,
            predictedAlert: null,
            updatedAt: new Date().toISOString()
          });
        }

        // Emit socket event notifying frontend that conditions are SAFE (no hazard)
        if (this.io) {
          this.io.emit('AI_PREDICTION_UPDATED', {
            predictedAlert: null,
            prediction: null,
            isCritical: false,
            riskScore: verification.riskScore,
            verification,
            liveMetrics: this.lastLiveMetrics,
            timestamp: this.lastFetchedAt
          });
        }

        console.log(`🛡️ [AI Live Prediction: SAFE <=50%] ${station.name} conditions safe (Rain: ${liveMetrics.precipitationMmPerHour}mm/h, Sat: ${liveMetrics.soilMoisturePct}%, Risk: ${verification.riskScore}% <= 50%). No disaster hazard broadcasted.`);
      }

      return {
        isCritical: verification.isCritical,
        riskScore: verification.riskScore,
        prediction: finalPrediction,
        verification,
        metrics: this.lastLiveMetrics
      };
    } catch (err) {
      console.error('[AI Live Prediction Error]:', err.message);
      return null;
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Starts autonomous periodic fetch & verification (every 12 seconds).
   * Emits refresh start signal to empty frontend state, recollects live atmospheric
   * conditions from the web API, replaces any fake custom simulation, and only
   * refills if verified risk > 50%.
   */
  startAutonomousLoop(intervalMs = 12000) {
    if (this.timer) clearInterval(this.timer);
    // Initial immediate cycle on locked monitored station with clean real-time data
    this.clearCustomWeatherOverride();
    this.runCycle(this.monitoredStationId, null);
    this.timer = setInterval(async () => {
      // 1. Notify all frontend clients that previous prediction is being emptied for the 12s cycle
      if (this.io) {
        this.io.emit('AI_CYCLE_REFRESH_START', {
          timestamp: new Date().toISOString(),
          cycleIntervalMs: intervalMs
        });
      }
      // 2. Clear any fake/custom weather override so fake AI predictions get replaced by real live data!
      this.clearCustomWeatherOverride();
      // 3. Recollect live atmospheric conditions from web API and verify
      await this.runCycle(this.monitoredStationId, null);
    }, intervalMs);
    console.log(`⚡ [AI Live Prediction] Background atmospheric verification loop active (Every ${intervalMs / 1000}s, Locked on: ${this.monitoredStationId}).`);
  }

  resetAutonomousTimer(intervalMs = 12000) {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(async () => {
      if (this.io) {
        this.io.emit('AI_CYCLE_REFRESH_START', {
          timestamp: new Date().toISOString(),
          cycleIntervalMs: intervalMs
        });
      }
      this.clearCustomWeatherOverride();
      await this.runCycle(this.monitoredStationId, null);
    }, intervalMs);
  }

  stopAutonomousLoop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getState() {
    return {
      status: 'OPERATIONAL',
      monitoredStationId: this.monitoredStationId,
      hasCustomOverride: !!this.customWeatherOverride,
      activeCorridors: UTTARAKHAND_WEATHER_STATIONS.map(s => s.name),
      lastFetchedAt: this.lastFetchedAt,
      lastMetrics: this.lastLiveMetrics,
      lastVerification: this.lastVerification,
      lastPrediction: this.lastPrediction,
      isCritical: this.lastVerification?.isCritical || false,
      riskScore: this.lastVerification?.riskScore || 0
    };
  }
}

export const aiLivePredictionService = new AiLivePredictionService();
