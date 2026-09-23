import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Slider, Chip, Tooltip } from '@mui/material';
import { Header } from '../components/common/Header';
import { EvacuationBanner } from '../components/alerts/EvacuationBanner';
import { GisMapCanvas } from '../components/gis/GisMapCanvas';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import {
  CloudRain,
  AlertTriangle,
  Radio,
  Sliders,
  Send,
  Cpu,
  CheckCircle2,
  Layers,
  Compass,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Zap,
  Globe,
  Activity,
  ChevronRight,
  Wind,
  Gauge,
  MapPin,
  Eye,
  Crosshair,
  Maximize2,
  Shield,
  CheckCircle,
  Clock
} from 'lucide-react';

// Northeast India (7 Sister States) Sector Stations Database
const SECTOR_STATIONS = [
  {
    id: 'guwahati',
    name: 'Brahmaputra Valley (Guwahati / Kamrup, Assam)',
    lat: 26.1445,
    lng: 91.7362,
    defaultRain: 165,
    defaultWind: 30,
    defaultPore: 89.5,
    severedRoads: ['NH-27 (Guwahati Bypass Lifeline)', 'Guwahati-Shillong GS Road Corridor']
  },
  {
    id: 'shillong',
    name: 'Khasi & Jaintia Hills (Shillong / Cherrapunji, Meghalaya)',
    lat: 25.5788,
    lng: 91.8933,
    defaultRain: 215,
    defaultWind: 42,
    defaultPore: 96.0,
    severedRoads: ['NH-6 (Shillong-Jowai-Silchar Lifeline)', 'SH-5 (Sohra-Shella Gorges Artery)']
  },
  {
    id: 'aizawl',
    name: 'Aizawl Ridge & Chhimtuipui Basin (Mizoram)',
    lat: 23.7271,
    lng: 92.7176,
    defaultRain: 175,
    defaultWind: 34,
    defaultPore: 94.2,
    severedRoads: ['NH-306 (Silchar-Kolasib-Aizawl Lifeline)', 'Melthum-Bualpui Ridge Road']
  },
  {
    id: 'imphal_noney',
    name: 'Imphal Basin & Noney Corridor (Manipur)',
    lat: 24.8167,
    lng: 93.6833,
    defaultRain: 185,
    defaultWind: 36,
    defaultPore: 93.8,
    severedRoads: ['NH-37 (Imphal-Jiribam Highway)', 'Tupul Railway Approach Corridor']
  },
  {
    id: 'kohima',
    name: 'Kohima & Chumukedima Gorge (Nagaland)',
    lat: 25.6751,
    lng: 94.1086,
    defaultRain: 145,
    defaultWind: 28,
    defaultPore: 90.5,
    severedRoads: ['NH-29 (Dimapur-Kohima Pagla Pahar Corridor)', 'Kohima-Mao Manipur Gate Highway']
  },
  {
    id: 'itanagar_siang',
    name: 'Siang & Papum Pare Basin (Arunachal Pradesh)',
    lat: 27.1004,
    lng: 93.6166,
    defaultRain: 160,
    defaultWind: 32,
    defaultPore: 88.5,
    severedRoads: ['NH-13 (Trans-Arunachal Highway)', 'Pasighat-Pangin-Along Artery']
  },
  {
    id: 'silchar_dima',
    name: 'Dima Hasao & Barak Valley (Haflong / Silchar, Assam)',
    lat: 25.1833,
    lng: 93.0167,
    defaultRain: 170,
    defaultWind: 35,
    defaultPore: 92.0,
    severedRoads: ['NH-27 (Haflong-Jatinga Hill Section)', 'Silchar-Kalain Arterial Bypass']
  },
  {
    id: 'agartala',
    name: 'Howrah Basin & Dhalai (Tripura)',
    lat: 23.8315,
    lng: 91.2868,
    defaultRain: 135,
    defaultWind: 24,
    defaultPore: 85.0,
    severedRoads: ['NH-8 (Assam-Agartala National Highway)', 'Ambassa-Manu Chokepoint']
  }
];

