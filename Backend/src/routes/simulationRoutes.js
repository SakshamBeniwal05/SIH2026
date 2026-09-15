import express from 'express';
import { db } from '../config/db.js';
import { calculateHazardTiers } from '../services/hazardZoneCalculator.js';
import { generateOfficialGovtAlert, generateAiClimaticPrediction, crossCheckHistoricalDisaster } from '../../../AI model/agent_predictor.js';
import { climaticService } from '../services/climaticService.js';
import { aiLivePredictionService, UTTARAKHAND_WEATHER_STATIONS } from '../services/aiLivePredictionService.js';

let officialAlertTimeoutTimer = null;
let simulationAlertTimeoutTimer = null;

export function createSimulationRouter(io) {
  const router = express.Router();

  // Evaluate AI Model capabilities dynamically against historical disaster records
  router.post('/evaluate-ai', async (req, res) => {
    try {
      const { stationId = 'chamoli', customWeather = null } = req.body || {};
      const st = UTTARAKHAND_WEATHER_STATIONS.find(s => s.id === stationId) || UTTARAKHAND_WEATHER_STATIONS[0];
      const liveState = aiLivePredictionService.getState();
      const rain = customWeather ? Number(customWeather.precipitationMmPerHour) || 0 : (liveState.lastMetrics?.precipitationMmPerHour || 0);
      const soil = customWeather ? Number(customWeather.soilMoisturePct) || 75 : (liveState.lastMetrics?.soilMoisturePct || 75);
      const wind = customWeather ? Number(customWeather.windSpeedKmh) || 15 : (liveState.lastMetrics?.windSpeedKmh || 15);

      const verification = crossCheckHistoricalDisaster({
        coordinates: { lat: st.lat, lng: st.lng },
        precipitationMmPerHour: rain,
        soilMoisturePct: soil,
        windSpeedKmh: wind,
        stationName: st.name
      });

      return res.json({
        success: true,
        station: st,
        verification,
        evaluatedConditions: {
          precipitationMmPerHour: rain,
          soilMoisturePct: soil,
          windSpeedKmh: wind
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Get available basins
  router.get('/basins', async (req, res) => {
    const basins = await db.getBasins();
    res.json(basins);
  });

  // Set active monitored corridor for AI loop (locks location without city hopping)
  router.post('/set-monitored-station', async (req, res) => {
    try {
      const { stationId } = req.body || {};
      const station = aiLivePredictionService.setMonitoredStation(stationId);
      if (station) {
        const result = await aiLivePredictionService.runCycle(station.id);
        return res.json({
          success: true,
          station,
          result,
          state: aiLivePredictionService.getState()
        });
      }
      return res.status(404).json({ success: false, message: 'Station not found' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Get real-time climatic conditions strictly across Uttarakhand
  router.get('/climatic', async (req, res) => {
    const climaticState = climaticService.getUttarakhandClimaticState();
    const livePredictions = climaticService.generateLiveClimaticPredictions();
    res.json({
      ...climaticState,
      livePredictions
    });
  });

  // GET /api/simulation/live-prediction - Live AI Data Fetch & Predictive Analysis State (Only Prediction Data)
  router.get('/live-prediction', async (req, res) => {
    const state = aiLivePredictionService.getState();
    res.json({
      success: true,
      ...state
    });
  });

  // POST /api/simulation/live-predict-cycle - Force immediate live AI data fetch & prediction cycle
  router.post('/live-predict-cycle', async (req, res) => {
    try {
      const { stationId, customWeather } = req.body || {};
      const result = await aiLivePredictionService.runCycle(stationId, customWeather);
      res.json({
        success: true,
        isCritical: result?.isCritical || false,
        riskScore: result?.riskScore || 0,
        prediction: result?.prediction || null,
        verification: result?.verification || null,
        metrics: result?.metrics || null,
        state: aiLivePredictionService.getState()
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Get active simulation / hazard state
  router.get('/active', async (req, res) => {
    const hazards = await db.getHazards();
    let active = hazards.find(h => h.status === 'active') || hazards[0] || null;
    const sensors = await db.getSensors();

    // AI Prediction: ONLY include if confirmed critical (>50%) by AI verification engine
    const livePrediction = aiLivePredictionService.getState().lastPrediction;
    if (active) {
      if (livePrediction && livePrediction.isCritical) {
        active.prediction = livePrediction;
        active.predictedAlert = livePrediction;
      } else {
        // Safe conditions (Risk <= 50%): Clear prediction so no fake hazard is shown
        active.prediction = null;
        active.predictedAlert = null;
      }
    }

    // Official alert & simulation alert: Check if timed out or inactive
    if (active && active.expiresAt && new Date(active.expiresAt).getTime() <= Date.now()) {
      active.status = 'standby';
      active.officialActive = false;
      active.current = null;
      active.prediction = null;
      active.officialAlert = null;
      active.predictedAlert = null;
      active.alertsList = [];
      active.tiers = [];
      active.severedRoads = [];
      active.vulnerableVillages = [];
      active.expiresAt = null;
      await db.updateHazard(active._id, {
        status: 'standby',
        officialActive: false,
        current: null,
        prediction: null,
        officialAlert: null,
        predictedAlert: null,
        alertsList: [],
        tiers: [],
        severedRoads: [],
        vulnerableVillages: [],
        expiresAt: null,
        updatedAt: new Date().toISOString()
      });
    } else if (active && active.officialActive !== true) {
      active.current = null;
      active.officialAlert = null;
      if (active.status !== 'active') {
        active.tiers = [];
        active.severedRoads = [];
        active.vulnerableVillages = [];
      }
    }

    res.json({
      activeHazard: active,
      liveSensors: sensors,
      officialActive: !!(active && active.officialActive && active.current),
      liveAiState: aiLivePredictionService.getState(),
      timestamp: new Date().toISOString()
    });
  });

  // POST /api/simulation/official-alert - FRONTEND ADMIN TRIGGER FOR OFFICIAL GOVERNMENT ALERT
  router.post('/official-alert', async (req, res) => {
    try {
      const {
        basinName = 'Alaknanda Valley (Chamoli / Joshimath)',
        rainfallRateMmPerHour = 165,
        epicenter = { lat: 30.4100, lng: 79.4200 },
        issuingAuthority = 'State Disaster Management Authority (USDMA) Uttarakhand',
        severedRoads = [],
        defconLevel = 'DEFCON 1 // IMMINENT SURGE',
        timeoutSeconds = 300
      } = req.body;

      // Enforce 20 sec minimum to 30 min (1800 sec) maximum range
      const timeoutSec = Math.max(20, Math.min(1800, Number(timeoutSeconds) || 300));
      const expiresAt = new Date(Date.now() + timeoutSec * 1000).toISOString();

      const rate = Number(rainfallRateMmPerHour) || 120;
      const officialAlert = generateOfficialGovtAlert({
        locationName: basinName,
        coordinates: epicenter,
        rainfallRateMmPerHour: rate,
        issuingAuthority
      });

      const calculatedTiers = officialAlert.tiers;
      const basins = await db.getBasins();
      const matchedBasin = basins.find(b => b.name.toLowerCase().includes(basinName.toLowerCase().split(' ')[0])) || basins[0];
      const roads = severedRoads && severedRoads.length > 0 ? severedRoads : (rate >= 100 ? matchedBasin.criticalRoads : [matchedBasin.criticalRoads[0]]);
      const vulnerableVillages = matchedBasin.vulnerableVillages;

      const hazards = await db.getHazards();
      const updatedFields = {
        title: `Official Disaster Directive — ${basinName} (${rate} mm/hr)`,
        simulatedBasin: basinName,
        rainfallRateMmPerHour: rate,
        status: 'active',
        officialActive: true,
        timeoutSeconds: timeoutSec,
        expiresAt,
        location: {
          type: 'Point',
          coordinates: [epicenter.lng, epicenter.lat]
        },
        current: officialAlert,
        officialAlert: officialAlert,
        tiers: calculatedTiers,
        severedRoads: roads,
        vulnerableVillages,
        updatedAt: new Date().toISOString()
      };

      let activeHazard;
      if (hazards.length > 0) {
        activeHazard = await db.updateHazard(hazards[0]._id, updatedFields);
      } else {
        activeHazard = await db.createHazard(updatedFields);
      }

      const alertPayload = {
        alertType: 'official',
        officialActive: true,
        basinName,
        rainfallRateMmPerHour: rate,
        epicenter,
        calculatedTiers,
        current: officialAlert,
        officialAlert,
        severedRoads: roads,
        vulnerableVillages,
        issuingAuthority,
        timeoutSeconds: timeoutSec,
        expiresAt,
        timestamp: new Date().toISOString(),
        defconLevel
      };

      // Clear any prior expiration timer and arm new auto-standdown timer
      if (officialAlertTimeoutTimer) clearTimeout(officialAlertTimeoutTimer);
      officialAlertTimeoutTimer = setTimeout(async () => {
        try {
          console.log(`⏱️ [Official Alert Timeout] Alert elapsed after ${timeoutSec}s. Standing down automatically.`);
          const hzList = await db.getHazards();
          if (hzList.length > 0 && hzList[0].officialActive) {
            const clearedHazard = await db.updateHazard(hzList[0]._id, {
              status: 'standby',
              officialActive: false,
              current: null,
              officialAlert: null,
              tiers: [],
              severedRoads: [],
              vulnerableVillages: [],
              alertsList: [],
              expiresAt: null,
              updatedAt: new Date().toISOString()
            });
            if (io) {
              io.emit('OFFICIAL_GOVT_ALERT_REVOKED', {
                reason: 'TIMEOUT_EXPIRED',
                message: `Official alert elapsed after ${timeoutSec} seconds. Automatic stand-down enacted.`,
                timestamp: new Date().toISOString(),
                hazard: clearedHazard
              });
              io.emit('ALERT_EXPIRED', {
                alertType: 'official',
                timestamp: new Date().toISOString()
              });
              io.emit('HAZARD_UPDATED', clearedHazard);
            }
          }
        } catch (timerErr) {
          console.error('[Official Alert Auto-Revocation Error]:', timerErr.message);
        }
      }, timeoutSec * 1000);

      if (io) {
        io.emit('OFFICIAL_GOVT_ALERT_ISSUED', alertPayload);
        io.emit('HAZARD_UPDATED', activeHazard);
        io.emit('ALERT_EMERGENCY_BROADCAST', alertPayload);
      }

      console.log(`🏛️ [Official Alert] Promulgated by ${issuingAuthority} for ${basinName} (${rate} mm/hr, Timeout: ${timeoutSec}s).`);
      return res.status(200).json({
        success: true,
        message: `Official Government Emergency Directive Promulgated by ${issuingAuthority} (Active for ${timeoutSec}s)`,
        officialAlert,
        activeHazard,
        timeoutSeconds: timeoutSec,
        expiresAt
      });
    } catch (err) {
      console.error('[Official Alert Promulgation Error]:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // POST /api/simulation/revoke-official-alert - FRONTEND ADMIN STAND DOWN / REVOCATION OF OFFICIAL ALERT
  router.post('/revoke-official-alert', async (req, res) => {
    try {
      if (officialAlertTimeoutTimer) {
        clearTimeout(officialAlertTimeoutTimer);
        officialAlertTimeoutTimer = null;
      }
      const hazards = await db.getHazards();
      let activeHazard = null;
      if (hazards.length > 0) {
        activeHazard = await db.updateHazard(hazards[0]._id, {
          status: 'standby',
          officialActive: false,
          current: null,
          officialAlert: null,
          tiers: [],
          severedRoads: [],
          vulnerableVillages: [],
          alertsList: [],
          expiresAt: null,
          updatedAt: new Date().toISOString()
        });
      }

      const revocationPayload = {
        timestamp: new Date().toISOString(),
        status: 'STANDBY',
        officialActive: false,
        message: 'Official Government Directive has been stood down. System returned to AI Predictive Monitoring.',
        hazard: activeHazard
      };

      if (io) {
        io.emit('OFFICIAL_GOVT_ALERT_REVOKED', revocationPayload);
        io.emit('ALERT_EXPIRED', { alertType: 'official', timestamp: new Date().toISOString() });
        if (activeHazard) io.emit('HAZARD_UPDATED', activeHazard);
      }

      console.log(`🏛️ [Official Alert] Directive stood down by Frontend Admin. System in Standby Predictive Monitoring.`);
      return res.status(200).json({
        success: true,
        message: 'Official Government Directive revoked. System in Standby Predictive Monitoring.',
        activeHazard
      });
    } catch (err) {
      console.error('[Official Alert Revocation Error]:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Trigger Rain Simulation & Broadcast (Admin Console Endpoint)
  router.post('/trigger-rain', async (req, res) => {
    try {
      const {
        basinName = 'Alaknanda Valley (Chamoli / Joshimath)',
        rainfallRateMmPerHour = 165,
        epicenter = { lat: 30.4100, lng: 79.4200 },
        simulatedDurationHours = 3,
        timeoutSeconds = 300
      } = req.body;

      const timeoutSec = Math.max(20, Math.min(1800, Number(timeoutSeconds) || 300));
      const expiresAt = new Date(Date.now() + timeoutSec * 1000).toISOString();

      const rate = Number(rainfallRateMmPerHour) || 120;
      const calculatedTiers = calculateHazardTiers(rate);

      // 1. Generate Priority 1: Official Govt Alert (Real Danger)
      const officialAlert = generateOfficialGovtAlert({
        locationName: basinName,
        coordinates: epicenter,
        rainfallRateMmPerHour: rate,
        issuingAuthority: rate >= 150
          ? 'National Disaster Management Authority (NDMA) & IMD Central'
          : 'State Disaster Management Authority (USDMA) Uttarakhand'
      });

      // 2. Generate Priority 2: AI Climatic Prediction (Predicted Danger)
      const predictedAlert = generateAiClimaticPrediction({
        locationName: `${basinName} (T+3h Expansion Corridor)`,
        coordinates: { lat: epicenter.lat + 0.015, lng: epicenter.lng + 0.015 },
        currentRainfallRate: rate,
        soilPoreSaturation: Math.min(98.5, 78.0 + (rate * 0.12)),
        leadTimeHours: simulatedDurationHours
      });

      // Update climatic service for the district
      climaticService.updateDistrictWeather(basinName.split(' ')[0], rate, 94.2);

      // Determine compromised infrastructure based on basin and rain intensity
      const basins = await db.getBasins();
      const matchedBasin = basins.find(b => b.name.toLowerCase().includes(basinName.toLowerCase().split(' ')[0])) || basins[0];

      const severedRoads = rate >= 100
        ? matchedBasin.criticalRoads
        : [matchedBasin.criticalRoads[0]];

      const vulnerableVillages = matchedBasin.vulnerableVillages;

      // Update or create active hazard in db
      const newHazard = {
        title: `Simulated Flash Surge — ${basinName} (${rate} mm/hr)`,
        simulatedBasin: basinName,
        rainfallRateMmPerHour: rate,
        status: 'active',
        timeoutSeconds: timeoutSec,
        expiresAt,
        location: {
          type: 'Point',
          coordinates: [epicenter.lng, epicenter.lat]
        },
        tiers: officialAlert.tiers, // default backward compatible tiers
        current: officialAlert,
        prediction: predictedAlert,
        officialAlert,
        predictedAlert,
        alertsList: [officialAlert, predictedAlert],
        severedRoads,
        vulnerableVillages
      };

      const existingHazards = await db.getHazards();
      let activeHazard;
      if (existingHazards.length > 0) {
        activeHazard = await db.updateHazard(existingHazards[0]._id, newHazard);
      } else {
        activeHazard = await db.createHazard(newHazard);
      }

      // Record simulation in history
      const simulationRecord = await db.createSimulation({
        basinName,
        rainfallRateMmPerHour: rate,
        epicenter,
        simulatedDurationHours,
        calculatedTiers,
        officialAlert,
        predictedAlert,
        severedRoads,
        vulnerableVillages,
        timeoutSeconds: timeoutSec,
        expiresAt
      });

      // Clear any prior simulation timer and arm new auto-standdown timer
      if (simulationAlertTimeoutTimer) clearTimeout(simulationAlertTimeoutTimer);
      simulationAlertTimeoutTimer = setTimeout(async () => {
        try {
          console.log(`⏱️ [Simulation Alert Timeout] Simulation elapsed after ${timeoutSec}s. Standing down automatically.`);
          const hzList = await db.getHazards();
          if (hzList.length > 0) {
            const clearedHazard = await db.updateHazard(hzList[0]._id, {
              status: 'standby',
              current: null,
              prediction: null,
              officialAlert: null,
              predictedAlert: null,
              alertsList: [],
              tiers: [],
              severedRoads: [],
              vulnerableVillages: [],
              expiresAt: null,
              updatedAt: new Date().toISOString()
            });
            if (io) {
              io.emit('SIMULATION_ALERT_REVOKED', {
                reason: 'TIMEOUT_EXPIRED',
                simulationId: simulationRecord.id,
                message: `Simulation alert elapsed after ${timeoutSec} seconds. Automatic stand-down enacted.`,
                timestamp: new Date().toISOString(),
                hazard: clearedHazard
              });
              io.emit('ALERT_EXPIRED', {
                simulationId: simulationRecord.id,
                alertType: 'simulation',
                timestamp: new Date().toISOString()
              });
              io.emit('HAZARD_UPDATED', clearedHazard);
            }
          }
        } catch (timerErr) {
          console.error('[Simulation Timeout Error]:', timerErr.message);
        }
      }, timeoutSec * 1000);

      // Broadcast alert to all connected Web & Mobile clients
      const alertPayload = {
        alertType: 'simulation',
        simulationId: simulationRecord.id,
        basinName,
        rainfallRateMmPerHour: rate,
        epicenter,
        calculatedTiers,
        current: officialAlert,
        prediction: predictedAlert,
        officialAlert,
        predictedAlert,
        alertsList: [officialAlert, predictedAlert],
        severedRoads,
        vulnerableVillages,
        timeoutSeconds: timeoutSec,
        expiresAt,
        timestamp: new Date().toISOString(),
        defconLevel: rate >= 150 ? 'DEFCON 1 // IMMINENT SURGE' : rate >= 80 ? 'DEFCON 2 // MONSOON PROTOCOL' : 'DEFCON 3 // ELEVATED VIGILANCE'
      };

      if (io) {
        io.emit('ALERT_EMERGENCY_BROADCAST', alertPayload);
        io.emit('HAZARD_UPDATED', activeHazard);
      }

      console.log(`📡 [Broadcast] ALERT_EMERGENCY_BROADCAST emitted for ${basinName} (Timeout: ${timeoutSec}s).`);

      return res.status(200).json({
        success: true,
        simulationId: simulationRecord.id,
        message: `Simulation alert broadcasted successfully (Active for ${timeoutSec}s).`,
        officialAlert,
        predictedAlert,
        activeHazard,
        calculatedTiers,
        severedRoads,
        vulnerableVillages,
        timeoutSeconds: timeoutSec,
        expiresAt
      });
    } catch (err) {
      console.error('[Simulation Error]:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Simulation History
  router.get('/history', async (req, res) => {
    const history = await db.getSimulations();
    res.json(history);
  });

  return router;
}
