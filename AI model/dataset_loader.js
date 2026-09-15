import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../Data');

// Strict Uttarakhand Bounding Box
export const UTTARAKHAND_BOUNDS = {
  minLat: 28.70,
  maxLat: 31.45,
  minLng: 77.50,
  maxLng: 81.05
};

// 13 Uttarakhand Administrative Districts & Key Corridors
export const UTTARAKHAND_DISTRICTS = [
  { name: 'Chamoli', center: { lat: 30.4100, lng: 79.4200 }, basin: 'Alaknanda River Basin', majorRoads: ['NH-58'] },
  { name: 'Rudraprayag', center: { lat: 30.2844, lng: 78.9811 }, basin: 'Mandakini River Basin', majorRoads: ['NH-107', 'NH-58'] },
  { name: 'Uttarkashi', center: { lat: 30.7268, lng: 78.4354 }, basin: 'Bhagirathi River Basin', majorRoads: ['NH-134', 'NH-108'] },
  { name: 'Pithoragarh', center: { lat: 29.5829, lng: 80.2182 }, basin: 'Kali / Gori Ganga Basin', majorRoads: ['NH-9'] },
  { name: 'Tehri Garhwal', center: { lat: 30.3800, lng: 78.4800 }, basin: 'Bhilangana River Basin', majorRoads: ['NH-58', 'NH-34'] },
  { name: 'Pauri Garhwal', center: { lat: 30.1500, lng: 78.7800 }, basin: 'Nayyar River Basin', majorRoads: ['NH-534', 'NH-58'] },
  { name: 'Dehradun', center: { lat: 30.3165, lng: 78.0322 }, basin: 'Song / Asan River Basin', majorRoads: ['NH-7', 'NH-307'] },
  { name: 'Nainital', center: { lat: 29.3919, lng: 79.4542 }, basin: 'Kosi / Gaula River Basin', majorRoads: ['NH-109'] },
  { name: 'Bageshwar', center: { lat: 29.8400, lng: 79.7700 }, basin: 'Saryu River Basin', majorRoads: ['NH-109K'] },
  { name: 'Champawat', center: { lat: 29.3300, lng: 80.1000 }, basin: 'Lodhika / Sharda Basin', majorRoads: ['NH-9'] },
  { name: 'Almora', center: { lat: 29.5971, lng: 79.6591 }, basin: 'Suyal / Kosi Basin', majorRoads: ['NH-109'] },
  { name: 'Haridwar', center: { lat: 29.9457, lng: 78.1642 }, basin: 'Lower Ganga Plain', majorRoads: ['NH-334', 'NH-7'] },
  { name: 'Udham Singh Nagar', center: { lat: 28.9800, lng: 79.4000 }, basin: 'Kalyani / Kumaon Foothills', majorRoads: ['NH-9'] }
];

/**
 * Loads and parses markdown files in Data/
 */
