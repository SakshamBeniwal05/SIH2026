# SIH 2026 — Unified Architecture, Simulation Pipeline & Dependencies Specification
## Real-Time Disaster & Rain Simulation, Crowdsourced Field Intelligence, and GIS Risk Mapping

This unified specification merges the complete system architecture, real-time rain/alert simulation workflows, crowdsourced mobile hazard reporting pipelines, autonomous Gemini ReAct intelligence, package manifests, environment configurations, and MongoDB geospatial schemas into a single operational blueprint.

Designed for open evaluation and live hackathon demonstration, the platform eliminates complex Role-Based Access Control (RBAC). Anyone accessing the designated Admin URL (`/admin/simulation`) can configure synthetic rainfall events, calibrate precipitation intensities, and trigger real-time regional alerts broadcast across Web and Mobile clients via WebSocket/SSE. Simultaneously, citizens and on-ground responders can submit geotagged photos and video telemetry of active slope fissures, road washouts, and infrastructure cracking. The autonomous **Gemini ReAct Agent** ingests these reports alongside real-time rain data to dynamically adjust GIS vulnerability boundaries.

---

## 1. High-Level System Architecture

```mermaid
graph TD
    subgraph Client_Tier ["Multi-Client Experience Layer"]
        AdminWeb["Admin Simulation Panel (Vite + React 18) <br/> Route: /admin/simulation (Open Demo Access)"]
        CitizenWeb["Web Citizen Viewer (React 18 + Mapbox / Google Maps)"]
        MobileApp["Citizen / Responder App (React Native Expo SDK 52) <br/> Geotagged Media & Incident Reporter"]
    end

    subgraph Ingestion_Broadcast_Gateway ["Express 5 / Node.js Real-Time Gateway"]
        APIRouter["REST Gateway (/api/simulation, /api/reports, /api/hazard)"]
        SocketEngine["Socket.io / Server-Sent Events (SSE) Engine <br/> Channel: 'disaster:broadcast'"]
        MediaSigner["Direct Media Upload Signer (ImageKit / Cloud Storage)"]
        APIRouter --> SocketEngine
        APIRouter --> MediaSigner
    end

    subgraph Intelligence_Tier ["AI Agent & Decision Engine (Python / FastAPI / TypeScript)"]
        ReActLoop["Gemini ReAct Reasoning Loop"]
        ToolsRegistry["Agent Tools: GIS Buffer, Rain Scorer, Severity Engine"]
        SpatialAggregator["Dynamic 4-Tier Vulnerability Recalculator"]
        ReActLoop <--> ToolsRegistry
        ReActLoop --> SpatialAggregator
    end

    subgraph Data_Storage_Tier ["Persistence & Spatial Store"]
        MongoDB[(MongoDB Atlas 2dsphere Geospatial Collections <br/> HazardEvents, IncidentReports, Simulations)]
        Redis[(Redis Pub/Sub & Telemetry Cache)]
        ObjectStore["ImageKit / Cloud Media Storage <br/> (Cracks, Rockfalls, Flood Videos)"]
    end

    %% Client Interactions
    AdminWeb -->|1. Trigger Rain & Alert| APIRouter
    CitizenWeb <-->|Stream Alerts & GIS Layers| SocketEngine
    MobileApp -->|Stream Alerts & Local GPS Proximity| SocketEngine
    MobileApp -->|Direct Geotagged Media Upload| ObjectStore
    MobileApp -->|Submit Report Metadata + Lat/Lng| APIRouter

    %% Gateway to Backend & Intelligence
    APIRouter --> MongoDB
    APIRouter --> Redis
    APIRouter -->|Forward New Report + Rain Intensity| ReActLoop
    SpatialAggregator -->|Update Zone Coordinates & Severity| MongoDB
    SpatialAggregator -->|Publish Dynamic Threat Recalculation| SocketEngine
```

---

## 2. Core Functional Pillars

