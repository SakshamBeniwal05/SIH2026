import React, { useState } from 'react';
import { Header } from '../components/common/Header';
import { GisMapCanvas } from '../components/gis/GisMapCanvas';
import { EvacuationBanner } from '../components/alerts/EvacuationBanner';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import {
  ChevronUp,
  ChevronDown,
  Activity,
  Layers,
  Compass,
  AlertTriangle,
  Radio,
  Maximize2
} from 'lucide-react';

export function GisMapView() {
  const { isDark } = useTheme();
  const { activeHazard, reports, telemetry } = useSocket();

  // Bottom Sheet State: 'peek' (72px), 'mid' (42%), 'max' (88%)
  const [sheetState, setSheetState] = useState('peek');

  const cycleSheet = () => {
    if (sheetState === 'peek') setSheetState('mid');
    else if (sheetState === 'mid') setSheetState('max');
    else setSheetState('peek');
  };

  const sheetHeightClass =
    sheetState === 'peek'
      ? 'h-[72px]'
      : sheetState === 'mid'
        ? 'h-[42%]'
        : 'h-[88%]';

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col pt-12 relative select-none">
      <Header />
      <EvacuationBanner />

      {/* Full Bleed Map */}
      <div className="flex-1 w-full h-full relative">
        <GisMapCanvas bottomOffset={sheetState === 'peek' ? 'bottom-20' : 'bottom-4'} />

        {/* Floating Right Perimeter Action Rings */}
        <div className="absolute right-3 top-6 z-20 flex flex-col gap-2">
          <button
            onClick={() => cycleSheet()}
            className={`w-11 h-11 border flex items-center justify-center shadow-lg transition-colors ${
              isDark ? 'bg-[#0f131b]/90 border-[#334155] text-cyan-400 hover:border-[#D32F2F]' : 'bg-white/95 border-[#cbd5e1] text-slate-800'
            }`}
            title="Expand / Collapse Telemetry Sheet"
          >
            {sheetState === 'peek' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Floating Bottom Operational Sheet (Stitch Screen 3 & 7 Pattern) */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 border-t flex flex-col shadow-[0_-8px_30px_rgba(0,0,0,0.6)] ${sheetHeightClass} ${
            isDark ? 'bg-[#0f131b]/98 border-[#27303e] text-[#dfe2ed]' : 'bg-white/98 border-[#cbd5e1] text-[#0f172a]'
          }`}
        >
          {/* Grabber Rail */}
          <div
            onClick={cycleSheet}
            className="w-full py-2 flex flex-col items-center justify-center cursor-pointer hover:opacity-80 shrink-0"
          >
            <div className="w-10 h-1 rounded-full bg-slate-600 mb-1" />
            <div className="w-full px-4 flex items-center justify-between font-headline text-xs font-bold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 telemetry-pulse-node" />
                <span className="uppercase text-slate-300">
                  {activeHazard?.simulatedBasin || 'Sector Chamoli Alaknanda'}
                </span>
                <span className="text-red-400 font-telemetry">
                  [{activeHazard?.rainfallRateMmPerHour || 180} mm/hr]
                </span>
              </div>
              <span className="font-telemetry text-[11px] text-cyan-400 uppercase">
                {sheetState.toUpperCase()} MODE — TAP TO RESIZE
              </span>
            </div>
          </div>

          {/* Expanded Sheet Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`p-3 border ${isDark ? 'bg-[#181c23] border-[#27303e]' : 'bg-[#f8fafc] border-[#cbd5e1]'}`}>
                <div className="font-label text-[10px] text-slate-400 uppercase">Zone 1 Hard Most Radius</div>
                <div className="font-headline font-bold text-lg text-red-500">
                  {activeHazard?.tiers?.[0]?.radiusMeters ? (activeHazard.tiers[0].radiusMeters / 1000).toFixed(2) : '4.80'} km
                </div>
                <div className="font-body text-[10px] text-slate-400">Immediate evacuation enforced</div>
              </div>

              <div className={`p-3 border ${isDark ? 'bg-[#181c23] border-[#27303e]' : 'bg-[#f8fafc] border-[#cbd5e1]'}`}>
                <div className="font-label text-[10px] text-slate-400 uppercase">Critical Infrastructure</div>
                <div className="font-headline font-bold text-lg text-amber-500">
                  {activeHazard?.severedRoads?.length || 2} SEVERED
                </div>
                <div className="font-body text-[10px] text-slate-400">NH-58 Lifeline affected</div>
              </div>

              <div className={`p-3 border ${isDark ? 'bg-[#181c23] border-[#27303e]' : 'bg-[#f8fafc] border-[#cbd5e1]'}`}>
                <div className="font-label text-[10px] text-slate-400 uppercase">Peak Pore Saturation</div>
                <div className="font-headline font-bold text-lg text-cyan-400">
                  {telemetry?.sensors?.[0]?.saturation || 94.2}%
                </div>
                <div className="font-body text-[10px] text-slate-400">Piezometer SN-UK-501</div>
              </div>

              <div className={`p-3 border ${isDark ? 'bg-[#181c23] border-[#27303e]' : 'bg-[#f8fafc] border-[#cbd5e1]'}`}>
                <div className="font-label text-[10px] text-slate-400 uppercase">Field Observations</div>
                <div className="font-headline font-bold text-lg text-emerald-400">
                  {reports.length} Reports
                </div>
                <div className="font-body text-[10px] text-slate-400">Geotagged crowdsourced data</div>
              </div>
            </div>

            {/* List of active field incident reports */}
            <div className="space-y-2">
              <h3 className="font-headline font-bold text-xs uppercase tracking-wider text-slate-400">
                Ground Zero Field Triage Stream
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {reports.map((rep) => (
                  <div
                    key={rep._id}
                    className={`p-3 border ${isDark ? 'bg-[#181c23] border-[#27303e]' : 'bg-white border-[#cbd5e1]'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-headline font-bold text-xs uppercase text-red-400">
                        {rep.category.replace('_', ' ')}
                      </span>
                      <span className="font-telemetry text-[10px] bg-red-950 text-red-300 px-1.5 py-0.5">
                        {rep.severityObserved?.toUpperCase()}
                      </span>
                    </div>
                    <p className="font-body text-xs text-slate-300 line-clamp-2">{rep.description}</p>
                    <div className="mt-2 text-[10px] font-telemetry text-slate-400 flex justify-between">
                      <span>Coordinates: [{rep.location.coordinates[1].toFixed(3)}, {rep.location.coordinates[0].toFixed(3)}]</span>
                      <span className="text-emerald-400">Verified</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