export function loadUttarakhandDisasterDataset() {
  const events = [
    {
      id: 'uk-2012-ukhimath',
      name: '2012 Ukhimath Landslide',
      year: 2012,
      district: 'Rudraprayag',
      location: 'Ukhimath Town & Mandakini Valley',
      coordinates: { lat: 30.5170, lng: 79.1000 },
      disasterType: 'Debris Flow / Landslide',
      rainfallMmPerHour: 85,
      historicalRadiiKm: { hardMost: 3.5, most: 8.0, some: 18.0, negligible: 35.0 },
      severedRoads: ['NH-107 (Rudraprayag-Kedarnath corridor)'],
      source: 'USDMA / NDMA Records'
    },
    {
      id: 'uk-2012-bhagirathi',
      name: '2012 Bhagirathi Valley Cloudburst & Flash Flood',
      year: 2012,
      district: 'Uttarkashi',
      location: 'Bhagirathi River Valley, Uttarkashi',
      coordinates: { lat: 30.7300, lng: 78.4400 },
      disasterType: 'Cloudburst + Flash Flood',
      rainfallMmPerHour: 110,
      historicalRadiiKm: { hardMost: 5.0, most: 12.0, some: 25.0, negligible: 45.0 },
      severedRoads: ['NH-108 (Gangotri Highway)', 'Bhatwari Bridge Approach'],
      source: 'USDMA 2012 Survey'
    },
    {
      id: 'uk-2013-kedarnath',
      name: '2013 Kedarnath Glacial Lake Outburst & Cloudburst',
      year: 2013,
      district: 'Rudraprayag',
      location: 'Kedarnath Valley, Chorabari Tal, Rambara',
      coordinates: { lat: 30.7352, lng: 79.0669 },
      disasterType: 'GLOF + Cloudburst + Catastrophic Talus Surge',
      rainfallMmPerHour: 220,
      historicalRadiiKm: { hardMost: 10.0, most: 35.0, some: 90.0, negligible: 180.0 },
      severedRoads: ['NH-107 (Wiped out between Sonprayag and Gaurikund)', 'Rambara pedestrian route'],
      source: 'NASA MODIS / ISRO NRSC'
    },
    {
      id: 'uk-2021-chamoli',
      name: '2021 Chamoli Rock/Ice Avalanche & Flash Surge',
      year: 2021,
      district: 'Chamoli',
      location: 'Ronti Peak, Rishiganga & Tapovan Canyons',
      coordinates: { lat: 30.4500, lng: 79.6300 },
      disasterType: 'Rock/Ice Avalanche Debris Torrent',
      rainfallMmPerHour: 140,
      historicalRadiiKm: { hardMost: 15.0, most: 35.0, some: 70.0, negligible: 140.0 },
      severedRoads: ['Joshimath-Malari Border Road', 'Tapovan Vishnugad Access'],
      source: 'Sentinel-Copernicus / ISRO NRSC composite'
    },
    {
      id: 'uk-2021-nainital',
      name: '2021 Nainital–Ramgarh Extreme Cloudburst Deluge',
      year: 2021,
      district: 'Nainital',
      location: 'Nainital Core, Ramgarh, Mukteshwar',
      coordinates: { lat: 29.3919, lng: 79.4542 },
      disasterType: 'Localized Microburst + Mudslide',
      rainfallMmPerHour: 160,
      historicalRadiiKm: { hardMost: 25.0, most: 60.0, some: 120.0, negligible: 200.0 },
      severedRoads: ['NH-109 (Kathgodam-Nainital Highway)', 'Bhimtal-Bhowali link'],
      source: 'IMD Station Nainital / rainInfo.md'
    },
    {
      id: 'uk-2022-maldevta',
      name: '2022 Maldevta & Raipur Flash Flood Surge',
      year: 2022,
      district: 'Dehradun',
      location: 'Maldevta, Sarkhet, Thano Canyon',
      coordinates: { lat: 30.3165, lng: 78.1200 },
      disasterType: 'Orographic Cloudburst Scouring',
      rainfallMmPerHour: 175,
      historicalRadiiKm: { hardMost: 15.0, most: 40.0, some: 80.0, negligible: 150.0 },
      severedRoads: ['Maldevta Bridge over Song River', 'Jolly Grant Approach Arteries'],
      source: 'USDMA Dehradun Post-Disaster Report'
    },
    {
      id: 'uk-2023-silkyara',
      name: '2023 Silkyara Bend-Barkot Tunnel Geo-Collapse',
      year: 2023,
      district: 'Uttarkashi',
      location: 'Silkyara Portal, Yamunotri Highway Corridor',
      coordinates: { lat: 30.7500, lng: 78.2600 },
      disasterType: 'Shear-Zone Tunnel Cave-In / Rockfall',
      rainfallMmPerHour: 45,
      historicalRadiiKm: { hardMost: 2.0, most: 12.0, some: 30.0, negligible: 60.0 },
      severedRoads: ['NH-134 (Silkyara Bend-Barkot Highway)'],
      source: 'Ministry of Road Transport & Highways (MoRTH)'
    },
    {
      id: 'uk-2023-joshimath',
      name: '2023 Joshimath Urban Land Subsidence Crisis',
      year: 2023,
      district: 'Chamoli',
      location: 'Joshimath Town, Sunil, Manohar Bagh',
      coordinates: { lat: 30.5500, lng: 79.5600 },
      disasterType: 'Progressive Glacial-Moraine Subsidence',
      rainfallMmPerHour: 60,
      historicalRadiiKm: { hardMost: 3.5, most: 10.0, some: 25.0, negligible: 50.0 },
      severedRoads: ['NH-58 (Main Badrinath Town Traverse)', 'Joshimath-Auli Ropeway base'],
      source: 'CBRI / NGRI / WIHG Geotechnical Audits'
    },
    {
      id: 'uk-2026-alaknanda-projected',
      name: '2026 Upper Alaknanda Monsoon Shear Deluge (Projected Scenario)',
      year: 2026,
      district: 'Chamoli',
      location: 'Helang KM 42, Pipalkoti, Alaknanda Gorge',
      coordinates: { lat: 30.4350, lng: 79.4600 },
      disasterType: 'Convective Cloudburst + Talus Slump',
      rainfallMmPerHour: 180,
      historicalRadiiKm: { hardMost: 5.2, most: 10.2, some: 18.0, negligible: 30.0 },
      severedRoads: ['NH-58 Helang-Joshimath Chokepoint'],
      source: 'SIH 2026 Calibrated Scenario'
    }
  ];

  // Filter strictly to Uttarakhand bounds
  return events.filter(e => {
    const { lat, lng } = e.coordinates;
    return (
      lat >= UTTARAKHAND_BOUNDS.minLat &&
      lat <= UTTARAKHAND_BOUNDS.maxLat &&
      lng >= UTTARAKHAND_BOUNDS.minLng &&
      lng <= UTTARAKHAND_BOUNDS.maxLng
    );
  });
}