### 2.1 Demo-Mode Open Admin Simulation Panel (`/admin/simulation`)
* **Purpose:** Because municipal government radar feeds and Doppler rainfall feeds do not offer unified real-time cloudburst APIs during live hackathon demos, this dashboard simulates hyper-localized convective storms, rainfall accumulations ($\text{mm/hr}$ and $\text{24h}$ totals), and dam outflows.
* **Access Model:** Directly accessible via URL route (`/admin/simulation`) without authentication or role gating.
* **Control Actions:**
  * Interactive slider for rainfall intensity ($0\text{ to }300\text{ mm/hr}$).
  * Interactive dropdown for target catchment/basin (e.g., *Kedarnath / Mandakini*, *Chamoli / Alaknanda*, *Dehradun / Song River*, *Wayanad Ghats*).
  * One-click trigger: **"Broadcast Flash Alert"** (pushes instant multi-tier concentric alert polygons to all connected clients).

### 2.2 Crowdsourced Citizen & Responder Field Reporting Pipeline
* **Purpose:** Citizens and first responders on the ground capture time-stamped and geotagged photographic/video evidence of structural cracks, slope movements, and flooded or severed roadways.
* **Direct-to-Cloud Upload Flow:**
  1. Mobile app captures high-resolution photo/video with native device GPS ($[\text{latitude}, \text{longitude}]$).
  2. Mobile client requests a pre-signed HMAC signature from `/api/media/sign-upload`.
  3. Binary data streams directly to Cloud Storage / ImageKit, bypassing backend memory overhead.
  4. Mobile client posts the media URL, GPS coordinates, category (`crack`, `landslide`, `road_blocked`), and description to `/api/reports`.

### 2.3 GIS Geospatial Overlay Engine
* **Purpose:** Visualizes vulnerable roads, bridges, and mountain villages mapped against the 4-tier concentric impact zones.
* **Ontology-Driven Vector Styling:**
  * **Zone 1 (Hard Most / Ground Zero):** Fill `#FFEBEE`, Stroke `#B71C1C`, Primary `#D32F2F`. Mandates immediate evacuation.
  * **Zone 2 (Most / Severe Impact):** Fill `#FFF3E0`, Stroke `#E65100`, Primary `#ED6C02`. Lifeline transit closure.
  * **Zone 3 (Some / Moderate Disruption):** Fill `#FFF8E1`, Stroke `#FF8F00`, Primary `#F57C00`. Agricultural/bypass warning.
  * **Zone 4 (Negligible / Periphery):** Fill `#E1F5FE`, Stroke `#01579B`, Primary `#0288D1`. Informational advisory.

### 2.4 Autonomous AI Agent ReAct Loop
* **Purpose:** Ingests live synthetic rainfall telemetry and crowdsourced incident reports.
* **Reasoning Action:**
  1. Detects multi-point clusters of reported fissures or landslides along a river valley.
  2. Correlates with current rainfall accumulation ($>100\text{ mm/hr}$).
  3. Dynamically expands or contracts the impact radii of active hazard zones and updates MongoDB.

---

## 3. Detailed Data Flow & Interaction Diagrams

### 3.1 Admin Rain Simulation & Real-Time Alert Broadcast Flow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin / Evaluator
    participant AdminUI as Web Admin (/admin/simulation)
    participant Backend as Express API Gateway
    participant RedisPub as Redis / Socket.io Engine
    participant MongoDB as MongoDB Atlas (2dsphere)
    participant Clients as Web & Mobile Clients (React / React Native)

    Admin->>AdminUI: Select Basin ("Alaknanda Valley") & Rain ("145 mm/hr")
    Admin->>AdminUI: Click [Trigger Rain Simulation & Broadcast]
    AdminUI->>Backend: POST /api/simulation/trigger-rain { basin, rainfallMmPerHour, epicenter }
    
    Backend->>MongoDB: Save Simulation State & Generate Concentric 4-Tier Hazard Zones
    Backend->>RedisPub: Publish to Channel "disaster:broadcast" (Alert Payload + Radii)
    RedisPub-->>Clients: WebSocket Event 'ALERT_EMERGENCY_BROADCAST'
    
    Note over Clients: Native Mobile receives event, plays haptic alarm,<br/>Web Client maps concentric hazard circles & top banner.
