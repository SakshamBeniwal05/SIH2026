import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import {
  Cpu,
  Activity,
  CloudRain,
  Radio,
  Zap,
  CheckCircle2,
  AlertCircle,
  Terminal,
  ChevronRight,
  ChevronLeft,
  RefreshCw
} from 'lucide-react';

export function RightRack({ isCollapsed = false, onToggleCollapse }) {
  const { isDark } = useTheme();
  const { activeHazard, aiTraces, telemetry, aiRefreshCountdown } = useSocket();

  // Collapsed Rail View
  if (isCollapsed) {
    return (
      <aside className={`w-12 h-full z-20 flex flex-col items-center justify-between py-3 px-1 border-l shrink-0 transition-all duration-300 select-none ${
        isDark ? 'bg-[#0f131b] border-[#27303e] text-[#dfe2ed]' : 'bg-[#ffffff] border-[#cbd5e1] text-[#0f172a]'
      }`}>
        {/* Top: Expand Toggle Button */}
        <div className="flex flex-col items-center gap-3 w-full">
          <button
            onClick={onToggleCollapse}
            className={`w-9 h-9 border flex items-center justify-center transition-colors shadow-sm ${
              isDark
                ? 'bg-[#181c23] border-[#27303e] text-[#00E676] hover:border-emerald-500 hover:text-white'
                : 'bg-slate-100 border-[#cbd5e1] text-slate-700 hover:bg-slate-200'
            }`}
            title="Expand Right Window (Gemini ReAct Telemetry)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="w-6 h-px bg-slate-700/50 my-1" />

          {/* Vertical Icon Badges */}
          <div className="flex flex-col items-center gap-3 w-full">
            <button
              onClick={onToggleCollapse}
              className={`w-9 h-9 border flex items-center justify-center transition-colors ${
                isDark ? 'bg-[#181c23] border-[#27303e] text-[#00E676]' : 'bg-slate-50 border-[#cbd5e1] text-emerald-600'
              }`}
              title="Gemini ReAct Autonomous Agent (Click to expand)"
            >
              <Cpu className="w-4 h-4 animate-pulse" />
            </button>

            <button
              onClick={onToggleCollapse}
              className={`w-9 h-9 border flex items-center justify-center transition-colors ${
                isDark ? 'bg-[#181c23] border-[#27303e] text-red-400' : 'bg-slate-50 border-[#cbd5e1] text-red-600'
              }`}
              title="Factor of Safety (0.94 FS Critical) - Click to expand"
            >
              <span className="font-telemetry text-[10px] font-bold">FS</span>
            </button>

            <button
              onClick={onToggleCollapse}
              className={`w-9 h-9 border flex items-center justify-center transition-colors ${
                isDark ? 'bg-[#181c23] border-[#27303e] text-cyan-400' : 'bg-slate-50 border-[#cbd5e1] text-cyan-600'
              }`}
              title={`Precipitation Rate: ${activeHazard?.rainfallRateMmPerHour || 180} mm/hr - Click to expand`}
            >
              <CloudRain className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom: Pulse indicator */}
        <div className="flex flex-col items-center gap-1.5 font-telemetry text-[9px] text-slate-400">
          <span className="w-2.5 h-2.5 rounded-none telemetry-pulse-node" />
          <span className="[writing-mode:vertical-lr] tracking-widest text-emerald-500 uppercase font-bold py-1">
            ReAct
          </span>
        </div>
      </aside>
    );
  }

  // Expanded View
  return (
    <aside className={`w-[320px] h-full z-20 flex flex-col justify-between p-3 border-l shrink-0 transition-all duration-300 ${
      isDark
        ? 'bg-[#0f131b]/95 border-[#27303e] text-[#dfe2ed]'
        : 'bg-[#ffffff]/95 border-[#cbd5e1] text-[#0f172a]'
    }`}>
      {/* Rack Header: AI Autonomous Reasoning Status */}
      <div className="space-y-2 shrink-0 pb-2 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-[#00E676] animate-pulse" />
            <span className="font-headline font-bold text-xs uppercase tracking-wider text-[#00E676]">
              GEMINI ReAct AGENT
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-950 text-emerald-400 font-telemetry text-[9px] border border-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-ping" />
              LIVE
            </span>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className={`p-1 border transition-colors ${
                  isDark
                    ? 'bg-[#181c23] border-[#27303e] text-slate-400 hover:text-white hover:border-slate-400'
                    : 'bg-slate-100 border-[#cbd5e1] text-slate-700 hover:bg-white hover:text-black'
                }`}
                title="Collapse Right Window"
                aria-label="Collapse Right Window"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <p className="font-body text-[11px] text-slate-400">
          Autonomous multi-turn loop correlating precipitation & crowdsourced field telemetry.
        </p>
        <div className="flex items-center justify-between font-telemetry text-[10px] bg-black/40 px-2 py-1 border border-slate-800">
          <span className="flex items-center gap-1.5 text-slate-300">
            <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>AI 12s Refresh Loop</span>
          </span>
          <span className="text-cyan-300 font-bold font-mono">
            {aiRefreshCountdown}s
          </span>
        </div>
      </div>

      {/* Main Rack Body: AI Traces & Step-by-Step Reasoner */}
      <div className="flex-1 overflow-y-auto custom-scrollbar my-2.5 space-y-2.5 pr-1">
        {/* Live Thought Process Container */}
        <div className={`p-2.5 border space-y-2 ${
          isDark ? 'bg-[#0a0e15] border-[#27303e]' : 'bg-[#f8fafc] border-[#cbd5e1]'
        }`}>
          <div className="flex items-center gap-1 text-[10px] font-headline font-bold uppercase text-slate-400">
            <Terminal className="w-3 h-3 text-cyan-400" />
            <span>Active Reasoning Telemetry</span>
          </div>

          <div className="space-y-2 text-[11px] font-body">
            {aiTraces && aiTraces.length > 0 ? (
              aiTraces.slice(0, 5).map((trace, idx) => (
                <div
                  key={idx}
                  className={`p-2 border border-l-2 ${
                    trace.type === 'ACTION'
                      ? 'border-cyan-500/40 border-l-cyan-400 bg-cyan-950/20'
                      : trace.type === 'OBSERVATION'
                        ? 'border-amber-500/40 border-l-amber-400 bg-amber-950/20'
                        : trace.type === 'FINAL_ASSESSMENT'
                          ? 'border-emerald-500/40 border-l-emerald-400 bg-emerald-950/20'
                          : 'border-slate-700 border-l-red-500 bg-slate-900/50'
                  }`}
                >
                  <div className="flex justify-between items-center font-telemetry text-[9px] text-slate-400 mb-1">
                    <span className="font-bold text-slate-300 uppercase">[{trace.type || 'STEP'}]</span>
                    <span>{trace.tool || 'ReAct Engine'}</span>
                  </div>
                  <p className="text-slate-200 text-[11px] leading-relaxed whitespace-pre-line">
                    {trace.content || trace.summary || JSON.stringify(trace)}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic text-[11px] p-2">
                Agent in standby monitoring mode. Trigger a rain simulation or submit a field report to initiate multi-turn ReAct reasoning.
              </div>
            )}
          </div>
        </div>

        {/* Doppler Weather & Cloudburst Inflow Metric */}
        <div className={`p-2.5 border space-y-1.5 ${
          isDark ? 'bg-[#181c23] border-[#27303e]' : 'bg-white border-[#cbd5e1]'
        }`}>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1 font-headline font-bold text-xs uppercase text-amber-400">
              <CloudRain className="w-3.5 h-3.5" />
              <span>Precipitation Inflow</span>
            </span>
            <span className="font-telemetry text-red-400 font-bold text-xs">
              {activeHazard?.rainfallRateMmPerHour || 180} mm/hr
            </span>
          </div>

          <div className="flex justify-between font-telemetry text-[10px] text-slate-400">
            <span>Regime Classification:</span>
            <strong className="text-red-400">
              {(activeHazard?.rainfallRateMmPerHour || 180) >= 100 ? 'CLOUDBURST SURGE' : 'MONSOON PEAK'}
            </strong>
          </div>
          <div className="flex justify-between font-telemetry text-[10px] text-slate-400">
            <span>Catchment Basin:</span>
            <span className="text-slate-300">{activeHazard?.simulatedBasin || 'Brahmaputra Valley (Guwahati)'}</span>
          </div>
        </div>

        {/* Factor of Safety (FS) Geotechnical Score */}
        <div className={`p-2.5 border space-y-1.5 ${
          isDark ? 'bg-[#181c23] border-[#27303e]' : 'bg-white border-[#cbd5e1]'
        }`}>
          <div className="flex justify-between items-center">
            <span className="font-headline font-bold text-xs uppercase text-slate-300">
              Slope Factor of Safety (FS)
            </span>
            <span className="font-telemetry text-xs font-extrabold text-[#D32F2F]">
              0.94 FS
            </span>
          </div>
          <p className="font-body text-[10px] text-slate-400 leading-tight">
            FS &lt; 1.0 indicates critical shear failure threshold reached along NH-58 Helang escarpment.
          </p>
          <div className="w-full h-1.5 bg-slate-800 border border-slate-700">
            <div className="h-full bg-red-600" style={{ width: '94%' }} />
          </div>
        </div>
      </div>

      {/* Rack Footer: Sensor Vitality Indicator */}
      <div className={`p-2 border shrink-0 flex items-center justify-between text-[11px] font-telemetry ${
        isDark ? 'bg-[#0a0e15] border-[#27303e]' : 'bg-[#f1f5f9] border-[#cbd5e1]'
      }`}>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-none telemetry-pulse-node" />
          <span className="text-slate-300">PULSE: 0.24s</span>
        </div>
        <span className="text-[#00E676] font-bold">SIGNAL LOCKED</span>
      </div>
    </aside>
  );
}
