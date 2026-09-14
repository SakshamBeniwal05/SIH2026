export const SEED_BASINS = [
  {
    id: 'alaknanda',
    name: 'Alaknanda Valley (Chamoli / Joshimath)',
    region: 'Uttarakhand (Garhwal Himalaya)',
    epicenter: { lat: 30.4100, lng: 79.4200 },
    defaultRainfall: 165,
    criticalRoads: [
      'NH-58 (Rishikesh-Joshimath-Badrinath Lifeline)',
      'Helang-Joshimath Bypass Link Road',
      'Tapovan-Rishiganga Access Route'
    ],
    vulnerableVillages: ['Helang', 'Pipalkoti', 'Joshimath Lower Ridge', 'Birahi', 'Tapovan']
  },
  {
    id: 'mandakini',
    name: 'Mandakini Basin (Kedarnath / Rudraprayag)',
    region: 'Uttarakhand (Rudraprayag District)',
    epicenter: { lat: 30.7300, lng: 79.0600 },
    defaultRainfall: 185,
    criticalRoads: [
      'NH-107 (Rudraprayag-Guptkashi-Kedarnath Highway)',
      'Kund-Gopeshwar Arterial Route'
    ],
    vulnerableVillages: ['Gaurikund', 'Sonprayag', 'Guptkashi', 'Agastyamuni', 'Rambara Buffer']
  },
  {
    id: 'bhagirathi',
    name: 'Bhagirathi Valley (Uttarkashi / Silkyara)',
    region: 'Uttarakhand (Uttarkashi District)',
    epicenter: { lat: 30.7300, lng: 78.4400 },
    defaultRainfall: 140,
    criticalRoads: [
      'NH-134 (Silkyara Bend-Barkot Highway)',
      'NH-34 (Dharasu-Uttarkashi-Gangotri Corridor)'
    ],
    vulnerableVillages: ['Silkyara Portal', 'Dharasu Bend', 'Maneri', 'Bhatwari', 'Barkot']
  },
  {
    id: 'song-river',
    name: 'Song River Basin (Maldevta / Dehradun)',
    region: 'Uttarakhand (Dehradun Foothills)',
    epicenter: { lat: 30.3165, lng: 78.0322 },
    defaultRainfall: 130,
    criticalRoads: [
      'Maldevta-Kumalda-Sahastradhara Road',
      'Raipur-Thano Forest Link'
    ],
    vulnerableVillages: ['Maldevta', 'Kumalda', 'Sarkhet Village', 'Song River Embankment Belt']
  },
  {
    id: 'pithoragarh',
    name: 'Pithoragarh & Kali Valley (Malpa / Dharchula)',
    region: 'Uttarakhand (Kumaon Himalaya)',
    epicenter: { lat: 29.9800, lng: 80.7500 },
    defaultRainfall: 155,
    criticalRoads: [
      'NH-9 (Tanakpur-Pithoragarh-Dharchula Highway)',
      'Tawaghat-Lipulekh Border Highway'
    ],
    vulnerableVillages: ['Malpa', 'Dharchula', 'Balwakot', 'Jauljibi', 'Pangla']
  }
];