```

### 3.2 Citizen Geotagged Media Ingestion & Agent Evaluation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Citizen as Citizen / Field Responder
    participant App as Expo Mobile App (App/)
    participant Storage as ImageKit / Cloud Storage
    participant Backend as Express API Gateway
    participant AIAgent as Gemini ReAct Agent
    participant DB as MongoDB Atlas

    Citizen->>App: Snap photo of slope crack on NH-58 with GPS
    App->>Backend: GET /api/media/sign-upload
    Backend-->>App: Return HMAC signature & pre-signed URL
    App->>Storage: Direct Binary Upload (multipart/form-data)
    Storage-->>App: Return { mediaUrl, fileId }

    App->>Backend: POST /api/reports { mediaUrl, lat, lng, type: "slope_crack", description }
    Backend->>DB: Save IncidentReport document
    Backend->>AIAgent: Invoke ReAct Agent with new report ID + rain telemetry

    Note over AIAgent: Agent loops: Reads report, queries nearby rainfall,<br/>evaluates road vulnerability, adjusts Zone 1 radius.
    AIAgent->>DB: Update HazardEvent { tiers, affectedRoads: ["NH-58"] }
    AIAgent->>Backend: Alert updated -> Broadcast updated GIS contours
```

---

## 4. Package Manifests by Subsystem

### 4.1 Root Workspace (`package.json`)
```json
{
  "name": "sih-2026-disaster-intelligence",
  "version": "2.0.0",
  "private": true,
  "workspaces": [
    "Backend",
    "Web",
    "App",
    "AI model"
  ],
  "scripts": {
    "dev:backend": "npm run dev --workspace=Backend",
    "dev:web": "npm run dev --workspace=Web",
    "dev:app": "npm run start --workspace=App",
    "dev:ai": "npm run start:agent --workspace=\"AI model\""
  }
}
```

### 4.2 Backend Gateway (`Backend/package.json`)
```json
{
  "name": "sih-2026-backend",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^5.0.1",
    "imagekit": "^6.0.0",
    "mongoose": "^8.10.1",
    "socket.io": "^4.8.1",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^22.13.4",
    "tsx": "^4.19.3",
    "typescript": "^5.7.3"
  }
}
```

### 4.3 Web Client & Admin Panel (`Web/package.json`)
```json
{
  "name": "sih-2026-web",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@react-google-maps/api": "^2.20.6",
    "axios": "^1.7.9",
    "clsx": "^2.1.1",
    "lucide-react": "^0.475.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "socket.io-client": "^4.8.1",
    "tailwind-merge": "^3.0.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.2",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vite": "^6.1.0"
  }
}
```

### 4.4 Mobile Citizen Reporter (`App/package.json`)
```json
{
  "name": "sih-2026-app",
  "version": "2.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios"
  },
  "dependencies": {
    "axios": "^1.7.9",
    "expo": "~52.0.37",
    "expo-camera": "~16.0.17",
    "expo-constants": "~17.0.7",
    "expo-haptics": "~14.0.1",
    "expo-image-picker": "~16.0.6",
    "expo-location": "~18.0.7",
    "expo-router": "~4.0.17",
    "expo-status-bar": "~2.0.1",
    "react": "18.3.1",
    "react-native": "0.76.7",
    "react-native-maps": "1.18.0",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.4.0",
    "socket.io-client": "^4.8.1"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@types/react": "~18.3.12",
    "typescript": "^5.3.3"
  }
}
```

