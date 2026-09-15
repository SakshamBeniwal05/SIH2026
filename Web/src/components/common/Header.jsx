import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import {
  Radio,
  AlertTriangle,
  Sun,
  Moon,
  Search,
  Sliders,
  Send,
  Bell,
  MapPin,
  Activity,
  Layers,
  ShieldAlert,
  X
} from 'lucide-react';

export function Header({ onSelectSector }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const { defconLevel, isConnected, telemetry } = useSocket();
  const location = useLocation();

  const [utcTime, setUtcTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showSitrepModal, setShowSitrepModal] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${hours}:${minutes}:${seconds} UTC`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const navLinks = [
    { name: 'Command Center', path: '/' },
    { name: 'GIS Map', path: '/map' },
    { name: 'Alerts Feed', path: '/alerts' },
    { name: 'Admin Sim', path: '/admin/simulation' },
    { name: 'Report Hazard', path: '/report' },
    { name: 'Design Matrix', path: '/design-system' }
  ];

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-40 h-12 flex items-center justify-between px-3 md:px-5 border-b backdrop-blur-md transition-colors ${
        isDark
          ? 'bg-[#0a0e15]/95 border-[#B71C1C]/40 text-[#dfe2ed] shadow-[0_4px_20px_rgba(211,47,47,0.2)]'
          : 'bg-[#ffffff]/95 border-[#cbd5e1] text-[#0f172a] shadow-sm'
      }`}>
        {/* Left: Brand Identity & Status */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="w-2.5 h-2.5 rounded-none telemetry-pulse-node animate-pulse" />
            <span className={`font-headline font-extrabold text-xs md:text-sm tracking-widest uppercase transition-all ${
              isDark
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#D32F2F] via-[#ED6C02] to-[#0288D1]'
                : 'text-[#006096] font-bold'
            }`}>
              LANDGUARD
            </span>
          </Link>

          <span className="hidden lg:inline text-xs opacity-30">|</span>

          {/* DEFCON Level Badge */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-headline font-bold uppercase tracking-wider border ${
            defconLevel.includes('DEFCON 1')
              ? 'bg-[#FFEBEE] text-[#B71C1C] border-[#B71C1C] animate-pulse'
              : isDark
                ? 'bg-[#181c23] text-[#D32F2F] border-[#B71C1C]/60'
                : 'bg-[#FFF3E0] text-[#E65100] border-[#E65100]'
          }`}>
            <AlertTriangle className="w-3 h-3 text-[#D32F2F]" />
            <span>{defconLevel}</span>
          </div>

          {/* Real-time Telemetry UTC Clock (Only Hour, Min, Sec) */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 border text-xs font-telemetry ${
            isDark
              ? 'bg-[#10131b] border-[#01579B]/50 text-[#0288D1]'
              : 'bg-[#f1f5f9] border-[#cbd5e1] text-[#0288D1]'
          }`}>
            <span className="w-1.5 h-1.5 rounded-none bg-[#0288D1]" />
            <span>{utcTime || '00:00:00 UTC'}</span>
          </div>
        </div>

        {/* Center: Tactical Search Bar & Sector Jumps directly inside Navbar */}
        <div className="flex-1 max-w-xl mx-2 md:mx-4 flex items-center gap-2 relative">
          {/* Integrated Search Input */}
          <div className={`flex-1 flex items-center border px-2.5 py-1 text-xs transition-all ${
            isDark
              ? 'bg-[#141824] border-[#27303e] focus-within:border-[#0288D1] focus-within:shadow-[0_0_8px_rgba(2,136,209,0.3)]'
              : 'bg-[#f8fafc] border-[#cbd5e1] focus-within:border-[#0288D1] focus-within:shadow-[0_0_8px_rgba(2,136,209,0.2)]'
          }`}>
            <Search className="w-3.5 h-3.5 text-[#0288D1] mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search corridors (NH-58, NH-107), basins, sensors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`bg-transparent text-xs w-full focus:outline-none placeholder:text-slate-500 font-body ${
                isDark ? 'text-slate-200' : 'text-slate-900'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-200 p-0.5"
                title="Clear Search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Uttarakhand Sector Jumps directly inside Navbar */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <span className="text-[9px] font-headline uppercase font-bold text-slate-500 mr-0.5">
              Jumps:
            </span>
            {[
              { id: 'chamoli', name: 'Chamoli' },
              { id: 'kedarnath', name: 'Kedarnath' },
              { id: 'joshimath', name: 'Joshimath' },
              { id: 'dehradun', name: 'Dehradun' },
              { id: 'uttarkashi', name: 'Uttarkashi' }
            ].map((sec) => (
              <button
                key={sec.id}
                onClick={() => {
                  if (onSelectSector) onSelectSector(sec.id);
                  setSearchQuery('');
                }}
                className={`px-1.5 py-0.5 border text-[10px] font-headline font-bold uppercase transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#10131b] text-slate-300 border-[#27303e] hover:bg-[#0288D1] hover:text-white hover:border-[#0288D1]'
                    : 'bg-white text-slate-700 border-[#cbd5e1] hover:bg-[#0288D1] hover:text-white hover:border-[#0288D1]'
                }`}
                title={`Jump to ${sec.name} Sector`}
              >
                {sec.name}
              </button>
            ))}
          </div>

          {/* Instant Search Suggestions Dropdown (Docked directly beneath Navbar) */}
          {searchQuery.trim() && (
            <div className={`absolute left-0 top-full mt-1.5 w-full max-h-72 overflow-y-auto border shadow-2xl z-50 p-1 font-body text-xs backdrop-blur-md ${
              isDark ? 'bg-[#0b0f17]/98 border-[#27303e] text-slate-200' : 'bg-white/98 border-[#cbd5e1] text-slate-800'
            }`}>
              {[
                { id: 'chamoli', name: 'Chamoli / Joshimath Corridor', subtitle: 'Alaknanda Valley', tag: 'NH-58 Lifeline' },
                { id: 'kedarnath', name: 'Kedarnath / Rudraprayag Corridor', subtitle: 'Mandakini Basin', tag: 'NH-107 Highway' },
                { id: 'joshimath', name: 'Joshimath Sunil Ridge', subtitle: 'Upper Alaknanda Escarpment', tag: 'Active Creep' },
                { id: 'dehradun', name: 'Dehradun / Maldevta Basin', subtitle: 'Song River Floodplain', tag: 'Doppler Radar' },
                { id: 'uttarkashi', name: 'Uttarkashi / Silkyara Corridor', subtitle: 'Bhagirathi Valley', tag: 'NH-134 Bypass' },
                { id: 'pithoragarh', name: 'Pithoragarh / Dharchula', subtitle: 'Kali Valley Corridor', tag: 'High Hazard' },
                { id: 'nainital', name: 'Nainital / Bhowali Sector', subtitle: 'Kosi River Watershed', tag: 'Catchment' }
              ]
                .filter(t =>
                  t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  t.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  t.tag.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (onSelectSector) onSelectSector(item.id);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left px-2.5 py-1.5 flex items-center justify-between transition-colors border-b last:border-b-0 cursor-pointer ${
                      isDark ? 'border-slate-800/60 hover:bg-[#151a26]' : 'border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#0288D1] shrink-0" />
                      <div>
                        <span className="font-headline font-bold block text-xs text-[#0288D1]">{item.name}</span>
                        <span className="text-[10px] text-slate-500">{item.subtitle}</span>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 text-[9px] font-telemetry uppercase font-bold border border-[#0288D1]/40 text-[#0288D1] bg-cyan-950/20">
                      {item.tag}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Right: Transmit SITREP Action & Officer Token */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Transmit SITREP button */}
          <Link
            to="/admin/simulation"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#B71C1C] hover:bg-[#D32F2F] text-white font-headline text-xs font-bold border border-[#7F0000] shadow-[0_0_10px_rgba(183,28,28,0.5)] transition-all shrink-0"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">Transmit SITREP</span>
          </Link>

          {/* Officer Token */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-700/50">
            <div className={`w-6 h-6 border flex items-center justify-center font-telemetry text-[10px] font-bold ${
              isDark
                ? 'bg-[#181c23] border-[#B71C1C] text-[#D32F2F]'
                : 'bg-[#f1f5f9] border-[#0288D1] text-[#0288D1]'
            }`}>
              CGO
            </div>
            <div className="hidden xl:block text-left leading-tight">
              <div className="font-headline text-[10px] font-bold tracking-tight">DR. D. ROY</div>
              <div className="font-label text-[8px] text-[#0288D1] tracking-wider uppercase">TAC-1 COMMAND</div>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Bottom-Center Tactical Navigation Dock */}
      <div className={`fixed ${location.pathname === '/map' ? 'bottom-20 md:bottom-22' : 'bottom-4'} left-1/2 -translate-x-1/2 z-40 max-w-[96vw] overflow-x-auto custom-scrollbar flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3 py-1.5 border shadow-2xl backdrop-blur-md transition-all ${
        isDark
          ? 'bg-[#0a0e15]/95 border-[#27303e] text-[#dfe2ed] shadow-[0_8px_30px_rgba(0,0,0,0.8)]'
          : 'bg-[#ffffff]/95 border-[#cbd5e1] text-[#0f172a] shadow-[0_8px_30px_rgba(0,0,0,0.15)]'
      }`}>
        <nav className="flex items-center gap-1 sm:gap-1.5 font-headline text-xs font-semibold shrink-0">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-2.5 py-1 border text-[11px] font-headline font-bold uppercase transition-all shrink-0 ${
                  isActive
                    ? isDark
                      ? 'bg-[#D32F2F] text-white border-[#B71C1C] shadow-[0_0_10px_rgba(211,47,47,0.5)]'
                      : 'bg-[#0288D1] text-white border-[#01579B] shadow-[0_0_10px_rgba(2,136,209,0.5)]'
                    : isDark
                      ? 'bg-[#121620] text-slate-300 border-[#27303e] hover:text-cyan-300 hover:border-cyan-500'
                      : 'bg-slate-100 text-slate-700 border-[#cbd5e1] hover:bg-slate-200'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <span className="w-px h-5 bg-slate-500/40 shrink-0 mx-0.5" />

        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-1.5 px-2.5 py-1 border text-[11px] font-headline font-bold uppercase transition-all shadow-sm shrink-0 ${
            isDark
              ? 'bg-[#181c23] border-[#27303e] text-amber-300 hover:border-amber-400'
              : 'bg-white border-[#cbd5e1] text-slate-800 hover:border-slate-400 hover:bg-slate-50'
          }`}
          title={`Switch to ${isDark ? 'Light (White)' : 'Dark (Tactical Matrix)'} Theme`}
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Theme: Dark</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              <span>Theme: White</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}
