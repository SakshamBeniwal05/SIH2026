import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useJsApiLoader, GoogleMap, Circle as GoogleCircle, Marker as GoogleMarker, Polyline as GooglePolyline, InfoWindow } from '@react-google-maps/api';
import { MapContainer, TileLayer, Circle as LeafletCircle, Marker as LeafletMarker, Popup, Polyline as LeafletPolyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { useGps, calculateDistanceKm, UTTARAKHAND_BOUNDS } from '../../context/GpsContext';
import { darkMapStyle, lightMapStyle } from './googleMapStyles';
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

// Helper to center the Leaflet map when sector changes
function LeafletMapRecenter({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] && coords[1]) {
      map.flyTo(coords, map.getZoom(), { animate: true, duration: 1.2 });
    }
  }, [coords, map]);
  return null;
}

const libraries = ['geometry', 'places'];

export function GisMapCanvas({ selectedSectorCoords, bottomOffset }) {
  const { isDark } = useTheme();
  const { activeHazard, reports, telemetry } = useSocket();
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

  // Uttarakhand Regional Center (Chamoli / Alaknanda Valley)
  const [mapCenter, setMapCenter] = useState({ lat: 30.4100, lng: 79.4200 });
  const [activeInfoWindow, setActiveInfoWindow] = useState(null);
  const googleMapRef = useRef(null);

  const leafletMaxBounds = [
    [UTTARAKHAND_BOUNDS.south, UTTARAKHAND_BOUNDS.west],
    [UTTARAKHAND_BOUNDS.north, UTTARAKHAND_BOUNDS.east]
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

  const onGoogleMapLoad = useCallback((map) => {
    googleMapRef.current = map;
  }, []);

  const onGoogleMapUnmount = useCallback(() => {
    googleMapRef.current = null;
  }, []);

  // Uttarakhand Critical Highway Lifelines & Corridors
  const roadCorridors = [
    {
      id: 'nh-58',
      name: 'NH-58 (Rishikesh - Chamoli - Joshimath - Badrinath Lifeline)',
      severed: activeHazard?.severedRoads?.some(r => r.includes('NH-58')),
      path: [
        { lat: 30.1500, lng: 78.3000 },
        { lat: 30.2200, lng: 78.7800 },
        { lat: 30.2800, lng: 78.9800 },
        { lat: 30.3200, lng: 79.2200 },
        { lat: 30.4100, lng: 79.4200 },
        { lat: 30.4600, lng: 79.4800 },
        { lat: 30.5200, lng: 79.5200 },
        { lat: 30.5500, lng: 79.5600 },
        { lat: 30.7400, lng: 79.4900 }
      ],
      leafletPath: [
        [30.1500, 78.3000],
        [30.2200, 78.7800],
        [30.2800, 78.9800],
        [30.3200, 79.2200],
        [30.4100, 79.4200],
        [30.4600, 79.4800],
        [30.5200, 79.5200],
        [30.5500, 79.5600],
        [30.7400, 79.4900]
      ]
    },
    {
      id: 'nh-107',
      name: 'NH-107 (Rudraprayag - Guptkashi - Kedarnath Highway)',
      severed: activeHazard?.severedRoads?.some(r => r.includes('NH-107')),
      path: [
        { lat: 30.2800, lng: 78.9800 },
        { lat: 30.3900, lng: 79.0300 },
        { lat: 30.5200, lng: 79.0800 },
        { lat: 30.6300, lng: 79.0100 },
        { lat: 30.6700, lng: 79.0300 },
        { lat: 30.7352, lng: 79.0669 }
      ],
      leafletPath: [
        [30.2800, 78.9800],
        [30.3900, 79.0300],
        [30.5200, 79.0800],
        [30.6300, 79.0100],
        [30.6700, 79.0300],
        [30.7352, 79.0669]
      ]
    },
    {
      id: 'nh-134',
      name: 'NH-134 (Silkyara Bend - Barkot Highway)',
      severed: activeHazard?.severedRoads?.some(r => r.includes('NH-134')),
      path: [
        { lat: 30.6200, lng: 78.3100 },
        { lat: 30.7500, lng: 78.2600 },
        { lat: 30.8100, lng: 78.2100 }
      ],
      leafletPath: [
        [30.6200, 78.3100],
        [30.7500, 78.2600],
        [30.8100, 78.2100]
      ]
    }
  ];

  const tiers = activeHazard?.tiers || [];
  const epicenterPos = activeHazard?.location?.coordinates
    ? { lat: activeHazard.location.coordinates[1], lng: activeHazard.location.coordinates[0] }
    : mapCenter;

  const leafletCenter = [mapCenter.lat, mapCenter.lng];
  const leafletEpicenter = [epicenterPos.lat, epicenterPos.lng];

  // Operator GPS Proximity to Active Disaster Epicenter
  const userDistanceToEpicenter = gpsLocation && epicenterPos
    ? calculateDistanceKm(gpsLocation.lat, gpsLocation.lng, epicenterPos.lat, epicenterPos.lng).toFixed(2)
    : null;

  const zone1RadiusKm = tiers[0] ? (tiers[0].radiusMeters / 1000).toFixed(2) : '4.80';
  const isInsideZone1 = userDistanceToEpicenter && parseFloat(userDistanceToEpicenter) <= parseFloat(zone1RadiusKm);

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
              latLngBounds: UTTARAKHAND_BOUNDS,
              strictBounds: false
            },
            minZoom: 8,
            maxZoom: 18
          }}
        >
          {/* 1. Calibrated Concentric 4-Tier Hazard Zones */}
          {layers.zones && tiers.map((tier, idx) => {
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
                  strokeOpacity: 0.9,
                  strokeWeight: current.tierName === 'Hard Most' ? 2.5 : 1.5,
                  fillColor: current.fillColor,
                  fillOpacity: isDark ? current.fillOpacity * 0.7 : current.fillOpacity * 0.5,
                  clickable: true
                }}
                onClick={() => {
                  setActiveInfoWindow({
                    type: 'zone',
                    title: `${current.tierName} Zone // Risk Matrix`,
                    radius: (current.radiusMeters / 1000).toFixed(2),
                    description: current.description || (current.evacuationMandated ? 'Mandatory Evacuation Enacted.' : 'Elevated Vigilance Buffer.'),
                    pos: epicenterPos
                  });
                }}
              />
            );
          })}

          {/* 2. Critical Epicenter Marker */}
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

          {/* Active InfoWindow */}
          {activeInfoWindow && (
            <InfoWindow
              position={activeInfoWindow.pos}
              onCloseClick={() => setActiveInfoWindow(null)}
            >
              <div className="p-2 space-y-1.5 max-w-xs text-xs font-sans text-slate-900">
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
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      ) : (
        /* LEAFLET / OPENSEAMAP FALLBACK */
        <MapContainer
          center={leafletCenter}
          zoom={10}
          minZoom={8}
          maxBounds={leafletMaxBounds}
          maxBoundsViscosity={0.8}
          className="w-full h-full z-0"
          zoomControl={false}
        >
          <LeafletMapRecenter coords={leafletCenter} />

          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>, OpenStreetMap'
            url={isDark ? darkTileUrl : lightTileUrl}
            maxZoom={19}
          />

          {/* Concentric 4-Tier Hazard Zones */}
          {layers.zones && tiers.map((tier, idx) => {
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
                  fillOpacity: isDark ? current.fillOpacity * 0.7 : current.fillOpacity * 0.5,
                  weight: current.tierName === 'Hard Most' ? 2.5 : 1.5,
                  dashArray: current.tierName === 'Negligible' ? '4, 4' : null
                }}
              >
                <Popup>
                  <div className="p-2 space-y-1 text-xs">
                    <div className="font-headline font-bold uppercase" style={{ color: current.strokeColor }}>
                      {current.tierName} Zone // Risk Matrix
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

          {/* Epicenter Marker */}
          <LeafletMarker position={leafletEpicenter} icon={leafletEpicenterIcon}>
            <Popup>
              <div className="p-2 text-xs space-y-1">
                <span className="font-headline font-bold text-[#D32F2F]">SIMULATED STORM EPICENTER</span>
                <p className="font-body text-slate-300">Basin: {activeHazard?.simulatedBasin || 'Active Basin'}</p>
                <p className="font-telemetry text-red-400 font-bold">{activeHazard?.rainfallRateMmPerHour || 180} mm/hr Accumulation</p>
              </div>
            </Popup>
          </LeafletMarker>

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
        </MapContainer>
      )}

      {/* Floating Center Reticle */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="w-12 h-12 border border-cyan-500/25 relative flex items-center justify-center">
          <span className="w-2 h-0.5 bg-cyan-400/60 absolute" />
          <span className="h-2 w-0.5 bg-cyan-400/60 absolute" />
        </div>
      </div>

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

      {/* Bottom Left: Calibrated Hazard Legend */}
      {isLegendCollapsed ? (
        <button
          onClick={() => setIsLegendCollapsed(false)}
          className={`absolute bottom-4 left-4 z-20 px-2.5 py-1 border shadow-lg font-headline font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all ${
            isDark
              ? 'bg-[#0f131b]/95 border-[#27303e] text-slate-400 hover:text-white hover:border-slate-400'
              : 'bg-white/95 border-[#cbd5e1] text-slate-700 hover:text-black hover:border-slate-400'
          }`}
          title="Expand Hazard Legend Window"
        >
          <span>Hazard Legend</span>
          <ChevronUp className="w-3 h-3 text-cyan-400" />
        </button>
      ) : (
        <div className={`absolute bottom-4 left-4 z-20 px-3 py-2 border shadow-lg transition-all ${
          isDark ? 'bg-[#0f131b]/95 border-[#27303e] text-slate-300' : 'bg-white/95 border-[#cbd5e1] text-slate-800'
        }`}>
          <div className="flex items-center justify-between font-headline font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-1">
            <span>Calibrated Hazard Tiers</span>
            <button
              onClick={() => setIsLegendCollapsed(true)}
              className="p-0.5 hover:text-cyan-400 text-slate-400 ml-3 transition-colors"
              title="Collapse Hazard Legend"
              aria-label="Collapse Hazard Legend"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-telemetry text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#FFEBEE] border border-[#B71C1C]" />
              <span className="text-[#D32F2F] font-bold">Zone 1: Hard Most</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#FFF3E0] border border-[#E65100]" />
              <span className="text-[#ED6C02] font-bold">Zone 2: Most</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#FFF8E1] border border-[#FF8F00]" />
              <span className="text-[#F57C00]">Zone 3: Some</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#E1F5FE] border border-[#01579B]" />
              <span className="text-[#0288D1]">Zone 4: Negligible</span>
            </div>
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
                <span className="text-slate-400">Uttarakhand AO:</span>
                <span className={gpsLocation.isInsideAO ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {gpsLocation.isInsideAO ? 'INSIDE OPERATIONAL AO' : 'BORDER PERIPHERY'}
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
          {/* Main Locate Me Button */}
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
            className={`flex items-center gap-2 px-3 py-1.5 border font-headline text-xs font-bold uppercase tracking-wider shadow-lg transition-all ${
              gpsStatus === 'acquiring'
                ? 'bg-cyan-900/80 border-cyan-500 text-cyan-300 animate-pulse cursor-wait'
                : gpsLocation && !gpsLocation.isSimulated
                  ? 'bg-[#00E5FF] hover:bg-[#00B0FF] text-black border-[#00B0FF] shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'bg-[#0288D1] hover:bg-[#0277BD] text-white border-[#01579B]'
            }`}
          >
            <Locate className={`w-4 h-4 ${gpsStatus === 'acquiring' ? 'animate-spin' : gpsLocation ? 'text-black' : ''}`} />
            <span>
              {gpsStatus === 'acquiring'
                ? 'Acquiring GPS...'
                : gpsLocation
                  ? `GPS: ${gpsLocation.lat.toFixed(3)}°, ${gpsLocation.lng.toFixed(3)}°`
                  : 'Acquire My GPS'}
            </span>
          </button>

          {/* Quick Presets Dropdown */}
          <div className="relative group">
            <button
              className={`p-1.5 border font-headline text-xs font-bold uppercase transition-colors ${
                isDark
                  ? 'bg-[#181c23] border-[#27303e] text-slate-300 hover:border-cyan-500'
                  : 'bg-slate-100 border-[#cbd5e1] text-slate-700 hover:border-cyan-500'
              }`}
              title="Quick Field GPS Simulation Presets"
            >
              <Navigation className="w-4 h-4 text-cyan-400" />
            </button>
            <div className={`absolute bottom-full right-0 mb-2 hidden group-hover:flex flex-col gap-1 p-1.5 border shadow-2xl min-w-[230px] text-xs font-telemetry z-30 ${
              isDark ? 'bg-[#0f131b] border-[#27303e]' : 'bg-white border-[#cbd5e1]'
            }`}>
              <div className="text-[10px] text-slate-400 uppercase font-headline font-bold px-1.5 py-0.5">
                Uttarakhand Sector Presets
              </div>
              <button
                onClick={() => {
                  const loc = setSimulatedGps(30.4350, 79.4600, 'Chamoli Helang KM 42');
                  const pos = { lat: loc.lat, lng: loc.lng };
                  setMapCenter(pos);
                  if (googleMapRef.current) {
                    googleMapRef.current.panTo(pos);
                    googleMapRef.current.setZoom(14);
                  }
                }}
                className="text-left px-2 py-1 hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors border border-transparent hover:border-cyan-700"
              >
                Chamoli Helang KM 42 (Zone 1)
              </button>
              <button
                onClick={() => {
                  const loc = setSimulatedGps(30.5500, 79.5600, 'Joshimath Main Corridor');
                  const pos = { lat: loc.lat, lng: loc.lng };
                  setMapCenter(pos);
                  if (googleMapRef.current) {
                    googleMapRef.current.panTo(pos);
                    googleMapRef.current.setZoom(14);
                  }
                }}
                className="text-left px-2 py-1 hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors border border-transparent hover:border-cyan-700"
              >
                Joshimath Main (NH-58)
              </button>
              <button
                onClick={() => {
                  const loc = setSimulatedGps(30.7350, 79.0669, 'Kedarnath Sonprayag Link');
                  const pos = { lat: loc.lat, lng: loc.lng };
                  setMapCenter(pos);
                  if (googleMapRef.current) {
                    googleMapRef.current.panTo(pos);
                    googleMapRef.current.setZoom(14);
                  }
                }}
                className="text-left px-2 py-1 hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors border border-transparent hover:border-cyan-700"
              >
                Kedarnath Sonprayag (NH-107)
              </button>
            </div>
          </div>

          {/* If GPS active: Toggle telemetry HUD & Clear */}
          {gpsLocation && (
            <>
              <button
                onClick={() => setIsTelemetryExpanded(prev => !prev)}
                className={`px-2 py-1.5 border text-[10px] font-headline font-bold uppercase transition-colors ${
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
                className="p-1.5 border border-red-500/50 bg-red-950/40 text-red-400 hover:bg-red-900/60 hover:text-white transition-colors"
                title="Clear GPS Position"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