### 4.5 AI Reasoning Subsystem (`AI model/package.json`)
```json
{
  "name": "sih-2026-ai-agent",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "start:agent": "tsx src/agent/agentLoop.ts"
  },
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "dotenv": "^16.4.7",
    "mongoose": "^8.10.1",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^22.13.4",
    "tsx": "^4.19.3",
    "typescript": "^5.7.3"
  }
}
```

---

## 5. Environment Configuration Templates

### 5.1 Backend Gateway (`Backend/.env`)
```bash
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Atlas Database URI
MONGODB_URI=mongodb+srv://admin_sih:YourMongoPasswordHere@cluster0.sih2026.mongodb.net/disaster_intelligence?retryWrites=true&w=majority

# ImageKit Pre-signed Direct Upload Credentials
IMAGEKIT_PUBLIC_KEY=public_your_key_here
IMAGEKIT_PRIVATE_KEY=private_your_key_here
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/sih2026
```

### 5.2 Web Frontend (`Web/.env`)
```bash
VITE_API_BASE_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_MAPS_KEY=AIzaSyYourGoogleMapsJavaScriptAPIKeyHere
```

### 5.3 Mobile App (`App/.env`)
```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:5000
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.100:5000
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyYourNativeGoogleMapsAPIKeyHere
```

### 5.4 AI Subsystem (`AI model/.env`)
```bash
GEMINI_API_KEY=AIzaSyYourGeminiDeveloperKeyHere
MONGODB_URI=mongodb+srv://admin_sih:YourMongoPasswordHere@cluster0.sih2026.mongodb.net/disaster_intelligence?retryWrites=true&w=majority
```

---

## 6. MongoDB Atlas Geospatial (2dsphere) Schemas

### 6.1 Crowdsourced Field Report Model (`Backend/src/models/IncidentReport.ts`)
```typescript
import { Schema, model, Document, Types } from 'mongoose';

export interface IIncidentReport extends Document {
  _id: Types.ObjectId;
  mediaUrl: string;
  category: 'crack' | 'slope_movement' | 'road_blocked' | 'bridge_damage';
  severityObserved: 'minor' | 'severe' | 'critical';
  location: {
    type: 'Point';
    coordinates: [number, number]; // [Longitude, Latitude] GeoJSON format
  };
  description: string;
  agentEvaluated: boolean;
  createdAt: Date;
}

const IncidentReportSchema = new Schema<IIncidentReport>(
  {
    mediaUrl: { type: String, required: true },
    category: {
      type: String,
      enum: ['crack', 'slope_movement', 'road_blocked', 'bridge_damage'],
      required: true,
      index: true
    },
    severityObserved: {
      type: String,
      enum: ['minor', 'severe', 'critical'],
      default: 'severe'
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point', required: true },
      coordinates: { type: [Number], required: true } // [lng, lat]
    },
    description: { type: String, trim: true },
    agentEvaluated: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

// 2dsphere index for radius proximity queries
IncidentReportSchema.index({ location: '2dsphere' });

export const IncidentReport = model<IIncidentReport>('IncidentReport', IncidentReportSchema);
```

