import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import {
  Radar,
  AlertTriangle,
  Activity,
  Layers,
  Users,
  Droplets,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  MapPin,
  Crosshair,
  Navigation,
  Locate,
  Cpu
} from 'lucide-react';

export function LeftDrawer({
  isCollapsed = false,
  onToggleCollapse,
  selectedAlertId = null,
  onSelectAlert = null
}) {
  const { isDark } = useTheme();
  const {
    activeHazard,
    reports,
    telemetry,
    alerts,
    isOfficialActive,
    officialAlert,
    predictedAlert
  } = useSocket();

  const [activeTab, setActiveTab] = useState('alerts'); // alerts, sensors, layers, sdrf

  const tabs = [
    { id: 'alerts', label: 'Alerts', icon: Radar },
    { id: 'sensors', label: 'Sensors', icon: Activity },
    { id: 'layers', label: 'Layers', icon: Layers },
    { id: 'sdrf', label: 'Field SDRF', icon: Users }
  ];

  // Collapsed Rail View
  if (isCollapsed) {
    return (
      <aside className={`w-12 h-full z-20 flex flex-col items-center justify-between py-3 px-1 border-r shrink-0 transition-all duration-300 select-none ${
        isDark ? 'bg-[#0f131b] border-[#27303e] text-[#dfe2ed]' : 'bg-[#ffffff] border-[#cbd5e1] text-[#0f172a]'
      }`}>
        {/* Top: Expand Toggle Button */}
        <div className="flex flex-col items-center gap-3 w-full">
          <button
            onClick={onToggleCollapse}
            className={`w-9 h-9 border flex items-center justify-center transition-colors shadow-sm ${
              isDark
                ? 'bg-[#181c23] border-[#27303e] text-cyan-400 hover:border-cyan-500 hover:text-white'
                : 'bg-slate-100 border-[#cbd5e1] text-slate-700 hover:bg-slate-200'
            }`}
            title="Expand Left Window (SECTOR TAC-GARHWAL)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="w-6 h-px bg-slate-700/50 my-1" />

          {/* Vertical Icon Tabs */}
          <div className="flex flex-col items-center gap-2 w-full">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (onToggleCollapse) onToggleCollapse();
                  }}
                  className={`w-9 h-9 border flex items-center justify-center relative transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-[#D32F2F] text-white border-[#B71C1C]'
                        : 'bg-[#0288D1] text-white border-[#01579B]'
                      : isDark
                        ? 'bg-[#181c23] border-[#27303e] text-slate-400 hover:text-cyan-300'
                        : 'bg-slate-50 border-[#cbd5e1] text-slate-600 hover:text-black'
                  }`}
                  title={`${tab.label} (Click to open)`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.id === 'alerts' && reports.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white rounded-full text-[8px] flex items-center justify-center font-bold">
                      {reports.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom: Mini telemetry readout */}
        <div className="flex flex-col items-center gap-1.5 font-telemetry text-[9px] text-slate-400">
          <span className="w-2.5 h-2.5 telemetry-pulse-node" />
          <span className="[writing-mode:vertical-lr] tracking-widest text-slate-500 uppercase font-bold py-1">
            GARHWAL
          </span>
        </div>
      </aside>
    );
  }

  // Expanded View
  return (
    <aside className={`w-[380px] h-full z-20 flex flex-col justify-between p-3 border-r shrink-0 transition-all duration-300 ${
      isDark
        ? 'bg-[#0f131b]/95 border-[#27303e] text-[#dfe2ed]'
        : 'bg-[#ffffff]/95 border-[#cbd5e1] text-[#0f172a]'
    }`}>
      {/* Drawer Header */}
      <div className="space-y-3 shrink-0">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-[#D32F2F] animate-pulse" />
            <div>
              <h2 className="font-headline font-bold text-xs uppercase tracking-widest leading-none">
                SECTOR TAC-GARHWAL
              </h2>
              <p className="font-label text-[10px] text-[#0288D1] font-semibold mt-0.5">
                {activeHazard?.simulatedBasin || 'Alaknanda Valley (Chamoli)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 border font-telemetry text-xs font-bold bg-[#FFEBEE] text-[#B71C1C] border-[#B71C1C]">
              {reports.length} ACTIVE
            </span>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className={`p-1 border transition-colors ${
                  isDark
                    ? 'bg-[#181c23] border-[#27303e] text-slate-400 hover:text-white hover:border-slate-400'
                    : 'bg-slate-100 border-[#cbd5e1] text-slate-700 hover:bg-white hover:text-black'
                }`}
                title="Collapse Left Window"
                aria-label="Collapse Left Window"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Selector Buttons */}
        <div className={`grid grid-cols-4 gap-1 p-0.5 border ${
          isDark ? 'bg-[#0a0e15] border-[#27303e]' : 'bg-[#f1f5f9] border-[#cbd5e1]'
        }`}>
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-1 text-center font-label text-[10px] font-semibold transition-colors ${
                  isSelected
                    ? isDark
                      ? 'bg-[#D32F2F] text-white border border-[#B71C1C] shadow-[0_0_6px_rgba(211,47,47,0.4)]'
                      : 'bg-[#0288D1] text-white border border-[#01579B]'
                    : isDark
                      ? 'text-slate-400 hover:text-[#0288D1]'
                      : 'text-slate-600 hover:text-[#0288D1]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Body (Scrollable) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar my-2.5 space-y-2.5 pr-1">
        {/* TAB 1: ALERTS & INCIDENT STREAM */}
        {activeTab === 'alerts' && (
          <>
            {/* 1. LIVE AI REAL-TIME PREDICTION (T+3H FORECAST STREAM) */}
            {(() => {
              const predData = (predictedAlert && predictedAlert.isCritical !== false)
                ? predictedAlert
                : (activeHazard?.prediction && activeHazard.prediction.isCritical !== false ? activeHazard.prediction : null);
              if (!predData) return null;
              const predLat = predData.coordinates?.lat || 30.4220;
              const predLng = predData.coordinates?.lng || 79.4320;
              const isPredFocused = selectedAlertId === 'ai-predicted-danger';
              const confPct = Math.round((predData.confidence || 0.94) * 100);

              return (
                <div
                  key="ai-predicted-danger"
                  onClick={() => {
                    if (onSelectAlert) {
                      onSelectAlert({
                        id: 'ai-predicted-danger',
                        type: 'prediction',
                        layer: 'predictions',
                        coords: [predLat, predLng],
                        zoom: 12,
                        title: 'LIVE AI CLIMATIC PREDICTION',
                        data: predData
                      });
                    }
                  }}
                  className={`p-3 border transition-all cursor-pointer relative group ${
                    isPredFocused
                      ? 'bg-purple-950/50 border-purple-500 shadow-[0_0_18px_rgba(156,39,176,0.4)] ring-1 ring-purple-500'
                      : isDark
                        ? 'bg-[#15101f] border-purple-800/60 hover:border-purple-400 hover:bg-[#1a1426]'
                        : 'bg-purple-50/70 border-purple-400 hover:border-purple-600 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-purple-400 fill-purple-400 shrink-0 animate-pulse" />
                      <span className="font-headline font-extrabold text-xs uppercase text-purple-400 tracking-wide flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 text-purple-400" />
                        AI REAL-TIME PREDICTION
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 font-telemetry text-[9px] uppercase font-bold bg-purple-950 text-purple-300 border border-purple-600">
                      {confPct}% CONFIDENCE
                    </span>
                  </div>

                  <h3 className="font-headline font-bold text-xs text-white mb-1">
                    {predData.location || 'Forecast Runout Expansion Corridor'}
                  </h3>

                  <p className="font-body text-[11px] text-slate-300 mb-2">
                    Rainfall: <strong className="text-purple-300">{predData.precipitationMmPerHour ?? 0} mm/hr</strong> | Soil Saturation: <strong className="text-amber-400">{predData.soilPoreSaturationPct ?? 75}%</strong>. Runout radius: <strong className="text-white">{predData.radius || '7.8 km'}</strong>.
                  </p>

                  <div className="flex items-center justify-between font-telemetry text-[10px] text-slate-400 pt-1.5 border-t border-purple-900/50">
                    <span className="flex items-center gap-1">
                      <Locate className="w-3 h-3 text-purple-400" />
                      {predLat.toFixed(3)}°N, {predLng.toFixed(3)}°E
                    </span>
                    <span className="flex items-center gap-1 text-purple-400 group-hover:text-purple-300 font-bold">
                      <Crosshair className="w-3 h-3" />
                      {isPredFocused ? 'FOCUSED ON MAP' : 'LOCATE AI RUNOUT'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* 2. OFFICIAL GOVERNMENT EMERGENCY DIRECTIVE (TRIGGERED BY FRONTEND ADMIN) */}
            {isOfficialActive && (officialAlert || activeHazard?.current) ? (() => {
              const currentOfficial = officialAlert || activeHazard?.current;
              const hazardLat = currentOfficial.coordinates?.lat || activeHazard.location?.coordinates?.[1] || 30.4100;
              const hazardLng = currentOfficial.coordinates?.lng || activeHazard.location?.coordinates?.[0] || 79.4200;
              const isEpicenterFocused = selectedAlertId === 'active-hazard-epicenter';
              const leastImpactKm = (currentOfficial.tiers?.[3]?.radiusMeters ? currentOfficial.tiers[3].radiusMeters / 1000 : 30.0).toFixed(1);
              const zone1Km = (currentOfficial.tiers?.[0]?.radiusMeters ? currentOfficial.tiers[0].radiusMeters / 1000 : 5.2).toFixed(1);

              return (
                <div
                  key="active-hazard-epicenter"
                  onClick={() => {
                    if (onSelectAlert) {
                      onSelectAlert({
                        id: 'active-hazard-epicenter',
                        type: 'epicenter',
                        layer: 'zones',
                        coords: [hazardLat, hazardLng],
                        zoom: 11,
                        title: 'OFFICIAL GOVERNMENT EMERGENCY ORDER',
                        basin: activeHazard.simulatedBasin || 'Alaknanda Valley (Chamoli)',
                        rain: activeHazard.rainfallRateMmPerHour || 165
                      });
                    }
                  }}
                  className={`p-3 border transition-all cursor-pointer relative group ${
                    isEpicenterFocused
                      ? 'bg-red-950/40 border-red-500 shadow-[0_0_18px_rgba(211,47,47,0.4)] ring-1 ring-red-500'
                      : isDark
                        ? 'bg-[#181c23] border-[#B71C1C] hover:border-red-400 hover:bg-[#1f242e]'
                        : 'bg-red-50/70 border-red-400 hover:border-red-600 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-500 fill-red-500 shrink-0 animate-ping" />
                      <span className="font-headline font-extrabold text-xs uppercase text-red-400 tracking-wide">
                        PRIMARY DISASTER EPICENTER
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 font-telemetry text-[9px] uppercase font-bold bg-[#FFEBEE] text-[#B71C1C] border border-[#B71C1C]">
                      GROUND ZERO
                    </span>
                  </div>

                  <h3 className="font-headline font-bold text-xs text-white mb-1">
                    {activeHazard.simulatedBasin || 'Alaknanda Valley (Chamoli)'}
                  </h3>

                  <p className="font-body text-[11px] text-slate-300 mb-2">
                    Official Emergency Promulgated by <strong className="text-red-400">{currentOfficial.issued || 'USDMA'}</strong>. Continuous radial gradient impact active from Ground Zero ({zone1Km} km Zone 1) out to perimeter ({leastImpactKm} km).
                  </p>

                  <div className="mb-2 p-1.5 bg-black/40 border border-slate-800 rounded-none">
                    <div className="flex justify-between font-telemetry text-[9px] text-slate-400 mb-1">
                      <span className="text-red-400 font-bold">Epicenter (Max)</span>
                      <span className="text-amber-400">Moderate</span>
                      <span className="text-cyan-400">Least Impact ({leastImpactKm}km)</span>
                    </div>
                    <div className="w-full h-2 rounded-none bg-gradient-to-r from-[#B71C1C] via-[#ED6C02] via-[#FF8F00] to-[#0288D1]" />
                  </div>

                  <div className="flex items-center justify-between font-telemetry text-[10px] text-slate-400 pt-1.5 border-t border-slate-800">
                    <span className="flex items-center gap-1">
                      <Locate className="w-3 h-3 text-red-400" />
                      {hazardLat.toFixed(3)}°N, {hazardLng.toFixed(3)}°E
                    </span>
                    <span className="flex items-center gap-1 text-cyan-400 group-hover:text-cyan-300 font-bold">
                      <Crosshair className="w-3 h-3" />
                      {isEpicenterFocused ? 'FOCUSED ON MAP' : 'CLICK TO LOCATE MAP'}
                    </span>
                  </div>
                </div>
              );
            })() : (
              /* GOVERNMENT DIRECTIVE STANDBY CARD */
              <div className={`p-3 border transition-all ${
                isDark ? 'bg-[#10131a] border-slate-700/60' : 'bg-slate-50 border-slate-300'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-headline font-bold text-xs uppercase text-slate-400 tracking-wide">
                      GOVERNMENT DIRECTIVE
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 font-telemetry text-[9px] uppercase font-bold bg-amber-950/60 text-amber-400 border border-amber-800">
                    STANDBY
                  </span>
                </div>
                <p className="font-body text-[11px] text-slate-400 mb-2">
                  No official government emergency order promulgated yet. State Disaster Authority (USDMA) and NDMA are monitoring live AI predictive feeds.
                </p>
                <Link
                  to="/admin/simulation"
                  className="inline-flex items-center gap-1 font-telemetry text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wide underline"
                >
                  <span>Open Admin Console to Promulgate Directive &rarr;</span>
                </Link>
              </div>
            )}

            {/* BROADCAST ALERTS STREAM */}
            {(alerts || [])
              .filter(a => {
                if (a.alertType === 'official' || a.alertType === 'government') return false;
                if (a.expiresAt && new Date(a.expiresAt).getTime() <= Date.now()) return false;
                return true;
              })
              .map((alertItem, idx) => {
              const alertLat = alertItem.epicenter?.lat || 30.4100;
              const alertLng = alertItem.epicenter?.lng || 79.4200;
              const alertId = alertItem.simulationId || `broadcast-${idx}`;
              const isAlertFocused = selectedAlertId === alertId;

              return (
                <div
                  key={alertId}
                  onClick={() => {
                    if (onSelectAlert) {
                      onSelectAlert({
                        id: alertId,
                        type: 'broadcast',
                        layer: 'zones',
                        coords: [alertLat, alertLng],
                        zoom: 12,
                        data: alertItem
                      });
                    }
                  }}
                  className={`p-2.5 border transition-all cursor-pointer ${
                    isAlertFocused
                      ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_12px_rgba(245,124,0,0.3)] ring-1 ring-amber-500'
                      : isDark
                        ? 'bg-[#181c23] border-[#27303e] hover:border-amber-400'
                        : 'bg-white border-[#cbd5e1] hover:border-amber-400 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-headline font-bold text-xs uppercase text-amber-400">
                        BROADCAST: {alertItem.basinName || 'Regional Storm'}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.2 font-telemetry text-[9px] uppercase font-bold bg-amber-900/50 text-amber-300 border border-amber-600">
                      ALERT
                    </span>
                  </div>
                  <p className="font-body text-xs line-clamp-2 mb-1.5 text-slate-300">
                    Intensity {alertItem.rainfallRateMmPerHour} mm/hr. Concentric zones active across {(alertItem.severedRoads || []).join(', ') || 'arterial lifelines'}.
                  </p>
                  <div className="flex items-center justify-between font-telemetry text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>GRID: {alertLat.toFixed(3)}°N, {alertLng.toFixed(3)}°E</span>
                    <span className="text-cyan-400 flex items-center gap-1">
                      <Crosshair className="w-3 h-3" />
                      {isAlertFocused ? 'FOCUSED' : 'VIEW ON MAP'}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* FIELD INCIDENT REPORTS STREAM */}
            {reports.map((report) => {
              const repLat = report.location?.coordinates?.[1] || 30.4100;
              const repLng = report.location?.coordinates?.[0] || 79.4200;
              const isFocused = selectedAlertId === report._id;

              return (
                <div
                  key={report._id}
                  onClick={() => {
                    if (onSelectAlert) {
                      onSelectAlert({
                        id: report._id,
                        type: 'report',
                        layer: 'reports',
                        coords: [repLat, repLng],
                        zoom: 14,
                        data: report
                      });
                    }
                  }}
                  className={`p-2.5 border transition-all cursor-pointer relative group ${
                    isFocused
                      ? 'bg-cyan-950/30 border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.3)] ring-1 ring-cyan-400'
                      : isDark
                        ? 'bg-[#181c23] border-[#27303e] hover:border-[#D32F2F] hover:bg-[#1a202c]'
                        : 'bg-white border-[#cbd5e1] hover:border-[#D32F2F] shadow-sm'
                  }`}
                  title="Click to redirect map to this incident location"
                >
                  {/* Header: Category & Severity Chip */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <MapPin className={`w-3.5 h-3.5 shrink-0 ${isFocused ? 'text-cyan-400 fill-cyan-400 animate-bounce' : 'text-[#D32F2F] fill-[#FFCDD2]'}`} />
                      <span className="font-headline font-bold text-xs uppercase tracking-tight">
                        {report.category.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isFocused && (
                        <span className="px-1 py-0.2 font-telemetry text-[8px] uppercase font-bold bg-cyan-950 text-cyan-300 border border-cyan-500 animate-pulse">
                          VIEWING
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 font-telemetry text-[9px] uppercase font-bold bg-[#FFEBEE] text-[#B71C1C] border border-[#B71C1C]">
                        {report.severityObserved || 'CRITICAL'}
                      </span>
                    </div>
                  </div>

                  <p className="font-body text-xs line-clamp-2 mb-2 text-slate-300">
                    {report.description}
                  </p>

                  {/* Report Image Thumbnail if present */}
                  {report.mediaUrl && (
                    <div className="w-full h-20 overflow-hidden mb-2 border border-slate-700/60">
                      <img
                        src={report.mediaUrl}
                        alt="Field Telemetry Evidence"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}

                  {/* Footer Coordinates & Redirection Cue */}
                  <div className="flex items-center justify-between font-telemetry text-[10px] text-slate-400 pt-1.5 border-t border-slate-800">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-400" />
                      {repLat.toFixed(3)}°N, {repLng.toFixed(3)}°E
                    </span>
                    <span className={`flex items-center gap-1 font-semibold ${isFocused ? 'text-cyan-300 font-bold' : 'text-slate-400 group-hover:text-cyan-400'}`}>
                      <Crosshair className="w-3 h-3" />
                      {isFocused ? 'FOCUSED ON MAP' : 'LOCATE ON MAP'}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* TAB 2: LIVE SENSORS ARRAY */}
        {activeTab === 'sensors' && (
          <div className="space-y-2">
            {(telemetry.sensors || []).map((sensor) => {
              const sensorCoords = sensor.coords ? [sensor.coords[1], sensor.coords[0]] : [30.4100, 79.4200];
              const isSensorFocused = selectedAlertId === sensor.id;
              return (
                <div
                  key={sensor.id}
                  onClick={() => {
                    if (onSelectAlert) {
                      onSelectAlert({
                        id: sensor.id,
                        type: 'sensor',
                        layer: 'sensors',
                        coords: sensorCoords,
                        zoom: 14,
                        title: sensor.name,
                        data: sensor
                      });
                    }
                  }}
                  className={`p-2.5 border space-y-1.5 cursor-pointer transition-all ${
                    isSensorFocused
                      ? 'bg-emerald-950/40 border-[#00E676] shadow-[0_0_12px_rgba(0,230,118,0.3)] ring-1 ring-[#00E676]'
                      : isDark
                        ? 'bg-[#181c23] border-[#27303e] hover:border-[#00E676]'
                        : 'bg-white border-[#cbd5e1] hover:border-[#00E676] shadow-sm'
                  }`}
                  title="Click to locate sensor on map and enable sensor layer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-headline font-bold text-xs uppercase text-[#0288D1]">
                      {sensor.name}
                    </span>
                    <span className="font-telemetry text-[10px] text-slate-400">
                      {sensor.id}
                    </span>
                  </div>

                  {/* Saturation Gauge Bar */}
                  <div>
                    <div className="flex justify-between font-telemetry text-[10px] mb-0.5">
                      <span>Pore Saturation:</span>
                      <strong className="text-red-400">{sensor.saturation}%</strong>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 border border-slate-700">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-red-500"
                        style={{ width: `${sensor.saturation}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between font-telemetry text-[10px] text-slate-300 pt-1">
                    <span>Displacement Delta:</span>
                    <span className="text-red-400 font-bold">{sensor.displacementDelta || '+14.2 mm/hr'}</span>
                  </div>
                  <div className="flex justify-between font-telemetry text-[10px] text-slate-300">
                    <span>Seismic Frequency:</span>
                    <span className="text-amber-400">{sensor.vibrationHz} Hz</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: GIS LAYERS */}
        {activeTab === 'layers' && (
          <div className="p-3 border space-y-3 font-body text-xs">
            <div className="font-headline font-bold text-xs uppercase text-slate-400">
              Cartographic Vector Layers
            </div>
            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer hover:text-cyan-400 transition-colors">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                  <span>4-Tier Hazard Polygons</span>
                </span>
                <input type="checkbox" defaultChecked className="accent-red-600 cursor-pointer" />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-cyan-400 transition-colors">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                  <span>Severed Road Corridors (NH-58 / NH-107)</span>
                </span>
                <input type="checkbox" defaultChecked className="accent-cyan-600 cursor-pointer" />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-cyan-400 transition-colors">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
                  <span>AI Predictive Runout Zones</span>
                </span>
                <input type="checkbox" defaultChecked className="accent-purple-600 cursor-pointer" />
              </label>
              <label className="flex items-center justify-between cursor-pointer hover:text-cyan-400 transition-colors">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  <span>Geotechnical Telemetry Sensors</span>
                </span>
                <input type="checkbox" defaultChecked className="accent-green-600 cursor-pointer" />
              </label>
            </div>
          </div>
        )}

        {/* TAB 4: FIELD SDRF RESPONSE UNITS */}
        {activeTab === 'sdrf' && (
          <div className="space-y-2">
            <div className={`p-2.5 border ${isDark ? 'bg-[#181c23] border-[#27303e]' : 'bg-white border-[#cbd5e1]'}`}>
              <div className="flex justify-between items-center font-headline text-xs font-bold mb-1">
                <span>SDRF Uttarakhand (Chamoli / Joshimath Unit)</span>
                <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-600 text-[9px]">
                  DEPLOYED
                </span>
              </div>
              <p className="font-body text-xs text-slate-300">
                Positioned at Helang KM 42 cordon on NH-58. Evacuation transport convoys en route to Joshimath Relief Staging area.
              </p>
            </div>

            <div className={`p-2.5 border ${isDark ? 'bg-[#181c23] border-[#27303e]' : 'bg-white border-[#cbd5e1]'}`}>
              <div className="flex justify-between items-center font-headline text-xs font-bold mb-1">
                <span>NDRF 15th Battalion (Rishikesh / Srinagar Detachment)</span>
                <span className="px-1.5 py-0.5 bg-amber-950 text-amber-400 border border-amber-600 text-[9px]">
                  STANDBY
                </span>
              </div>
              <p className="font-body text-xs text-slate-300">
                Standby at Rudraprayag hub equipped with drone LIDAR survey rig & geotechnical excavator units.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer: Quick Telemetry Stat */}
      <div className={`p-2.5 border shrink-0 text-xs font-telemetry ${
        isDark ? 'bg-[#0a0e15] border-[#27303e]' : 'bg-[#f1f5f9] border-[#cbd5e1]'
      }`}>
        <div className="flex justify-between">
          <span className="text-slate-400">Current Precipitation:</span>
          <span className="text-red-400 font-bold">{activeHazard?.rainfallRateMmPerHour || 180} mm/hr</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-slate-400">Zone 1 Evacuation Radius:</span>
          <span className="text-red-400 font-bold">
            {activeHazard?.tiers?.[0]?.radiusMeters ? (activeHazard.tiers[0].radiusMeters / 1000).toFixed(2) : '4.80'} km
          </span>
        </div>
      </div>
    </aside>
  );
}
