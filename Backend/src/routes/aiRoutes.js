import express from 'express';
import { db } from '../config/db.js';
import { runDisasterIntelligenceReActLoop } from '../services/aiAgentService.js';
import { calculateHazardTiers } from '../services/hazardZoneCalculator.js';

export function createAiRouter(io) {
  const router = express.Router();

  // GET /api/ai/telemetry (Live AI Agent status & telemetry metrics)
  router.get('/telemetry', async (req, res) => {
    const hazards = await db.getHazards();
    const reports = await db.getReports();
    const activeHazard = hazards[0];

    res.json({
      agentStatus: 'ACTIVE_MONITORING',
      modelArchitecture: 'Gemini ReAct Autonomous Reasoning Engine',
      runtimeEnvironment: 'Node.js Intelligence Gateway',
      toolRegistry: [
        {
          name: 'fetchNearbyCitizenReports',
          description: 'Radial geospatial search in 2dsphere index for multi-point crack clusters',
          status: 'READY'
        },
        {
          name: 'recalculateHazardTierRadii',
          description: 'Dynamically updates concentric risk boundaries and road severance states',
          status: 'READY'
        },
        {
          name: 'evaluateSlopeFailureFactor',
          description: 'Computes infinite slope factor of safety (FS) given soil pore pressure & rainfall',
          status: 'READY'
        }
      ],
      currentMetrics: {
        evaluatedReportsCount: reports.filter(r => r.agentEvaluated).length,
        pendingReportsCount: reports.filter(r => !r.agentEvaluated).length,
        activeZone1RadiusKm: activeHazard ? activeHazard.tiers[0]?.radiusMeters / 1000 : 4.8,
        activeRainfallMmPerHour: activeHazard ? activeHazard.rainfallRateMmPerHour : 180,
        factorOfSafetyScore: 0.94, // < 1.0 indicates critical imminent movement
        confidenceScore: 0.962
      },
      recentTraces: [
        {
          timestamp: new Date(Date.now() - 120000).toISOString(),
          type: 'TOOL_EXECUTION',
          tool: 'recalculateHazardTierRadii',
          summary: 'Zone 1 Hard Most contour expanded to 4.8km following report cluster along NH-306.'
        },
        {
          timestamp: new Date(Date.now() - 340000).toISOString(),
          type: 'ROAD_SEVERANCE',
          tool: 'updateInfrastructureState',
          summary: 'NH-306 KM 42 declared SEVERED. SDRF detour recommendation broadcasted.'
        }
      ]
    });
  });

  // POST /api/ai/evaluate-incident (Manual or triggered evaluation)
  router.post('/evaluate-incident', async (req, res) => {
    try {
      const { incidentId } = req.body;
      const reports = await db.getReports();
      const targetReport = incidentId
        ? reports.find(r => r._id === incidentId)
        : reports[0];

      if (!targetReport) {
        return res.status(404).json({ error: 'Incident report not found' });
      }

      const evaluation = await runDisasterIntelligenceReActLoop(targetReport, io);
      res.json({ success: true, evaluation });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/ai/recalculate-risk (Dynamic risk recalculation)
  router.post('/recalculate-risk', async (req, res) => {
    try {
      const { rainfallRate = 180, basinName, severedRoads } = req.body;
      const newTiers = calculateHazardTiers(rainfallRate);
      const hazards = await db.getHazards();

      if (hazards.length > 0) {
        const updated = await db.updateHazard(hazards[0]._id, {
          rainfallRateMmPerHour: rainfallRate,
          tiers: newTiers,
          ...(severedRoads ? { severedRoads } : {})
        });

        if (io) {
          io.emit('HAZARD_UPDATED', updated);
        }

        return res.json({ success: true, updatedHazard: updated });
      }

      res.status(404).json({ error: 'No active hazard found to update' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