### 6.2 Simulation State & Hazard Event Model (`Backend/src/models/HazardEvent.ts`)
```typescript
import { Schema, model, Document, Types } from 'mongoose';

export interface IRiskTier {
  tierName: 'Hard Most' | 'Most' | 'Some' | 'Negligible';
  radiusMeters: number;
  strokeColor: string;
  fillColor: string;
  fillOpacity: number;
  evacuationMandated: boolean;
}

export interface IHazardEvent extends Document {
  _id: Types.ObjectId;
  title: string;
  simulatedBasin: string;
  rainfallRateMmPerHour: number;
  status: 'active' | 'resolved';
  location: {
    type: 'Point';
    coordinates: [number, number]; // [Longitude, Latitude]
  };
  tiers: IRiskTier[];
  severedRoads: string[];
  vulnerableVillages: string[];
  createdAt: Date;
  updatedAt: Date;
}

const HazardEventSchema = new Schema<IHazardEvent>(
  {
    title: { type: String, required: true },
    simulatedBasin: { type: String, required: true, index: true },
    rainfallRateMmPerHour: { type: Number, required: true },
    status: { type: String, enum: ['active', 'resolved'], default: 'active', index: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point', required: true },
      coordinates: { type: [Number], required: true }
    },
    tiers: [
      {
        tierName: { type: String, required: true },
        radiusMeters: { type: Number, required: true },
        strokeColor: { type: String, required: true },
        fillColor: { type: String, required: true },
        fillOpacity: { type: Number, required: true },
        evacuationMandated: { type: Boolean, default: false }
      }
    ],
    severedRoads: [{ type: String }],
    vulnerableVillages: [{ type: String }]
  },
  { timestamps: true }
);

// 2dsphere index for epicenter buffering and spatial overlaps
HazardEventSchema.index({ location: '2dsphere' });

export const HazardEvent = model<IHazardEvent>('HazardEvent', HazardEventSchema);
```

---

## 7. Open Admin Simulation Console (`Web/src/pages/AdminSimulation.tsx`)

Accessible openly without authentication at `/admin/simulation` for live demonstration and evaluator interaction:

