import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const SocketContext = createContext();

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeHazard, setActiveHazard] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const [aiTraces, setAiTraces] = useState([]);
  const [telemetry, setTelemetry] = useState({
    rainfallRateMmPerHour: 180,
    sensors: [],
    utcTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
  });
  const [defconLevel, setDefconLevel] = useState('DEFCON 3 // ELEVATED VIGILANCE');
  const [isOfficialActive, setIsOfficialActive] = useState(false);
  const [officialAlert, setOfficialAlert] = useState(null);
  const [predictedAlert, setPredictedAlert] = useState(null);
  const [liveAiMetrics, setLiveAiMetrics] = useState(null);
  const [aiRefreshCountdown, setAiRefreshCountdown] = useState(12);

  // Initial Fetch of Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activeRes, reportsRes, aiRes] = await Promise.all([
          axios.get('/api/simulation/active'),
          axios.get('/api/reports'),
          axios.get('/api/ai/telemetry')
        ]);

        if (activeRes.data?.activeHazard) {
          const hz = activeRes.data.activeHazard;
          const isExpired = hz.expiresAt && new Date(hz.expiresAt).getTime() <= Date.now();
          if (isExpired) {
            hz.status = 'standby';
            hz.officialActive = false;
            hz.current = null;
            hz.officialAlert = null;
            hz.tiers = [];
            hz.severedRoads = [];
            hz.vulnerableVillages = [];
            hz.alertsList = [];
          }
          setActiveHazard(hz);
          const isOff = !isExpired && activeRes.data.officialActive !== false && !!(hz.current || hz.officialAlert);
          setIsOfficialActive(isOff);
          setOfficialAlert(isOff ? (hz.officialAlert || hz.current) : null);
          setPredictedAlert((hz.prediction && hz.prediction.isCritical !== false) ? (hz.prediction || hz.predictedAlert) : null);

          if (activeRes.data.liveAiState?.lastMetrics) {
            setLiveAiMetrics(activeRes.data.liveAiState.lastMetrics);
          }

          if (isOff) {
            const rate = hz.rainfallRateMmPerHour || 165;
            setDefconLevel(
              rate >= 150 ? 'DEFCON 1 // IMMINENT SURGE' :
              rate >= 80 ? 'DEFCON 2 // MONSOON PROTOCOL ACTIVE' :
              'DEFCON 3 // ELEVATED VIGILANCE'
            );
          } else {
            setDefconLevel('DEFCON 3 // AI PREDICTIVE MONITORING (STANDBY)');
          }
        }

        if (Array.isArray(reportsRes.data)) {
          setReports(reportsRes.data);
        }

        if (aiRes.data?.recentTraces) {
          setAiTraces(aiRes.data.recentTraces);
        }
      } catch (err) {
        console.warn('Backend initial fetch note:', err.message);
      }
    };

    fetchData();
  }, []);

  // Socket.io Connection & Event Listeners
  useEffect(() => {
    const s = io(SOCKET_SERVER_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    s.on('connect', () => {
      console.log('📡 [WebSocket] Connected to Disaster Intelligence Gateway:', s.id);
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      console.log('🔌 [WebSocket] Disconnected from Gateway');
      setIsConnected(false);
    });

    s.on('INITIAL_STATE', (data) => {
      if (data?.activeHazard) {
        const hz = data.activeHazard;
        const isExpired = hz.expiresAt && new Date(hz.expiresAt).getTime() <= Date.now();
        if (isExpired) {
          hz.status = 'standby';
          hz.officialActive = false;
          hz.current = null;
          hz.officialAlert = null;
          hz.tiers = [];
          hz.severedRoads = [];
          hz.vulnerableVillages = [];
          hz.alertsList = [];
        }
        setActiveHazard(hz);
        const isOff = !isExpired && hz.officialActive === true && !!(hz.current || hz.officialAlert);
        setIsOfficialActive(isOff);
        setOfficialAlert(isOff ? (hz.officialAlert || hz.current) : null);
        setPredictedAlert((hz.prediction && hz.prediction.isCritical !== false) ? (hz.prediction || hz.predictedAlert) : null);
      }
    });

    // 12-Second AI Cycle Refresh Start Signal: Empties prediction on frontend
    s.on('AI_CYCLE_REFRESH_START', (cycleInfo) => {
      console.log('🔄 [AI_CYCLE_REFRESH_START received]:', cycleInfo);
      setPredictedAlert(null);
      setActiveHazard(prev => ({
        ...(prev || {}),
        prediction: null,
        predictedAlert: null
      }));
      setAiRefreshCountdown(12);
    });

    // Live AI real-time prediction stream (ONLY prediction data)
    s.on('AI_PREDICTION_UPDATED', (payload) => {
      console.log('🤖 [AI_PREDICTION_UPDATED received]:', payload);
      if (payload?.predictedAlert && payload?.isCritical !== false) {
        setPredictedAlert(payload.predictedAlert);
        setActiveHazard(prev => ({
          ...(prev || {}),
          prediction: payload.predictedAlert,
          predictedAlert: payload.predictedAlert
        }));
      } else {
        // Safe conditions (Risk <= 50%): Clear predicted hazard from map and global state
        setPredictedAlert(null);
        setActiveHazard(prev => ({
          ...(prev || {}),
          prediction: null,
          predictedAlert: null
        }));
      }
      if (payload?.liveMetrics) {
        setLiveAiMetrics({
          ...payload.liveMetrics,
          isCritical: payload?.isCritical || false,
          riskScore: payload?.riskScore || 0,
          verification: payload?.verification || null
        });
      }
    });

    // Official Government Emergency Directive Promulgated by Admin
    s.on('OFFICIAL_GOVT_ALERT_ISSUED', (payload) => {
      console.log('🏛️ [OFFICIAL_GOVT_ALERT_ISSUED received]:', payload);
      setIsOfficialActive(true);
      const official = payload.officialAlert || payload.current || payload;
      setOfficialAlert(official);
      if (payload.defconLevel) setDefconLevel(payload.defconLevel);
      setActiveHazard(prev => ({
        ...(prev || {}),
        officialActive: true,
        current: official,
        officialAlert: official,
        simulatedBasin: payload.basinName || prev?.simulatedBasin,
        rainfallRateMmPerHour: payload.rainfallRateMmPerHour || prev?.rainfallRateMmPerHour,
        location: payload.epicenter ? {
          type: 'Point',
          coordinates: [payload.epicenter.lng, payload.epicenter.lat]
        } : prev?.location,
        tiers: official.tiers || payload.calculatedTiers || prev?.tiers,
        severedRoads: payload.severedRoads || prev?.severedRoads,
        vulnerableVillages: payload.vulnerableVillages || prev?.vulnerableVillages
      }));
    });

    // Official Government Emergency Directive Revoked / Stood Down by Admin or Timeout
    s.on('OFFICIAL_GOVT_ALERT_REVOKED', (payload) => {
      console.log('🏛️ [OFFICIAL_GOVT_ALERT_REVOKED received]:', payload);
      setIsOfficialActive(false);
      setOfficialAlert(null);
      setDefconLevel('DEFCON 3 // AI PREDICTIVE MONITORING (STANDBY)');
      setActiveHazard(prev => ({
        ...(prev || {}),
        status: 'standby',
        officialActive: false,
        current: null,
        officialAlert: null,
        tiers: [],
        severedRoads: [],
        vulnerableVillages: []
      }));
      setAlerts(prev => prev.filter(a => a.alertType !== 'official' && a.alertType !== 'government' && !a.officialAlert));
    });

    // Simulation Emergency Alert Revoked / Stood Down by Timeout
    s.on('SIMULATION_ALERT_REVOKED', (payload) => {
      console.log('⏱️ [SIMULATION_ALERT_REVOKED received]:', payload);
      const simId = payload?.simulationId;
      setActiveHazard(prev => ({
        ...(prev || {}),
        status: 'standby',
        current: null,
        prediction: null,
        officialAlert: null,
        predictedAlert: null,
        alertsList: [],
        tiers: [],
        severedRoads: [],
        vulnerableVillages: [],
        expiresAt: null
      }));
      setAlerts(prev => prev.filter(a => {
        if (simId && a.simulationId === simId) return false;
        if (a.alertType === 'simulation' || a.alertType === 'broadcast') return false;
        return true;
      }));
    });

    // Alert Expired Signal (Both Official & Simulation)
    s.on('ALERT_EXPIRED', (payload) => {
      console.log('⏱️ [ALERT_EXPIRED received]:', payload);
      const simId = payload?.simulationId;
      const aType = payload?.alertType;
      setAlerts(prev => prev.filter(a => {
        if (simId && a.simulationId === simId) return false;
        if (aType === 'official' && (a.alertType === 'official' || a.alertType === 'government')) return false;
        return true;
      }));
    });

    // Alert broadcast from Admin rain simulation
    s.on('ALERT_EMERGENCY_BROADCAST', (alertPayload) => {
      console.log('🚨 [ALERT_EMERGENCY_BROADCAST received]:', alertPayload);
      setAlerts(prev => [alertPayload, ...prev]);
      if (alertPayload.defconLevel) setDefconLevel(alertPayload.defconLevel);
      if (alertPayload.calculatedTiers) {
        setActiveHazard(prev => ({
          ...(prev || {}),
          simulatedBasin: alertPayload.basinName,
          rainfallRateMmPerHour: alertPayload.rainfallRateMmPerHour,
          location: {
            type: 'Point',
            coordinates: [alertPayload.epicenter.lng, alertPayload.epicenter.lat]
          },
          tiers: alertPayload.calculatedTiers,
          severedRoads: alertPayload.severedRoads,
          vulnerableVillages: alertPayload.vulnerableVillages
        }));
      }
    });

    // New field report submitted
    s.on('REPORT_NEW', (newReport) => {
      console.log('📥 [REPORT_NEW received]:', newReport);
      setReports(prev => [newReport, ...prev.filter(r => r._id !== newReport._id)]);
    });

    // Hazard updated by AI ReAct agent or Admin
    s.on('HAZARD_UPDATED', (hazardUpdate) => {
      console.log('⚡ [HAZARD_UPDATED received]:', hazardUpdate);
      setActiveHazard(prev => {
        const merged = { ...(prev || {}), ...hazardUpdate };
        if (hazardUpdate.officialActive !== undefined) {
          setIsOfficialActive(hazardUpdate.officialActive);
          setOfficialAlert(hazardUpdate.officialActive ? (hazardUpdate.officialAlert || hazardUpdate.current) : null);
        }
        if (hazardUpdate.prediction || hazardUpdate.predictedAlert) {
          setPredictedAlert(hazardUpdate.prediction || hazardUpdate.predictedAlert);
        }
        return merged;
      });
    });

    // AI reasoning loop trace
    s.on('AI_REASONING_UPDATE', (evaluation) => {
      console.log('🤖 [AI_REASONING_UPDATE received]:', evaluation);
      if (evaluation?.reasoningSteps) {
        setAiTraces(prev => [...evaluation.reasoningSteps, ...prev]);
      }
    });

    // Real-time periodic telemetry heartbeat
    s.on('TELEMETRY_PULSE', (pulse) => {
      setTelemetry(pulse);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // 12-Second Real-Time AI Auto-Refresh Loop with 1-second interval ticker
  // Empties prediction state on frontend every 12s and auto-requests fresh prediction from backend,
  // replacing any fake/custom AI simulation with live Open-Meteo web API data.
  useEffect(() => {
    if (!socket || !isConnected) return;

    const ticker = setInterval(() => {
      setAiRefreshCountdown(prev => {
        if (prev <= 1) {
          // 1. Immediately empty previous AI prediction on frontend
          setPredictedAlert(null);
          setActiveHazard(current => ({
            ...(current || {}),
            prediction: null,
            predictedAlert: null
          }));

          // 2. Auto-request backend to fetch fresh live web data, clearing fake override
          socket.emit('REQUEST_AI_REFRESH', { clearFakeOverride: true });
          return 12;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, [socket, isConnected]);

  // 1-Second Auto-Prune Ticker for Expired Alerts (Both Official and Simulation)
  useEffect(() => {
    const pruneTicker = setInterval(() => {
      const now = Date.now();
      setAlerts(prev => {
        const filtered = prev.filter(a => {
          if (a.expiresAt && new Date(a.expiresAt).getTime() <= now) {
            return false;
          }
          if ((a.alertType === 'official' || a.alertType === 'government') && !isOfficialActive) {
            return false;
          }
          return true;
        });
        if (filtered.length !== prev.length) {
          return filtered;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(pruneTicker);
  }, [isOfficialActive]);

  // Imperative trigger for on-demand AI refresh
  const requestAiRefresh = (clearFake = true, stationId = null) => {
    // Immediately empty previous AI prediction on frontend
    setPredictedAlert(null);
    setActiveHazard(prev => ({
      ...(prev || {}),
      prediction: null,
      predictedAlert: null
    }));
    setAiRefreshCountdown(12);
    if (socket && isConnected) {
      socket.emit('REQUEST_AI_REFRESH', { clearFakeOverride: clearFake, stationId });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        activeHazard,
        alerts,
        reports,
        aiTraces,
        telemetry,
        defconLevel,
        isOfficialActive,
        officialAlert,
        predictedAlert,
        liveAiMetrics,
        aiRefreshCountdown,
        requestAiRefresh,
        setIsOfficialActive,
        setOfficialAlert,
        setPredictedAlert,
        setActiveHazard,
        setReports
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
