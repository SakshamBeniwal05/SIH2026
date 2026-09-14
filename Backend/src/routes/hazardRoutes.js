import express from 'express';
import { db } from '../config/db.js';

export function createHazardRouter() {
  const router = express.Router();

  // Get all hazards
  router.get('/', async (req, res) => {
    try {
      const hazards = await db.getHazards();
      res.json(hazards);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get specific hazard
  router.get('/:id', async (req, res) => {
    try {
      const hazard = await db.getHazardById(req.params.id);
      if (!hazard) {
        return res.status(404).json({ error: 'Hazard event not found' });
      }
      res.json(hazard);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