```tsx
import React, { useState } from 'react';
import axios from 'axios';
import { CloudRain, AlertTriangle, Radio } from 'lucide-react';

export const AdminSimulationPanel: React.FC = () => {
  const [basin, setBasin] = useState('Alaknanda Valley (Chamoli)');
  const [rainfall, setRainfall] = useState<number>(120);
  const [epicenter, setEpicenter] = useState({ lat: 30.41, lng: 79.42 });
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastLog, setBroadcastLog] = useState<string | null>(null);

  const handleSimulateAndBroadcast = async () => {
    setIsBroadcasting(true);
    setBroadcastLog(null);
    try {
      const response = await axios.post('/api/simulation/trigger-rain', {
        basinName: basin,
        rainfallRateMmPerHour: rainfall,
        epicenter,
        simulatedDurationHours: 3
      });

      setBroadcastLog(
        `Alert Broadcasted Successfully! Event ID: ${response.data.simulationId}. Hard Most Radius: ${response.data.calculatedTiers[0].radiusKm} km.`
      );
    } catch (err: any) {
      setBroadcastLog(`Broadcast Failure: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Radio className="w-8 h-8 text-red-500 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight">Crisis Simulation & Broadcast Console</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Open URL Demo Access: Trigger simulated monsoon regimes, calibrate rainfall intensity, and broadcast live alerts.
          </p>
        </div>

        {/* Configuration Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-400">
            <CloudRain className="w-5 h-5" /> 1. Configure Synthetic Rainfall Regimes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Target Catchment / Basin
              </label>
              <select
                value={basin}
                onChange={(e) => {
                  setBasin(e.target.value);
                  if (e.target.value.includes('Alaknanda')) setEpicenter({ lat: 30.41, lng: 79.42 });
                  if (e.target.value.includes('Mandakini')) setEpicenter({ lat: 30.73, lng: 79.06 });
                  if (e.target.value.includes('Wayanad')) setEpicenter({ lat: 11.52, lng: 76.13 });
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-500"
              >
                <option>Alaknanda Valley (Chamoli)</option>
                <option>Mandakini Basin (Kedarnath/Rudraprayag)</option>
                <option>Wayanad Western Ghats (Chooralmala/Meppadi)</option>
                <option>Song River Basin (Maldevta/Dehradun)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Rainfall Accumulation: <span className="text-red-400 font-bold">{rainfall} mm/hr</span>
              </label>
              <input
                type="range"
                min="10"
                max="250"
                step="5"
                value={rainfall}
                onChange={(e) => setRainfall(Number(e.target.value))}
                className="w-full accent-red-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>Light (10 mm/h)</span>
                <span>Heavy (65 mm/h)</span>
                <span>Cloudburst (&gt;100 mm/h)</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <button
              onClick={handleSimulateAndBroadcast}
              disabled={isBroadcasting}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-800 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-red-600/30 cursor-pointer"
            >
              {isBroadcasting ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5" />
                  <span>Broadcast Live Alert to All Web & Mobile Clients</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Broadcast Feedback */}
        {broadcastLog && (
          <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-sm font-mono flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            {broadcastLog}
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## 8. Mobile Citizen Hazard Reporter (`App/src/screens/ReportHazardScreen.tsx`)

Native Expo client enabling photo/video capture, GPS geotagging, direct-to-cloud upload, and dispatch:

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

export const ReportHazardScreen: React.FC = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [category, setCategory] = useState<'crack' | 'slope_movement' | 'road_blocked'>('slope_movement');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    })();
  }, []);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permissions are required to report visible hazards.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const submitReport = async () => {
    if (!location || !imageUri) {
      Alert.alert('Incomplete', 'A geotagged photo and GPS fix are required.');
      return;
    }

    setUploading(true);
    try {
      // 1. Fetch pre-signed direct upload credentials
      const signRes = await axios.get('https://api.disasterintel.gov.in/api/media/sign-upload');
      const { signature, token, expire, publicKey } = signRes.data;

      // 2. Direct binary streaming to cloud storage
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `report_${Date.now()}.jpg`
      } as any);
      formData.append('publicKey', publicKey);
      formData.append('signature', signature);
      formData.append('expire', expire);
      formData.append('token', token);

      const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData
      });
      const cloudData = await uploadRes.json();

      // 3. Post structured metadata to Express Backend
      await axios.post('https://api.disasterintel.gov.in/api/reports/submit', {
        mediaUrl: cloudData.url,
        category,
        coordinates: [location.lng, location.lat], // GeoJSON standard
        description
      });

      Alert.alert('Report Dispatched', 'Your field observation has been ingested by the AI Risk Engine.');
      setImageUri(null);
      setDescription('');
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to submit report');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Report Field Hazard</Text>
      <Text style={styles.subtext}>Submit geotagged photos of road washouts, slope cracks, or rockfalls.</Text>

      {/* Camera Capture */}
      <TouchableOpacity style={styles.cameraBox} onPress={takePhoto}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <Text style={styles.cameraText}>📷 Tap to Capture Geotagged Photo</Text>
        )}
      </TouchableOpacity>

      {/* GPS Status */}
      <View style={styles.gpsBadge}>
        <Text style={styles.gpsText}>
          {location ? `GPS Fixed: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Acquiring GPS location...'}
        </Text>
      </View>

      {/* Category Selection */}
      <Text style={styles.label}>Observation Category</Text>
      <View style={styles.buttonRow}>
        {(['slope_movement', 'crack', 'road_blocked'] as const).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catButton, category === cat && styles.catButtonActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.catText, category === cat && styles.catTextActive]}>
              {cat.replace('_', ' ').toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notes Input */}
      <Text style={styles.label}>Field Description</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Fissures widening across NH-58 shoulder near km 42"
        placeholderTextColor="#64748b"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitBtn} onPress={submitReport} disabled={uploading}>
        {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Report</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  content: { padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc', marginBottom: 6 },
  subtext: { fontSize: 13, color: '#94a3b8', marginBottom: 20 },
  cameraBox: { height: 180, backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#334155', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 16 },
  cameraText: { color: '#38bdf8', fontWeight: '600' },
  previewImage: { width: '100%', height: '100%' },
  gpsBadge: { backgroundColor: '#1e293b', padding: 10, borderRadius: 8, marginBottom: 16 },
  gpsText: { color: '#10b981', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  label: { color: '#cbd5e1', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  buttonRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  catButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  catButtonActive: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  catText: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  catTextActive: { color: '#ffffff' },
  input: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 8, padding: 12, color: '#f8fafc', minHeight: 80, marginBottom: 20, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#dc2626', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  submitText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 }
});
```

---

## 9. AI ReAct Agent Loop Engine (`AI model/src/agent/agentLoop.ts`)

Autonomous multi-turn reasoning agent ingesting crowdsourced observations and live rainfall telemetry to dynamically adjust hazard boundaries:

```typescript
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { HazardEvent } from '../../../Backend/src/models/HazardEvent';
import { IncidentReport } from '../../../Backend/src/models/IncidentReport';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Declarations of callable tools for the agent
const agentTools: FunctionDeclaration[] = [
  {
    name: 'fetchNearbyCitizenReports',
    description: 'Retrieves all citizen-submitted geotagged reports of fissures or blockages within a radial distance.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        latitude: { type: SchemaType.NUMBER },
        longitude: { type: SchemaType.NUMBER },
        radiusMeters: { type: SchemaType.NUMBER }
      },
      required: ['latitude', 'longitude', 'radiusMeters']
    }
  },
  {
    name: 'recalculateHazardTierRadii',
    description: 'Dynamically updates the concentric geographic boundaries of an active disaster zone in MongoDB.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        hazardId: { type: SchemaType.STRING },
        zone1RadiusKm: { type: SchemaType.NUMBER },
        zone2RadiusKm: { type: SchemaType.NUMBER },
        severedRoads: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING }
        }
      },
      required: ['hazardId', 'zone1RadiusKm', 'zone2RadiusKm']
    }
  }
];

export async function runDisasterIntelligenceReActLoop(incidentId: string) {
  const incident = await IncidentReport.findById(incidentId);
  if (!incident) return;

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    tools: [{ functionDeclarations: agentTools }]
  });

  const chat = model.startChat();
  let prompt = `CRITICAL ALERT EVALUATION:
A new incident report was filed at Coordinates: [${incident.location.coordinates[1]}, ${incident.location.coordinates[0]}].
Category: ${incident.category}
Description: ${incident.description}
Evaluate if surrounding road infrastructure (e.g. NH-58, NH-107) is compromised and adjust active hazard boundaries accordingly.`;

  let response = await chat.sendMessage(prompt);

  // ReAct Iteration Loop
  while (true) {
    const call = response.functionCalls()?.[0];
    if (!call) break; // Finished reasoning

    console.log(`[ReAct Tool Call]: ${call.name}`, call.args);
    let toolResult: any;

    if (call.name === 'fetchNearbyCitizenReports') {
      const { latitude, longitude, radiusMeters } = call.args as any;
      toolResult = await IncidentReport.find({
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [longitude, latitude] },
            $maxDistance: radiusMeters
          }
        }
      }).limit(5);
    } else if (call.name === 'recalculateHazardTierRadii') {
      const { hazardId, zone1RadiusKm, zone2RadiusKm, severedRoads } = call.args as any;
      await HazardEvent.findByIdAndUpdate(hazardId, {
        $set: {
          'tiers.0.radiusMeters': zone1RadiusKm * 1000,
          'tiers.1.radiusMeters': zone2RadiusKm * 1000,
          severedRoads: severedRoads || []
        }
      });
      toolResult = { status: 'SUCCESS', updated: true };
    }

    // Feed observation back to model
    response = await chat.sendMessage([
      {
        functionResponse: {
          name: call.name,
          response: { output: toolResult }
        }
      }
    ]);
  }

  console.log('[ReAct Final Assessment]:', response.text());
}
```

---

## 10. Verification & Local Launch Runbook

Follow this sequential runbook to verify and execute the complete platform locally:

```bash
# 1. Install root workspace dependencies
npm install

# 2. Start the Backend Express & Socket.io server
cd Backend
npm run dev

# 3. Start the Web Admin Console & Citizen Map
cd ../Web
npm run dev

# 4. Start the Mobile Citizen Reporter via Expo
cd ../App
npx expo start

# 5. Execute AI Agent Listener
cd "../AI model"
npm run start:agent
```