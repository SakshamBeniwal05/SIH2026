import express from 'express';
import { db } from '../config/db.js';
import { runDisasterIntelligenceReActLoop } from '../services/aiAgentService.js';

export function createReportRouter(io) {
  const router = express.Router();

  // Get all incident reports
  router.get('/', async (req, res) => {
    try {
      const reports = await db.getReports();
      res.json(reports);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get single incident report
  router.get('/:id', async (req, res) => {
    try {
      const report = await db.getReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'Incident report not found' });
      }
      res.json(report);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Submit crowdsourced report handler (supports both / and /submit)
  const submitHandler = async (req, res) => {
    try {
      const {
        mediaUrl = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
        category = 'slope_movement',
        severityObserved = 'severe',
        coordinates, // [lng, lat]
        lat,
        lng,
        description = 'Observation submitted via field responder terminal.'
      } = req.body;

      // Normalize coordinates
      let finalCoords = [91.8933, 25.5788];
      if (Array.isArray(coordinates) && coordinates.length === 2) {
        finalCoords = [Number(coordinates[0]), Number(coordinates[1])];
      } else if (lat != null && lng != null) {
        finalCoords = [Number(lng), Number(lat)];
      }

      const newReport = await db.createReport({
        mediaUrl,
        category,
        severityObserved,
        location: {
          type: 'Point',
          coordinates: finalCoords
        },
        description,
        agentEvaluated: false
      });

      // Broadcast new report to connected clients
      if (io) {
        io.emit('REPORT_NEW', newReport);
      }

      console.log(`📥 [Field Report] New observation ingested: ${newReport._id} at [${finalCoords}]`);

      // Asynchronously trigger AI ReAct Reasoning Loop
      const aiEvaluation = await runDisasterIntelligenceReActLoop(newReport, io);

      res.status(201).json({
        success: true,
        message: 'Field observation ingested and evaluated by AI Risk Engine.',
        report: newReport,
        aiEvaluation
      });
    } catch (err) {
      console.error('[Report Ingestion Error]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  };

  router.post('/', submitHandler);
  router.post('/submit', submitHandler);

  return router;
}
