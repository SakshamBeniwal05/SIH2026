import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useJsApiLoader, GoogleMap, Circle as GoogleCircle, Marker as GoogleMarker, Polyline as GooglePolyline, Polygon as GooglePolygon, InfoWindow } from '@react-google-maps/api';
import { MapContainer, TileLayer, Circle as LeafletCircle, Marker as LeafletMarker, Popup, Polyline as LeafletPolyline, Polygon as LeafletPolygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { useGps, calculateDistanceKm, NORTHEAST_BOUNDS } from '../../context/GpsContext';
import { darkMapStyle, lightMapStyle } from './googleMapStyles';
import {
  GOOGLE_MASK_PATHS,
  LEAFLET_MASK_POSITIONS,
  NORTHEAST_STATE_PERIMETERS,
  NORTHEAST_PERIMETER_GOOGLE,
  NORTHEAST_PERIMETER_LEAFLET
} from '../../data/northeastMask';
import {
  Layers,
  Crosshair,
  Compass,
  Radio,
  AlertOctagon,
  Shield,
  Activity,
  Globe,
  Map as MapIcon,
  Navigation,
  Locate,
  MapPin,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

// Fix Leaflet Default Icon issue in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Tactical SVG Markers for Leaflet
const createLeafletTacticalIcon = (color, symbol) => {
  return L.divIcon({
    className: 'custom-tactical-marker',
    html: `
      <div style="
        width: 26px;
        height: 26px;
        background-color: ${color};
        border: 2px solid #ffffff;
        box-shadow: 0 0 10px ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-family: 'Space Grotesk', sans-serif;
        font-weight: bold;
        font-size: 11px;
      ">
        ${symbol}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

const leafletReportIcon = createLeafletTacticalIcon('#D32F2F', '!');
const leafletSensorIcon = createLeafletTacticalIcon('#00E676', 'S');
const leafletEpicenterIcon = createLeafletTacticalIcon('#B71C1C', 'X');

// Pulsating GPS Reticle Icon for Leaflet
const leafletUserGpsIcon = L.divIcon({
  className: 'custom-leaflet-user-gps',
  html: `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(0, 229, 255, 0.4); animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 14px; height: 14px; border-radius: 50%; background: #00E5FF; border: 2.5px solid #ffffff; box-shadow: 0 0 12px #00E5FF;"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Tactical Pinpoint Target Marker Icon for Leaflet
const leafletTargetIcon = L.divIcon({
  className: 'custom-leaflet-target-pinpoint',
  html: `
    <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: rgba(0, 229, 255, 0.5); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 28px; height: 28px; border-radius: 50%; background: #D32F2F; border: 2.5px solid #ffffff; box-shadow: 0 0 14px #00E5FF; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 14px;">
        🎯
      </div>
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19]
});

// Custom Vector Tactical Pin with Pulsating Ring for Leaflet
const createLeafletTargetPinIcon = (color = '#D32F2F') => {
  return L.divIcon({
    className: 'custom-leaflet-target-pin',
    html: `
      <div style="position: relative; width: 44px; height: 52px; filter: drop-shadow(0 0 10px ${color});">
        <svg width="44" height="52" viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 2 C11.5 2 3 10.5 3 21 C3 34 22 50 22 50 C22 50 41 34 41 21 C41 10.5 32.5 2 22 2 Z" fill="${color}" stroke="#ffffff" stroke-width="2.5"/>
          <circle cx="22" cy="21" r="9" fill="#090d14" stroke="#00E5FF" stroke-width="2"/>
          <circle cx="22" cy="21" r="4" fill="#00E5FF"/>
        </svg>
        <div style="position: absolute; top: 12px; left: 13px; width: 18px; height: 18px; border-radius: 50%; background: rgba(0, 229, 255, 0.4); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none;"></div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 50],
    popupAnchor: [0, -48]
  });
};

// Helper to center the Leaflet map when sector or target alert changes
function LeafletMapRecenter({ coords, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] && coords[1]) {
      map.flyTo(coords, zoom || map.getZoom() || 12, { animate: true, duration: 1.0 });
    }
  }, [coords, zoom, map]);
  return null;
}

const libraries = ['geometry', 'places'];

