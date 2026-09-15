# 🏔️ Uttarakhand Disaster Command & Control System (SIH 2026)

An autonomous, real-time multi-hazard early warning and crisis response platform strictly tailored for **Uttarakhand, India**. The system combines live meteorological telemetry, historical disaster machine learning models, and real-time GIS spatial analytics to forecast cloudbursts, flash floods, and debris flow runouts across key Himalayan corridors.

---

## 📋 System Architecture

```
                                  [ Open-Meteo Live API ]
                                             │
                                             ▼
[ In-situ Hydrological Sensors ] ──▶ [ Backend Server ] ◀── [ AI Model Engine ]
                                  (Node.js + Express)     (Trained on 2010–2026 UK Data)
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
2. **Local AI Model Execution**: The predictive regression and spatial hazard model runs **locally on your backend server (in Node.js / JavaScript)**. It does not depend on cloud-hosted LLM endpoints (such as OpenAI ChatGPT or Google Gemini) to calculate geographic coordinates, runout expansion factors, or impact radii. This ensures **zero API billing costs**, **ultra-low latency**, and **offline resilience** in disaster scenarios.

---

### Q2: Does the AI use a real-time weather API or seed data to estimate the location and impact radius?
**Answer:** **It actively calls a real-time weather API, with seed data serving strictly as an offline safety fallback.**

1. **Live Weather API**:
   * Every 12 seconds, the background service (`Backend/src/services/aiLivePredictionService.js`) queries Open-Meteo for real-time conditions:
     ```http
     GET https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code&hourly=soil_moisture_0_to_1cm
     ```
   * It rotates through observation corridors across Uttarakhand:
     * **Alaknanda Valley (Chamoli / Joshimath)** `[30.4100, 79.4200]`
     * **Mandakini Basin (Kedarnath / Rudraprayag)** `[30.7300, 79.0600]`
     * **Bhagirathi Valley (Uttarkashi / Silkyara)** `[30.7300, 78.4400]`
     * **Song River Basin (Maldevta / Dehradun)** `[30.3165, 78.0322]`
     * **Kali / Gori Ganga Valley (Pithoragarh / Dharchula)** `[29.9800, 80.7500]`
     * **Nainital & Kosi Valley (Bhowali / Haldwani)** `[29.3919, 79.4542]`
     * **Almora & Suyal Basin (Ranikhet / Kausani)** `[29.5971, 79.6591]`
     * **Tehri Garhwal (Bhilangana Basin)** `[30.3800, 78.4800]`
   * Extracted metrics include **precipitation intensity (mm/h)**, **relative humidity (%)**, **ambient temperature (°C)**, and **soil moisture / pore water saturation (0–1cm depth)**.
2. **Seed Data Role**:
   * If the internet connection fails, an endpoint times out (>4000ms), or the system is deployed in disconnected tactical conditions, it falls back to district baseline records with simulated micro-variations so the command center never halts.

---

### Q3: Did the AI train on historical data so that it predicts the disaster?
**Answer:** **Yes. The model was trained on historical Uttarakhand disaster records from 2010 through 2026.**

* **Dataset Ingestion** (`AI model/dataset_loader.js`): Ingested historical disaster events from `Data/Uttarakhand_Disaster_Data_2010-2026.md` and `Data/Disaster_and_Infrastructure_Impact_Analysis_2010_2026.xlsx`, including:
  * 2013 Kedarnath Glacial Lake Outburst & Cloudburst (220 mm/h deluge)
  * 2021 Chamoli Rock/Ice Avalanche & Flash Surge
  * 2012 Ukhimath Landslide (Mandakini Valley)
  * 2012 Bhagirathi Valley Cloudburst
  * 2023 Joshimath Land Subsidence & Aquifer Breach
* **Trained Weights & Formulas** (`AI model/train_agent.js` & `AI model/landslide_hazard_model.json`):
  1. **Rainfall-to-Radius Regression**: Derived slope coefficients relating precipitation volume to ground impact runout radius ($\text{slopeCoeff} \approx 0.0824$).
  2. **District Vulnerability Multiplier**: Evaluated vulnerability ratings for all 13 districts (e.g. Chamoli: `1.54`, Rudraprayag: `1.36`, Uttarkashi: `1.36`).
  3. **Soil Pore Saturation Factor**: Learned that saturated soil ($\ge 88\%$) increases debris runout distance by up to $45\%$:
     $$\text{Expansion Factor} = 1.0 + \left(\frac{\text{Soil Moisture \%}}{100}\right) \times 0.45$$
     $$\text{Zone 1 Core Surge Radius} = (\text{Rainfall Rate} \times 36 + 1200) \times \text{Expansion Factor}$$
     $$\text{Zone 2 (Secondary Runout)} = \text{Zone 1} \times 1.90$$
     $$\text{Zone 3 (Slope Washout)} = \text{Zone 1} \times 3.30$$
     $$\text{Zone 4 (Advisory Boundary)} = \text{Zone 1} \times 5.10$$

---

### Q4: How does the 12-second weather loop work? Does it broadcast fake predictions or remove previous alerts?
**Answer:**
1. **Reversion of Fake Automatic Predictions**: The 12-second background loop does **NOT** fabricate fake cloudburst alerts. Instead, every 12 seconds it collects real live atmospheric data (precipitation, humidity, soil moisture, wind speed) from Open-Meteo across Uttarakhand observation stations.
2. **AI Historical Data Cross-Check & Critical 50% Threshold**:
   * For every queried station coordinate `[lat, lng]`, the AI cross-references the location with Uttarakhand's 2010–2026 historical disaster catalog (`Data/Uttarakhand_Disaster_Data_2010-2026.md`).
   * It calculates a **Disaster Risk Probability Score** (0% to 100%) by weighing live precipitation against historical slope-failure initiation thresholds (65 mm/h), pore saturation triggers (88%), wind funneling, and proximity to documented active shear zones.
   * **If Risk Score > 50%**: A critical hazard is confirmed against historical precedent. Only then does the AI generate and broadcast the predictive runout expansion cordons (`AI_PREDICTION_UPDATED`).
   * **If Risk Score <= 50%**: Current conditions are safe and historical data shows no imminent threat. The AI suppresses any hazard circles and broadcasts nominal telemetry (`predictedAlert: null`), ensuring **no fake disaster is shown on the map**.
3. **Admin Custom Simulation Control**: Disaster scenarios can also be explicitly broadcast when an authorized operator dials in custom extreme weather (e.g. 155 mm/h cloudburst, 93% pore saturation) from the simulation console.
4. **Target Area Pinpoint Marker**: The simulation map displays a dedicated tactical target pinpoint marker (`🎯`) at the exact target coordinates, allowing operators to visualize the location while simulating.
5. **Official Government Alert Independence**: Official Government Alerts (Priority 1) are completely independent of the AI cycle. An Official Alert is **never** removed or overwritten by the AI weather loop; it remains permanently active until authorized personnel explicitly click **"Stand Down / Revoke"** on the simulation console.

---

## 🎛️ Interactive Simulation Console

Visit `/simulation` in the web application to access the dual-control console:

### 1. Official Government Crisis Declaration (Priority 1: Real Danger)
* **Promulgating Authority**: Select between USDMA Uttarakhand, NDMA, DM Chamoli, or SEOC Dehradun.
* **Catchment Basin & Ground Zero**: Choose the epicenter coordinates.
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
* **Target Corridor Selection**: Choose any key Uttarakhand district/valley.
* **Live Feed vs. Custom Simulation Toggle**:
  * **Live Open-Meteo Feed**: Fetches live satellite atmospheric conditions automatically.
  * **Custom Simulated Weather**: Inject custom hypothetical weather extremes to test AI predictions:
    * **Rainfall Severity**: Presets for *Light* (15 mm/h), *Moderate* (45 mm/h), *Heavy* (85 mm/h), *Very Heavy* (130 mm/h), and *Critical Cloudburst* (185 mm/h), plus exact slider.
    * **Wind Speed & Category**: Presets for *Calm* (10 km/h), *High Mountain Wind* (45 km/h), and *Gale / Severe Storm* (75 km/h), plus slider (0–120 km/h).
    * **Soil Pore Saturation**: Presets for *Baseline* (40%), *Saturated* (80%), and *Critical Saturation* (96%).
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
