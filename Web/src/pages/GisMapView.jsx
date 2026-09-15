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
  const { activeHazard, reports, telemetry, predictedAlert, isOfficialActive } = useSocket();
  const [focusedTarget, setFocusedTarget] = useState(null);

  // Sync AI prediction focus: If conditions become safe (predictedAlert is null), clear focus.
  // If a new 12-second prediction arrives, update focus to only the latest prediction!
  useEffect(() => {
    if (focusedTarget && (focusedTarget.type === 'prediction' || focusedTarget.id === 'ai-predicted-danger' || focusedTarget.id === 'ai-prediction-cycle')) {
      if (!predictedAlert || predictedAlert.isCritical === false) {
        setFocusedTarget(null);
      } else if (predictedAlert.coordinates) {
        setFocusedTarget({
          id: 'ai-predicted-danger',
          type: 'prediction',
          layer: 'predictions',
          coords: [predictedAlert.coordinates.lat, predictedAlert.coordinates.lng],
          zoom: 12,
          title: `AI PREDICTED: ${predictedAlert.location || predictedAlert.locationName || 'Runout Corridor'}`,
          data: predictedAlert,
          timestamp: Date.now()
        });
      }
    }
  }, [predictedAlert, focusedTarget]);

  // Synchronously clear focused target if government directive stands down or expires
  useEffect(() => {
    if (!isOfficialActive && focusedTarget && (
      focusedTarget.type === 'epicenter' ||
      focusedTarget.id === 'active-hazard-epicenter' ||
      focusedTarget.id === 'official-govt-directive-live'
    )) {
      setFocusedTarget(null);
    }
  }, [isOfficialActive, focusedTarget]);

  const handleSelectAlert = (target) => {
    if (!target) return;
    if (focusedTarget && focusedTarget.id === target.id) {
      setFocusedTarget(null);
      return;
    }
    setFocusedTarget({
      ...target,
      timestamp: Date.now()
    });
  };

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

  const [selectedCoords, setSelectedCoords] = useState(null);

  const handleSelectSector = (sectorKey) => {
    const coordsMap = {
      chamoli: [30.4100, 79.4200],
      kedarnath: [30.7300, 79.0600],
      joshimath: [30.5500, 79.5600],
      dehradun: [30.3165, 78.0322],
      uttarkashi: [30.7300, 78.4400],
      pithoragarh: [29.5800, 80.2200],
      nainital: [29.3800, 79.4600],
      almora: [29.6000, 79.6600],
      tehri: [30.3800, 78.4800]
    };
    const coords = coordsMap[sectorKey];
    if (coords) {
      setSelectedCoords(coords);
      setFocusedTarget({
        id: `sector-${sectorKey}`,
        type: 'sector',
        coords,
        zoom: 12,
        timestamp: Date.now()
      });
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col pt-12 relative select-none">
      <Header onSelectSector={handleSelectSector} />
      <EvacuationBanner onSelectAlert={handleSelectAlert} />

      {/* Full Bleed Map */}
      <div className="flex-1 w-full h-full relative">
        <GisMapCanvas
          selectedSectorCoords={selectedCoords}
          focusedTarget={focusedTarget}
          onClearFocus={() => setFocusedTarget(null)}
          bottomOffset={sheetState === 'peek' ? 'bottom-20' : 'bottom-4'}
        />

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
                    onClick={() => {
                      handleSelectAlert({
                        id: rep._id,
                        type: 'report',
                        layer: 'reports',
                        coords: [rep.location.coordinates[1], rep.location.coordinates[0]],
                        zoom: 14,
                        data: rep
                      });
                      setSheetState('peek');
                    }}
                    className={`p-3 border cursor-pointer hover:border-red-400 transition-all ${isDark ? 'bg-[#181c23] border-[#27303e] hover:bg-[#1f2633]' : 'bg-white border-[#cbd5e1] hover:shadow-md'}`}
                    title="Click to redirect map to this incident"
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
                    <div className="mt-2 text-[10px] font-telemetry text-slate-400 flex justify-between items-center">
                      <span>Coordinates: [{rep.location.coordinates[1].toFixed(3)}, {rep.location.coordinates[0].toFixed(3)}]</span>
                      <span className="text-cyan-400 font-bold hover:underline">LOCATE ON MAP</span>
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
