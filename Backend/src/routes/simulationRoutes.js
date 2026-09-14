import express from 'express';
import { db } from '../config/db.js';
import { calculateHazardTiers } from '../services/hazardZoneCalculator.js';

export function createSimulationRouter(io) {
  const router = express.Router();

  // Get available basins
  router.get('/basins', async (req, res) => {
    const basins = await db.getBasins();
    res.json(basins);
  });

  // Get active simulation / hazard state
  router.get('/active', async (req, res) => {
    const hazards = await db.getHazards();
    const active = hazards.find(h => h.status === 'active') || hazards[0] || null;
    const sensors = await db.getSensors();
    res.json({
      activeHazard: active,
      liveSensors: sensors,
      timestamp: new Date().toISOString()
    });
  });

  // Trigger Rain Simulation & Broadcast (Admin Console Endpoint)
  router.post('/trigger-rain', async (req, res) => {
    try {
      const {
        basinName = 'Alaknanda Valley (Chamoli / Joshimath)',
        rainfallRateMmPerHour = 165,
        epicenter = { lat: 30.4100, lng: 79.4200 },
        simulatedDurationHours = 3
      } = req.body;

      const rate = Number(rainfallRateMmPerHour) || 120;
      const calculatedTiers = calculateHazardTiers(rate);

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
        location: {
          type: 'Point',
          coordinates: [epicenter.lng, epicenter.lat]
        },
        tiers: calculatedTiers,
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
        severedRoads,
        vulnerableVillages
      });

      // Broadcast alert to all connected Web & Mobile clients
      const alertPayload = {
        simulationId: simulationRecord.id,
        basinName,
        rainfallRateMmPerHour: rate,
        epicenter,
        calculatedTiers,
        severedRoads,
        vulnerableVillages,
        timestamp: new Date().toISOString(),
        defconLevel: rate >= 150 ? 'DEFCON 1 // IMMINENT SURGE' : rate >= 80 ? 'DEFCON 2 // MONSOON PROTOCOL' : 'DEFCON 3 // ELEVATED VIGILANCE'
      };

      if (io) {
        io.emit('ALERT_EMERGENCY_BROADCAST', alertPayload);
        io.emit('HAZARD_UPDATED', activeHazard);
      }

      console.log(`📡 [Broadcast] ALERT_EMERGENCY_BROADCAST emitted for ${basinName} at ${rate} mm/hr.`);

      return res.status(200).json({
        success: true,
        simulationId: simulationRecord.id,
        message: 'Crisis alert and multi-tier hazard zones broadcasted successfully.',
        calculatedTiers,
        activeHazard,
        severedRoads,
        vulnerableVillages
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
