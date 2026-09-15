import React, { useState, useEffect } from 'react';
import { AlertTriangle, Compass, X, RefreshCw, Eye } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export function EvacuationBanner({ onSelectAlert }) {
  const { activeHazard, alerts, isOfficialActive, officialAlert } = useSocket();

  const [dismissedDirective, setDismissedDirective] = useState(false);
  const [dismissedDetour, setDismissedDetour] = useState(false);

  // Automatically reset dismissals when a new broadcast / simulation arrives
  const latestAlertId = alerts?.[0]?.simulationId || activeHazard?.simulatedBasin || '';
  useEffect(() => {
    setDismissedDirective(false);
    setDismissedDetour(false);
  }, [latestAlertId, activeHazard?.rainfallRateMmPerHour]);

  if (!activeHazard) return null;

  const currentOfficial = isOfficialActive ? (officialAlert || activeHazard.current || activeHazard.officialAlert) : null;
  const hasEvacuation = isOfficialActive && !!currentOfficial?.tiers?.some(t => t.evacuationMandated);
  const severedRoads = isOfficialActive ? (activeHazard.severedRoads || []) : [];

  const showDirective = hasEvacuation && !dismissedDirective;
  const showDetour = severedRoads.length > 0 && !dismissedDetour;

  // When user has dismissed all active banners, show a minimal restore badge
  if (!showDirective && !showDetour) {
    if (hasEvacuation || severedRoads.length > 0) {
      return (
        <div className="w-full bg-slate-800/80 border-b border-slate-700/50 px-3 py-1 flex items-center justify-between text-[11px] font-telemetry text-slate-300 z-30 select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>BROADCAST ALERTS ACTIVE ({activeHazard.simulatedBasin || 'Uttarakhand Basin'}) — HIDDEN BY USER</span>
          </div>
          <button
            onClick={() => {
              setDismissedDirective(false);
              setDismissedDetour(false);
            }}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold uppercase underline transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Restore Notification</span>
          </button>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-1 z-30 shrink-0 select-none">
      {/* 1. Critical Evacuation Directive Banner */}
      {showDirective && (
        <div className="w-full bg-[#B71C1C] border border-[#7F0000] border-l-4 border-l-[#EF5350] px-3 py-1.5 flex items-center justify-between shadow-[0_2px_12px_rgba(183,28,28,0.4)]">
          <div
            className="flex items-center gap-2 text-white flex-1 pr-2 cursor-pointer hover:opacity-90"
            onClick={() => {
              if (onSelectAlert) {
                const hazardLat = currentOfficial?.coordinates?.lat || activeHazard.location?.coordinates?.[1] || 30.4100;
                const hazardLng = currentOfficial?.coordinates?.lng || activeHazard.location?.coordinates?.[0] || 79.4200;
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
            title="Click to redirect map to Disaster Epicenter & enable Govt Alert layer"
          >
            <span className="p-0.5 bg-[#7F0000] text-[#EF5350] shrink-0">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
            </span>
            <div>
              <span className="font-headline font-bold text-xs uppercase tracking-wider text-white">
                [CRITICAL EVACUATION DIRECTIVE]
              </span>
              <span className="font-body text-xs text-red-100 ml-2">
                Mandatory evacuation active for Zone 1 Ground Zero ({activeHazard.simulatedBasin || 'Active Sector'}). Rapid slope mass movement imminent.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 font-telemetry text-xs text-white shrink-0">
            <span className="hidden md:inline px-1.5 py-0.5 bg-[#7F0000] uppercase font-bold text-[10px]">
              ZONE 1 IMMEDIATE
            </span>
            {/* Cross icon to remove/dismiss notification */}
            <button
              onClick={() => setDismissedDirective(true)}
              className="p-1 hover:bg-black/30 rounded text-red-200 hover:text-white transition-colors"
              title="Dismiss evacuation notification"
              aria-label="Dismiss evacuation notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Action Detour & Route Severance Banner */}
      {showDetour && (
        <div className="w-full bg-[#E65100] border border-[#A73A00] border-l-4 border-l-[#FFA726] px-3 py-1 flex items-center justify-between shadow-[0_2px_10px_rgba(230,81,0,0.3)]">
          <div
            className="flex items-center gap-2 text-white flex-1 pr-2 cursor-pointer hover:opacity-90"
            onClick={() => {
              if (onSelectAlert) {
                onSelectAlert({
                  id: 'severed-roads-alert',
                  type: 'road',
                  layer: 'roads',
                  coords: [30.5280, 79.5080],
                  zoom: 13,
                  data: {
                    name: severedRoads.join(' & ') || 'NH-58 Lifeline',
                    severed: true
                  }
                });
              }
            }}
            title="Click to view severed road corridors on map & enable Roads layer"
          >
            <span className="p-0.5 bg-[#A73A00] text-[#FFA726] shrink-0">
              <Compass className="w-3.5 h-3.5" />
            </span>
            <div>
              <span className="font-headline font-bold text-[11px] uppercase tracking-wider text-white">
                [ACTION DETOUR INITIATED]
              </span>
              <span className="font-body text-xs text-amber-100 ml-2">
                Traffic diverted: <strong className="underline">{severedRoads.join(' & ')}</strong> declared SEVERED. SDRF perimeter cordoned.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 font-telemetry text-xs text-white shrink-0">
            <span className="hidden sm:inline font-telemetry text-[10px] text-amber-200 uppercase font-semibold">
              TRANSIT ADVISORY
            </span>
            {/* Cross icon to remove/dismiss detour notification */}
            <button
              onClick={() => setDismissedDetour(true)}
              className="p-1 hover:bg-black/30 rounded text-amber-200 hover:text-white transition-colors"
              title="Dismiss detour notification"
              aria-label="Dismiss detour notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
