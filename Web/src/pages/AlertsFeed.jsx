import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { EvacuationBanner } from '../components/alerts/EvacuationBanner';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import {
  AlertTriangle,
  ShieldAlert,
  Compass,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Flame,
  Radio,
  Crosshair
} from 'lucide-react';

export function AlertsFeed() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { activeHazard, reports, alerts } = useSocket();

  const [selectedFilter, setSelectedFilter] = useState('ALL'); // ALL, ZONE1, ZONE2, ZONE3, ZONE4

  const filterChips = [
    { id: 'ALL', label: 'All Alerts' },
    { id: 'ZONE1', label: 'Zone 1: Hard Most', color: '#D32F2F', fill: '#FFEBEE' },
    { id: 'ZONE2', label: 'Zone 2: Most', color: '#ED6C02', fill: '#FFF3E0' },
    { id: 'ZONE3', label: 'Zone 3: Some', color: '#F57C00', fill: '#FFF8E1' },
    { id: 'ZONE4', label: 'Zone 4: Advisory', color: '#0288D1', fill: '#E1F5FE' }
  ];

  // Combined alert stream from broadcast simulation and citizen reports
  const allEvents = [
    ...(alerts || [])
      .filter(a => !a.expiresAt || new Date(a.expiresAt).getTime() > Date.now())
      .map(a => ({
        id: a.simulationId || `sim-${Math.random()}`,
        title: `${a.alertType === 'official' ? 'GOVERNMENT DIRECTIVE' : 'BROADCAST ALERT'}: ${a.basinName || 'Regional Storm Event'}`,
        description: `Precipitation rate of ${a.rainfallRateMmPerHour} mm/hr triggered concentric hazard zones. Evacuation mandated for Zone 1 Ground Zero. Affected lifelines: ${(a.severedRoads || []).join(', ')}.`,
        tier: 'Hard Most',
        zoneNum: 'ZONE1',
        severity: 'CRITICAL',
        timestamp: a.timestamp || new Date().toISOString(),
        source: a.issuingAuthority || 'Admin Radar Simulation',
        coords: a.epicenter ? [a.epicenter.lat, a.epicenter.lng] : [30.41, 79.42]
      })),
    ...reports.map(r => ({
      id: r._id,
      title: `FIELD INCIDENT: ${r.category.replace('_', ' ').toUpperCase()}`,
      description: r.description,
      tier: r.severityObserved === 'critical' ? 'Hard Most' : r.severityObserved === 'severe' ? 'Most' : 'Some',
      zoneNum: r.severityObserved === 'critical' ? 'ZONE1' : r.severityObserved === 'severe' ? 'ZONE2' : 'ZONE3',
      severity: r.severityObserved?.toUpperCase() || 'SEVERE',
      timestamp: r.createdAt,
      mediaUrl: r.mediaUrl,
      source: 'Crowdsourced Field Observer',
      coords: r.location?.coordinates ? [r.location.coordinates[1], r.location.coordinates[0]] : [30.41, 79.42]
    }))
  ];

  const filteredEvents = allEvents.filter(ev => {
    if (selectedFilter === 'ALL') return true;
    return ev.zoneNum === selectedFilter;
  });

  return (
    <div className={`min-h-screen pt-12 flex flex-col transition-colors ${
      isDark ? 'bg-[#0a0e15] text-[#dfe2ed]' : 'bg-[#f8fafc] text-[#0f172a]'
    }`}>
      <Header />
      <EvacuationBanner />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-700/50 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-none telemetry-pulse-node" />
              <h1 className="font-headline font-extrabold text-xl md:text-2xl tracking-wider uppercase">
                TACTICAL ALERT & DIRECTIVE FEED
              </h1>
            </div>
            <p className="font-body text-xs text-slate-400 mt-1">
              Live multi-tier disaster alerts, evacuation mandates, and lifeline detour vectors.
            </p>
          </div>

          <div className="flex items-center gap-2 font-telemetry text-xs">
            <span className="px-2 py-1 bg-[#FFEBEE] text-[#B71C1C] border border-[#B71C1C] font-bold">
              {filteredEvents.length} ACTIVE DIRECTIVES
            </span>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 font-label text-xs">
          <span className="flex items-center gap-1 text-slate-400 text-xs mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>
          {filterChips.map(chip => {
            const isSelected = selectedFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedFilter(chip.id)}
                className={`px-3 py-1 border font-bold uppercase transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#D32F2F] text-white border-[#B71C1C] shadow-[0_0_8px_rgba(211,47,47,0.4)]'
                    : isDark
                      ? 'bg-[#181c23] text-slate-300 border-[#27303e] hover:border-slate-500'
                      : 'bg-white text-slate-700 border-[#cbd5e1] hover:bg-slate-50'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Alert Cards Stream */}
        <div className="space-y-4">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => (
              <article
                key={event.id}
                className={`p-4 border transition-all ${
                  event.tier === 'Hard Most'
                    ? isDark
                      ? 'bg-[#181c23] border-[#B71C1C] shadow-[0_0_15px_rgba(183,28,28,0.2)]'
                      : 'bg-white border-[#B71C1C] shadow-md'
                    : isDark
                      ? 'bg-[#181c23] border-[#27303e]'
                      : 'bg-white border-[#cbd5e1]'
                }`}
              >
                {/* Top status bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-700/40 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 border ${
                      event.tier === 'Hard Most' ? 'bg-[#D32F2F] border-[#B71C1C]' : 'bg-[#ED6C02] border-[#E65100]'
                    }`} />
                    <h2 className="font-headline font-bold text-sm tracking-wide uppercase text-white">
                      {event.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#FFEBEE] text-[#B71C1C] border border-[#B71C1C] font-telemetry text-[10px] font-bold">
                      {event.tier.toUpperCase()} TIER
                    </span>
                    <span className="font-telemetry text-[10px] text-slate-400">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  {event.mediaUrl && (
                    <div className="w-full md:w-48 h-32 shrink-0 overflow-hidden border border-slate-700">
                      <img
                        src={event.mediaUrl}
                        alt="Evidence"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <p className="font-body text-sm text-slate-200 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 font-telemetry text-xs text-slate-400 border-t border-slate-700/40 mt-2">
                      <div className="flex items-center gap-3">
                        <span>Source: <strong className="text-slate-300">{event.source}</strong></span>
                        <span>Status: <strong className="text-emerald-400">BROADCASTED</strong></span>
                      </div>
                      <button
                        onClick={() => {
                          if (event.coords) {
                            navigate(`/?lat=${event.coords[0]}&lng=${event.coords[1]}&alertId=${event.id}`);
                          } else {
                            navigate('/');
                          }
                        }}
                        className="px-2.5 py-1 bg-cyan-950 text-cyan-300 border border-cyan-500 hover:bg-cyan-900 flex items-center gap-1 font-bold text-[11px] transition-colors"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>VIEW ON COMMAND CENTER MAP</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className={`p-8 text-center border font-body text-sm ${
              isDark ? 'bg-[#181c23] border-[#27303e] text-slate-400' : 'bg-white border-[#cbd5e1] text-slate-600'
            }`}>
              No active alerts matching the selected filter category.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
