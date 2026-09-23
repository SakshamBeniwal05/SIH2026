export const SEED_BASINS = [
  {
    id: 'brahmaputra',
    name: 'Brahmaputra Valley (Guwahati / Kamrup)',
    region: 'Assam (Lower Brahmaputra Plain)',
    epicenter: { lat: 26.1445, lng: 91.7362 },
    defaultRainfall: 165,
    criticalRoads: [
      'NH-27 (Guwahati Bypass Lifeline)',
      'GS Road Shillong Arterial Corridor',
      'Kamakhya Foothills Bypass'
    ],
    vulnerableVillages: ['Khanapara', 'Nilachal Foothills', 'Jalukbari', 'Noonmati', 'Dispur Buffer']
  },
  {
    id: 'khasi-hills',
    name: 'Khasi & Jaintia Hills (Shillong / Cherrapunji)',
    region: 'Meghalaya (Meghalaya Plateau)',
    epicenter: { lat: 25.5788, lng: 91.8933 },
    defaultRainfall: 215,
    criticalRoads: [
      'NH-6 (Shillong-Jowai-Silchar Lifeline)',
      'SH-5 (Sohra-Shella Gorges Artery)',
      'Mawkdok Dympep Bridge Link'
    ],
    vulnerableVillages: ['Cherrapunji Core', 'Mawkdok', 'Nohkalikai Valley', 'Pynursla', 'Mawsynram']
  },
  {
    id: 'aizawl-ridge',
    name: 'Aizawl Ridge & Chhimtuipui Basin',
    region: 'Mizoram (Lushai Hills)',
    epicenter: { lat: 23.7271, lng: 92.7176 },
    defaultRainfall: 175,
    criticalRoads: [
      'NH-306 (Silchar-Aizawl National Highway Lifeline)',
      'Melthum-Bualpui Ridge Arterial Link',
      'Aizawl World Bank Bypass'
    ],
    vulnerableVillages: ['Melthum', 'Bawngkawn', 'Durtlang Leitan', 'Ramhlun', 'Kulikawn']
  },
  {
    id: 'noney-tupul',
    name: 'Ijai Basin & Tupul Gorge (Noney Corridor)',
    region: 'Manipur (Western Hill Tracts)',
    epicenter: { lat: 24.8167, lng: 93.6833 },
    defaultRainfall: 185,
    criticalRoads: [
      'NH-37 (Imphal-Jiribam Lifeline Highway)',
      'Tupul Railway Approach Corridor',
      'Noney-Khongsang Link Road'
    ],
    vulnerableVillages: ['Tupul Station Yard', 'Marangching', 'Makhuam', 'Ijai River Plain', 'Noney Bazaar']
  },
  {
    id: 'chumukedima',
    name: 'Kohima & Chumukedima Pagla Pahar Gorge',
    region: 'Nagaland (Naga Hills)',
    epicenter: { lat: 25.8000, lng: 93.7500 },
    defaultRainfall: 150,
    criticalRoads: [
      'NH-29 (Dimapur-Kohima Trans-Asian Lifeline)',
      'Chumukedima Old Bypass Link',
      'Zubza-Kohima Ridge Arterial Highway'
    ],
    vulnerableVillages: ['Pagla Pahar Chokepoint', 'New Chumukedima', 'Phesama', 'Zubza', 'Jotsoma']
  },
  {
    id: 'siang-gorge',
    name: 'Upper Siang & Pasighat Basin',
    region: 'Arunachal Pradesh (Eastern Himalaya)',
    epicenter: { lat: 28.0667, lng: 95.3333 },
    defaultRainfall: 160,
    criticalRoads: [
      'NH-13 (Trans-Arunachal Highway)',
      'Pasighat-Pangin-Along Highway',
      'Yingkiong Border Arterial Road'
    ],
    vulnerableVillages: ['Pasighat', 'Tuting', 'Pangin', 'Yingkiong', 'Geku River Buffer']
  },
  {
    id: 'howrah-river',
    name: 'Howrah Basin & Dhalai Valley',
    region: 'Tripura (Tripura Trough)',
    epicenter: { lat: 23.8315, lng: 91.2868 },
    defaultRainfall: 140,
    criticalRoads: [
      'NH-8 (Assam-Agartala Highway)',
      'Howrah River Bund Arteries',
      'Ambassa-Manu Chokepoint'
    ],
    vulnerableVillages: ['Agartala East Plain', 'Champaknagar', 'Teliamura', 'Ambassa', 'Manu']
  }
];

