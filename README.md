# 🏔️ Northeast India (7 Sister States) Disaster Command & Control System (SIH 2026)

An autonomous, real-time multi-hazard early warning and crisis response platform strictly tailored for the **Northeast Region of India (covering all 7 Sister States: Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, and Tripura)**. The system combines live meteorological telemetry, historical disaster machine learning models, and real-time GIS spatial analytics to forecast cloudbursts, flash floods, and debris flow runouts across key Eastern Himalayan and Indo-Burma corridors.

---

## 📋 System Architecture

```
                                  [ Open-Meteo Live API ]
                                             │
                                             ▼
[ In-situ Hydrological Sensors ] ──▶ [ Backend Server ] ◀── [ AI Model Engine ]
                                  (Node.js + Express)     (Trained on 2010–2026 NE 7-Sisters Data)
                                             │
                                             ▼ (Socket.IO WebSockets)
                                  [ Frontend Web Command Center ]
                             (Google Maps API + Leaflet + TailwindCSS)
```

---

## ❓ Frequently Asked Questions (Technical & Architectural FAQ)

### Q1: Is the AI working without an API key? Why doesn't it require an OpenAI / Gemini API key?
**Answer:** **Yes, the AI is 100% operational.** You do not need to provide a paid API key for two key architectural reasons:
1. **Open-Access Meteorological Feed**: The live weather data is retrieved from **[Open-Meteo](https://open-meteo.com/)**, an open-access meteorological API that provides global satellite and numerical weather prediction forecasts with **no API key or authentication tokens required**.
2. **Local AI Model Execution**: The predictive regression and spatial hazard model runs **locally on your backend server (in Node.js / JavaScript)**. It does not depend on cloud-hosted LLM endpoints to calculate geographic coordinates, runout expansion factors, or impact radii. This ensures **zero API billing costs**, **ultra-low latency**, and **offline resilience** in disaster scenarios.

---

### Q2: Does the AI use a real-time weather API or seed data to estimate the location and impact radius?
**Answer:** **It actively calls a real-time weather API, with seed data serving strictly as an offline safety fallback.**

1. **Live Weather API**:
   * Every 12 seconds, the background service (`Backend/src/services/aiLivePredictionService.js`) queries Open-Meteo for real-time conditions:
     ```http
     GET https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code&hourly=soil_moisture_0_to_1cm
     ```
   * It rotates through observation corridors across the 7 Sister States:
     * **Brahmaputra Valley (Guwahati / Kamrup, Assam)** `[26.1445, 91.7362]`
     * **Khasi & Jaintia Hills (Shillong / Cherrapunji, Meghalaya)** `[25.5788, 91.8933]`
     * **Aizawl Ridge & Chhimtuipui Basin (Mizoram)** `[23.7271, 92.7176]`
     * **Imphal Basin & Noney Corridor (Manipur)** `[24.8167, 93.6833]`
     * **Kohima & Chumukedima Gorge (Nagaland)** `[25.6751, 94.1086]`
     * **Siang & Papum Pare Basin (Arunachal Pradesh)** `[27.1004, 93.6166]`
     * **Dima Hasao & Barak Valley (Haflong / Silchar, Assam)** `[25.1833, 93.0167]`
     * **Howrah Basin & Dhalai (Tripura)** `[23.8315, 91.2868]`
   * Extracted metrics include **precipitation intensity (mm/h)**, **relative humidity (%)**, **ambient temperature (°C)**, and **soil moisture / pore water saturation (0–1cm depth)**.
2. **Seed Data Role**:
   * If the internet connection fails, an endpoint times out (>4000ms), or the system is deployed in disconnected tactical conditions, it falls back to district baseline records with simulated micro-variations so the command center never halts.

---

### Q3: Did the AI train on historical data so that it predicts the disaster?
**Answer:** **Yes. The model was trained on historical Northeast India disaster records from 2010 through 2026 across all 7 Sister States.**

* **Dataset Ingestion** (`AI model/dataset_loader.js`): Ingested historical disaster events, including:
  * 2024 Cyclone Remal Melthum Quarry Landslides (Aizawl, Mizoram)
  * 2022 Noney Tupul Railway Debris Avalanche (Manipur)
  * 2022 Dima Hasao Massive Landslides & Haflong Deluge (Assam)
  * 2020 Cherrapunji-Mawsynram Extreme Orographic Deluge & Escarpment Slump (Meghalaya)
  * 2021 Chumukedima Pagla Pahar Rockfall (Nagaland)
  * 2023 Upper Siang Landslide Dam Outburst Flood Threat (Arunachal Pradesh)
  * 2024 Tripura Gomati Embankment Breach & Flash Flood
* **Trained Weights & Formulas** (`AI model/train_agent.js` & `AI model/landslide_hazard_model.json`):
  1. **Rainfall-to-Radius Regression**: Derived slope coefficients relating precipitation volume to ground impact runout radius.
  2. **District Vulnerability Multiplier**: Evaluated vulnerability ratings across all 7 Sister States districts.
  3. **Soil Pore Saturation Factor**: Saturated soil increases debris runout distance by up to $45\%$:
     $$\text{Expansion Factor} = 1.0 + \left(\frac{\text{Soil Moisture \%}}{100}\right) \times 0.45$$
     $$\text{Zone 1 Core Surge Radius} = (\text{Rainfall Rate} \times 36 + 1200) \times \text{Expansion Factor}$$
     $$\text{Zone 2 (Secondary Runout)} = \text{Zone 1} \times 1.90$$
     $$\text{Zone 3 (Slope Washout)} = \text{Zone 1} \times 3.30$$
     $$\text{Zone 4 (Advisory Boundary)} = \text{Zone 1} \times 5.10$$

---

### Q4: How does the 12-second weather loop work? Does it broadcast fake predictions or remove previous alerts?
**Answer:**
1. **Reversion of Fake Automatic Predictions**: The 12-second background loop does **NOT** fabricate fake alerts. Instead, every 12 seconds it collects real live atmospheric data (precipitation, humidity, soil moisture, wind speed) from Open-Meteo across Northeast observation stations.
2. **AI Historical Data Cross-Check & Critical 50% Threshold**:
   * For every queried station coordinate `[lat, lng]`, the AI cross-references the location with Northeast India's 2010–2026 historical disaster catalog.
   * It calculates a **Disaster Risk Probability Score** (0% to 100%) by weighing live precipitation against historical slope-failure initiation thresholds (65 mm/h), pore saturation triggers (88%), wind funneling, and proximity to documented active shear zones.
   * **If Risk Score > 50%**: A critical hazard is confirmed against historical precedent. Only then does the AI generate and broadcast the predictive runout expansion cordons (`AI_PREDICTION_UPDATED`).
   * **If Risk Score <= 50%**: Current conditions are safe and historical data shows no imminent threat. The AI suppresses any hazard circles and broadcasts nominal telemetry (`predictedAlert: null`), ensuring **no fake disaster is shown on the map**.
3. **Admin Custom Simulation Control**: Disaster scenarios can also be explicitly broadcast when an authorized operator dials in custom extreme weather (e.g. 175 mm/h cloudburst, 94% pore saturation) from the simulation console.
4. **Target Area Pinpoint Marker**: The simulation map displays a dedicated tactical target pinpoint marker (`🎯`) at the exact target coordinates, allowing operators to visualize the location while simulating.
5. **Official Government Alert Independence**: Official Government Alerts (Priority 1) are completely independent of the AI cycle. An Official Alert is **never** removed or overwritten by the AI weather loop; it remains permanently active until authorized personnel explicitly click **"Stand Down / Revoke"** on the simulation console.

---

## 🎛️ Interactive Simulation Console

Visit `/simulation` in the web application to access the dual-control console:

### 1. Official Government Crisis Declaration (Priority 1: Real Danger)
* **Promulgating Authority**: Select between North Eastern Council (NEC), ASDMA (Assam), MSDMA (Meghalaya), DM&R Mizoram, NSDMA (Nagaland), Manipur SDMA, APDMA (Arunachal Pradesh), TDMA (Tripura), or NDMA.
* **Catchment Basin & Ground Zero**: Choose the epicenter coordinates across 7 Sister States.
* **Precipitation Severity Slider**: Adjust from 10 to 250 mm/h.
* **Live 4-Tier Impact Radius Preview**:
  * **Zone 1 (Hard Most — Ground Zero)**: Solid red edge, mandatory evacuation zone.
  * **Zone 2 (Most — Severe Impact)**: Solid orange edge, severed arterial road lifelines.
  * **Zone 3 (Some — Moderate Disruption)**: Solid amber edge, agricultural slope creep.
  * **Zone 4 (Negligible — Advisory Boundary)**: Solid blue edge, regional monitoring cordon.
* **Actions**:
  * `DECLARE & BROADCAST OFFICIAL GOVERNMENT EMERGENCY`: Publishes directive across all frequencies.
  * `STAND DOWN / REVOKE`: Demobilizes emergency cordons and restores standby status.

### 2. Live AI Weather & Impact Radius Simulator (Priority 2: Predicted Danger)
* **Target Corridor Selection**: Choose any key Northeast 7 Sister States district/basin.
* **Live Feed vs. Custom Simulation Toggle**:
  * **Live Open-Meteo Feed**: Fetches live satellite atmospheric conditions automatically.
  * **Custom Simulated Weather**: Inject custom hypothetical weather extremes to test AI predictions.
* **Action**:
  * `⚡ INGEST WEATHER & RUN AI PREDICTION`: Runs the AI regression model, computes the 4-tier projected surge expansion, updates the database, and renders on the live map in real time.

---

## 🚀 Running the Project

### Prerequisites
* **Node.js** (v18+)
* **npm** (v9+)

### 1. Start the Backend Server
```bash
cd Backend
npm install
npm run dev
```
* Backend runs at `http://localhost:5000`
* WebSocket server starts on port `5000`

### 2. Start the Frontend Web Application
```bash
cd Web
npm install
npm run dev
```
* Web application runs at `http://localhost:5173`

---

## 🗺️ Key Routes
* `/` — Tactical Command Center (full-screen GIS map canvas, alerts feed, ReAct reasoning rack)
* `/map` — Full Bleed Spatial GIS Map View
* `/simulation` — Government Crisis Command & AI Weather Simulation Console
* `/report` — Citizen & Field SDRF Hazard Reporting Portal
* `/alerts` — Emergency Multi-Agency Alerts Feed
