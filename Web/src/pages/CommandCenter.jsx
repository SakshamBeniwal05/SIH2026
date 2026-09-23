import React, { useState, useEffect } from 'react';
import { Header } from '../components/common/Header';
import { EvacuationBanner } from '../components/alerts/EvacuationBanner';
import { LeftDrawer } from '../components/dashboard/LeftDrawer';
import { GisMapCanvas } from '../components/gis/GisMapCanvas';
import { RightRack } from '../components/dashboard/RightRack';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';

export function CommandCenter() {
  const { isDark } = useTheme();
  const { predictedAlert, isOfficialActive } = useSocket();
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [focusedTarget, setFocusedTarget] = useState(null);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

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

  // Check URL query parameters for deep-linked alert coordinates
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get('lat'));
    const lng = parseFloat(params.get('lng'));
    const alertId = params.get('alertId');
    if (!isNaN(lat) && !isNaN(lng)) {
      const target = {
        id: alertId || 'query-target',
        type: 'report',
        coords: [lat, lng],
        zoom: 14,
        timestamp: Date.now()
      };
      setFocusedTarget(target);
      setSelectedCoords([lat, lng]);
    }
  }, []);

  const handleSelectSector = (sectorKey) => {
    const coordsMap = {
      guwahati: [26.1445, 91.7362],
      shillong: [25.5788, 91.8933],
      aizawl: [23.7271, 92.7176],
      kohima: [25.6751, 94.1086],
      imphal: [24.8167, 93.6833],
      itanagar: [27.1004, 93.6166],
      agartala: [23.8315, 91.2868],
      haflong: [25.1833, 93.0167],
      // Backward compatibility aliases
      chamoli: [26.1445, 91.7362],
      kedarnath: [25.5788, 91.8933],
      joshimath: [23.7271, 92.7176],
      dehradun: [25.6751, 94.1086],
      uttarkashi: [24.8167, 93.6833]
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

  const handleSelectAlert = (target) => {
    if (!target) return;
    // Clicking the already focused alert removes focus
    if (focusedTarget && focusedTarget.id === target.id) {
      setFocusedTarget(null);
      return;
    }
    setFocusedTarget({
      ...target,
      timestamp: Date.now()
    });
    if (target.coords) {
      setSelectedCoords(target.coords);
    }
  };

  return (
    <div className={`w-screen h-screen overflow-hidden flex flex-col pt-12 select-none transition-colors ${
      isDark ? 'bg-[#0a0e15] text-[#dfe2ed]' : 'bg-[#ffffff] text-[#0f172a]'
    }`}>
      {/* Top Fixed Header */}
      <Header onSelectSector={handleSelectSector} />

      {/* Emergency Action Banners */}
      <EvacuationBanner onSelectAlert={handleSelectAlert} />

      {/* Main Tactical Grid Viewport */}
      <div className="flex-1 w-full h-[calc(100vh-3rem)] overflow-hidden flex relative">
        {/* Left Side Navigation & Tactical Alerts Drawer */}
        <LeftDrawer
          isCollapsed={isLeftCollapsed}
          onToggleCollapse={() => setIsLeftCollapsed(prev => !prev)}
          selectedAlertId={focusedTarget?.id}
          onSelectAlert={handleSelectAlert}
        />

        {/* Center Spatial Map Viewport (Full Bleed) */}
        <main className="flex-1 h-full relative overflow-hidden">
          <GisMapCanvas
            selectedSectorCoords={selectedCoords}
            focusedTarget={focusedTarget}
            onClearFocus={() => setFocusedTarget(null)}
          />
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
