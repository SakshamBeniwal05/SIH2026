import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { GpsProvider } from './context/GpsContext';
import { CommandCenter } from './pages/CommandCenter';
import { GisMapView } from './pages/GisMapView';
import { AlertsFeed } from './pages/AlertsFeed';
import { AdminSimulation } from './pages/AdminSimulation';
import { ReportHazard } from './pages/ReportHazard';
import { DesignSystemShowcase } from './pages/DesignSystemShowcase';

export function App() {
  return (
    <ThemeProvider>
      <SocketProvider>
        <GpsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<CommandCenter />} />
              <Route path="/map" element={<GisMapView />} />
              <Route path="/alerts" element={<AlertsFeed />} />
              <Route path="/admin/simulation" element={<AdminSimulation />} />
              <Route path="/report" element={<ReportHazard />} />
              <Route path="/design-system" element={<DesignSystemShowcase />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </GpsProvider>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
