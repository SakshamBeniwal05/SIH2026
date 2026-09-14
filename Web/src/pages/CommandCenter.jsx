import React, { useState } from 'react';
import { Header } from '../components/common/Header';
import { EvacuationBanner } from '../components/alerts/EvacuationBanner';
import { LeftDrawer } from '../components/dashboard/LeftDrawer';
import { GisMapCanvas } from '../components/gis/GisMapCanvas';
import { RightRack } from '../components/dashboard/RightRack';
import { useTheme } from '../context/ThemeContext';

export function CommandCenter() {
  const { isDark } = useTheme();
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  const handleSelectSector = (sectorKey) => {
    if (sectorKey === 'chamoli') {
      setSelectedCoords([30.4100, 79.4200]);
    } else if (sectorKey === 'kedarnath') {
      setSelectedCoords([30.7300, 79.0600]);
    } else if (sectorKey === 'joshimath') {
      setSelectedCoords([30.5500, 79.5600]);
    } else if (sectorKey === 'dehradun') {
      setSelectedCoords([30.3165, 78.0322]);
    } else if (sectorKey === 'uttarkashi') {
      setSelectedCoords([30.7300, 78.4400]);
    }
  };

  return (
    <div className={`w-screen h-screen overflow-hidden flex flex-col pt-12 select-none transition-colors ${
      isDark ? 'bg-[#0a0e15] text-[#dfe2ed]' : 'bg-[#ffffff] text-[#0f172a]'
    }`}>
      {/* Top Fixed Header */}
      <Header onSelectSector={handleSelectSector} />

      {/* Emergency Action Banners */}
      <EvacuationBanner />

      {/* Main Tactical Grid Viewport */}
      <div className="flex-1 w-full h-[calc(100vh-3rem)] overflow-hidden flex relative">
        {/* Left Side Navigation & Tactical Alerts Drawer */}
        <LeftDrawer
          isCollapsed={isLeftCollapsed}
          onToggleCollapse={() => setIsLeftCollapsed(prev => !prev)}
        />

        {/* Center Spatial Map Viewport (Full Bleed) */}
        <main className="flex-1 h-full relative overflow-hidden">
          <GisMapCanvas selectedSectorCoords={selectedCoords} />
        </main>

        {/* Right Telemetry & AI ReAct Reasoner Rack */}
        <RightRack
          isCollapsed={isRightCollapsed}
          onToggleCollapse={() => setIsRightCollapsed(prev => !prev)}
        />
      </div>
    </div>
  );
}
