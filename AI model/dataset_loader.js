import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../Data');

// Strict Northeast India Bounding Box (Encompassing all 7 Sister States)
// Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Tripura
export const NORTHEAST_BOUNDS = {
  minLat: 21.50,
  maxLat: 29.50,
  minLng: 89.60,
  maxLng: 97.50
};

// 7 Sister States Core Administrative Districts & Key Corridors
export const NORTHEAST_DISTRICTS = [
  // Assam
  { name: 'Kamrup Metropolitan', state: 'Assam', center: { lat: 26.1445, lng: 91.7362 }, basin: 'Brahmaputra River Basin', majorRoads: ['NH-27', 'NH-37'] },
  { name: 'Dima Hasao', state: 'Assam', center: { lat: 25.1833, lng: 93.0167 }, basin: 'Diyung & Jatinga Valley', majorRoads: ['NH-27 (Haflong Section)'] },
  { name: 'Cachar', state: 'Assam', center: { lat: 24.8333, lng: 92.7789 }, basin: 'Barak River Basin', majorRoads: ['NH-37', 'NH-306'] },
  { name: 'Dibrugarh', state: 'Assam', center: { lat: 27.4728, lng: 94.9120 }, basin: 'Upper Brahmaputra Basin', majorRoads: ['NH-15', 'NH-37'] },

  // Arunachal Pradesh
  { name: 'Papum Pare', state: 'Arunachal Pradesh', center: { lat: 27.1004, lng: 93.6166 }, basin: 'Dikrong / Subansiri Basin', majorRoads: ['NH-415', 'NH-13'] },
  { name: 'Upper Siang', state: 'Arunachal Pradesh', center: { lat: 28.0667, lng: 95.3333 }, basin: 'Siang River Gorge', majorRoads: ['NH-13 (Trans-Arunachal)'] },
  { name: 'West Kameng', state: 'Arunachal Pradesh', center: { lat: 27.3500, lng: 92.2500 }, basin: 'Kameng River Canyon', majorRoads: ['NH-13'] },

  // Meghalaya
  { name: 'East Khasi Hills', state: 'Meghalaya', center: { lat: 25.5788, lng: 91.8933 }, basin: 'Umiam & Wah Umkhrah Basin', majorRoads: ['NH-6'] },
  { name: 'Sohra', state: 'Meghalaya', center: { lat: 25.2700, lng: 91.7300 }, basin: 'Cherrapunji Limestone Gorges', majorRoads: ['SH-5 (Sohra Highway)'] },
  { name: 'West Garo Hills', state: 'Meghalaya', center: { lat: 25.5138, lng: 90.2201 }, basin: 'Ganol & Simsang Basin', majorRoads: ['NH-217'] },

  // Manipur
  { name: 'Noney', state: 'Manipur', center: { lat: 24.8167, lng: 93.6833 }, basin: 'Ijai River & Tupul Gorge', majorRoads: ['NH-37 (Imphal-Jiribam)'] },
  { name: 'Imphal West', state: 'Manipur', center: { lat: 24.8170, lng: 93.9368 }, basin: 'Imphal / Manipur River Basin', majorRoads: ['NH-2', 'NH-37'] },

  // Mizoram
  { name: 'Aizawl', state: 'Mizoram', center: { lat: 23.7271, lng: 92.7176 }, basin: 'Tlawng River & Melthum Ridge', majorRoads: ['NH-306', 'NH-54'] },
  { name: 'Lunglei', state: 'Mizoram', center: { lat: 22.8833, lng: 92.7333 }, basin: 'Chhimtuipui / Kolodyne Basin', majorRoads: ['NH-54'] },

  // Nagaland
  { name: 'Kohima', state: 'Nagaland', center: { lat: 25.6751, lng: 94.1086 }, basin: 'Doyang & Zubza River Basin', majorRoads: ['NH-29', 'NH-2'] },
  { name: 'Dimapur', state: 'Nagaland', center: { lat: 25.8000, lng: 93.7500 }, basin: 'Chathe / Dhansiri Corridor', majorRoads: ['NH-29'] },

  // Tripura
  { name: 'West Tripura', state: 'Tripura', center: { lat: 23.8315, lng: 91.2868 }, basin: 'Howrah River Basin', majorRoads: ['NH-8'] },
  { name: 'Dhalai', state: 'Tripura', center: { lat: 23.8500, lng: 91.8500 }, basin: 'Dhalai & Khowai Valley', majorRoads: ['NH-8'] }
];