export function AdminSimulation() {
  const { isDark } = useTheme();
  const {
    isOfficialActive,
    officialAlert,
    predictedAlert,
    liveAiMetrics,
    activeHazard,
    aiRefreshCountdown,
    requestAiRefresh
  } = useSocket();

  // Official Government Alert Form State
  const [authority, setAuthority] = useState('North Eastern Council (NEC) & ASDMA');
  const [selectedStationId, setSelectedStationId] = useState('guwahati');
  const [basin, setBasin] = useState(SECTOR_STATIONS[0].name);
  const [rainfall, setRainfall] = useState(165);
  const [epicenter, setEpicenter] = useState({ lat: 26.1445, lng: 91.7362 });
  const [defconLevel, setDefconLevel] = useState('DEFCON 1 // IMMINENT SURGE');
  const [severedRoads, setSeveredRoads] = useState(SECTOR_STATIONS[0].severedRoads);
  const [isBroadcastingOfficial, setIsBroadcastingOfficial] = useState(false);
  const [isRevokingOfficial, setIsRevokingOfficial] = useState(false);

  // Map Focus & Navigation State
  const [mapFocusedTarget, setMapFocusedTarget] = useState(null);
  const [mapCenterCoords, setMapCenterCoords] = useState([30.4100, 79.4200]);

  // AI Prediction & Custom Weather Simulation State
  const [aiWeatherMode, setAiWeatherMode] = useState('custom'); // 'custom' | 'live'
  const [simStationId, setSimStationId] = useState('chamoli');
  const [simRainfall, setSimRainfall] = useState(155);
  const [simRainCondition, setSimRainCondition] = useState('Critical Cloudburst');
  const [simWindSpeed, setSimWindSpeed] = useState(48);
  const [simWindCondition, setSimWindCondition] = useState('High Mountain Winds');
  const [simSoilPore, setSimSoilPore] = useState(93.5);
  const [isPredictingAi, setIsPredictingAi] = useState(false);
  const [liveAiState, setLiveAiState] = useState(null);

  // Status feedback log
  const [broadcastLog, setBroadcastLog] = useState(null);

  // Active Target Station for Pinpoint Marker
  const activeTargetStation = useMemo(() => {
    return aiWeatherMode === 'custom'
      ? SECTOR_STATIONS.find(s => s.id === simStationId) || SECTOR_STATIONS[0]
      : SECTOR_STATIONS.find(s => s.id === selectedStationId) || SECTOR_STATIONS[0];
  }, [aiWeatherMode, simStationId, selectedStationId]);

  // Fetch initial live prediction state
  const fetchAiState = async () => {
    try {
      const res = await axios.get('/api/simulation/live-prediction');
      if (res.data?.success) {
        setLiveAiState(res.data);
      }
    } catch (err) {
      console.warn('AI live prediction state fetch error:', err.message);
    }
  };

  useEffect(() => {
    fetchAiState();
  }, []);

  const activePredictionData = (predictedAlert && predictedAlert.isCritical !== false)
    ? predictedAlert
    : null;
  const activeMetricsData = liveAiMetrics || liveAiState?.lastMetrics;

  // Official Alert Timeout Duration in Seconds (Range: 20s to 1800s / 30min)
  const [govtTimeoutSeconds, setGovtTimeoutSeconds] = useState(() => {
    const saved = localStorage.getItem('govt_alert_timeout_seconds');
    return saved ? Math.max(20, Math.min(1800, Number(saved))) : 300;
  });
  const [remainingAlertSeconds, setRemainingAlertSeconds] = useState(null);

  useEffect(() => {
    localStorage.setItem('govt_alert_timeout_seconds', String(govtTimeoutSeconds));
  }, [govtTimeoutSeconds]);

  // Real Dynamic AI Model Evaluation State
  const [aiEvaluationData, setAiEvaluationData] = useState(null);
  const [isEvaluatingAi, setIsEvaluatingAi] = useState(false);
  const [isLockingStation, setIsLockingStation] = useState(false);

  // Update Government Basin & Epicenter
  const handleBasinSelect = (stId) => {
    setSelectedStationId(stId);
    const match = SECTOR_STATIONS.find(s => s.id === stId) || SECTOR_STATIONS[0];
    setBasin(match.name);
    setEpicenter({ lat: match.lat, lng: match.lng });
    setSeveredRoads(match.severedRoads);
    setMapCenterCoords([match.lat, match.lng]);
  };

  // Dynamically evaluate against AI Model and historical catalog
  const evaluateAiModel = useCallback(async () => {
    setIsEvaluatingAi(true);
    try {
      const payload = {
        stationId: simStationId,
        customWeather: aiWeatherMode === 'custom' ? {
          precipitationMmPerHour: simRainfall,
          soilMoisturePct: simSoilPore,
          windSpeedKmh: simWindSpeed,
          rainSeverity: simRainCondition,
          windCondition: simWindCondition
        } : null
      };
      const res = await axios.post('/api/simulation/evaluate-ai', payload);
      if (res.data?.success && res.data?.verification) {
        setAiEvaluationData(res.data.verification);
      }
    } catch (err) {
      console.warn('Dynamic AI evaluation note:', err.message);
    } finally {
      setIsEvaluatingAi(false);
    }
  }, [simStationId, aiWeatherMode, simRainfall, simSoilPore, simWindSpeed, simRainCondition, simWindCondition]);

  useEffect(() => {
    const timer = setTimeout(evaluateAiModel, 300);
    return () => clearTimeout(timer);
  }, [evaluateAiModel]);

  // Lock AI background loop to this corridor without city jumping
  const handleLockMonitoredStation = async () => {
    setIsLockingStation(true);
    try {
      const res = await axios.post('/api/simulation/set-monitored-station', { stationId: simStationId });
      if (res.data?.success) {
        setBroadcastLog({
          status: 'AI_SUCCESS',
          message: `📍 AI Monitoring locked to ${res.data.station?.name || activeTargetStation.name}. Background loop will continuously monitor this corridor without changing locations.`
        });
      }
    } catch (err) {
      setBroadcastLog({
        status: 'ERROR',
        message: `Failed to lock corridor: ${err.message}`
      });
    } finally {
      setIsLockingStation(false);
    }
  };

  // 1. CALCULATE LIVE GOVERNMENT IMPACT RADIUS TIERS
  const govtRadiusTiers = useMemo(() => {
    const rain = Math.max(10, rainfall);
    const z1Meters = Math.round(rain * 28 + 600);
    const z2Meters = Math.round(z1Meters * 1.95);
    const z3Meters = Math.round(z1Meters * 3.45);
    const z4Meters = Math.round(z1Meters * 5.80);
    return {
      z1: { meters: z1Meters, km: (z1Meters / 1000).toFixed(2), name: 'Zone 1: Hard Most (Ground Zero)' },
      z2: { meters: z2Meters, km: (z2Meters / 1000).toFixed(2), name: 'Zone 2: Most (Severe Impact)' },
      z3: { meters: z3Meters, km: (z3Meters / 1000).toFixed(2), name: 'Zone 3: Some (Moderate Creep)' },
      z4: { meters: z4Meters, km: (z4Meters / 1000).toFixed(2), name: 'Zone 4: Least Impact (Advisory Cordon)' }
    };
  }, [rainfall]);

  // 2. REAL-TIME AI HISTORICAL RISK SCORE EVALUATION (From Model, Not Scripted)
  const liveRiskAssessment = useMemo(() => {
    if (aiEvaluationData) {
      return {
        totalScore: aiEvaluationData.riskScore || 0,
        isCritical: aiEvaluationData.isCritical || false,
        rainScore: Math.round(aiEvaluationData.components?.rainfallScore || 0),
        soilScore: Math.round(aiEvaluationData.components?.soilScore || 0),
        windScore: Math.round(aiEvaluationData.components?.windScore || 0),
        historicalPrecedentScore: Math.round(aiEvaluationData.components?.historicalPrecedentScore || 0),
        nearestEvent: aiEvaluationData.nearestEvent,
        summary: aiEvaluationData.verificationSummary
      };
    }
    return {
      totalScore: 14,
      isCritical: false,
      rainScore: 0,
      soilScore: 4,
      windScore: 1,
      historicalPrecedentScore: 10,
      nearestEvent: null,
      summary: 'Evaluating against historical disaster precedents...'
    };
  }, [aiEvaluationData]);

  // 3. CALCULATE LIVE AI PREDICTED EXPANSION RADIUS TIERS
  const aiPredictedRunout = useMemo(() => {
    const windFactor = 1.0 + Math.min(0.22, (simWindSpeed / 120) * 0.22);
    const effectiveRain = Math.round(simRainfall * windFactor);
    const expansionFactor = 1.0 + (simSoilPore / 100) * 0.45;
    const predZ1Meters = Math.round((effectiveRain * 36 + 1200) * expansionFactor);
    const predZ2Meters = Math.round(predZ1Meters * 1.90);
    const predZ3Meters = Math.round(predZ1Meters * 3.30);
    const predZ4Meters = Math.round(predZ1Meters * 5.10);
    const predKm = (predZ1Meters / 1000).toFixed(2);
    return {
      windFactor: Number((windFactor * 100 - 100).toFixed(1)),
      expansionMultiplier: expansionFactor.toFixed(2),
      effectiveRain,
      predZ1Meters,
      predKm,
      predZ2Km: (predZ2Meters / 1000).toFixed(2),
      predZ3Km: (predZ3Meters / 1000).toFixed(2),
      predZ4Km: (predZ4Meters / 1000).toFixed(2)
    };
  }, [simRainfall, simWindSpeed, simSoilPore]);

  // Formatted 4-Tier Solid Radial Gradient Zones for Live Map Preview
  const formattedGovtPreviewTiers = useMemo(() => {
    return [
      {
        tierName: 'Hard Most',
        radiusMeters: govtRadiusTiers.z1.meters,
        strokeColor: '#B71C1C',
        fillColor: '#FFEBEE',
        fillOpacity: 0.45,
        evacuationMandated: true,
        description: `Ground Zero Core (${govtRadiusTiers.z1.km} km) - Immediate evacuation ordered.`
      },
      {
        tierName: 'Most',
        radiusMeters: govtRadiusTiers.z2.meters,
        strokeColor: '#E65100',
        fillColor: '#FFF3E0',
        fillOpacity: 0.35,
        evacuationMandated: true,
        description: `Severe Impact (${govtRadiusTiers.z2.km} km) - Lifeline road severed, detour initiated.`
      },
      {
        tierName: 'Some',
        radiusMeters: govtRadiusTiers.z3.meters,
        strokeColor: '#FF8F00',
        fillColor: '#FFF8E1',
        fillOpacity: 0.25,
        evacuationMandated: false,
        description: `Moderate Creep (${govtRadiusTiers.z3.km} km) - Agricultural washouts, slope creep.`
      },
      {
        tierName: 'Negligible',
        radiusMeters: govtRadiusTiers.z4.meters,
        strokeColor: '#01579B',
        fillColor: '#E1F5FE',
        fillOpacity: 0.15,
        evacuationMandated: false,
        description: `Advisory Buffer (${govtRadiusTiers.z4.km} km) - Doppler tracking cordon.`
      }
    ];
  }, [govtRadiusTiers]);

  // Formatted Violet Dashed Gradient Zones for AI Preview
  const formattedAiPreviewZones = useMemo(() => {
    if (!liveRiskAssessment.isCritical) return null;
    return {
      coordinates: { lat: activeTargetStation.lat + 0.012, lng: activeTargetStation.lng + 0.012 },
      radiusMeters: aiPredictedRunout.predZ1Meters,
      radius: `${aiPredictedRunout.predKm} km (T+3h Projected Surge Expansion)`,
      isCritical: true,
      locationName: `${activeTargetStation.name} (AI Forecast Runout Corridor)`,
      currentRainfallRate: aiPredictedRunout.effectiveRain,
      soilPoreSaturation: simSoilPore,
      riskScore: liveRiskAssessment.totalScore
    };
  }, [liveRiskAssessment.isCritical, liveRiskAssessment.totalScore, activeTargetStation, aiPredictedRunout, simSoilPore]);

  // PREVIEW GOVERNMENT IMPACT RADIUS ON MAP
  const handlePreviewGovtRadius = () => {
    setMapFocusedTarget({
      coords: [epicenter.lat, epicenter.lng],
      id: 'official-govt-preview',
      type: 'epicenter',
      basin: basin,
      rain: rainfall,
      zoom: 13
    });
  };

  // PINPOINT TARGET AREA ON MAP
  const handlePinpointTarget = () => {
    setMapCenterCoords([activeTargetStation.lat, activeTargetStation.lng]);
    setMapFocusedTarget({
      coords: [activeTargetStation.lat, activeTargetStation.lng],
      id: `target-pinpoint-${activeTargetStation.id}`,
      type: 'sensor',
      data: {
        name: `🎯 TARGET SIMULATION LOCATION: ${activeTargetStation.name}`,
        saturation: simSoilPore,
        displacementDelta: `Risk: ${liveRiskAssessment.totalScore}% (${liveRiskAssessment.isCritical ? 'CRITICAL' : 'SAFE'})`
      },
      zoom: 13
    });
  };

  // Synchronously clear focused target if the target prediction is stood down or removed
  useEffect(() => {
    if (mapFocusedTarget && (mapFocusedTarget.type === 'prediction' || mapFocusedTarget.id === 'ai-prediction-cycle')) {
      if (!predictedAlert || predictedAlert.isCritical === false) {
        setMapFocusedTarget(null);
      }
    }
  }, [predictedAlert, mapFocusedTarget]);

  // Synchronously clear focused target if government directive is stood down / revoked or expired
  useEffect(() => {
    if (!isOfficialActive && mapFocusedTarget && (
      mapFocusedTarget.type === 'epicenter' ||
      mapFocusedTarget.id === 'official-govt-directive-live' ||
      mapFocusedTarget.id === 'active-hazard-epicenter'
    )) {
      setMapFocusedTarget(null);
    }
  }, [isOfficialActive, mapFocusedTarget]);

  // 1. ADMIN TRIGGER: PROMULGATE OFFICIAL GOVERNMENT DIRECTIVE
  const handlePromulgateOfficial = async () => {
    setIsBroadcastingOfficial(true);
    setBroadcastLog(null);
    try {
      const response = await axios.post('/api/simulation/official-alert', {
        basinName: basin,
        rainfallRateMmPerHour: rainfall,
        epicenter,
        issuingAuthority: authority,
        severedRoads,
        defconLevel,
        timeoutSeconds: govtTimeoutSeconds
      });

      // Focus map to promulgated epicenter
      setMapFocusedTarget({
        coords: [epicenter.lat, epicenter.lng],
        id: 'official-govt-directive-live',
        type: 'epicenter',
        basin: basin,
        rain: rainfall,
        zoom: 13
      });

      setBroadcastLog({
        status: 'SUCCESS',
        message: `Official Government Emergency Directive promulgated by ${authority}! Ground Zero and concentric evacuation cordons (${govtRadiusTiers.z1.km} km to ${govtRadiusTiers.z4.km} km) published across Northeast India (7 Sister States) (Active for ${Math.floor(govtTimeoutSeconds / 60)}m ${govtTimeoutSeconds % 60}s).`
      });
    } catch (err) {
      setBroadcastLog({
        status: 'ERROR',
        message: `Official Declaration Failure: ${err.response?.data?.message || err.message}`
      });
    } finally {
      setIsBroadcastingOfficial(false);
    }
  };

  // 2. ADMIN TRIGGER: STAND DOWN / REVOKE OFFICIAL GOVERNMENT DIRECTIVE
  const handleRevokeOfficial = async () => {
    setIsRevokingOfficial(true);
    setBroadcastLog(null);
    try {
      await axios.post('/api/simulation/revoke-official-alert');
      setMapFocusedTarget(null);
      setRemainingAlertSeconds(null);
      setBroadcastLog({
        status: 'INFO',
        message: 'Official Government Directive stood down. Emergency cordons demobilized. System returned to AI Predictive Monitoring.'
      });
    } catch (err) {
      setBroadcastLog({
        status: 'ERROR',
        message: `Revocation Failure: ${err.response?.data?.message || err.message}`
      });
    } finally {
      setIsRevokingOfficial(false);
    }
  };

  // Live countdown timer for active official emergency alert
  useEffect(() => {
    if (!isOfficialActive) {
      setRemainingAlertSeconds(null);
      return;
    }
    const expiresAtStr = officialAlert?.expiresAt || activeHazard?.expiresAt;
    if (!expiresAtStr) {
      setRemainingAlertSeconds(null);
      return;
    }

    const checkTime = () => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAtStr).getTime() - Date.now()) / 1000));
      setRemainingAlertSeconds(remaining);
      if (remaining <= 0) {
        handleRevokeOfficial();
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [isOfficialActive, officialAlert, activeHazard]);

  const formatCountdown = (secs) => {
    if (secs === null || secs === undefined) return '--:--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 3. TRIGGER AI PREDICT CYCLE (STRICT HISTORICAL VERIFICATION & >50% THRESHOLD)
  const handleRunAiPredictCycle = async () => {
    setIsPredictingAi(true);
    try {
      const payload = {
        stationId: simStationId
      };

      if (aiWeatherMode === 'custom') {
        payload.customWeather = {
          precipitationMmPerHour: simRainfall,
          rainSeverity: simRainCondition,
          windSpeedKmh: simWindSpeed,
          windCondition: simWindCondition,
          soilMoisturePct: simSoilPore,
          temperatureC: 17.5,
          humidityPct: 94
        };
      }

      const res = await axios.post('/api/simulation/live-predict-cycle', payload);
      if (res.data?.state) {
        setLiveAiState(res.data.state);
      }

      const st = SECTOR_STATIONS.find(s => s.id === simStationId) || SECTOR_STATIONS[0];

      if (res.data.isCritical && res.data.prediction) {
        // Critical threat (>50%) verified against historical disaster data
        setMapFocusedTarget({
          coords: [st.lat + 0.012, st.lng + 0.012],
          id: 'ai-prediction-cycle',
          type: 'prediction',
          data: res.data.prediction,
          zoom: 13
        });

        setBroadcastLog({
          status: 'AI_SUCCESS',
          message: `⚠️ AI Historical Disaster Verification: CRITICAL HAZARD CONFIRMED (Risk Score: ${res.data.riskScore}% > 50%). Analyzed ${st.name}. Historical precedent proves high slope failure probability. Projected Runout Radius: ${res.data.prediction.radius}. Concentric prediction zones rendered on GIS map.`
        });
      } else {
        // Normal / Safe (<= 50%): No fake hazard circles displayed
        setMapFocusedTarget(null);
        setBroadcastLog({
          status: 'AI_SAFE',
          message: `🛡️ AI Historical Disaster Verification: NOMINAL / SAFE (Risk Score: ${res.data.riskScore}% <= 50%). Current conditions at ${st.name} do not meet historical failure triggers. Prediction hazard suppressed. No danger zone displayed.`
        });
      }
    } catch (err) {
      setBroadcastLog({
        status: 'ERROR',
        message: `AI Evaluation Error: ${err.message}`
      });
    } finally {
      setIsPredictingAi(false);
    }
  };

  return (
    <div className={`min-h-screen pt-12 flex flex-col transition-colors ${
      isDark ? 'bg-[#0a0e15] text-[#dfe2ed]' : 'bg-[#f8fafc] text-[#0f172a]'
    }`}>
      <Header />
      <EvacuationBanner />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Title Header */}
        <div className="pb-4 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-7 h-7 text-[#D32F2F] animate-pulse" />
              <h1 className="font-headline font-extrabold text-xl md:text-2xl tracking-wider uppercase">
                CRISIS COMMAND & HISTORICAL AI VERIFICATION SIMULATOR
              </h1>
            </div>
            <p className="font-body text-xs text-slate-400 mt-1">
              AI cross-checks real-time latitude & longitude against Northeast India's (7 Sister States) 2010–2026 disaster dataset. Predictions are broadcast strictly when risk exceeds 50% or when custom weather is submitted by admin.
            </p>
          </div>

          {/* Master Status Pill */}
          <div className="shrink-0 flex items-center gap-2">
            {isOfficialActive ? (
              <div className="px-3 py-1.5 bg-red-950/80 border border-red-500 text-red-300 font-telemetry text-xs font-extrabold flex items-center gap-2 shadow-[0_0_15px_rgba(211,47,47,0.5)]">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span>OFFICIAL GOVT DIRECTIVE: ACTIVE</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-telemetry text-xs font-extrabold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>GOVERNMENT STATUS: STANDBY</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Broadcast Feedback Log */}
        {broadcastLog && (
          <div className={`p-4 border font-telemetry text-xs flex items-center justify-between gap-3 ${
            broadcastLog.status === 'SUCCESS'
              ? 'bg-[#10131b] border-red-500 text-red-400 shadow-[0_0_15px_rgba(211,47,47,0.3)]'
              : broadcastLog.status === 'AI_SUCCESS'
                ? 'bg-[#10131b] border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(123,31,162,0.3)]'
                : broadcastLog.status === 'AI_SAFE'
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                  : broadcastLog.status === 'ERROR'
                    ? 'bg-red-950/50 border-red-500 text-red-300'
                    : 'bg-cyan-950/50 border-cyan-500 text-cyan-300'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-none ${
                broadcastLog.status === 'SUCCESS' ? 'bg-red-500 animate-ping' :
                broadcastLog.status === 'AI_SUCCESS' ? 'bg-purple-500 animate-ping' :
                broadcastLog.status === 'AI_SAFE' ? 'bg-emerald-500' : 'bg-cyan-500'
              }`} />
              <span>{broadcastLog.message}</span>
            </div>
            <button
              onClick={() => setBroadcastLog(null)}
              className="text-slate-400 hover:text-white uppercase font-bold text-[10px]"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* SECTION 1: INTERACTIVE GIS SPATIAL SIMULATION VIEWPORT */}
        <div className={`border overflow-hidden shadow-2xl ${
          isDark ? 'bg-[#0c1017] border-slate-700/60' : 'bg-white border-slate-300'
        }`}>
          {/* Map Viewport Control Bar */}
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '14s' }} />
              <span className="font-headline font-bold text-white uppercase tracking-wider text-[11px]">
                SPATIAL IMPACT RUNOUT & TARGET PINPOINT VIEWPORT
              </span>
              <span className="px-2 py-0.5 bg-cyan-950/80 border border-cyan-500/50 font-telemetry text-[9px] text-cyan-300 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-cyan-400" />
                <span>TARGET: {activeTargetStation.name} [{activeTargetStation.lat.toFixed(2)}°N, {activeTargetStation.lng.toFixed(2)}°E]</span>
              </span>
              <span className={`px-2 py-0.5 font-telemetry text-[9px] font-bold border ${
                liveRiskAssessment.isCritical
                  ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
                  : 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
              }`}>
                {liveRiskAssessment.isCritical ? `⚠️ RISK: ${liveRiskAssessment.totalScore}% [CRITICAL >50%]` : `🛡️ RISK: ${liveRiskAssessment.totalScore}% [SAFE <=50%]`}
              </span>
            </div>

            <div className="flex items-center gap-2 font-telemetry text-[11px]">
              {/* Quick Pinpoint Target Area Button */}
              <button
                type="button"
                onClick={handlePinpointTarget}
                className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MapPin className="w-3 h-3 text-cyan-400" />
                <span>Pinpoint Target Area</span>
              </button>

              {/* Quick Focus: Official Government Alert */}
              <button
                onClick={() => {
                  setMapFocusedTarget({
                    coords: [epicenter.lat, epicenter.lng],
                    id: 'official-govt-focus',
                    type: 'epicenter',
                    basin: basin,
                    rain: rainfall,
                    zoom: 13
                  });
                }}
                className="px-2.5 py-1 bg-red-950/70 hover:bg-red-900 border border-red-500/60 text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Crosshair className="w-3 h-3 text-red-400" />
                <span>Focus Govt Epicenter</span>
              </button>

              {/* Clear Reticle */}
              {mapFocusedTarget && (
                <button
                  onClick={() => setMapFocusedTarget(null)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-colors cursor-pointer"
                >
                  Clear Reticle
                </button>
              )}
            </div>
          </div>

          {/* Map Canvas Embed with Simulation Target Pinpoint */}
          <div className="h-[380px] md:h-[440px] w-full relative overflow-hidden">
            <GisMapCanvas
              selectedSectorCoords={mapCenterCoords}
              focusedTarget={mapFocusedTarget}
              customPreviewTiers={(isOfficialActive || mapFocusedTarget?.id === 'official-govt-preview') ? formattedGovtPreviewTiers : null}
              customPreviewEpicenter={(isOfficialActive || mapFocusedTarget?.id === 'official-govt-preview') ? epicenter : null}
              customAiPreviewZones={activePredictionData ? formattedAiPreviewZones : null}
              simulationTarget={{
                lat: activeTargetStation.lat,
                lng: activeTargetStation.lng,
                name: activeTargetStation.name,
                stationId: activeTargetStation.id,
                riskScore: liveRiskAssessment.totalScore,
                isCritical: liveRiskAssessment.isCritical
              }}
              onClearFocus={() => setMapFocusedTarget(null)}
            />
          </div>
        </div>

        {/* SECTION 2: DUAL COMMAND & SIMULATION CONTROLS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* PANEL 1: OFFICIAL GOVERNMENT EMERGENCY DIRECTIVE (7 Cols) */}
          <div className={`lg:col-span-7 p-6 border space-y-6 shadow-xl ${
            isDark ? 'bg-[#0f131b] border-[#27303e]' : 'bg-white border-[#cbd5e1]'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
              <div className="flex items-center gap-2 font-headline font-bold text-sm text-[#D32F2F] uppercase tracking-wide">
                <ShieldAlert className="w-5 h-5 text-[#D32F2F]" />
                <span>1. Official Government Directive & Cordon Radius</span>
              </div>
              <span className="font-telemetry text-[10px] text-slate-400 uppercase">
                ADMIN AUTHORIZATION REQUIRED
              </span>
            </div>

            {/* Issuing Authority Select */}
            <div>
              <label className="block font-label text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Promulgating Authority (Government Order)
              </label>
              <select
                value={authority}
                onChange={(e) => setAuthority(e.target.value)}
                className={`w-full border px-3 py-2 text-xs font-body focus:outline-none focus:border-[#D32F2F] ${
                  isDark ? 'bg-[#0a0e15] border-[#27303e] text-slate-200' : 'bg-[#f8fafc] border-[#cbd5e1] text-slate-800'
                }`}
              >
                <option>North Eastern Council (NEC) & ASDMA</option>
                <option>Assam State Disaster Management Authority (ASDMA)</option>
                <option>Meghalaya State Disaster Management Authority (MSDMA)</option>
                <option>Disaster Management & Rehabilitation (DM&R) Mizoram</option>
                <option>Nagaland State Disaster Management Authority (NSDMA)</option>
                <option>Manipur State Disaster Management Authority (SDMA)</option>
                <option>Arunachal Pradesh Disaster Management Authority (APDMA)</option>
                <option>Tripura State Disaster Management Authority (TDMA)</option>
                <option>National Disaster Management Authority (NDMA) & NEOC</option>
              </select>
            </div>

            {/* Catchment Basin Select */}
            <div>
              <label className="block font-label text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Designated Disaster Sector & Ground Zero
              </label>
              <select
                value={selectedStationId}
                onChange={(e) => handleBasinSelect(e.target.value)}
                className={`w-full border px-3 py-2 text-xs font-body focus:outline-none focus:border-[#D32F2F] ${
                  isDark ? 'bg-[#0a0e15] border-[#27303e] text-slate-200' : 'bg-[#f8fafc] border-[#cbd5e1] text-slate-800'
                }`}
              >
                {SECTOR_STATIONS.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name} [{station.lat.toFixed(2)}°N, {station.lng.toFixed(2)}°E]
                  </option>
                ))}
              </select>
            </div>

            {/* Rainfall & Threat Level Slider */}
            <div className="space-y-2">
              <div className="flex justify-between font-label text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span>Precipitation Severity & Threshold:</span>
                <span className="text-[#D32F2F] font-telemetry text-xs font-extrabold">{rainfall} mm/hr</span>
              </div>
              <Slider
                min={10}
                max={250}
                step={5}
                value={rainfall}
                onChange={(e, val) => {
                  setRainfall(val);
                  if (val >= 150) setDefconLevel('DEFCON 1 // IMMINENT SURGE');
                  else if (val >= 80) setDefconLevel('DEFCON 2 // MONSOON PROTOCOL ACTIVE');
                  else setDefconLevel('DEFCON 3 // ELEVATED VIGILANCE');
                }}
                sx={{
                  color: '#D32F2F',
                  height: 6,
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                    borderRadius: 0,
                    backgroundColor: '#D32F2F',
                    border: '2px solid #ffffff',
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0 0 0 8px rgba(211, 47, 47, 0.16)',
                    },
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: isDark ? '#334155' : '#cbd5e1',
                  },
                }}
              />
              <div className="flex justify-between font-telemetry text-[10px] text-slate-500">
                <span>Light (&lt;65 mm/h)</span>
                <span>Heavy (65–100 mm/h)</span>
                <span className="text-red-400 font-bold">Cloudburst (&gt;100 mm/h)</span>
              </div>
            </div>

            {/* DYNAMIC IMPACT RADIUS FORMULA & CORDON PROJECTION */}
            <div className="p-4 bg-red-950/20 border border-red-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-headline font-bold text-xs text-red-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-red-400" />
                  Calculated Concentric Impact Radius Cordons
                </span>
                <button
                  type="button"
                  onClick={handlePreviewGovtRadius}
                  className="px-2 py-0.5 bg-red-900/40 hover:bg-red-800/60 border border-red-500/50 text-[10px] font-telemetry text-red-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>Preview On Map</span>
                </button>
              </div>

              {/* 4-Tier Radius Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-telemetry text-xs">
                {/* Zone 1: Hard Most */}
                <div className="p-2.5 bg-black/40 border border-red-600/60">
                  <div className="text-[10px] text-red-400 font-bold uppercase">Zone 1 (Hard Most)</div>
                  <div className="text-lg font-extrabold text-white">{govtRadiusTiers.z1.km} <span className="text-xs text-red-300 font-normal">km</span></div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Ground Zero Core</div>
                </div>

                {/* Zone 2: Most */}
                <div className="p-2.5 bg-black/40 border border-orange-500/50">
                  <div className="text-[10px] text-orange-400 font-bold uppercase">Zone 2 (Most)</div>
                  <div className="text-lg font-extrabold text-white">{govtRadiusTiers.z2.km} <span className="text-xs text-orange-300 font-normal">km</span></div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Severe Inundation</div>
                </div>

                {/* Zone 3: Some */}
                <div className="p-2.5 bg-black/40 border border-amber-500/50">
                  <div className="text-[10px] text-amber-400 font-bold uppercase">Zone 3 (Some)</div>
                  <div className="text-lg font-extrabold text-white">{govtRadiusTiers.z3.km} <span className="text-xs text-amber-300 font-normal">km</span></div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Moderate Creep</div>
                </div>

                {/* Zone 4: Negligible / Advisory */}
                <div className="p-2.5 bg-black/40 border border-cyan-500/50">
                  <div className="text-[10px] text-cyan-400 font-bold uppercase">Zone 4 (Periphery)</div>
                  <div className="text-lg font-extrabold text-white">{govtRadiusTiers.z4.km} <span className="text-xs text-cyan-300 font-normal">km</span></div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Advisory Buffer</div>
                </div>
              </div>

              <div className="text-[10px] font-telemetry text-slate-400 flex items-center justify-between pt-1">
                <span>Model Equation: <code className="text-red-300 font-mono">Z₁ = (Rain × 28) + 600m</code></span>
                <span className="text-red-300 font-bold">Total Evacuation Reach: {govtRadiusTiers.z4.km} km</span>
              </div>
            </div>

            {/* Severed Arterial Lifelines Check */}
            <div>
              <label className="block font-label text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Severed Transport Arteries / Detour Cordon
              </label>
              <div className="space-y-1.5 p-2 bg-black/30 border border-slate-800 text-xs font-body">
                {severedRoads.map((road, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 bg-amber-500 rounded-none shrink-0" />
                    <span>{road}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coordinates Lat / Lng */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700/40 font-telemetry text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Ground Zero Latitude:</span>
                <span className="font-bold text-slate-300">{epicenter.lat.toFixed(4)}°N</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Ground Zero Longitude:</span>
                <span className="font-bold text-slate-300">{epicenter.lng.toFixed(4)}°E</span>
              </div>
            </div>

            {/* Active Directive Live Countdown Banner */}
            {isOfficialActive && remainingAlertSeconds !== null && (
              <div className="p-3 bg-red-950/70 border-2 border-red-500 text-red-200 animate-pulse flex items-center justify-between font-telemetry text-xs shadow-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-400 animate-spin" />
                  <span className="font-bold uppercase tracking-wider">Active Directive Countdown:</span>
                </div>
                <div className="text-base font-black text-white bg-red-900 px-3 py-0.5 border border-red-400 font-mono tracking-wider">
                  {formatCountdown(remainingAlertSeconds)}
                </div>
              </div>
            )}

            {/* Official Alert Broadcast Timeout Configuration (Range: 20s - 1800s / 30 min) */}
            <div className={`p-3 border space-y-2.5 ${isDark ? 'bg-red-950/20 border-red-900/50' : 'bg-red-50 border-red-200'}`}>
              <div className="flex justify-between items-center text-xs">
                <span className="font-label text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-red-400" />
                  Official Alert Display Timeout:
                </span>
                <span className="font-telemetry font-bold text-[#D32F2F] text-xs">
                  {Math.floor(govtTimeoutSeconds / 60)}m {govtTimeoutSeconds % 60}s ({govtTimeoutSeconds}s)
                </span>
              </div>

              {/* Quick Presets: 20s, 1m, 5m, 15m, 30m */}
              <div className="grid grid-cols-5 gap-1 pt-1">
                {[
                  { label: '20s', val: 20 },
                  { label: '1 min', val: 60 },
                  { label: '5 min', val: 300 },
                  { label: '15 min', val: 900 },
                  { label: '30 min', val: 1800 }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setGovtTimeoutSeconds(preset.val)}
                    className={`py-1 px-1 text-[10px] font-telemetry border transition-all cursor-pointer ${
                      govtTimeoutSeconds === preset.val
                        ? 'bg-[#D32F2F] border-red-400 text-white font-bold'
                        : isDark
                          ? 'bg-black/40 border-red-900/50 text-slate-400 hover:text-white'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <Slider
                min={20}
                max={1800}
                step={10}
                value={govtTimeoutSeconds}
                onChange={(e, val) => setGovtTimeoutSeconds(val)}
                sx={{
                  color: '#D32F2F',
                  height: 6,
                  '& .MuiSlider-thumb': {
                    width: 14,
                    height: 14,
                    borderRadius: 0,
                    backgroundColor: '#D32F2F',
                    border: '2px solid #ffffff',
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0 0 0 8px rgba(211, 47, 47, 0.16)',
                    },
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: isDark ? '#334155' : '#cbd5e1',
                  },
                }}
              />
              <div className="flex justify-between font-telemetry text-[9px] text-slate-500">
                <span>Min: 20 sec</span>
                <span>Persistent in LocalStorage</span>
                <span>Max: 30 min (1800s)</span>
              </div>
            </div>

            {/* Government Promulgation Buttons */}
            <div className="pt-4 border-t border-slate-700/50 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handlePromulgateOfficial}
                disabled={isBroadcastingOfficial}
                className="flex-1 flex items-center justify-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] disabled:bg-slate-800 text-white font-headline text-xs font-bold py-3 px-6 transition-all shadow-lg hover:shadow-red-600/30 cursor-pointer border border-[#B71C1C]"
              >
                {isBroadcastingOfficial ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>DECLARE & BROADCAST OFFICIAL GOVERNMENT EMERGENCY</span>
                  </>
                )}
              </button>

              {isOfficialActive && (
                <button
                  onClick={handleRevokeOfficial}
                  disabled={isRevokingOfficial}
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-headline text-xs font-bold py-3 px-4 border border-slate-600 cursor-pointer transition-colors"
                >
                  {isRevokingOfficial ? (
                    <div className="animate-spin h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>STAND DOWN / REVOKE</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* PANEL 2: LIVE AI REAL-TIME PREDICTION & CUSTOM WEATHER ENGINE (5 Cols) */}
          <div className={`lg:col-span-5 p-6 border space-y-6 shadow-xl flex flex-col justify-between ${
            isDark ? 'bg-[#0f131b] border-[#27303e]' : 'bg-white border-[#cbd5e1]'
          }`}>
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-700/50 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2 font-headline font-bold text-sm text-[#7B1FA2] uppercase tracking-wide">
                  <Cpu className="w-5 h-5 text-purple-400 animate-pulse" />
                  <span>2. AI Real-Time Prediction Simulator</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-950/60 border border-purple-800/80 text-[10px] font-telemetry text-purple-300">
                    <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
                    <span>Auto-Refresh:</span>
                    <strong className="text-cyan-300 font-mono">{aiRefreshCountdown}s</strong>
                  </div>
                  <div className="flex items-center gap-1 bg-black/40 p-0.5 border border-purple-900/50">
                    <button
                      type="button"
                      onClick={() => setAiWeatherMode('custom')}
                      className={`px-2 py-0.5 text-[10px] font-telemetry font-bold uppercase transition-colors ${
                        aiWeatherMode === 'custom' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Custom Weather
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiWeatherMode('live')}
                      className={`px-2 py-0.5 text-[10px] font-telemetry font-bold uppercase transition-colors ${
                        aiWeatherMode === 'live' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Live Open-Meteo
                    </button>
                  </div>
                </div>
              </div>

              {/* HISTORICAL DISASTER CROSS-CHECK & RISK BANNER */}
              <div className={`p-3 border font-telemetry text-xs space-y-1.5 transition-colors ${
                liveRiskAssessment.isCritical
                  ? 'bg-red-950/30 border-red-500/60 text-red-300'
                  : 'bg-emerald-950/20 border-emerald-500/50 text-emerald-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 uppercase text-[11px]">
                    {liveRiskAssessment.isCritical ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
                        <span>HISTORICAL DISASTER PRECEDENT: CRITICAL</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span>HISTORICAL DISASTER PRECEDENT: SAFE</span>
                      </>
                    )}
                  </span>
                  <strong className={`px-2 py-0.5 text-xs font-black ${
                    liveRiskAssessment.isCritical ? 'bg-red-900 text-white' : 'bg-emerald-900 text-white'
                  }`}>
                    {liveRiskAssessment.totalScore}% RISK SCORE
                  </strong>
                </div>

                <div className="grid grid-cols-4 gap-1 text-[10px] pt-1 border-t border-slate-700/50 text-slate-300">
                  <div>Rain: <strong>{liveRiskAssessment.rainScore}/45</strong></div>
                  <div>Soil: <strong>{liveRiskAssessment.soilScore}/35</strong></div>
                  <div>Wind: <strong>{liveRiskAssessment.windScore}/10</strong></div>
                  <div>Precedent: <strong>{liveRiskAssessment.historicalPrecedentScore}/10</strong></div>
                </div>

                {liveRiskAssessment.nearestEvent && (
                  <div className="text-[10px] text-amber-300/90 pt-0.5 font-telemetry flex items-center gap-1">
                    <span>🏛️ Analogous Event:</span>
                    <strong>{liveRiskAssessment.nearestEvent.name} ({liveRiskAssessment.nearestEvent.year})</strong>
                    <span className="text-slate-400">[{liveRiskAssessment.nearestEvent.type}]</span>
                  </div>
                )}

                <p className="text-[10px] pt-1 text-slate-400">
                  {liveRiskAssessment.summary || (liveRiskAssessment.isCritical
                    ? '⚠️ Risk exceeds 50% critical threshold. Historical records indicate catastrophic talus shear. AI will project surge expansion.'
                    : '🛡️ Conditions <= 50% threshold. Historical records prove no imminent disaster. Fake predictions are suppressed.')}
                </p>
              </div>

              {/* INTERACTIVE CUSTOM WEATHER INPUT CONTROLS */}
              {aiWeatherMode === 'custom' ? (
                <div className="space-y-4">
                  {/* City / Station Selector */}
                  <div>
                    <label className="block font-label text-[11px] font-bold uppercase tracking-wider text-purple-300 mb-1.5 flex items-center justify-between">
                      <span>Target Mountain Corridor / Basin:</span>
                      <span className="text-[10px] text-cyan-300 font-telemetry flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Pinpoint at [{activeTargetStation.lat.toFixed(2)}°N, {activeTargetStation.lng.toFixed(2)}°E]
                      </span>
                    </label>
                    <select
                      value={simStationId}
                      onChange={(e) => setSimStationId(e.target.value)}
                      className={`w-full border px-3 py-2 text-xs font-body focus:outline-none focus:border-purple-500 ${
                        isDark ? 'bg-[#0a0e15] border-purple-900/60 text-slate-200' : 'bg-[#f8fafc] border-purple-300 text-slate-800'
                      }`}
                    >
                      {SECTOR_STATIONS.map((station) => (
                        <option key={station.id} value={station.id}>
                          {station.name} [{station.lat.toFixed(2)}°N, {station.lng.toFixed(2)}°E]
                        </option>
                      ))}
                    </select>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleLockMonitoredStation}
                        disabled={isLockingStation}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/50 text-purple-200 text-xs font-headline font-bold transition-all cursor-pointer shadow-sm"
                      >
                        {isLockingStation ? (
                          <div className="animate-spin h-3.5 w-3.5 border-2 border-purple-300 border-t-transparent rounded-full" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span>LOCK 12s AI MONITORING TO THIS CORRIDOR</span>
                      </button>
                      <span className="text-[10px] text-slate-400 font-telemetry">
                        Stops random city-hopping
                      </span>
                    </div>
                  </div>

                  {/* Rainfall Condition Presets & Custom Slider */}
                  <div className="p-3 bg-purple-950/20 border border-purple-800/40 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-label text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1">
                        <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                        Simulated Rainfall:
                      </span>
                      <span className="font-telemetry font-bold text-red-400 text-xs">
                        {simRainfall} mm/hr ({simRainCondition})
                      </span>
                    </div>

                    {/* Quick presets */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {[
                        { label: 'Moderate', val: 35, condition: 'Moderate Rainfall' },
                        { label: 'Heavy', val: 95, condition: 'Heavy Rainfall' },
                        { label: 'Severe', val: 160, condition: 'Severe Downpour' },
                        { label: 'Cloudburst', val: 240, condition: 'Critical Cloudburst' }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setSimRainfall(preset.val);
                            setSimRainCondition(preset.condition);
                          }}
                          className={`py-1 px-1 text-[10px] font-telemetry border transition-all ${
                            simRainfall === preset.val
                              ? 'bg-purple-600 border-purple-400 text-white font-bold'
                              : 'bg-black/30 border-purple-900/50 text-slate-400 hover:text-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <Slider
                      min={10}
                      max={300}
                      step={5}
                      value={simRainfall}
                      onChange={(e, val) => {
                        setSimRainfall(val);
                        if (val >= 180) setSimRainCondition('Critical Cloudburst');
                        else if (val >= 110) setSimRainCondition('Severe Downpour');
                        else if (val >= 60) setSimRainCondition('Heavy Rainfall');
                        else setSimRainCondition('Moderate Rainfall');
                      }}
                      sx={{
                        color: '#9C27B0',
                        height: 6,
                        '& .MuiSlider-thumb': {
                          width: 16,
                          height: 16,
                          borderRadius: 0,
                          backgroundColor: '#9C27B0',
                          border: '2px solid #ffffff',
                          '&:hover, &.Mui-focusVisible': {
                            boxShadow: '0 0 0 8px rgba(156, 39, 176, 0.16)',
                          },
                        },
                        '& .MuiSlider-rail': {
                          backgroundColor: isDark ? '#334155' : '#cbd5e1',
                        },
                      }}
                    />
                  </div>

                  {/* Wind Conditions & Speed Slider */}
                  <div className="p-3 bg-purple-950/20 border border-purple-800/40 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-label text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1">
                        <Wind className="w-3.5 h-3.5 text-cyan-400" />
                        Mountain Wind Conditions:
                      </span>
                      <span className="font-telemetry font-bold text-cyan-400 text-xs">
                        {simWindSpeed} km/h ({simWindCondition})
                      </span>
                    </div>

                    {/* Quick presets */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {[
                        { label: 'Calm', val: 12, condition: 'Calm Mountain Air' },
                        { label: 'Breeze', val: 28, condition: 'Moderate Breeze' },
                        { label: 'High Wind', val: 55, condition: 'High Mountain Winds' },
                        { label: 'Gale Storm', val: 88, condition: 'Gale / Mountain Storm' }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setSimWindSpeed(preset.val);
                            setSimWindCondition(preset.condition);
                          }}
                          className={`py-1 px-1 text-[10px] font-telemetry border transition-all ${
                            simWindSpeed === preset.val
                              ? 'bg-cyan-600 border-cyan-400 text-white font-bold'
                              : 'bg-black/30 border-purple-900/50 text-slate-400 hover:text-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <Slider
                      min={5}
                      max={120}
                      step={5}
                      value={simWindSpeed}
                      onChange={(e, val) => {
                        setSimWindSpeed(val);
                        if (val >= 75) setSimWindCondition('Gale / Mountain Storm');
                        else if (val >= 45) setSimWindCondition('High Mountain Winds');
                        else if (val >= 20) setSimWindCondition('Moderate Breeze');
                        else setSimWindCondition('Calm Mountain Air');
                      }}
                      sx={{
                        color: '#00E5FF',
                        height: 6,
                        '& .MuiSlider-thumb': {
                          width: 16,
                          height: 16,
                          borderRadius: 0,
                          backgroundColor: '#00E5FF',
                          border: '2px solid #ffffff',
                          '&:hover, &.Mui-focusVisible': {
                            boxShadow: '0 0 0 8px rgba(0, 229, 255, 0.16)',
                          },
                        },
                        '& .MuiSlider-rail': {
                          backgroundColor: isDark ? '#334155' : '#cbd5e1',
                        },
                      }}
                    />
                  </div>

                  {/* Soil Moisture Slider */}
                  <div className="p-3 bg-purple-950/20 border border-purple-800/40 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-label text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-amber-400" />
                        Slope Soil Pore Saturation:
                      </span>
                      <span className="font-telemetry font-bold text-amber-400 text-xs">
                        {simSoilPore}%
                      </span>
                    </div>
                    <Slider
                      min={40}
                      max={100}
                      step={0.5}
                      value={simSoilPore}
                      onChange={(e, val) => setSimSoilPore(val)}
                      sx={{
                        color: '#F59E0B',
                        height: 6,
                        '& .MuiSlider-thumb': {
                          width: 16,
                          height: 16,
                          borderRadius: 0,
                          backgroundColor: '#F59E0B',
                          border: '2px solid #ffffff',
                          '&:hover, &.Mui-focusVisible': {
                            boxShadow: '0 0 0 8px rgba(245, 158, 11, 0.16)',
                          },
                        },
                        '& .MuiSlider-rail': {
                          backgroundColor: isDark ? '#334155' : '#cbd5e1',
                        },
                      }}
                    />
                    <div className="flex justify-between font-telemetry text-[9px] text-slate-500">
                      <span>Drained (40%)</span>
                      <span>Saturated (80%)</span>
                      <span className="text-red-400 font-bold">Liquefaction Critical (95%+)</span>
                    </div>
                  </div>

                  {/* Live AI Calculated Runout Radius Card */}
                  <div className="p-3.5 bg-black/40 border border-purple-500/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-headline font-bold text-xs text-purple-300 uppercase tracking-wide">
                        AI Runout Radius Projection
                      </span>
                      <span className={`font-telemetry text-[10px] font-bold px-2 py-0.5 border ${
                        liveRiskAssessment.isCritical
                          ? 'bg-purple-950/80 border-purple-500/60 text-purple-300'
                          : 'bg-slate-900 border-slate-600 text-slate-400'
                      }`}>
                        {liveRiskAssessment.isCritical ? 'T+3H PROJECTION ACTIVE' : 'NO HAZARD PROJECTED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-telemetry">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Projected Runout Radius:</span>
                        <strong className="text-xl font-black text-purple-300">
                          {liveRiskAssessment.isCritical ? `${aiPredictedRunout.predKm} km` : '0.0 km (Safe)'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Wind Convergence Factor:</span>
                        <strong className="text-cyan-300 text-sm">
                          +{aiPredictedRunout.windFactor}% <span className="text-[10px] text-slate-400 font-normal">({aiPredictedRunout.effectiveRain} mm/h eff.)</span>
                        </strong>
                      </div>
                    </div>

                    <div className="text-[10px] font-telemetry text-slate-400 pt-1.5 border-t border-purple-900/40 flex items-center justify-between">
                      <span>Pore Pressure Multiplier: <strong className="text-amber-300">{aiPredictedRunout.expansionMultiplier}x</strong></span>
                      <button
                        type="button"
                        onClick={handlePinpointTarget}
                        className="text-cyan-400 hover:text-white underline text-[10px] cursor-pointer flex items-center gap-1"
                      >
                        <MapPin className="w-2.5 h-2.5" />
                        <span>Pinpoint on Map</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* LIVE OPEN-METEO TELEMETRY STREAM */
                <div className="space-y-4">
                  <div className="p-3 bg-purple-950/20 border border-purple-800/40 space-y-3 font-telemetry text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 uppercase text-[10px]">Data Fetch Source:</span>
                      <span className="text-purple-300 font-bold text-[11px] flex items-center gap-1">
                        <Globe className="w-3 h-3 text-cyan-400" />
                        Open-Meteo API & Ground Sensors
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-900/40 text-[11px]">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Analyzed Station:</span>
                        <strong className="text-white truncate block">
                          {activeMetricsData?.stationName || 'Alaknanda (Chamoli)'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Real Precipitation:</span>
                        <strong className={activeMetricsData?.precipitationMmPerHour > 50 ? 'text-red-400' : 'text-emerald-400'}>
                          {activeMetricsData?.precipitationMmPerHour || 0} mm/hr
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Soil Saturation:</span>
                        <strong className="text-amber-400">
                          {activeMetricsData?.soilMoisturePct || 75.0}%
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Wind Velocity:</span>
                        <strong className="text-cyan-400">
                          {activeMetricsData?.windSpeedKmh || 15} km/h
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Latest AI Prediction Runout Corridor */}
                  <div className="p-3 bg-black/40 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-headline font-bold text-purple-400 uppercase text-[11px]">
                        Projected Runout Horizon
                      </span>
                      <span className={`font-telemetry text-[10px] font-bold ${
                        activePredictionData?.isCritical ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {activePredictionData?.isCritical ? 'CRITICAL THREAT ACTIVE' : 'NOMINAL / SAFE'}
                      </span>
                    </div>
                    <p className="font-body text-xs text-slate-300">
                      {activePredictionData?.isCritical
                        ? `${activePredictionData.radius}. Model identifies talus shear and convective saturation runout.`
                        : 'Current live atmospheric conditions are below the 50% disaster risk threshold. No slope failure projected.'}
                    </p>
                    <div className="font-telemetry text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                      <span>Target: {activePredictionData?.location || activeTargetStation.name}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Strict 50% Rule Protocol Note */}
              <div className="p-2.5 bg-slate-900/60 border border-slate-800 text-[10px] font-body text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-200 font-bold font-headline text-[11px]">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Historical Data Cross-Check Protocol</span>
                </div>
                <p>
                  Every 12 seconds, the AI verifies current atmospheric data against historical Northeast India records (2010–2026). If the calculated disaster risk is <strong>&le; 50%</strong>, no hazard prediction is broadcast. Threat zones are broadcast <strong>only</strong> when risk crosses <strong>50%</strong> or via admin custom input.
                </p>
              </div>
            </div>

            {/* Trigger Predict Cycle Button */}
            <div className="pt-4 border-t border-slate-700/50">
              <button
                onClick={handleRunAiPredictCycle}
                disabled={isPredictingAi}
                className={`w-full flex items-center justify-center gap-2 text-white font-headline text-xs font-bold py-3 px-4 border cursor-pointer transition-all shadow-md ${
                  liveRiskAssessment.isCritical
                    ? 'bg-[#7B1FA2] hover:bg-[#6A1B9A] border-[#9C27B0]'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-300'
                }`}
              >
                {isPredictingAi ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Zap className={`w-4 h-4 ${liveRiskAssessment.isCritical ? 'text-amber-300' : 'text-cyan-400'}`} />
                    <span>
                      {aiWeatherMode === 'custom'
                        ? (liveRiskAssessment.isCritical
                            ? '⚡ INGEST WEATHER & BROADCAST PREDICTED RUNOUT (>50%)'
                            : '⚡ EVALUATE CONDITIONS & VERIFY AGAINST HISTORICAL DATA')
                        : 'RECOLLECT LIVE DATA & VERIFY NOW'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
