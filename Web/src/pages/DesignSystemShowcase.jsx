import React from 'react';
import { Header } from '../components/common/Header';
import { EvacuationBanner } from '../components/alerts/EvacuationBanner';
import { useTheme } from '../context/ThemeContext';
import {
  ShieldAlert,
  AlertTriangle,
  Compass,
  Radio,
  Layers,
  Activity,
  Droplets,
  Sun,
  Moon,
  CheckSquare
} from 'lucide-react';

export function DesignSystemShowcase() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className={`min-h-screen pt-12 flex flex-col transition-colors ${
      isDark ? 'bg-[#0a0e15] text-[#dfe2ed]' : 'bg-[#f8fafc] text-[#0f172a]'
    }`}>
      <Header />
      <EvacuationBanner />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-8">
        {/* Header & Theme Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-700/50 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-none telemetry-pulse-node" />
              <h1 className="font-headline font-extrabold text-xl md:text-2xl tracking-wider uppercase">
                STITCH MCP DESIGN SYSTEM SPECIFICATION
              </h1>
            </div>
            <p className="font-body text-xs text-slate-400 mt-1">
              Active Design System: <strong className="text-cyan-400">{isDark ? 'Tactical Telemetry Disaster Matrix (Dark)' : 'Tactical Field Telemetry Matrix (Light)'}</strong>
            </p>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 border font-headline text-xs font-bold border-cyan-500 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/40 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
            <span>Switch to {isDark ? 'Light Field Matrix' : 'Dark Telemetry HUD'}</span>
          </button>
        </div>

        {/* 1. Calibrated 4-Tier Hazard Zone Ontology */}
        <section className="space-y-3">
          <h2 className="font-headline font-bold text-sm uppercase tracking-wider text-slate-400">
            1. Calibrated 4-Tier Hazard Ontology
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Zone 1 */}
            <div className="p-3 border border-[#B71C1C] bg-[#FFEBEE] text-[#B71C1C]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-headline font-bold text-xs uppercase">Zone 1: Hard Most</span>
                <span className="font-telemetry text-[10px] font-extrabold">#D32F2F</span>
              </div>
              <p className="font-body text-xs text-red-950">
                Ground Zero. Active debris flow and tension cracking. Mandatory evacuation.
              </p>
              <div className="mt-2 text-[10px] font-telemetry font-bold">
                Fill: #FFEBEE | Stroke: #B71C1C
              </div>
            </div>

            {/* Zone 2 */}
            <div className="p-3 border border-[#E65100] bg-[#FFF3E0] text-[#E65100]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-headline font-bold text-xs uppercase">Zone 2: Most</span>
                <span className="font-telemetry text-[10px] font-extrabold">#ED6C02</span>
              </div>
              <p className="font-body text-xs text-orange-950">
                Severe Impact. Lifeline road severed. Active slope creep and bypass closures.
              </p>
              <div className="mt-2 text-[10px] font-telemetry font-bold">
                Fill: #FFF3E0 | Stroke: #E65100
              </div>
            </div>

            {/* Zone 3 */}
            <div className="p-3 border border-[#FF8F00] bg-[#FFF8E1] text-[#000000]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-headline font-bold text-xs uppercase">Zone 3: Some</span>
                <span className="font-telemetry text-[10px] font-extrabold">#F57C00</span>
              </div>
              <p className="font-body text-xs text-amber-950">
                Moderate Disruption. Secondary roadway caution, agricultural drainage washouts.
              </p>
              <div className="mt-2 text-[10px] font-telemetry font-bold">
                Fill: #FFF8E1 | Stroke: #FF8F00
              </div>
            </div>

            {/* Zone 4 */}
            <div className="p-3 border border-[#01579B] bg-[#E1F5FE] text-[#01579B]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-headline font-bold text-xs uppercase">Zone 4: Negligible</span>
                <span className="font-telemetry text-[10px] font-extrabold">#0288D1</span>
              </div>
              <p className="font-body text-xs text-sky-950">
                Periphery Advisory. Baseline monitoring, Doppler radar watch sector.
              </p>
              <div className="mt-2 text-[10px] font-telemetry font-bold">
                Fill: #E1F5FE | Stroke: #01579B
              </div>
            </div>
          </div>
        </section>

        {/* 2. Emergency Directives & Action Banners */}
        <section className="space-y-3">
          <h2 className="font-headline font-bold text-sm uppercase tracking-wider text-slate-400">
            2. Emergency Directives & Action Banners
          </h2>

          <div className="space-y-2">
            <div className="w-full bg-[#B71C1C] border border-[#7F0000] border-l-4 border-l-[#EF5350] p-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#EF5350]" />
                <span className="font-headline font-bold text-xs uppercase">
                  [CRITICAL EVACUATION DIRECTIVE] — Mandatory Immediate Withdrawal
                </span>
              </div>
              <span className="font-telemetry text-[10px] px-2 py-0.5 bg-[#7F0000]">PRIORITY 1</span>
            </div>

            <div className="w-full bg-[#E65100] border border-[#A73A00] border-l-4 border-l-[#FFA726] p-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#FFA726]" />
                <span className="font-headline font-bold text-xs uppercase">
                  [ACTION DETOUR INITIATED] — NH-58 Corridor Closed at KM 42 (Helang)
                </span>
              </div>
              <span className="font-telemetry text-[10px] px-2 py-0.5 bg-[#A73A00]">PRIORITY 2</span>
            </div>
          </div>
        </section>

        {/* 3. Live Vitality Pulse Nodes & Brutalist Elements */}
        <section className="space-y-3">
          <h2 className="font-headline font-bold text-sm uppercase tracking-wider text-slate-400">
            3. Live Telemetry Pulse & Control Instrumentation
          </h2>

          <div className={`p-4 border grid grid-cols-1 md:grid-cols-3 gap-4 ${
            isDark ? 'bg-[#0f131b] border-[#27303e]' : 'bg-white border-[#cbd5e1]'
          }`}>
            <div className="space-y-2">
              <span className="font-headline text-xs font-bold text-slate-400 uppercase">Vitality Pulse Node</span>
              <div className="flex items-center gap-2 pt-1">
                <span className="w-3 h-3 rounded-none telemetry-pulse-node animate-ping" />
                <span className="font-telemetry text-xs font-bold text-[#00E676]">00E676 LIVE PULSE</span>
              </div>
              <p className="font-body text-[11px] text-slate-400">
                8px × 8px square block (0px radius) with 00B0FF signal lock border and 69F0AE halo.
              </p>
            </div>

            <div className="space-y-2">
              <span className="font-headline text-xs font-bold text-slate-400 uppercase">Tactical Command Buttons</span>
              <div className="flex flex-col gap-2 pt-1">
                <button className="px-3 py-1.5 bg-[#00E676] text-black font-telemetry text-xs font-bold uppercase hover:bg-[#69F0AE] transition-colors border border-[#00B0FF]">
                  Primary Actionable
                </button>
                <button className="px-3 py-1.5 bg-[#D32F2F] text-white font-headline text-xs font-bold uppercase hover:bg-[#B71C1C] transition-colors border border-[#B71C1C]">
                  Destructive Override
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-headline text-xs font-bold text-slate-400 uppercase">Zero-Radius Brutalist Inputs</span>
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value="GRID // 25.5788°N 91.8933°E"
                  className={`w-full border p-2 font-telemetry text-xs ${
                    isDark ? 'bg-[#0a0e15] border-[#27303e] text-slate-200' : 'bg-[#f8fafc] border-[#cbd5e1] text-slate-800'
                  }`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 4. Referenced Screen Previews from Stitch */}
        <section className="space-y-3">
          <h2 className="font-headline font-bold text-sm uppercase tracking-wider text-slate-400">
            4. Downloaded Stitch Screen References
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-3 border ${isDark ? 'bg-[#181c23] border-[#27303e]' : 'bg-white border-[#cbd5e1]'}`}>
              <div className="font-headline font-bold text-xs uppercase mb-1">Screen 2: Command Center (Dark)</div>
              <p className="font-body text-[11px] text-slate-400 mb-2">ID: 2ba59e5565d2401e8fbf9a93ca57a06f</p>
              <img src="/stitch_reference/screen2_command_center_dark.png" alt="Screen 2" className="w-full h-32 object-cover border border-slate-700" />
            </div>

            <div className={`p-3 border ${isDark ? 'bg-[#181c23] border-[#27303e]' : 'bg-white border-[#cbd5e1]'}`}>
              <div className="font-headline font-bold text-xs uppercase mb-1">Screen 6: Command Center (Light)</div>
              <p className="font-body text-[11px] text-slate-400 mb-2">ID: 90314ec3e2c644dbac547a37553c26fc</p>
              <img src="/stitch_reference/screen6_command_center_light.png" alt="Screen 6" className="w-full h-32 object-cover border border-slate-700" />
            </div>

            <div className={`p-3 border ${isDark ? 'bg-[#181c23] border-[#27303e]' : 'bg-white border-[#cbd5e1]'}`}>
              <div className="font-headline font-bold text-xs uppercase mb-1">Screen 4: Alerts Feed (Dark)</div>
              <p className="font-body text-[11px] text-slate-400 mb-2">ID: 0c1f06ed43c043fda9911beae2788948</p>
              <img src="/stitch_reference/screen4_alerts_feed_dark.png" alt="Screen 4" className="w-full h-32 object-cover border border-slate-700" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