/**
 * Loads Northeast historical disaster catalog (2010–2026) across 7 Sister States
 */
export function loadNortheastDisasterDataset() {
  const events = [
    {
      id: 'ne-2024-aizawl-remal',
      name: '2024 Cyclone Remal Melthum Quarry Debris Collapse',
      year: 2024,
      state: 'Mizoram',
      district: 'Aizawl',
      location: 'Melthum Stone Quarry & Aizawl Ridge Corridor',
      coordinates: { lat: 23.7271, lng: 92.7176 },
      disasterType: 'Catastrophic Quarry Collapse + Slope Liquefaction',
      rainfallMmPerHour: 170,
      historicalRadiiKm: { hardMost: 4.8, most: 11.0, some: 24.0, negligible: 45.0 },
      severedRoads: ['NH-306 (Silchar-Aizawl Lifeline)', 'Melthum-Bualpui Road'],
      source: 'Disaster Management & Rehabilitation Dept Mizoram / NDMA'
    },
    {
      id: 'ne-2022-noney-tupul',
      name: '2022 Noney Tupul Railway Yard Landslide',
      year: 2022,
      state: 'Manipur',
      district: 'Noney',
      location: 'Tupul Railway Yard, Ijai River Gorge',
      coordinates: { lat: 24.8167, lng: 93.6833 },
      disasterType: 'Rotational Debris Avalanche & River Damming',
      rainfallMmPerHour: 185,
      historicalRadiiKm: { hardMost: 8.5, most: 22.0, some: 55.0, negligible: 110.0 },
      severedRoads: ['NH-37 (Imphal-Jiribam Highway)', 'Tupul Rail Access Corridor'],
      source: 'Geological Survey of India (GSI) / Northeast Frontier Railway'
    },
    {
      id: 'ne-2022-dima-hasao',
      name: '2022 Dima Hasao Massive Landslides & Haflong Deluge',
      year: 2022,
      state: 'Assam',
      district: 'Dima Hasao',
      location: 'New Haflong Station & Jatinga Hill Section',
      coordinates: { lat: 25.1833, lng: 93.0167 },
      disasterType: 'Multiple Slope Failures & Railbed Liquefaction',
      rainfallMmPerHour: 160,
      historicalRadiiKm: { hardMost: 12.0, most: 28.0, some: 65.0, negligible: 130.0 },
      severedRoads: ['NH-27 (Haflong-Silchar Section)', 'Lumding-Badarpur Hill Rail Corridor'],
      source: 'Assam State Disaster Management Authority (ASDMA)'
    },
    {
      id: 'ne-2020-cherrapunji',
      name: '2020 Sohra-Cherrapunji Extreme Orographic Deluge',
      year: 2020,
      state: 'Meghalaya',
      district: 'Sohra',
      location: 'Cherrapunji Rim, Nohkalikai Gorge, Shella',
      coordinates: { lat: 25.2700, lng: 91.7300 },
      disasterType: 'Orographic Cloudburst + Escarpment Mudslide',
      rainfallMmPerHour: 235,
      historicalRadiiKm: { hardMost: 14.0, most: 32.0, some: 75.0, negligible: 150.0 },
      severedRoads: ['SH-5 (Sohra-Shella Gorges Artery)', 'Mawkdok Bridge Link'],
      source: 'IMD Station Sohra / Meghalaya SDMA'
    },
    {
      id: 'ne-2021-pagla-pahar',
      name: '2021 Chumukedima Pagla Pahar Rockfall & Mudflow',
      year: 2021,
      state: 'Nagaland',
      district: 'Dimapur',
      location: 'Pagla Pahar Chokepoint, Chathe River Gorge',
      coordinates: { lat: 25.8000, lng: 93.7500 },
      disasterType: 'Co-Seismic / Monsoon Rockfall Cascade',
      rainfallMmPerHour: 130,
      historicalRadiiKm: { hardMost: 3.2, most: 8.5, some: 20.0, negligible: 40.0 },
      severedRoads: ['NH-29 (Dimapur-Kohima Trans-Asian Lifeline)'],
      source: 'Nagaland State Disaster Management Authority (NSDMA)'
    },
    {
      id: 'ne-2023-siang-glof',
      name: '2023 Upper Siang Flash Surge & Landslide Dam Threat',
      year: 2023,
      state: 'Arunachal Pradesh',
      district: 'Upper Siang',
      location: 'Tuting, Pasighat & Siang River Canyon',
      coordinates: { lat: 28.0667, lng: 95.3333 },
      disasterType: 'Landslide Dam Outburst Flood (LDOF) / Glacial Surge',
      rainfallMmPerHour: 150,
      historicalRadiiKm: { hardMost: 15.0, most: 38.0, some: 85.0, negligible: 170.0 },
      severedRoads: ['NH-13 (Trans-Arunachal Highway)', 'Pasighat-Along Corridor'],
      source: 'Central Water Commission (CWC) / APDMA'
    },
    {
      id: 'ne-2024-tripura-gomati',
      name: '2024 Tripura Gomati River Deluge & Embankment Breach',
      year: 2024,
      state: 'Tripura',
      district: 'West Tripura',
      location: 'Howrah River Basin, Agartala, Gomati Valley',
      coordinates: { lat: 23.8315, lng: 91.2868 },
      disasterType: 'Flash Flood + Valley Mudslides + Dyke Scouring',
      rainfallMmPerHour: 145,
      historicalRadiiKm: { hardMost: 6.5, most: 16.0, some: 40.0, negligible: 80.0 },
      severedRoads: ['NH-8 (Assam-Agartala Highway)', 'Howrah River Bund Arteries'],
      source: 'Tripura State Disaster Management Authority (TDMA)'
    },
    {
      id: 'ne-2016-tawang',
      name: '2016 Tawang Terraced Slope Failure',
      year: 2016,
      state: 'Arunachal Pradesh',
      district: 'West Kameng',
      location: 'Phamla Village, Tawang Escarpment',
      coordinates: { lat: 27.3500, lng: 92.2500 },
      disasterType: 'High-Altitude Talus Slump & Debris Avalanche',
      rainfallMmPerHour: 120,
      historicalRadiiKm: { hardMost: 2.8, most: 7.2, some: 18.0, negligible: 35.0 },
      severedRoads: ['NH-13 (Bhalukpong-Bomdila-Tawang Highway)'],
      source: 'NDRF 12th Battalion Incident Survey'
    },
    {
      id: 'ne-2022-silchar-barak',
      name: '2022 Silchar Barak River Megaflood & Scouring',
      year: 2022,
      state: 'Assam',
      district: 'Cachar',
      location: 'Bethukandi Embankment, Silchar Urban Basin',
      coordinates: { lat: 24.8333, lng: 92.7789 },
      disasterType: 'Dyke Failure / Massive Riparian Scouring',
      rainfallMmPerHour: 190,
      historicalRadiiKm: { hardMost: 9.0, most: 24.0, some: 60.0, negligible: 120.0 },
      severedRoads: ['NH-306 (Silchar Gateway)', 'Kumbhirgram Airport Approach Road'],
      source: 'ASDMA Cachar District Survey'
    },
    {
      id: 'ne-2026-brahmaputra-projected',
      name: '2026 Brahmaputra Valley Monsoon High-Shear Deluge (Projected Scenario)',
      year: 2026,
      state: 'Assam',
      district: 'Kamrup Metropolitan',
      location: 'Guwahati Hills, Nilachal Escarpment, Khanapara Corridor',
      coordinates: { lat: 26.1445, lng: 91.7362 },
      disasterType: 'Convective Microburst + Urban Flash Flood + Talus Slump',
      rainfallMmPerHour: 175,
      historicalRadiiKm: { hardMost: 5.5, most: 12.0, some: 25.0, negligible: 50.0 },
      severedRoads: ['NH-27 Guwahati Bypass Chokepoint', 'GS Road Shillong Corridor'],
      source: 'SIH 2026 Calibrated Scenario'
    }
  ];

  // Filter strictly to Northeast 7 Sister States bounds
  return events.filter(e => {
    const { lat, lng } = e.coordinates;
    return (
      lat >= NORTHEAST_BOUNDS.minLat &&
      lat <= NORTHEAST_BOUNDS.maxLat &&
      lng >= NORTHEAST_BOUNDS.minLng &&
      lng <= NORTHEAST_BOUNDS.maxLng
    );
  });
}

// Backward compatibility exports
export const UTTARAKHAND_BOUNDS = NORTHEAST_BOUNDS;
export const UTTARAKHAND_DISTRICTS = NORTHEAST_DISTRICTS;
export const loadUttarakhandDisasterDataset = loadNortheastDisasterDataset;