export function GisMapCanvas({
  selectedSectorCoords,
  bottomOffset,
  focusedTarget,
  onClearFocus,
  simulationTarget,
  customPreviewTiers,
  customPreviewEpicenter,
  customAiPreviewZones
}) {
  const { isDark } = useTheme();
  const { activeHazard, reports, telemetry, predictedAlert, isOfficialActive, alerts } = useSocket();
  const activePrediction = (customAiPreviewZones && customAiPreviewZones.isCritical !== false)
    ? customAiPreviewZones
    : (predictedAlert && predictedAlert.isCritical !== false ? predictedAlert : null);
  const {
    gpsLocation,
    status: gpsStatus,
    errorMessage: gpsErrorMessage,
    isLiveTracking,
    acquireGps,
    toggleLiveTracking,
    setSimulatedGps,
    clearGps
  } = useGps();

  const [isTelemetryExpanded, setIsTelemetryExpanded] = useState(true);

  // Read Google Maps API Key from environment
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';
  const hasValidGoogleKey = Boolean(googleMapsApiKey && !googleMapsApiKey.includes('YourGoogleMapsJavaScriptAPIKeyHere'));

  // Map Engine State: 'google' (default if key exists) or 'leaflet'
  const [engine, setEngine] = useState(hasValidGoogleKey ? 'google' : 'leaflet');

  // Google Map Type: 'roadmap' (vector), 'satellite', 'hybrid', 'terrain'
  const [googleMapTypeId, setGoogleMapTypeId] = useState('roadmap');

  // Load Google Maps JS Script via @react-google-maps/api
  const { isLoaded: isGoogleLoaded, loadError: googleLoadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey,
    libraries
  });

  // Active Map Layer Toggles
  const [layers, setLayers] = useState({
    zones: true,
    roads: true,
    reports: true,
    sensors: true,
    radarSweep: true
  });

  // Floating HUD Widgets Collapse States
  const [isLayersCollapsed, setIsLayersCollapsed] = useState(false);
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);

  // Northeast India Regional Center (Guwahati / Brahmaputra Basin)
  const [mapCenter, setMapCenter] = useState({ lat: 26.1445, lng: 91.7362 });
  const [activeInfoWindow, setActiveInfoWindow] = useState(null);
  const googleMapRef = useRef(null);
  const leafletTargetMarkerRef = useRef(null);

  const leafletMaxBounds = [
    [20.5, 88.5],
    [30.5, 98.0]
  ];

  // Pan to GPS location when acquired or updated
  useEffect(() => {
    if (gpsLocation) {
      const newPos = { lat: gpsLocation.lat, lng: gpsLocation.lng };
      setMapCenter(newPos);
      if (googleMapRef.current) {
        googleMapRef.current.panTo(newPos);
        googleMapRef.current.setZoom(14);
      }
    }
  }, [gpsLocation]);

  useEffect(() => {
    if (selectedSectorCoords) {
      const newPos = { lat: selectedSectorCoords[0], lng: selectedSectorCoords[1] };
      setMapCenter(newPos);
      if (googleMapRef.current) {
        googleMapRef.current.panTo(newPos);
      }
    } else if (activeHazard?.location?.coordinates) {
      const newPos = { lat: activeHazard.location.coordinates[1], lng: activeHazard.location.coordinates[0] };
      setMapCenter(newPos);
      if (googleMapRef.current) {
        googleMapRef.current.panTo(newPos);
      }
    }
  }, [selectedSectorCoords, activeHazard]);

  // Pan and activate InfoWindow whenever an emergency alert is clicked
  useEffect(() => {
    if (focusedTarget && focusedTarget.coords) {
      const pos = { lat: focusedTarget.coords[0], lng: focusedTarget.coords[1] };
      setMapCenter(pos);
      if (googleMapRef.current) {
        googleMapRef.current.panTo(pos);
        googleMapRef.current.setZoom(focusedTarget.zoom || 13);
      }
      setActiveInfoWindow({
        type: 'focusedTarget',
        title: focusedTarget.title || 'ACTIVE EMERGENCY DIRECTIVE',
        pos,
        target: focusedTarget
      });
      const timer = setTimeout(() => {
        if (leafletTargetMarkerRef.current) {
          leafletTargetMarkerRef.current.openPopup();
        }
      }, 350);
      return () => clearTimeout(timer);
    } else {
      // Clear target info window if focused target is stood down or removed
      setActiveInfoWindow(prev => (prev?.type === 'focusedTarget' ? null : prev));
    }
  }, [focusedTarget]);

  // Synchronize InfoWindow / popup removal when AI prediction is cleared or becomes safe
  useEffect(() => {
    if (!activePrediction || activePrediction.isCritical === false) {
      setActiveInfoWindow(prev => {
        if (
          prev?.type === 'prediction' ||
          (prev?.type === 'focusedTarget' && (
            prev?.target?.type === 'prediction' ||
            prev?.target?.id === 'ai-predicted-danger' ||
            prev?.target?.id === 'ai-prediction-cycle'
          ))
        ) {
          return null;
        }
        return prev;
      });
    }
  }, [activePrediction]);

  const onGoogleMapLoad = useCallback((map) => {
    googleMapRef.current = map;
  }, []);

  const onGoogleMapUnmount = useCallback(() => {
    googleMapRef.current = null;
  }, []);

  // Northeast India Critical Highway Lifelines & Corridors
  const roadCorridors = [
    {
      id: 'nh-27',
      name: 'NH-27 / NH-37 (Brahmaputra Valley Arterial Lifeline: Guwahati - Nagaon - Kaziranga - Jorhat - Dibrugarh)',
      severed: activeHazard?.severedRoads?.some(r => r.includes('NH-27') || r.includes('NH-37')),
      path: [
        { lat: 26.1445, lng: 91.7362 },
        { lat: 26.3500, lng: 92.6800 },
        { lat: 26.5800, lng: 93.1700 },
        { lat: 26.7500, lng: 94.2200 },
        { lat: 27.4728, lng: 94.9120 }
      ],
      leafletPath: [
        [26.1445, 91.7362],
        [26.3500, 92.6800],
        [26.5800, 93.1700],
        [26.7500, 94.2200],
        [27.4728, 94.9120]
      ]
    },
    {
      id: 'nh-29',
      name: 'NH-29 / NH-2 (Dimapur - Kohima - Imphal Trans-Asian Lifeline)',
      severed: activeHazard?.severedRoads?.some(r => r.includes('NH-29') || r.includes('NH-2')),
      path: [
        { lat: 25.9000, lng: 93.7300 },
        { lat: 25.8000, lng: 93.7500 },
        { lat: 25.6751, lng: 94.1086 },
        { lat: 25.5000, lng: 94.1500 },
        { lat: 24.8170, lng: 93.9368 }
      ],
      leafletPath: [
        [25.9000, 93.7300],
        [25.8000, 93.7500],
        [25.6751, 94.1086],
        [25.5000, 94.1500],
        [24.8170, 93.9368]
      ]
    },
    {
      id: 'nh-6',
      name: 'NH-6 (Guwahati - Shillong - Silchar - Agartala Lifeline)',
      severed: activeHazard?.severedRoads?.some(r => r.includes('NH-6')),
      path: [
        { lat: 26.1445, lng: 91.7362 },
        { lat: 25.5788, lng: 91.8933 },
        { lat: 25.4500, lng: 92.2000 },
        { lat: 24.8333, lng: 92.7789 },
        { lat: 23.8315, lng: 91.2868 }
      ],
      leafletPath: [
        [26.1445, 91.7362],
        [25.5788, 91.8933],
        [25.4500, 92.2000],
        [24.8333, 92.7789],
        [23.8315, 91.2868]
      ]
    },
    {
      id: 'nh-306',
      name: 'NH-306 / NH-54 (Silchar - Kolasib - Aizawl Lifeline)',
      severed: activeHazard?.severedRoads?.some(r => r.includes('NH-306') || r.includes('NH-54')),
      path: [
        { lat: 24.8333, lng: 92.7789 },
        { lat: 24.2200, lng: 92.6800 },
        { lat: 23.7271, lng: 92.7176 }
      ],
      leafletPath: [
        [24.8333, 92.7789],
        [24.2200, 92.6800],
        [23.7271, 92.7176]
      ]
    },
    {
      id: 'nh-13',
      name: 'NH-13 (Trans-Arunachal Highway: Bhalukpong - Itanagar - Pasighat)',
      severed: activeHazard?.severedRoads?.some(r => r.includes('NH-13')),
      path: [
        { lat: 27.0100, lng: 92.6300 },
        { lat: 27.1004, lng: 93.6166 },
        { lat: 28.0667, lng: 95.3333 }
      ],
      leafletPath: [
        [27.0100, 92.6300],
        [27.1004, 93.6166],
        [28.0667, 95.3333]
      ]
    }
  ];

  const isGovtActive = isOfficialActive || activeHazard?.officialActive === true;
  const isSimActive = activeHazard?.status === 'active' && (!activeHazard?.expiresAt || new Date(activeHazard.expiresAt).getTime() > Date.now());
  const showHazardZones = (customPreviewTiers && customPreviewTiers.length > 0) || ((isGovtActive || isSimActive) && (activeHazard?.tiers?.length > 0));

  const tiers = (customPreviewTiers && customPreviewTiers.length > 0)
    ? customPreviewTiers
    : (showHazardZones ? (activeHazard?.tiers || []) : []);

  const epicenterPos = customPreviewEpicenter
    ? { lat: customPreviewEpicenter.lat, lng: customPreviewEpicenter.lng }
    : (activeHazard?.location?.coordinates
        ? { lat: activeHazard.location.coordinates[1], lng: activeHazard.location.coordinates[0] }
        : mapCenter);

  const leafletCenter = [mapCenter.lat, mapCenter.lng];
  const leafletEpicenter = [epicenterPos.lat, epicenterPos.lng];

  // Operator GPS Proximity to Active Disaster Epicenter
  const userDistanceToEpicenter = gpsLocation && epicenterPos
    ? calculateDistanceKm(gpsLocation.lat, gpsLocation.lng, epicenterPos.lat, epicenterPos.lng).toFixed(2)
    : null;

  const zone1RadiusKm = tiers[0] ? (tiers[0].radiusMeters / 1000).toFixed(2) : '4.80';
  const isInsideZone1 = userDistanceToEpicenter && parseFloat(userDistanceToEpicenter) <= parseFloat(zone1RadiusKm);

  // Target Visuals & Impact Radius when an alert is focused
  const targetLat = focusedTarget?.coords?.[0];
  const targetLng = focusedTarget?.coords?.[1];
  const isTargetPrediction = focusedTarget?.type === 'prediction' || focusedTarget?.id === 'ai-predicted-danger' || focusedTarget?.id === 'ai-prediction-cycle';
  const isTargetExpiredPrediction = isTargetPrediction && (!activePrediction || activePrediction.isCritical === false);

  const isTargetEpicenter = focusedTarget?.type === 'epicenter' || focusedTarget?.id === 'active-hazard-epicenter' || focusedTarget?.id === 'official-govt-directive-live';
  const isTargetExpiredEpicenter = isTargetEpicenter && !isGovtActive && !(customPreviewTiers && customPreviewTiers.length > 0);

  const isTargetSimulation = focusedTarget?.type === 'broadcast';
  const isTargetExpiredSimulation = isTargetSimulation && !isSimActive && !(alerts || []).some(a => (a.simulationId && a.simulationId === focusedTarget.id) || a.basinName === focusedTarget.data?.basinName);

  const isTargetExpired = isTargetExpiredPrediction || isTargetExpiredEpicenter || isTargetExpiredSimulation;
  const hasTarget = Boolean(targetLat && targetLng) && !isTargetExpired;

  // Auto-clear focus synchronously if target alert was stood down, expired or removed
  useEffect(() => {
    if (isTargetExpired) {
      setActiveInfoWindow(prev => (prev?.type === 'focusedTarget' ? null : prev));
      if (onClearFocus) {
        onClearFocus();
      }
    }
  }, [isTargetExpired, onClearFocus]);

  const targetImpactRadius = (() => {
    if (!focusedTarget) return 5000;
    if (focusedTarget.data?.radiusMeters) return Number(focusedTarget.data.radiusMeters);
    if (focusedTarget.radiusMeters) return Number(focusedTarget.radiusMeters);
    if (typeof focusedTarget.data?.radius === 'number') return focusedTarget.data.radius * 1000;
    if (typeof focusedTarget.data?.radius === 'string') {
      const parsed = parseFloat(focusedTarget.data.radius);
      if (!isNaN(parsed)) return parsed * 1000;
    }
    if (focusedTarget.type === 'epicenter' || focusedTarget.id === 'active-hazard-epicenter') {
      return (tiers && tiers[0]?.radiusMeters) || 5200;
    }
    if (focusedTarget.type === 'prediction' || focusedTarget.id === 'ai-predicted-danger') {
      return (activePrediction?.radiusMeters) || 7500;
    }
    if (focusedTarget.type === 'road') return 2500;
    if (focusedTarget.type === 'report') return 1600;
    if (focusedTarget.type === 'sensor') return 1200;
    return 4500;
  })();

  const targetVisuals = (() => {
    if (!focusedTarget) return { color: '#00E5FF', stroke: '#00B0FF', fill: '#80D8FF', badge: 'TACTICAL PINPOINT' };
    if (focusedTarget.type === 'prediction' || focusedTarget.id === 'ai-predicted-danger') {
      return { color: '#9C27B0', stroke: '#7B1FA2', fill: '#CE93D8', badge: 'AI CLIMATIC RUNOUT PREDICTION' };
    }
    if (focusedTarget.type === 'epicenter' || focusedTarget.id === 'active-hazard-epicenter') {
      return { color: '#D32F2F', stroke: '#B71C1C', fill: '#EF5350', badge: 'GOVERNMENT EMERGENCY DIRECTIVE' };
    }
    if (focusedTarget.type === 'road') {
      return { color: '#EF6C00', stroke: '#E65100', fill: '#FFA726', badge: 'SEVERED HIGHWAY LIFELINE' };
    }
    if (focusedTarget.type === 'report') {
      return { color: '#E65100', stroke: '#BF360C', fill: '#FFAB91', badge: 'GROUND ZERO CITIZEN REPORT' };
    }
    if (focusedTarget.type === 'sensor') {
      return { color: '#00E676', stroke: '#00C853', fill: '#B9F6CA', badge: 'IoT TELEMETRY SENSOR' };
    }
    return { color: '#00E5FF', stroke: '#00B0FF', fill: '#80D8FF', badge: 'TACTICAL SECTOR DIRECTIVE' };
  })();

  // Tile layer URL for Leaflet fallback
  const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const lightTileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const shouldUseGoogle = engine === 'google' && isGoogleLoaded && !googleLoadError;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#090d14]">
      {/* ================= MAP CANVAS ================= */}
      {shouldUseGoogle ? (
        /* GOOGLE MAPS ENGINE */
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={mapCenter}
          zoom={12}
          onLoad={onGoogleMapLoad}
          onUnmount={onGoogleMapUnmount}
          options={{
            styles: isDark ? darkMapStyle : lightMapStyle,
            mapTypeId: googleMapTypeId,
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            rotateControl: true,
            fullscreenControl: false,
            backgroundColor: isDark ? '#090d14' : '#f8fafc',
            restriction: {
              latLngBounds: {
                north: 30.5,
                south: 20.5,
                east: 98.5,
                west: 88.5
              },
              strictBounds: true
            },
            minZoom: 6,
            maxZoom: 18
          }}
        >
          {/* Northeast India (7 Sister States) Inverse Boundary Mask & Glowing State Perimeters */}
          <GooglePolygon
            paths={GOOGLE_MASK_PATHS}
            options={{
              fillColor: isDark ? '#05070a' : '#e2e8f0',
              fillOpacity: 1.0,
              strokeColor: '#00E5FF',
              strokeOpacity: 1.0,
              strokeWeight: 2.0,
              clickable: false,
              zIndex: 2
            }}
          />
          {NORTHEAST_STATE_PERIMETERS.map((sp) => (
            <GooglePolyline
              key={sp.id}
              path={sp.googlePath}
              options={{
                strokeColor: '#00E5FF',
                strokeOpacity: 0.9,
                strokeWeight: 2.0,
                zIndex: 3
              }}
            />
          ))}

          {/* 1. Official Emergency Directive (Priority 1): Solid Radial Gradient 4-Tier Hazard Zones */}
          {layers.zones && showHazardZones && tiers.length > 0 && tiers.map((tier, idx) => {
            const reversed = [...tiers].reverse();
            const current = reversed[idx];
            if (!current) return null;

            return (
              <GoogleCircle
                key={current.tierName}
                center={epicenterPos}
                radius={current.radiusMeters}
                options={{
                  strokeColor: current.strokeColor,
                  strokeOpacity: 0.95,
                  strokeWeight: current.tierName === 'Hard Most' ? 3 : 1.8,
                  fillColor: current.fillColor,
                  fillOpacity: isDark ? current.fillOpacity * 0.75 : current.fillOpacity * 0.55,
                  clickable: true,
                  zIndex: 3
                }}
                onClick={() => {
                  setActiveInfoWindow({
                    type: 'zone',
                    title: `${current.tierName} Zone // Official Directive`,
                    radius: (current.radiusMeters / 1000).toFixed(2),
                    description: current.description || (current.evacuationMandated ? 'Mandatory Evacuation Enacted.' : 'Elevated Vigilance Buffer.'),
                    pos: epicenterPos
                  });
                }}
              />
            );
          })}

          {/* 1.1 AI Climatic Prediction (Priority 2): Violet Radial Gradient Circles (Only when Critical) */}
          {layers.zones && activePrediction && activePrediction.isCritical !== false && activePrediction.coordinates && (
            <>
              {/* Outer Prediction Warning Cordon */}
              <GoogleCircle
                center={{ lat: activePrediction.coordinates.lat, lng: activePrediction.coordinates.lng }}
                radius={Math.round((activePrediction.radiusMeters || 7500) * 1.45)}
                options={{
                  strokeColor: '#7B1FA2',
                  strokeOpacity: 0.8,
                  strokeWeight: 1.5,
                  fillColor: '#E1BEE7',
                  fillOpacity: isDark ? 0.12 : 0.18,
                  clickable: false,
                  zIndex: 3
                }}
              />
              {/* Secondary Moderate Hazard Ring */}
              <GoogleCircle
                center={{ lat: activePrediction.coordinates.lat, lng: activePrediction.coordinates.lng }}
                radius={Math.round(activePrediction.radiusMeters || 7500)}
                options={{
                  strokeColor: '#8E24AA',
                  strokeOpacity: 0.9,
                  strokeWeight: 2,
                  fillColor: '#CE93D8',
                  fillOpacity: isDark ? 0.24 : 0.30,
                  clickable: true,
                  zIndex: 4
                }}
                onClick={() => {
                  setActiveInfoWindow({
                    type: 'prediction',
                    title: 'AI PREDICTED RUNOUT CORRIDOR',
                    location: activePrediction.locationName || 'Projected Runout Corridor',
                    radius: activePrediction.radius || `${((activePrediction.radiusMeters || 7500)/1000).toFixed(1)} km`,
                    riskScore: activePrediction.riskScore || 0,
                    rain: activePrediction.currentRainfallRate || 0,
                    saturation: activePrediction.soilPoreSaturation || 0,
                    pos: { lat: activePrediction.coordinates.lat, lng: activePrediction.coordinates.lng }
                  });
                }}
              />
              {/* Core High Hazard Ring */}
              <GoogleCircle
                center={{ lat: activePrediction.coordinates.lat, lng: activePrediction.coordinates.lng }}
                radius={Math.round((activePrediction.radiusMeters || 7500) * 0.5)}
                options={{
                  strokeColor: '#4A148C',
                  strokeOpacity: 0.95,
                  strokeWeight: 2.5,
                  fillColor: '#BA68C8',
                  fillOpacity: isDark ? 0.38 : 0.45,
                  clickable: false,
                  zIndex: 5
                }}
              />
              <GoogleMarker
                position={{ lat: activePrediction.coordinates.lat, lng: activePrediction.coordinates.lng }}
                title="AI Climatic Predicted Storm Epicenter"
                onClick={() => {
                  setActiveInfoWindow({
                    type: 'prediction',
                    title: 'AI PREDICTED STORM HAZARD',
                    location: activePrediction.locationName || 'Projected Runout Corridor',
                    radius: activePrediction.radius || `${((activePrediction.radiusMeters || 7500)/1000).toFixed(1)} km`,
                    riskScore: activePrediction.riskScore || 0,
                    rain: activePrediction.currentRainfallRate || 0,
                    saturation: activePrediction.soilPoreSaturation || 0,
                    pos: { lat: activePrediction.coordinates.lat, lng: activePrediction.coordinates.lng }
                  });
                }}
              />
            </>
          )}

          {/* 2. Critical Epicenter Marker */}
          {showHazardZones && (
            <GoogleMarker
              position={epicenterPos}
              title="Simulated Storm Epicenter"
              onClick={() => {
                setActiveInfoWindow({
                  type: 'epicenter',
                  title: 'SIMULATED STORM EPICENTER',
                  basin: activeHazard?.simulatedBasin || 'Active Basin',
                  rain: activeHazard?.rainfallRateMmPerHour || 180,
                  pos: epicenterPos
                });
              }}
            />
          )}

          {/* 3. Road Network Overlays */}
          {layers.roads && roadCorridors.map(road => (
            <GooglePolyline
              key={road.id}
              path={road.path}
              options={{
                strokeColor: road.severed ? '#D32F2F' : '#0288D1',
                strokeOpacity: 0.9,
                strokeWeight: road.severed ? 5 : 3.5
              }}
              onClick={() => {
                setActiveInfoWindow({
                  type: 'road',
                  name: road.name,
                  severed: road.severed,
                  pos: road.path[1]
                });
              }}
            />
          ))}

          {/* 4. Crowdsourced Field Report Markers */}
          {layers.reports && reports.map(rep => {
            const pos = { lat: rep.location.coordinates[1], lng: rep.location.coordinates[0] };
            return (
              <GoogleMarker
                key={rep._id}
                position={pos}
                title={rep.description}
                onClick={() => {
                  setActiveInfoWindow({
                    type: 'report',
                    report: rep,
                    pos
                  });
                }}
              />
            );
          })}

          {/* 5. Live Telemetry Sensors */}
          {layers.sensors && (telemetry.sensors || []).map(sensor => {
            const pos = sensor.coords
              ? { lat: sensor.coords[1], lng: sensor.coords[0] }
              : { lat: 30.4100, lng: 79.4200 };
            return (
              <GoogleMarker
                key={sensor.id}
                position={pos}
                title={sensor.name}
                onClick={() => {
                  setActiveInfoWindow({
                    type: 'sensor',
                    sensor,
                    pos
                  });
                }}
              />
            );
          })}

          {/* 6. Operator Live GPS Location Marker & Precision Ring */}
          {gpsLocation && (
            <>
              <GoogleCircle
                center={{ lat: gpsLocation.lat, lng: gpsLocation.lng }}
                radius={gpsLocation.accuracy || 25}
                options={{
                  strokeColor: '#00B0FF',
                  strokeOpacity: 0.8,
                  strokeWeight: 1.5,
                  fillColor: '#00E5FF',
                  fillOpacity: 0.15,
                  clickable: false
                }}
              />
              <GoogleMarker
                position={{ lat: gpsLocation.lat, lng: gpsLocation.lng }}
                title={gpsLocation.isSimulated ? (gpsLocation.label || 'Simulated Field GPS') : 'Operator Current GPS Position'}
                onClick={() => {
                  setActiveInfoWindow({
                    type: 'userGps',
                    pos: { lat: gpsLocation.lat, lng: gpsLocation.lng }
                  });
                }}
                icon={{
                  path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                  scale: 8,
                  fillColor: '#00E5FF',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2.5
                }}
              />
            </>
          )}

          {/* Focused Alert Pinpoint Marker & Concentric Impact Radius (Google Maps) */}
          {hasTarget && (
            <>
              {/* Outer Impact Radius Circle */}
              <GoogleCircle
                center={{ lat: targetLat, lng: targetLng }}
                radius={targetImpactRadius}
                options={{
                  strokeColor: targetVisuals.stroke,
                  strokeOpacity: 0.9,
                  strokeWeight: 2,
                  fillColor: targetVisuals.fill || targetVisuals.color,
                  fillOpacity: isDark ? 0.20 : 0.28,
                  clickable: true,
                  zIndex: 15
                }}
                onClick={() => {
                  setActiveInfoWindow({
                    type: 'focusedTarget',
                    title: focusedTarget.title || 'ACTIVE EMERGENCY DIRECTIVE',
                    pos: { lat: targetLat, lng: targetLng },
                    target: focusedTarget
                  });
                }}
              />
              {/* Inner Core Radius Circle */}
              <GoogleCircle
                center={{ lat: targetLat, lng: targetLng }}
                radius={Math.round(targetImpactRadius * 0.45)}
                options={{
                  strokeColor: targetVisuals.color,
                  strokeOpacity: 0.95,
                  strokeWeight: 2.5,
                  fillColor: targetVisuals.color,
                  fillOpacity: isDark ? 0.28 : 0.35,
                  clickable: false,
                  zIndex: 16
                }}
              />
              {/* Tactical Crosshair Reticle Ring */}
              <GoogleCircle
                center={{ lat: targetLat, lng: targetLng }}
                radius={Math.min(650, targetImpactRadius * 0.15)}
                options={{
                  strokeColor: '#00E5FF',
                  strokeOpacity: 1,
                  strokeWeight: 2.5,
                  fillColor: '#00E5FF',
                  fillOpacity: 0.15,
                  clickable: false,
                  zIndex: 17
                }}
              />
              {/* Pinpoint Target Marker */}
              <GoogleMarker
                position={{ lat: targetLat, lng: targetLng }}
                zIndex={100}
                onClick={() => {
                  setActiveInfoWindow({
                    type: 'focusedTarget',
                    title: focusedTarget.title || 'ACTIVE EMERGENCY DIRECTIVE',
                    pos: { lat: targetLat, lng: targetLng },
                    target: focusedTarget
                  });
                }}
                icon={
                  window.google?.maps?.SymbolPath
                    ? {
                        path: 'M 0,0 C -2,-20 -10,-22 -10,-32 A 10,10 0 1,1 10,-32 C 10,-22 2,-20 0,0 Z',
                        scale: 1.4,
                        fillColor: targetVisuals.color,
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2.5
                      }
                    : undefined
                }
              />
            </>
          )}

          {/* Active InfoWindow */}
          {activeInfoWindow && (
            <InfoWindow
              position={activeInfoWindow.pos}
              onCloseClick={() => setActiveInfoWindow(null)}
            >
              <div className="p-2 space-y-1.5 max-w-xs text-xs font-sans text-slate-900">
                {activeInfoWindow.type === 'focusedTarget' && (
                  <div className="space-y-2 min-w-[240px] max-w-xs">
                    {/* Header with Dual Controls: Minimize (—) vs Clear (✕) */}
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <div className="flex items-center gap-1.5 font-bold uppercase text-[10px]" style={{ color: targetVisuals.color }}>
                        <span className="w-2 h-2 rounded-full inline-block animate-ping" style={{ backgroundColor: targetVisuals.color }} />
                        <span>{focusedTarget?.badge || targetVisuals.badge}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setActiveInfoWindow(null)}
                          className="px-1.5 py-0.5 text-[11px] font-bold text-slate-500 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                          title="Minimize mini-window (keeps pinpoint & radius active)"
                        >
                          —
                        </button>
                        <button
                          onClick={() => {
                            setActiveInfoWindow(null);
                            if (onClearFocus) onClearFocus();
                          }}
                          className="px-1.5 py-0.5 text-[11px] font-bold text-red-600 hover:bg-red-100 rounded transition-colors cursor-pointer"
                          title="Clear pinpoint & radius from map"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-xs uppercase text-slate-900 mb-0.5">
                        {focusedTarget?.title || 'ACTIVE EMERGENCY DIRECTIVE'}
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center justify-between">
                        <span>Coordinates:</span>
                        <strong className="font-mono">{targetLat?.toFixed(4)}°N, {targetLng?.toFixed(4)}°E</strong>
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center justify-between">
                        <span>Impact Radius:</span>
                        <strong className="text-red-600 font-mono">{(targetImpactRadius / 1000).toFixed(1)} km</strong>
                      </div>
                      {focusedTarget?.basin && (
                        <div className="text-[11px] text-slate-600 flex items-center justify-between">
                          <span>River Basin:</span>
                          <strong>{focusedTarget.basin}</strong>
                        </div>
                      )}
                      {focusedTarget?.rain && (
                        <div className="text-[11px] text-slate-600 flex items-center justify-between">
                          <span>Rainfall Rate:</span>
                          <strong className="text-red-600">{focusedTarget.rain} mm/hr</strong>
                        </div>
                      )}
                      {focusedTarget?.data?.description && (
                        <p className="mt-1 text-[11px] text-slate-700 bg-slate-50 p-1 rounded border border-slate-200">
                          {focusedTarget.data.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-1.5 border-t border-slate-200 flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setActiveInfoWindow(null);
                          if (onClearFocus) onClearFocus();
                        }}
                        className="flex-1 py-1 px-2 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase transition-colors text-center cursor-pointer"
                      >
                        ✕ Clear Pinpoint
                      </button>
                      <button
                        onClick={() => setActiveInfoWindow(null)}
                        className="py-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] uppercase transition-colors cursor-pointer"
                        title="Keep pinpoint & radius active, minimize popup"
                      >
                        Minimize
                      </button>
                    </div>
                  </div>
                )}
                {activeInfoWindow.type === 'zone' && (
                  <>
                    <div className="font-bold text-xs uppercase text-red-600">
                      {activeInfoWindow.title}
                    </div>
                    <p className="text-slate-700">Radius: <strong>{activeInfoWindow.radius} km</strong></p>
                    <p className="text-[11px] text-slate-500">{activeInfoWindow.description}</p>
                  </>
                )}
                {activeInfoWindow.type === 'epicenter' && (
                  <>
                    <div className="font-bold text-xs uppercase text-red-600">
                      {activeInfoWindow.title}
                    </div>
                    <p className="text-slate-700">Basin: {activeInfoWindow.basin}</p>
                    <p className="text-red-600 font-bold">{activeInfoWindow.rain} mm/hr Precipitation</p>
                  </>
                )}
                {activeInfoWindow.type === 'road' && (
                  <>
                    <div className={`font-bold text-xs ${activeInfoWindow.severed ? 'text-red-600' : 'text-cyan-600'}`}>
                      {activeInfoWindow.name}
                    </div>
                    <p className="text-slate-700">
                      Status: <strong>{activeInfoWindow.severed ? 'SEVERED / CLOSED' : 'PASSABLE'}</strong>
                    </p>
                  </>
                )}
                {activeInfoWindow.type === 'report' && (
                  <>
                    <div className="flex justify-between border-b pb-1">
                      <strong className="text-red-600 uppercase">{activeInfoWindow.report.category.replace('_', ' ')}</strong>
                      <span className="text-[10px] bg-red-100 text-red-700 px-1 font-bold">{activeInfoWindow.report.severityObserved?.toUpperCase()}</span>
                    </div>
                    {activeInfoWindow.report.mediaUrl && (
                      <img src={activeInfoWindow.report.mediaUrl} alt="evidence" className="w-full h-24 object-cover my-1" />
                    )}
                    <p className="text-slate-600 text-[11px]">{activeInfoWindow.report.description}</p>
                  </>
                )}
                {activeInfoWindow.type === 'sensor' && (
                  <>
                    <div className="font-bold text-emerald-600 uppercase">{activeInfoWindow.sensor.name}</div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                      <span>Saturation:</span>
                      <strong>{activeInfoWindow.sensor.saturation}%</strong>
                      <span>Displacement:</span>
                      <strong className="text-red-600">{activeInfoWindow.sensor.displacementDelta || '+14.2 mm/h'}</strong>
                    </div>
                  </>
                )}
                {activeInfoWindow.type === 'userGps' && gpsLocation && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold uppercase text-[#0091EA] border-b pb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] inline-block animate-ping" />
                      <span>{gpsLocation.isSimulated ? (gpsLocation.label || 'SIMULATED GPS') : 'OPERATOR LIVE GPS'}</span>
                    </div>
                    <div className="space-y-0.5 text-[11px]">
                      <div>Coordinates: <strong>[{gpsLocation.lat.toFixed(5)}, {gpsLocation.lng.toFixed(5)}]</strong></div>
                      <div>Satellite Precision: <strong>±{gpsLocation.accuracy} meters</strong></div>
                      {gpsLocation.altitude && <div>Altitude: <strong>{gpsLocation.altitude} m MSL</strong></div>}
                      {userDistanceToEpicenter && (
                        <div className="pt-1 border-t border-slate-200 mt-1">
                          <div>Distance to Storm Epicenter: <strong>{userDistanceToEpicenter} km</strong></div>
                          <div className="mt-1 font-bold">
                            {isInsideZone1 ? (
                              <span className="text-red-700 bg-red-50 px-1 py-0.5 border border-red-300">
                                CRITICAL: MANDATORY EVACUATION ZONE
                              </span>
                            ) : (
                              <span className="text-emerald-700 bg-emerald-50 px-1 py-0.5 border border-emerald-300">
                                OUTSIDE IMMEDIATE ZONE 1 RADIUS
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeInfoWindow.type === 'prediction' && (
                  <div className="space-y-1">
                    <div className="font-bold text-xs uppercase text-purple-700 flex items-center gap-1 border-b pb-1">
                      <span>{activeInfoWindow.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-700 space-y-0.5">
                      <div>Corridor: <strong>{activeInfoWindow.location}</strong></div>
                      <div>Projected Runout: <strong>{activeInfoWindow.radius}</strong></div>
                      <div>Risk Probability: <strong className="text-red-600">{activeInfoWindow.riskScore}%</strong></div>
                      <div>Effective Rain: <strong>{activeInfoWindow.rain} mm/hr</strong></div>
                      <div>Soil Saturation: <strong>{activeInfoWindow.saturation}%</strong></div>
                    </div>
                  </div>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      ) : (
        /* LEAFLET / OPENSEAMAP FALLBACK */
        <MapContainer
          center={leafletCenter}
          zoom={10}
          minZoom={6}
          maxBounds={leafletMaxBounds}
          maxBoundsViscosity={1.0}
          className="w-full h-full z-0"
          zoomControl={false}
        >
          <LeafletMapRecenter coords={focusedTarget?.coords || selectedSectorCoords || leafletCenter} zoom={focusedTarget?.zoom || 11} />

          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>, OpenStreetMap'
            url={isDark ? darkTileUrl : lightTileUrl}
            maxZoom={19}
          />

          {/* Northeast India (7 Sister States) Inverse Boundary Mask & Glowing State Perimeters */}
          <LeafletPolygon
            positions={LEAFLET_MASK_POSITIONS}
            interactive={false}
            pathOptions={{
              fillColor: isDark ? '#05070a' : '#e2e8f0',
              fillOpacity: 1.0,
              color: '#00E5FF',
              weight: 2.0,
              fillRule: 'evenodd'
            }}
          />
          {NORTHEAST_STATE_PERIMETERS.map((sp) => (
            <LeafletPolyline
              key={sp.id}
              positions={sp.leafletPositions}
              interactive={false}
              pathOptions={{
                color: '#00E5FF',
                weight: 2.0,
                opacity: 0.9
              }}
            />
          ))}

          {/* 1. Official Emergency Directive (Priority 1): Concentric 4-Tier Hazard Zones */}
          {layers.zones && showHazardZones && tiers.length > 0 && tiers.map((tier, idx) => {
            const reversedTiers = [...tiers].reverse();
            const current = reversedTiers[idx];
            if (!current) return null;

            return (
              <LeafletCircle
                key={current.tierName}
                center={leafletEpicenter}
                radius={current.radiusMeters}
                pathOptions={{
                  color: current.strokeColor,
                  fillColor: current.fillColor,
                  fillOpacity: isDark ? current.fillOpacity * 0.75 : current.fillOpacity * 0.55,
                  weight: current.tierName === 'Hard Most' ? 3 : 1.8,
                  dashArray: current.tierName === 'Negligible' ? '4, 4' : null
                }}
              >
                <Popup>
                  <div className="p-2 space-y-1 text-xs">
                    <div className="font-headline font-bold uppercase" style={{ color: current.strokeColor }}>
                      {current.tierName} Zone // Official Directive
                    </div>
                    <p className="font-body text-slate-300">
                      Radius: <strong>{(current.radiusMeters / 1000).toFixed(2)} km</strong>
                    </p>
                    <p className="font-body text-[11px] text-slate-400">
                      {current.description || (current.evacuationMandated ? 'Mandatory Evacuation Enacted.' : 'Elevated Vigilance Buffer.')}
                    </p>
                  </div>
                </Popup>
              </LeafletCircle>
            );
          })}

          {/* 1.1 AI Climatic Prediction (Priority 2): Violet Radial Gradient Circles (Only when Critical) */}
          {layers.zones && activePrediction && activePrediction.isCritical !== false && activePrediction.coordinates && (
            <>
              <LeafletCircle
                center={[activePrediction.coordinates.lat, activePrediction.coordinates.lng]}
                radius={Math.round((activePrediction.radiusMeters || 7500) * 1.45)}
                pathOptions={{
                  color: '#7B1FA2',
                  fillColor: '#E1BEE7',
                  fillOpacity: isDark ? 0.12 : 0.18,
                  weight: 1.5,
                  dashArray: '6, 6'
                }}
              />
              <LeafletCircle
                center={[activePrediction.coordinates.lat, activePrediction.coordinates.lng]}
                radius={Math.round(activePrediction.radiusMeters || 7500)}
                pathOptions={{
                  color: '#8E24AA',
                  fillColor: '#CE93D8',
                  fillOpacity: isDark ? 0.24 : 0.30,
                  weight: 2,
                  dashArray: '4, 4'
                }}
              >
                <Popup>
                  <div className="p-2 space-y-1 text-xs font-telemetry">
                    <div className="font-headline font-bold text-purple-400 uppercase">
                      AI PREDICTED RUNOUT CORRIDOR
                    </div>
                    <p className="text-slate-300">Location: <strong>{activePrediction.locationName || 'Projected Corridor'}</strong></p>
                    <p className="text-slate-300">Risk Score: <strong className="text-red-400">{activePrediction.riskScore || 0}%</strong></p>
                    <p className="text-slate-300">Runout Radius: <strong>{activePrediction.radius || '7.5 km'}</strong></p>
                    <p className="text-slate-300">Effective Rain: <strong>{activePrediction.currentRainfallRate || 0} mm/hr</strong></p>
                  </div>
                </Popup>
              </LeafletCircle>
              <LeafletCircle
                center={[activePrediction.coordinates.lat, activePrediction.coordinates.lng]}
                radius={Math.round((activePrediction.radiusMeters || 7500) * 0.5)}
                pathOptions={{
                  color: '#4A148C',
                  fillColor: '#BA68C8',
                  fillOpacity: isDark ? 0.38 : 0.45,
                  weight: 2.5
                }}
              />
            </>
          )}

          {/* Epicenter Marker */}
          {showHazardZones && (
            <LeafletMarker position={leafletEpicenter} icon={leafletEpicenterIcon}>
              <Popup>
                <div className="p-2 text-xs space-y-1">
                  <span className="font-headline font-bold text-[#D32F2F]">SIMULATED STORM EPICENTER</span>
                  <p className="font-body text-slate-300">Basin: {activeHazard?.simulatedBasin || 'Active Basin'}</p>
                  <p className="font-telemetry text-red-400 font-bold">{activeHazard?.rainfallRateMmPerHour || 180} mm/hr Accumulation</p>
                </div>
              </Popup>
            </LeafletMarker>
          )}

          {/* Road Network Overlays */}
          {layers.roads && roadCorridors.map(road => (
            <LeafletPolyline
              key={road.id}
              positions={road.leafletPath}
              pathOptions={{
                color: road.severed ? '#D32F2F' : '#0288D1',
                weight: road.severed ? 5 : 3.5,
                dashArray: road.severed ? '6, 6' : null,
                opacity: 0.9
              }}
            >
              <Popup>
                <div className="p-2 text-xs space-y-1">
                  <span className={`font-headline font-bold ${road.severed ? 'text-red-500' : 'text-cyan-500'}`}>
                    {road.name}
                  </span>
                  <p className="font-body text-slate-300">
                    Status: <strong>{road.severed ? 'SEVERED / CLOSED' : 'PASSABLE'}</strong>
                  </p>
                </div>
              </Popup>
            </LeafletPolyline>
          ))}

          {/* Field Reports */}
          {layers.reports && reports.map(rep => {
            const coords = [rep.location.coordinates[1], rep.location.coordinates[0]];
            return (
              <LeafletMarker key={rep._id} position={coords} icon={leafletReportIcon}>
                <Popup>
                  <div className="p-2 space-y-1.5 max-w-xs text-xs">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                      <span className="font-headline font-bold uppercase text-red-400">
                        {rep.category.replace('_', ' ')}
                      </span>
                      <span className="px-1.5 py-0.5 bg-red-950/80 text-red-300 font-telemetry text-[10px]">
                        {rep.severityObserved?.toUpperCase()}
                      </span>
                    </div>
                    {rep.mediaUrl && (
                      <img src={rep.mediaUrl} alt="Evidence" className="w-full h-24 object-cover border border-slate-700" />
                    )}
                    <p className="font-body text-slate-300 text-[11px]">{rep.description}</p>
                  </div>
                </Popup>
              </LeafletMarker>
            );
          })}

          {/* Sensors */}
          {layers.sensors && (telemetry.sensors || []).map(sensor => {
            const coords = sensor.coords ? [sensor.coords[1], sensor.coords[0]] : [30.4100, 79.4200];
            return (
              <LeafletMarker key={sensor.id} position={coords} icon={leafletSensorIcon}>
                <Popup>
                  <div className="p-2 space-y-1 text-xs">
                    <div className="font-headline font-bold text-[#00E676] uppercase">
                      {sensor.name}
                    </div>
                    <div className="grid grid-cols-2 gap-1 font-telemetry text-[11px] pt-1">
                      <span>Pore Saturation:</span>
                      <strong className="text-amber-400">{sensor.saturation}%</strong>
                      <span>Displacement:</span>
                      <strong className="text-red-400">{sensor.displacementDelta || '+14.2 mm/h'}</strong>
                    </div>
                  </div>
                </Popup>
              </LeafletMarker>
            );
          })}

          {/* Operator Live GPS Position & Accuracy Circle on Leaflet */}
          {gpsLocation && (
            <>
              <LeafletCircle
                center={[gpsLocation.lat, gpsLocation.lng]}
                radius={gpsLocation.accuracy || 25}
                pathOptions={{
                  color: '#00B0FF',
                  fillColor: '#00E5FF',
                  fillOpacity: 0.15,
                  weight: 1.5
                }}
              />
              <LeafletMarker
                position={[gpsLocation.lat, gpsLocation.lng]}
                icon={leafletUserGpsIcon}
              >
                <Popup>
                  <div className="p-2 space-y-1.5 max-w-xs text-xs">
                    <div className="flex items-center gap-1.5 font-headline font-bold text-[#00E5FF] uppercase border-b border-slate-700 pb-1">
                      <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping" />
                      <span>{gpsLocation.isSimulated ? (gpsLocation.label || 'Simulated Field GPS') : 'Operator Live GPS Fix'}</span>
                    </div>
                    <div className="space-y-0.5 font-telemetry text-slate-300 text-[11px]">
                      <div>Coordinates: [{gpsLocation.lat.toFixed(5)}, {gpsLocation.lng.toFixed(5)}]</div>
                      <div>Satellite Precision: ±{gpsLocation.accuracy} meters</div>
                      {gpsLocation.altitude && <div>Elevation: {gpsLocation.altitude} m MSL</div>}
                      {userDistanceToEpicenter && (
                        <div className="pt-1 border-t border-slate-700 mt-1">
                          <div>Distance to Storm Epicenter: <strong>{userDistanceToEpicenter} km</strong></div>
                          <div className="mt-1 font-bold">
                            {isInsideZone1 ? (
                              <span className="text-red-400 bg-red-950 px-1 py-0.5 border border-red-700">
                                CRITICAL: INSIDE ZONE 1 EVACUATION RADIUS
                              </span>
                            ) : (
                              <span className="text-emerald-400 bg-emerald-950 px-1 py-0.5 border border-emerald-700">
                                OUTSIDE ACTIVE ZONE 1 RADIUS
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </LeafletMarker>
            </>
          )}

          {/* Focused Alert Pinpoint Marker & Concentric Impact Radius (Leaflet) */}
          {hasTarget && (
            <>
              {/* Outer Impact Radius Circle */}
              <LeafletCircle
                center={[targetLat, targetLng]}
                radius={targetImpactRadius}
                pathOptions={{
                  color: targetVisuals.stroke,
                  weight: 2,
                  fillColor: targetVisuals.fill || targetVisuals.color,
                  fillOpacity: isDark ? 0.20 : 0.28
                }}
                eventHandlers={{
                  click: () => {
                    if (leafletTargetMarkerRef.current) {
                      leafletTargetMarkerRef.current.openPopup();
                    }
                  }
                }}
              />
              {/* Inner Core Radius Circle */}
              <LeafletCircle
                center={[targetLat, targetLng]}
                radius={Math.round(targetImpactRadius * 0.45)}
                pathOptions={{
                  color: targetVisuals.color,
                  weight: 2.5,
                  fillColor: targetVisuals.color,
                  fillOpacity: isDark ? 0.28 : 0.35
                }}
              />
              {/* Tactical Crosshair Reticle Ring */}
              <LeafletCircle
                center={[targetLat, targetLng]}
                radius={Math.min(650, targetImpactRadius * 0.15)}
                pathOptions={{
                  color: '#00E5FF',
                  weight: 2.5,
                  fillColor: '#00E5FF',
                  fillOpacity: 0.15,
                  dashArray: '5, 5'
                }}
              />
              {/* Pinpoint Target Marker */}
              <LeafletMarker
                ref={leafletTargetMarkerRef}
                position={[targetLat, targetLng]}
                icon={createLeafletTargetPinIcon(targetVisuals.color)}
                zIndexOffset={1000}
              >
                <Popup minWidth={260} maxWidth={320} className="custom-tactical-popup">
                  <div className="p-1.5 space-y-2 text-xs font-sans text-slate-900">
                    {/* Header with Dual Controls: Minimize (—) vs Clear (✕) */}
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <div className="flex items-center gap-1.5 font-bold uppercase text-[10px]" style={{ color: targetVisuals.color }}>
                        <span className="w-2 h-2 rounded-full inline-block animate-ping" style={{ backgroundColor: targetVisuals.color }} />
                        <span>{focusedTarget?.badge || targetVisuals.badge}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (leafletTargetMarkerRef.current) {
                              leafletTargetMarkerRef.current.closePopup();
                            }
                          }}
                          className="px-1.5 py-0.5 text-[11px] font-bold text-slate-500 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                          title="Minimize mini-window (keeps pinpoint & radius active)"
                        >
                          —
                        </button>
                        <button
                          onClick={() => {
                            if (leafletTargetMarkerRef.current) {
                              leafletTargetMarkerRef.current.closePopup();
                            }
                            if (onClearFocus) onClearFocus();
                          }}
                          className="px-1.5 py-0.5 text-[11px] font-bold text-red-600 hover:bg-red-100 rounded transition-colors cursor-pointer"
                          title="Clear pinpoint & radius from map"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-xs uppercase text-slate-900 mb-0.5">
                        {focusedTarget?.title || 'ACTIVE EMERGENCY DIRECTIVE'}
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center justify-between">
                        <span>Coordinates:</span>
                        <strong className="font-mono">{targetLat?.toFixed(4)}°N, {targetLng?.toFixed(4)}°E</strong>
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center justify-between">
                        <span>Impact Radius:</span>
                        <strong className="text-red-600 font-mono">{(targetImpactRadius / 1000).toFixed(1)} km</strong>
                      </div>
                      {focusedTarget?.basin && (
                        <div className="text-[11px] text-slate-600 flex items-center justify-between">
                          <span>River Basin:</span>
                          <strong>{focusedTarget.basin}</strong>
                        </div>
                      )}
                      {focusedTarget?.rain && (
                        <div className="text-[11px] text-slate-600 flex items-center justify-between">
                          <span>Rainfall Rate:</span>
                          <strong className="text-red-600">{focusedTarget.rain} mm/hr</strong>
                        </div>
                      )}
                      {focusedTarget?.data?.description && (
                        <p className="mt-1 text-[11px] text-slate-700 bg-slate-50 p-1 rounded border border-slate-200">
                          {focusedTarget.data.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-1.5 border-t border-slate-200 flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          if (leafletTargetMarkerRef.current) {
                            leafletTargetMarkerRef.current.closePopup();
                          }
                          if (onClearFocus) onClearFocus();
                        }}
                        className="flex-1 py-1 px-2 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase transition-colors text-center cursor-pointer"
                      >
                        ✕ Clear Pinpoint
                      </button>
                      <button
                        onClick={() => {
                          if (leafletTargetMarkerRef.current) {
                            leafletTargetMarkerRef.current.closePopup();
                          }
                        }}
                        className="py-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] uppercase transition-colors cursor-pointer"
                        title="Keep pinpoint & radius active, minimize popup"
                      >
                        Minimize
                      </button>
                    </div>
                  </div>
                </Popup>
              </LeafletMarker>
            </>
          )}
        </MapContainer>
      )}

      {/* Radar Sweep Animation */}
      {layers.radarSweep && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden flex items-center justify-center">
          <div className="w-[800px] h-[800px] rounded-full border border-red-500/10 radar-sweep opacity-30 bg-gradient-to-tr from-transparent via-red-500/5 to-transparent" />
        </div>
      )}

      {/* ================= TACTICAL HUD OVERLAYS ================= */}

      {/* Top Left: Map Engine & View Mode Switcher */}
      <div className={`absolute top-4 left-4 z-20 flex items-center gap-1.5 p-1 border shadow-xl ${
        isDark ? 'bg-[#0f131b]/95 border-[#27303e] text-slate-300' : 'bg-white/95 border-[#cbd5e1] text-slate-800'
      }`}>
        {/* Engine Switcher */}
        <button
          onClick={() => setEngine(prev => (prev === 'google' ? 'leaflet' : 'google'))}
          className={`px-2 py-1 flex items-center gap-1.5 text-[10px] font-headline font-bold uppercase border transition-colors ${
            engine === 'google'
              ? 'bg-[#0288D1] text-white border-[#01579B]'
              : isDark
                ? 'bg-[#181c23] text-slate-300 border-[#27303e]'
                : 'bg-slate-100 text-slate-700 border-[#cbd5e1]'
          }`}
          title="Toggle Map Engine (Google Maps API / CartoDB)"
        >
          <Globe className="w-3 h-3" />
          <span>{engine === 'google' ? 'Google Maps (Active)' : 'Leaflet CartoDB'}</span>
        </button>

        {/* Google Map Type Selector (Visible when Google engine is active) */}
        {shouldUseGoogle && (
          <div className="flex items-center gap-1 font-telemetry text-[10px]">
            {['roadmap', 'satellite', 'hybrid', 'terrain'].map(type => (
              <button
                key={type}
                onClick={() => setGoogleMapTypeId(type)}
                className={`px-1.5 py-1 uppercase font-semibold border ${
                  googleMapTypeId === type
                    ? 'bg-[#D32F2F] text-white border-[#B71C1C]'
                    : isDark
                      ? 'bg-[#10131b] text-slate-400 border-[#27303e] hover:text-white'
                      : 'bg-white text-slate-600 border-[#cbd5e1] hover:text-black'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Top Right: Layer Controls */}
      {isLayersCollapsed ? (
        <button
          onClick={() => setIsLayersCollapsed(false)}
          className={`absolute top-4 right-4 z-20 px-2.5 py-1.5 border shadow-xl flex items-center gap-1.5 text-xs font-headline font-bold uppercase transition-all ${
            isDark
              ? 'bg-[#0f131b]/95 border-[#27303e] text-cyan-400 hover:border-cyan-500 hover:text-white'
              : 'bg-white/95 border-[#cbd5e1] text-slate-800 hover:border-cyan-500'
          }`}
          title="Expand Map Layers"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="text-[10px]">Layers</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      ) : (
        <div className={`absolute top-4 right-4 z-20 flex flex-col gap-1.5 p-1 border shadow-xl transition-all ${
          isDark ? 'bg-[#0f131b]/90 border-[#27303e] text-slate-300' : 'bg-white/95 border-[#cbd5e1] text-slate-800'
        }`}>
          <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-700/50">
            <span className="font-headline font-bold text-[9px] uppercase text-slate-400">Carto Layers</span>
            <button
              onClick={() => setIsLayersCollapsed(true)}
              className="p-0.5 hover:text-cyan-400 text-slate-400 transition-colors"
              title="Collapse Layer Window"
              aria-label="Collapse Layer Window"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={() => setLayers(prev => ({ ...prev, zones: !prev.zones }))}
            className={`px-2 py-1 flex items-center gap-1.5 text-[10px] font-headline font-semibold border transition-colors ${
              layers.zones
                ? 'bg-[#B71C1C] text-white border-[#B71C1C]'
                : 'border-transparent hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>4-Tier Zones</span>
          </button>

          <button
            onClick={() => setLayers(prev => ({ ...prev, roads: !prev.roads }))}
            className={`px-2 py-1 flex items-center gap-1.5 text-[10px] font-headline font-semibold border transition-colors ${
              layers.roads
                ? 'bg-[#0288D1] text-white border-[#0288D1]'
                : 'border-transparent hover:bg-slate-800/40'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>Roads (NH-58)</span>
          </button>

          <button
            onClick={() => setLayers(prev => ({ ...prev, reports: !prev.reports }))}
            className={`px-2 py-1 flex items-center gap-1.5 text-[10px] font-headline font-semibold border transition-colors ${
              layers.reports
                ? 'bg-[#E65100] text-white border-[#E65100]'
                : 'border-transparent hover:bg-slate-800/40'
            }`}
          >
            <AlertOctagon className="w-3 h-3" />
            <span>Reports ({reports.length})</span>
          </button>

          <button
            onClick={() => setLayers(prev => ({ ...prev, sensors: !prev.sensors }))}
            className={`px-2 py-1 flex items-center gap-1.5 text-[10px] font-headline font-semibold border transition-colors ${
              layers.sensors
                ? 'bg-[#00E676] text-black border-[#00E676]'
                : 'border-transparent hover:bg-slate-800/40'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Sensors</span>
          </button>

          <button
            onClick={() => setLayers(prev => ({ ...prev, radarSweep: !prev.radarSweep }))}
            className={`px-2 py-1 flex items-center gap-1.5 text-[10px] font-headline font-semibold border transition-colors ${
              layers.radarSweep
                ? 'bg-slate-700 text-cyan-300 border-slate-600'
                : 'border-transparent hover:bg-slate-800/40'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>Radar Sweep</span>
          </button>
        </div>
      )}

      {/* Centered on top of Center Bottom Dock: Calibrated Hazard Legend */}
      {isLegendCollapsed ? (
        <button
          onClick={() => setIsLegendCollapsed(false)}
          className={`absolute ${bottomOffset === 'bottom-20' ? 'bottom-36 md:bottom-40' : 'bottom-16 sm:bottom-[4.5rem]'} left-1/2 -translate-x-1/2 z-30 px-3 py-1 border shadow-2xl font-headline font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all backdrop-blur-md rounded-sm ${
            isDark
              ? 'bg-[#0f131b]/95 border-[#27303e] text-slate-300 hover:text-cyan-400 hover:border-cyan-500'
              : 'bg-white/95 border-[#cbd5e1] text-slate-700 hover:text-black hover:border-slate-400'
          }`}
          title="Expand Calibrated Hazard Legend"
        >
          <Layers className="w-3 h-3 text-cyan-400" />
          <span>Hazard Legend</span>
          <ChevronUp className="w-3 h-3 text-cyan-400" />
        </button>
      ) : (
        <div className={`absolute ${bottomOffset === 'bottom-20' ? 'bottom-36 md:bottom-40' : 'bottom-16 sm:bottom-[4.5rem]'} left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 border shadow-2xl backdrop-blur-md transition-all flex flex-col items-center rounded-sm max-w-[95vw] ${
          isDark ? 'bg-[#0f131b]/95 border-[#27303e] text-slate-300' : 'bg-white/95 border-[#cbd5e1] text-slate-800'
        }`}>
          <div className="w-full flex items-center justify-between font-headline font-bold text-[9px] uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-700/40 pb-0.5 gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
              <span>Calibrated Hazard Tiers</span>
            </div>
            <button
              onClick={() => setIsLegendCollapsed(true)}
              className="p-0.5 hover:text-cyan-400 text-slate-400 transition-colors"
              title="Collapse Hazard Legend"
              aria-label="Collapse Hazard Legend"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-telemetry text-[10px]">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#D32F2F] fill-[#FFCDD2] shrink-0" />
              <span className="text-[#D32F2F] font-bold whitespace-nowrap">Zone 1: Hard Most</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#ED6C02] fill-[#FFE0B2] shrink-0" />
              <span className="text-[#ED6C02] font-bold whitespace-nowrap">Zone 2: Most</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#FF8F00] fill-[#FFF9C4] shrink-0" />
              <span className="text-[#F57C00] whitespace-nowrap">Zone 3: Some</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#0288D1] fill-[#B3E5FC] shrink-0" />
              <span className="text-[#0288D1] whitespace-nowrap">Zone 4: Negligible</span>
            </div>
            {activePrediction && activePrediction.isCritical !== false && (
              <div className="flex items-center gap-1 pl-2 border-l border-purple-800/60">
                <MapPin className="w-3 h-3 text-[#7B1FA2] fill-[#E1BEE7] shrink-0" />
                <span className="text-purple-400 font-bold whitespace-nowrap">AI Runout ({activePrediction.radius || '7.5 km'})</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Right: Tactical GPS Telemetry & Live Controls */}
      <div className={`absolute ${bottomOffset || 'bottom-4'} right-4 z-20 flex flex-col items-end gap-2 max-w-sm pointer-events-auto`}>
        {/* GPS Error or Permission Notice */}
        {gpsErrorMessage && (
          <div className="p-2 text-[10px] font-telemetry bg-red-950/95 border border-red-600 text-red-200 shadow-xl max-w-xs text-right">
            <div className="font-bold flex items-center justify-end gap-1 text-red-400">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>GPS ACQUISITION NOTICE</span>
            </div>
            <p className="mt-0.5">{gpsErrorMessage}</p>
          </div>
        )}

        {/* Live GPS Telemetry Readout Card (Collapsible) */}
        {gpsLocation && isTelemetryExpanded && (
          <div className={`p-2.5 border shadow-2xl backdrop-blur-md text-xs font-telemetry w-72 sm:w-80 ${
            isDark ? 'bg-[#0f131b]/95 border-[#27303e] text-slate-200' : 'bg-white/95 border-[#cbd5e1] text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/50 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-pulse" />
                <span className="font-headline font-bold text-[11px] uppercase tracking-wider text-[#00E5FF]">
                  {gpsLocation.isSimulated ? 'SIMULATED FIELD GPS' : 'LIVE SATELLITE GPS'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-1.5 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold">
                  ±{gpsLocation.accuracy}m
                </span>
                <button
                  onClick={() => setIsTelemetryExpanded(false)}
                  className="text-slate-400 hover:text-white p-0.5"
                  title="Minimize Readout"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Fix Coords:</span>
                <span className="font-bold">
                  {gpsLocation.lat.toFixed(4)}° N, {gpsLocation.lng.toFixed(4)}° E
                </span>
              </div>
              {userDistanceToEpicenter && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Epicenter Dist:</span>
                  <span className={`font-bold ${isInsideZone1 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {userDistanceToEpicenter} km {isInsideZone1 ? '(Zone 1 Alert)' : '(Safe Buffer)'}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">Northeast AO:</span>
                <span className={gpsLocation.isInsideAO ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {gpsLocation.isInsideAO ? 'INSIDE 7 SISTERS AO' : 'BORDER PERIPHERY'}
                </span>
              </div>
            </div>

            {/* Quick Actions within Card */}
            <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-slate-700/50">
              <button
                onClick={() => {
                  const pos = { lat: gpsLocation.lat, lng: gpsLocation.lng };
                  setMapCenter(pos);
                  if (googleMapRef.current) {
                    googleMapRef.current.panTo(pos);
                    googleMapRef.current.setZoom(14);
                  }
                }}
                className="flex-1 py-1 px-1.5 bg-[#0288D1] hover:bg-[#0277BD] text-white text-[10px] font-headline font-bold uppercase transition-colors text-center"
              >
                Center
              </button>
              <button
                onClick={toggleLiveTracking}
                className={`py-1 px-1.5 text-[10px] font-headline font-bold uppercase border transition-colors ${
                  isLiveTracking
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : isDark
                      ? 'bg-[#181c23] text-slate-300 border-[#27303e] hover:border-slate-500'
                      : 'bg-slate-100 text-slate-700 border-[#cbd5e1] hover:bg-slate-200'
                }`}
                title="Toggle continuous live GPS tracking"
              >
                {isLiveTracking ? 'Tracking: ON' : 'Live Sync'}
              </button>
              <button
                onClick={clearGps}
                className={`py-1 px-1.5 text-[10px] font-headline font-bold uppercase border transition-colors ${
                  isDark
                    ? 'bg-[#181c23] text-slate-400 border-[#27303e] hover:text-red-400'
                    : 'bg-slate-100 text-slate-500 border-[#cbd5e1] hover:text-red-600'
                }`}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Primary Bottom-Center Action Bar */}
        <div className={`flex items-center gap-1.5 p-1 border shadow-2xl backdrop-blur-md transition-all ${
          isDark
            ? 'bg-[#0f131b]/95 border-[#27303e]'
            : 'bg-white/95 border-[#cbd5e1]'
        }`}>
          {/* Main Locate Me Button (Icon Only) */}
          <button
            onClick={async () => {
              try {
                const loc = await acquireGps();
                const pos = { lat: loc.lat, lng: loc.lng };
                setMapCenter(pos);
                if (googleMapRef.current) {
                  googleMapRef.current.panTo(pos);
                  googleMapRef.current.setZoom(14);
                }
              } catch (err) {
                console.warn('GPS Locate failed:', err);
              }
            }}
            disabled={gpsStatus === 'acquiring'}
            className={`w-8 h-8 flex items-center justify-center border transition-all shadow-lg cursor-pointer ${
              gpsStatus === 'acquiring'
                ? 'bg-cyan-900/80 border-cyan-500 text-cyan-300 animate-pulse cursor-wait'
                : gpsLocation && !gpsLocation.isSimulated
                  ? 'bg-[#00E5FF] hover:bg-[#00B0FF] text-black border-[#00B0FF] shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'bg-[#0288D1] hover:bg-[#0277BD] text-white border-[#01579B]'
            }`}
            title={
              gpsStatus === 'acquiring'
                ? 'Acquiring GPS...'
                : gpsLocation
                  ? `GPS: ${gpsLocation.lat.toFixed(4)}°, ${gpsLocation.lng.toFixed(4)}° (Click to center)`
                  : 'Acquire My GPS'
            }
            aria-label="Acquire My GPS"
          >
            <Locate className={`w-4 h-4 ${gpsStatus === 'acquiring' ? 'animate-spin' : gpsLocation && !gpsLocation.isSimulated ? 'text-black' : ''}`} />
          </button>

          {/* Quick Presets Dropdown */}
          <div className="relative group">
            <button
              className={`w-8 h-8 flex items-center justify-center border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#181c23] border-[#27303e] text-slate-300 hover:border-cyan-500'
                  : 'bg-slate-100 border-[#cbd5e1] text-slate-700 hover:border-cyan-500'
              }`}
              title="Quick Field GPS Simulation Presets"
              aria-label="Quick Field GPS Simulation Presets"
            >
              <Navigation className="w-4 h-4 text-cyan-400" />
            </button>
            <div className={`absolute bottom-full right-0 mb-2 hidden group-hover:flex flex-col gap-1 p-1.5 border shadow-2xl min-w-[250px] text-xs font-telemetry z-30 ${
              isDark ? 'bg-[#0f131b] border-[#27303e]' : 'bg-white border-[#cbd5e1]'
            }`}>
              <div className="text-[10px] text-slate-400 uppercase font-headline font-bold px-1.5 py-0.5">
                Northeast 7 Sisters Sector Presets
              </div>
              <button
                onClick={() => {
                  const loc = setSimulatedGps(26.1445, 91.7362, 'Guwahati Kamrup (Assam)');
                  const pos = { lat: loc.lat, lng: loc.lng };
                  setMapCenter(pos);
                  if (googleMapRef.current) {
                    googleMapRef.current.panTo(pos);
                    googleMapRef.current.setZoom(14);
                  }
                }}
                className="text-left px-2 py-1 hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors border border-transparent hover:border-cyan-700"
              >
                Guwahati / Kamrup (Assam)
              </button>
              <button
                onClick={() => {
                  const loc = setSimulatedGps(25.5788, 91.8933, 'Shillong Khasi Hills (Meghalaya)');
                  const pos = { lat: loc.lat, lng: loc.lng };
                  setMapCenter(pos);
                  if (googleMapRef.current) {
                    googleMapRef.current.panTo(pos);
                    googleMapRef.current.setZoom(14);
                  }
                }}
                className="text-left px-2 py-1 hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors border border-transparent hover:border-cyan-700"
              >
                Shillong / Khasi Hills (Meghalaya)
              </button>
              <button
                onClick={() => {
                  const loc = setSimulatedGps(23.7271, 92.7176, 'Aizawl Melthum (Mizoram)');
                  const pos = { lat: loc.lat, lng: loc.lng };
                  setMapCenter(pos);
                  if (googleMapRef.current) {
                    googleMapRef.current.panTo(pos);
                    googleMapRef.current.setZoom(14);
                  }
                }}
                className="text-left px-2 py-1 hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors border border-transparent hover:border-cyan-700"
              >
                Aizawl Melthum Ridge (Mizoram)
              </button>
              <button
                onClick={() => {
                  const loc = setSimulatedGps(25.8000, 93.7500, 'Chumukedima Pagla Pahar (Nagaland)');
                  const pos = { lat: loc.lat, lng: loc.lng };
                  setMapCenter(pos);
                  if (googleMapRef.current) {
                    googleMapRef.current.panTo(pos);
                    googleMapRef.current.setZoom(14);
                  }
                }}
                className="text-left px-2 py-1 hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors border border-transparent hover:border-cyan-700"
              >
                Chumukedima / NH-29 (Nagaland)
              </button>
              <button
                onClick={() => {
                  const loc = setSimulatedGps(24.8167, 93.6833, 'Tupul Noney Corridor (Manipur)');
                  const pos = { lat: loc.lat, lng: loc.lng };
                  setMapCenter(pos);
                  if (googleMapRef.current) {
                    googleMapRef.current.panTo(pos);
                    googleMapRef.current.setZoom(14);
                  }
                }}
                className="text-left px-2 py-1 hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors border border-transparent hover:border-cyan-700"
              >
                Tupul / Noney Gorge (Manipur)
              </button>
              <button
                onClick={() => {
                  const loc = setSimulatedGps(28.0667, 95.3333, 'Pasighat Upper Siang (Arunachal)');
                  const pos = { lat: loc.lat, lng: loc.lng };
                  setMapCenter(pos);
                  if (googleMapRef.current) {
                    googleMapRef.current.panTo(pos);
                    googleMapRef.current.setZoom(14);
                  }
                }}
                className="text-left px-2 py-1 hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors border border-transparent hover:border-cyan-700"
              >
                Pasighat / Siang (Arunachal Pradesh)
              </button>
              <button
                onClick={() => {
                  const loc = setSimulatedGps(23.8315, 91.2868, 'Agartala Howrah (Tripura)');
                  const pos = { lat: loc.lat, lng: loc.lng };
                  setMapCenter(pos);
                  if (googleMapRef.current) {
                    googleMapRef.current.panTo(pos);
                    googleMapRef.current.setZoom(14);
                  }
                }}
                className="text-left px-2 py-1 hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors border border-transparent hover:border-cyan-700"
              >
                Agartala / Howrah River (Tripura)
              </button>
            </div>
          </div>

          {/* If GPS active: Toggle telemetry HUD & Clear */}
          {gpsLocation && (
            <>
              <button
                onClick={() => setIsTelemetryExpanded(prev => !prev)}
                className={`h-8 px-2 flex items-center justify-center border text-[10px] font-headline font-bold uppercase transition-colors cursor-pointer ${
                  isTelemetryExpanded
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                    : isDark ? 'bg-[#181c23] text-slate-300 border-[#27303e]' : 'bg-slate-100 text-slate-700 border-[#cbd5e1]'
                }`}
                title="Toggle Telemetry Readout"
              >
                {isTelemetryExpanded ? 'HUD -' : 'HUD +'}
              </button>
              <button
                onClick={clearGps}
                className="w-8 h-8 flex items-center justify-center border border-red-500/50 bg-red-950/40 text-red-400 hover:bg-red-900/60 hover:text-white transition-colors cursor-pointer"
                title="Clear GPS Position"
                aria-label="Clear GPS Position"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
