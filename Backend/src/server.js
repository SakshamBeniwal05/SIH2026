import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { db } from './config/db.js';
import { createSimulationRouter } from './routes/simulationRoutes.js';
import { createHazardRouter } from './routes/hazardRoutes.js';
import { createReportRouter } from './routes/reportRoutes.js';
import { createMediaRouter } from './routes/mediaRoutes.js';
import { createAiRouter } from './routes/aiRoutes.js';
import { aiLivePredictionService } from './services/aiLivePredictionService.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Socket.io initialization with open development CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.resolve('uploads')));

// Mount API routers
app.use('/api/simulation', createSimulationRouter(io));
app.use('/api/hazard', createHazardRouter());
app.use('/api/reports', createReportRouter(io));
app.use('/api/media', createMediaRouter());
app.use('/api/ai', createAiRouter(io));

// Healthcheck & metadata endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OPERATIONAL',
    service: 'SIH 2026 Disaster Intelligence Gateway',
    timestamp: new Date().toISOString(),
    database: db.isMongooseConnected ? 'MongoDB Atlas 2dsphere' : 'In-Memory Resilient Store',
    socketClientsCount: io.engine.clientsCount
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'SIH 2026 Disaster & Rain Simulation Gateway API',
    endpoints: [
      '/api/simulation/active',
      '/api/simulation/trigger-rain',
      '/api/simulation/basins',
      '/api/hazard',
      '/api/reports',
      '/api/media/sign-upload',
      '/api/ai/telemetry',
      '/api/ai/evaluate-incident'
    ]
  });
});

// WebSocket Event Listeners & Periodic Telemetry Pulse
io.on('connection', (socket) => {
  console.log(`🔌 [Socket.io] Client connected: ${socket.id}`);

  // Send initial state upon connection
  db.getHazards().then(hazards => {
    const active = hazards[0] || null;
    if (active) {
      if (active.expiresAt && new Date(active.expiresAt).getTime() <= Date.now()) {
        active.status = 'standby';
        active.officialActive = false;
        active.current = null;
        active.officialAlert = null;
        active.tiers = [];
        active.severedRoads = [];
        active.vulnerableVillages = [];
        active.alertsList = [];
        active.expiresAt = null;
      }
      const livePrediction = aiLivePredictionService.getState().lastPrediction;
      if (livePrediction && livePrediction.isCritical) {
        active.prediction = livePrediction;
        active.predictedAlert = livePrediction;
      } else {
        active.prediction = null;
        active.predictedAlert = null;
      }
    }
    socket.emit('INITIAL_STATE', {
      activeHazard: active,
      hazards
    });
  });

  // Real-time 12-second Auto-Request from Frontend
  // Empties previous prediction, replaces fake simulation with live Open-Meteo data, and refills
  socket.on('REQUEST_AI_REFRESH', async (payload) => {
    console.log(`🔄 [Socket.io] REQUEST_AI_REFRESH received from client ${socket.id}`);
    // Broadcast refresh start to empty previous prediction on all frontend clients
    io.emit('AI_CYCLE_REFRESH_START', {
      timestamp: new Date().toISOString(),
      requestedBy: socket.id
    });

    // Clear fake/custom weather override so fake simulation is replaced by live web API data
    if (payload?.clearFakeOverride !== false) {
      aiLivePredictionService.clearCustomWeatherOverride();
    }

    // Reset autonomous timer so next background tick stays synchronized at 12 seconds
    aiLivePredictionService.resetAutonomousTimer(12000);

    // Recollect real-time atmospheric data from Open-Meteo and re-evaluate
    await aiLivePredictionService.runCycle(payload?.stationId || null, null);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 [Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Periodic Telemetry Heartbeat (every 5 seconds)
// Simulates live seismic vibration, pore pressure variance, and rainfall tick
setInterval(async () => {
  const hazards = await db.getHazards();
  const activeHazard = hazards[0];
  const rainfall = activeHazard ? activeHazard.rainfallRateMmPerHour : 140;

  // Add realistic micro-variances
  const jitter = (Math.random() - 0.5) * 1.5;
  const pulsePayload = {
    timestamp: new Date().toISOString(),
    utcTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
    sensors: [
      {
        id: 'SN-UK-501',
        name: 'Joshimath Sunil Ridge Tiltmeter',
        vibrationHz: Number((4.8 + (Math.random() * 0.4)).toFixed(2)),
        saturation: Math.min(100, Number((93.8 + (Math.random() * 0.4)).toFixed(1))),
        displacementDelta: `+${(16.4 + jitter * 0.2).toFixed(1)} mm/hr`
      },
      {
        id: 'SN-UK-502',
        name: 'Helang NH-58 Escarpment Piezometer',
        vibrationHz: Number((4.1 + (Math.random() * 0.3)).toFixed(2)),
        saturation: Math.min(100, Number((90.2 + (Math.random() * 0.3)).toFixed(1))),
        displacementDelta: `+${(11.8 + jitter * 0.15).toFixed(1)} mm/hr`
      }
    ],
    rainfallRateMmPerHour: rainfall
  };

  io.emit('TELEMETRY_PULSE', pulsePayload);
}, 5000);

// Initialize DB and start listening
async function startServer() {
  await db.connect();

  // Initialize and start live autonomous AI data fetch & prediction engine (only prediction data)
  aiLivePredictionService.setIo(io);
  aiLivePredictionService.startAutonomousLoop(12000);

  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 [SIH 2026 Backend] Ingestion & Broadcast Gateway running`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📡 WebSocket Channel: disaster:broadcast ready`);
    console.log(`⚡ Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
  });
}

startServer();
