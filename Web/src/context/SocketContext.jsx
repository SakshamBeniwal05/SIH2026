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
  const [defconLevel, setDefconLevel] = useState('DEFCON 2 // MONSOON PROTOCOL ACTIVE');

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
          setActiveHazard(activeRes.data.activeHazard);
          const rate = activeRes.data.activeHazard.rainfallRateMmPerHour;
          setDefconLevel(
            rate >= 150 ? 'DEFCON 1 // IMMINENT SURGE' :
            rate >= 80 ? 'DEFCON 2 // MONSOON PROTOCOL ACTIVE' :
            'DEFCON 3 // ELEVATED VIGILANCE'
          );
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
      if (data?.activeHazard) setActiveHazard(data.activeHazard);
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

    // Hazard updated by AI ReAct agent
    s.on('HAZARD_UPDATED', (hazardUpdate) => {
      console.log('⚡ [HAZARD_UPDATED received]:', hazardUpdate);
      setActiveHazard(prev => ({ ...(prev || {}), ...hazardUpdate }));
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