export const SEED_HAZARDS = [
  {
    _id: 'hazard-uk-alaknanda-active',
    title: 'Severe Slope Failure & Debris Surge — Alaknanda Valley (Chamoli)',
    simulatedBasin: 'Alaknanda Valley (Chamoli / Joshimath)',
    rainfallRateMmPerHour: 165,
    status: 'active',
    location: {
      type: 'Point',
      coordinates: [79.4200, 30.4100] // [lng, lat]
    },
    tiers: [
      {
        tierName: 'Hard Most',
        radiusMeters: 5200,
        strokeColor: '#B71C1C',
        fillColor: '#FFEBEE',
        fillOpacity: 0.45,
        evacuationMandated: true,
        description: 'Ground Zero Chamoli — Critical slope failure on NH-58 shoulder. Immediate evacuation ordered.'
      },
      {
        tierName: 'Most',
        radiusMeters: 10100,
        strokeColor: '#E65100',
        fillColor: '#FFF3E0',
        fillOpacity: 0.35,
        evacuationMandated: true,
        description: 'Severe Impact Zone — NH-58 Badrinath Lifeline severed at KM 42. Detour via Pipalkoti.'
      },
      {
        tierName: 'Some',
        radiusMeters: 17900,
        strokeColor: '#FF8F00',
        fillColor: '#FFF8E1',
        fillOpacity: 0.25,
        evacuationMandated: false,
        description: 'Moderate Disruption — Slope creep, agricultural washouts, elevated river level advisory.'
      },
      {
        tierName: 'Negligible',
        radiusMeters: 30000,
        strokeColor: '#01579B',
        fillColor: '#E1F5FE',
        fillOpacity: 0.15,
        evacuationMandated: false,
        description: 'Periphery Buffer — Doppler radar observation sector across Garhwal watershed.'
      }
    ],
    severedRoads: [
      'NH-58 (Rishikesh-Joshimath-Badrinath Lifeline)',
      'Helang-Joshimath Bypass Link Road'
    ],
    vulnerableVillages: ['Helang', 'Pipalkoti', 'Joshimath Lower Ridge', 'Birahi', 'Tapovan'],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const SEED_REPORTS = [
  {
    _id: 'rep-uk-001',
    mediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Tapovan_pre_post_NRSC_cropped.jpg',
    category: 'crack',
    severityObserved: 'critical',
    location: {
      type: 'Point',
      coordinates: [79.4500, 30.4300] // Helang / Chamoli
    },
    description: 'Widening slope fissure extending 3.2m across NH-58 shoulder near Helang. Substantial roadbed subsidence.',
    agentEvaluated: true,
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    _id: 'rep-uk-002',
    mediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/2023_Uttarakhand_tunnel_collapse.jpg',
    category: 'slope_movement',
    severityObserved: 'critical',
    location: {
      type: 'Point',
      coordinates: [79.5600, 30.5500] // Joshimath
    },
    description: 'Active talus shear slide and slope subsidence observed along Sunil Ward / Joshimath Lower Ridge.',
    agentEvaluated: true,
    createdAt: new Date(Date.now() - 2400000).toISOString()
  },
  {
    _id: 'rep-uk-003',
    mediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/62/The_Indian_Air_Force_personnel_unloading_relief_materials_from_a_chopper_during_their_flood_relief_operations%2C_at_Guptakashi_near_flood-hit_Kedarnath%2C_in_Uttarakhand.jpg',
    category: 'road_blocked',
    severityObserved: 'severe',
    location: {
      type: 'Point',
      coordinates: [79.0500, 30.6300] // Sonprayag / Kedarnath corridor
    },
    description: 'Massive rockfall obstructing NH-107 between Guptkashi and Sonprayag. Heavy transport completely halted.',
    agentEvaluated: true,
    createdAt: new Date(Date.now() - 600000).toISOString()
  },
  {
    _id: 'rep-uk-004',
    mediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/77/1999Chamoli.png',
    category: 'bridge_damage',
    severityObserved: 'severe',
    location: {
      type: 'Point',
      coordinates: [78.0800, 30.3300] // Maldevta Dehradun
    },
    description: 'Song River flash surge eroded left abutment protection of Maldevta Bridge. High scouring risk.',
    agentEvaluated: false,
    createdAt: new Date(Date.now() - 3200000).toISOString()
  }
];

export const SEED_SENSORS = [
  {
    id: 'SN-UK-501',
    name: 'Joshimath Sunil Ridge Tiltmeter',
    type: 'Biaxial Inclinometer',
    coords: [79.5600, 30.5500],
    saturation: 93.8,
    rainfallRate: 165,
    displacementRate: '+16.4 mm/hr',
    vibrationHz: 5.2,
    status: 'CRITICAL',
    lastPing: '2s ago'
  },
  {
    id: 'SN-UK-502',
    name: 'Helang NH-58 Escarpment Piezometer',
    type: 'Pore Pressure Piezometer',
    coords: [79.4500, 30.4300],
    saturation: 90.2,
    rainfallRate: 160,
    displacementRate: '+11.8 mm/hr',
    vibrationHz: 4.1,
    status: 'CRITICAL',
    lastPing: '5s ago'
  },
  {
    id: 'SN-UK-503',
    name: 'Sonprayag Mandakini Radar Station',
    type: 'Hydro-Acoustic Debris Radar',
    coords: [79.0500, 30.6300],
    saturation: 84.5,
    rainfallRate: 185,
    displacementRate: '+6.2 mm/hr',
    vibrationHz: 2.8,
    status: 'MONITOR',
    lastPing: '8s ago'
  },
  {
    id: 'SN-UK-504',
    name: 'Maldevta Song River Doppler Terminal',
    type: 'Rain Doppler & Barometer',
    coords: [78.0800, 30.3300],
    saturation: 68.0,
    rainfallRate: 130,
    displacementRate: '+0.8 mm/hr',
    vibrationHz: 0.6,
    status: 'STABLE',
    lastPing: '1s ago'
  }
];
