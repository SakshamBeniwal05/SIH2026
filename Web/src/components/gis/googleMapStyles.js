// Stitch Tactical HUD Styling for Google Maps (Dark Mode)
export const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#090d14" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#090d14" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#111822" }]
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#18202d" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2c384a" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }]
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0a0e15" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }]
  }
];

// Stitch Tactical Field Matrix Styling for Google Maps (Light Mode)
export const lightMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#e2e8f0" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#cbd5e1" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#e0f2fe" }]
  }
];