export const SEED_HAZARDS = [
  {
    _id: 'hazard-ne-brahmaputra-active',
    title: 'Severe Slope Failure & Debris Surge — Brahmaputra Valley (Guwahati)',
    simulatedBasin: 'Brahmaputra Valley (Guwahati / Kamrup)',
    rainfallRateMmPerHour: 165,
    status: 'standby',
    location: {
      type: 'Point',
      coordinates: [91.7362, 26.1445] // [lng, lat]
    },
    officialActive: false,
    current: null,
    officialAlert: null,
    prediction: null,
    predictedAlert: null,
    tiers: [],
    alertsList: [],
    severedRoads: [],
    vulnerableVillages: [],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const SEED_REPORTS = [
  {
    _id: 'rep-ne-001',
    mediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Tupul_railway_station_under_construction.jpg/800px-Tupul_railway_station_under_construction.jpg',
    category: 'crack',
    severityObserved: 'critical',
    location: {
      type: 'Point',
      coordinates: [93.6833, 24.8167] // Tupul / Noney, Manipur
    },
    description: 'Deep rotational crown crack extending 4.2m across the upper cut-slope of Tupul Railway yard. High impending debris avalanche threat.',
    agentEvaluated: true,
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    _id: 'rep-ne-002',
    mediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Aizawl_city_view.jpg/800px-Aizawl_city_view.jpg',
    category: 'slope_movement',
    severityObserved: 'critical',
    location: {
      type: 'Point',
      coordinates: [92.7176, 23.7271] // Melthum / Aizawl, Mizoram
    },
    description: 'Active talus shear slip and slope liquefaction observed along Melthum stone quarry ridge following relentless monsoon downpour.',
    agentEvaluated: true,
    createdAt: new Date(Date.now() - 2400000).toISOString()
  },
  {
    _id: 'rep-ne-003',
    mediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Dimapur_Nagaland.jpg/800px-Dimapur_Nagaland.jpg',
    category: 'road_blocked',
    severityObserved: 'severe',
    location: {
      type: 'Point',
      coordinates: [93.7500, 25.8000] // Pagla Pahar, Nagaland
    },
    description: 'Massive boulders cascaded onto NH-29 Pagla Pahar bypass corridor. Complete obstruction of interstate vehicular movement.',
    agentEvaluated: true,
    createdAt: new Date(Date.now() - 600000).toISOString()
  },
  {
    _id: 'rep-ne-004',
    mediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/New_Haflong_railway_station.jpg/800px-New_Haflong_railway_station.jpg',
    category: 'bridge_damage',
    severityObserved: 'severe',
    location: {
      type: 'Point',
      coordinates: [93.0167, 25.1833] // Dima Hasao, Assam
    },
    description: 'Jatinga River flash surge eroded bridge foundation piers and railbed embankment near Haflong hill section.',
    agentEvaluated: false,
    createdAt: new Date(Date.now() - 3200000).toISOString()
  }
];

export const SEED_SENSORS = [
  {
    id: 'SN-NE-501',
    name: 'Chumukedima Pagla Pahar Tiltmeter',
    type: 'Biaxial Inclinometer',
    coords: [93.7500, 25.8000],
    saturation: 92.4,
    rainfallRate: 150,
    displacementRate: '+14.8 mm/hr',
    vibrationHz: 4.8,
    status: 'CRITICAL',
    lastPing: '2s ago'
  },
  {
    id: 'SN-NE-502',
    name: 'Melthum Aizawl Escarpment Piezometer',
    type: 'Pore Pressure Piezometer',
    coords: [92.7176, 23.7271],
    saturation: 94.6,
    rainfallRate: 175,
    displacementRate: '+18.2 mm/hr',
    vibrationHz: 5.6,
    status: 'CRITICAL',
    lastPing: '4s ago'
  },
  {
    id: 'SN-NE-503',
    name: 'Tupul Ijai River Debris Radar',
    type: 'Hydro-Acoustic Debris Radar',
    coords: [93.6833, 24.8167],
    saturation: 90.1,
    rainfallRate: 185,
    displacementRate: '+8.6 mm/hr',
    vibrationHz: 3.4,
    status: 'MONITOR',
    lastPing: '7s ago'
  },
  {
    id: 'SN-NE-504',
    name: 'Guwahati Nilachal Doppler Terminal',
    type: 'Rain Doppler & Barometer',
    coords: [91.7362, 26.1445],
    saturation: 76.2,
    rainfallRate: 110,
    displacementRate: '+1.2 mm/hr',
    vibrationHz: 0.9,
    status: 'STABLE',
    lastPing: '1s ago'
  }
];
