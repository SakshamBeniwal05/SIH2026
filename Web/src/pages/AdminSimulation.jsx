import React, { useState } from 'react';
import axios from 'axios';
import { Header } from '../components/common/Header';
import { EvacuationBanner } from '../components/alerts/EvacuationBanner';
import { useTheme } from '../context/ThemeContext';
import {
  CloudRain,
  AlertTriangle,
  Radio,
  Sliders,
  Send,
  Cpu,
  CheckCircle2,
  Layers,
  Compass
} from 'lucide-react';

export function AdminSimulation() {
  const { isDark } = useTheme();

  const [basin, setBasin] = useState('Alaknanda Valley (Chamoli / Joshimath)');
  const [rainfall, setRainfall] = useState(165);
  const [epicenter, setEpicenter] = useState({ lat: 30.4100, lng: 79.4200 });
  const [durationHours, setDurationHours] = useState(3);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastLog, setBroadcastLog] = useState(null);

  const handleSimulateAndBroadcast = async () => {
    setIsBroadcasting(true);
    setBroadcastLog(null);
    try {
      const response = await axios.post('/api/simulation/trigger-rain', {
        basinName: basin,
        rainfallRateMmPerHour: rainfall,
        epicenter,
        simulatedDurationHours: durationHours
      });

      const z1RadiusKm = response.data.calculatedTiers?.[0]?.radiusKm || (rainfall * 0.035).toFixed(2);

      setBroadcastLog({
        status: 'SUCCESS',
        message: `Crisis Alert Broadcasted! Event ID: ${response.data.simulationId}. Hard Most Radius: ${z1RadiusKm} km. Concentric zones published over WebSocket.`,
        data: response.data
      });
    } catch (err) {
      setBroadcastLog({
        status: 'ERROR',
        message: `Broadcast Failure: ${err.response?.data?.message || err.message}`
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleTriggerAiRecalculation = async () => {
    try {
      setBroadcastLog({
        status: 'INFO',
        message: 'Invoking autonomous Gemini ReAct Agent to recalculate hazard boundaries...'
      });
      const res = await axios.post('/api/ai/recalculate-risk', {
        rainfallRate: rainfall,
        basinName: basin
      });
      setBroadcastLog({
        status: 'SUCCESS',
        message: 'AI ReAct Agent recalculated hazard contours based on current precipitation and report density!'
      });
    } catch (err) {
      setBroadcastLog({
        status: 'ERROR',
        message: `AI Evaluation Error: ${err.message}`
      });
    }
  };

  return (
    <div className={`min-h-screen pt-12 flex flex-col transition-colors ${
      isDark ? 'bg-[#0a0e15] text-[#dfe2ed]' : 'bg-[#f8fafc] text-[#0f172a]'
    }`}>
      <Header />
      <EvacuationBanner />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Title Header */}
        <div className="pb-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <Radio className="w-7 h-7 text-[#D32F2F] animate-pulse" />
            <h1 className="font-headline font-extrabold text-xl md:text-2xl tracking-wider uppercase">
              CRISIS SIMULATION & BROADCAST CONSOLE
            </h1>
          </div>
          <p className="font-body text-xs text-slate-400 mt-1">
            Open URL Demo Access: Calibrate synthetic precipitation regimes, simulate cloudburst intensity, and broadcast live alerts to connected Web & Mobile terminals.
          </p>
        </div>

        {/* Configuration Card */}
        <div className={`p-6 border space-y-6 shadow-xl ${
          isDark ? 'bg-[#0f131b] border-[#27303e]' : 'bg-white border-[#cbd5e1]'
        }`}>
          <div className="flex items-center gap-2 font-headline font-bold text-sm text-amber-400 uppercase tracking-wide">
            <CloudRain className="w-5 h-5 text-amber-400" />
            <span>1. Configure Synthetic Rainfall Regimes</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Catchment Basin Select */}
            <div>
              <label className="block font-label text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Target Catchment / Basin
              </label>
              <select
                value={basin}
                onChange={(e) => {
                  const val = e.target.value;
                  setBasin(val);
                  if (val.includes('Alaknanda')) setEpicenter({ lat: 30.4100, lng: 79.4200 });
                  if (val.includes('Mandakini')) setEpicenter({ lat: 30.7300, lng: 79.0600 });
                  if (val.includes('Bhagirathi')) setEpicenter({ lat: 30.7300, lng: 78.4400 });
                  if (val.includes('Song')) setEpicenter({ lat: 30.3165, lng: 78.0322 });
                  if (val.includes('Pithoragarh')) setEpicenter({ lat: 29.9800, lng: 80.7500 });
                }}
                className={`w-full border px-3 py-2 text-xs font-body focus:outline-none focus:border-[#D32F2F] ${
                  isDark ? 'bg-[#0a0e15] border-[#27303e] text-slate-200' : 'bg-[#f8fafc] border-[#cbd5e1] text-slate-800'
                }`}
              >
                <option>Alaknanda Valley (Chamoli / Joshimath)</option>
                <option>Mandakini Basin (Kedarnath / Rudraprayag)</option>
                <option>Bhagirathi Valley (Uttarkashi / Silkyara)</option>
                <option>Song River Basin (Maldevta / Dehradun)</option>
                <option>Pithoragarh & Kali Valley (Malpa / Dharchula)</option>
              </select>
            </div>

            {/* Rainfall Intensity Slider */}
            <div>
              <div className="flex justify-between font-label text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                <span>Precipitation Accumulation:</span>
                <span className="text-[#D32F2F] font-telemetry text-xs font-extrabold">{rainfall} mm/hr</span>
              </div>
              <input
                type="range"
                min="10"
                max="250"
                step="5"
                value={rainfall}
                onChange={(e) => setRainfall(Number(e.target.value))}
                className="w-full accent-red-600 cursor-pointer h-2 bg-slate-700"
              />
              <div className="flex justify-between font-telemetry text-[10px] text-slate-500 mt-1.5">
                <span>Light (10 mm/h)</span>
                <span>Heavy (65 mm/h)</span>
                <span className="text-red-400 font-bold">Cloudburst (&gt;100 mm/h)</span>
              </div>
            </div>
          </div>

          {/* Coordinates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-700/40">
            <div>
              <label className="block font-label text-[10px] font-bold uppercase text-slate-400 mb-1">
                Epicenter Latitude
              </label>
              <input
                type="number"
                step="0.001"
                value={epicenter.lat}
                onChange={(e) => setEpicenter(prev => ({ ...prev, lat: Number(e.target.value) }))}
                className={`w-full border px-3 py-1.5 font-telemetry text-xs focus:outline-none ${
                  isDark ? 'bg-[#0a0e15] border-[#27303e]' : 'bg-[#f8fafc] border-[#cbd5e1]'
                }`}
              />
            </div>
            <div>
              <label className="block font-label text-[10px] font-bold uppercase text-slate-400 mb-1">
                Epicenter Longitude
              </label>
              <input
                type="number"
                step="0.001"
                value={epicenter.lng}
                onChange={(e) => setEpicenter(prev => ({ ...prev, lng: Number(e.target.value) }))}
                className={`w-full border px-3 py-1.5 font-telemetry text-xs focus:outline-none ${
                  isDark ? 'bg-[#0a0e15] border-[#27303e]' : 'bg-[#f8fafc] border-[#cbd5e1]'
                }`}
              />
            </div>
          </div>

          {/* Action Triggers */}
          <div className="pt-4 border-t border-slate-700/50 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSimulateAndBroadcast}
              disabled={isBroadcasting}
              className="flex-1 flex items-center justify-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] disabled:bg-slate-800 text-white font-headline text-xs font-bold py-3 px-6 transition-all shadow-lg hover:shadow-red-600/30 cursor-pointer border border-[#B71C1C]"
            >
              {isBroadcasting ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Broadcast Live Alert to All Web & Mobile Clients</span>
                </>
              )}
            </button>

            <button
              onClick={handleTriggerAiRecalculation}
              className="flex items-center justify-center gap-2 bg-[#0288D1] hover:bg-[#0277BD] text-white font-headline text-xs font-bold py-3 px-4 border border-[#01579B] cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>Trigger AI ReAct Recalculation</span>
            </button>
          </div>
        </div>

        {/* Live Broadcast Feedback Log */}
        {broadcastLog && (
          <div className={`p-4 border font-telemetry text-xs flex items-center gap-3 ${
            broadcastLog.status === 'SUCCESS'
              ? 'bg-[#10131b] border-emerald-500 text-emerald-400'
              : broadcastLog.status === 'ERROR'
                ? 'bg-red-950/50 border-red-500 text-red-300'
                : 'bg-cyan-950/50 border-cyan-500 text-cyan-300'
          }`}>
            <span className="w-2.5 h-2.5 rounded-none bg-emerald-500 animate-ping" />
            <span>{broadcastLog.message}</span>
          </div>
        )}
      </main>
    </div>
  );
}
