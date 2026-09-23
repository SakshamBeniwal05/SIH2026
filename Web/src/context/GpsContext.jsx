import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const GpsContext = createContext();

// Northeast India (7 Sister States) Bounding Box Constraint
export const NORTHEAST_BOUNDS = {
  north: 29.5,
  south: 21.5,
  east: 97.5,
  west: 89.6
};

// Backward compatibility alias
export const UTTARAKHAND_BOUNDS = NORTHEAST_BOUNDS;

// Haversine Distance in Kilometers
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function GpsProvider({ children }) {
  const [gpsLocation, setGpsLocation] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'acquiring' | 'locked' | 'denied' | 'error'
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const watchIdRef = useRef(null);

  // Check if coordinates fall within Northeast 7 Sister States AO
  const isInsideNortheast = useCallback((lat, lng) => {
    return (
      lat >= NORTHEAST_BOUNDS.south &&
      lat <= NORTHEAST_BOUNDS.north &&
      lng >= NORTHEAST_BOUNDS.west &&
      lng <= NORTHEAST_BOUNDS.east
    );
  }, []);

  const isInsideUttarakhand = isInsideNortheast;

  // One-time GPS fix acquisition
  const acquireGps = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('GPS Geolocation is not supported by your browser.');
      return Promise.reject(new Error('Geolocation not supported'));
    }

    setStatus('acquiring');
    setErrorMessage(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
          const locData = {
            lat: latitude,
            lng: longitude,
            accuracy: Math.round(accuracy || 10),
            altitude: altitude ? Math.round(altitude) : null,
            heading: heading || null,
            speed: speed || null,
            timestamp: position.timestamp || Date.now(),
            isSimulated: false,
            isInsideAO: isInsideUttarakhand(latitude, longitude)
          };

          setGpsLocation(locData);
          setStatus('locked');
          resolve(locData);
        },
        (error) => {
          let message = 'Unable to acquire GPS signal.';
          let newStatus = 'error';

          if (error.code === error.PERMISSION_DENIED) {
            message = 'GPS permission denied. Please allow location access in your browser settings.';
            newStatus = 'denied';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = 'GPS satellite fix unavailable. Check device antenna or clear sky view.';
          } else if (error.code === error.TIMEOUT) {
            message = 'GPS acquisition request timed out (12s threshold exceeded).';
          }

          setErrorMessage(message);
          setStatus(newStatus);
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0
        }
      );
    });
  }, [isInsideUttarakhand]);

  // Toggle continuous real-time GPS tracking
  const toggleLiveTracking = useCallback(() => {
    if (isLiveTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsLiveTracking(false);
    } else {
      if (!navigator.geolocation) {
        setStatus('error');
        setErrorMessage('GPS tracking not supported.');
        return;
      }

      setStatus('acquiring');
      setIsLiveTracking(true);

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy, altitude } = position.coords;
          setGpsLocation({
            lat: latitude,
            lng: longitude,
            accuracy: Math.round(accuracy || 10),
            altitude: altitude ? Math.round(altitude) : null,
            timestamp: position.timestamp || Date.now(),
            isSimulated: false,
            isInsideAO: isInsideUttarakhand(latitude, longitude)
          });
          setStatus('locked');
        },
        (error) => {
          setErrorMessage(error.message);
          setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error');
          setIsLiveTracking(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 1000
        }
      );

      watchIdRef.current = watchId;
    }
  }, [isLiveTracking, isInsideUttarakhand]);

  // Simulate GPS coordinates (Useful for testing inside Uttarakhand AO)
  const setSimulatedGps = useCallback((lat, lng, label = 'Simulated Field GPS') => {
    const locData = {
      lat,
      lng,
      accuracy: 8,
      altitude: 1420,
      timestamp: Date.now(),
      isSimulated: true,
      label,
      isInsideAO: isInsideUttarakhand(lat, lng)
    };
    setGpsLocation(locData);
    setStatus('locked');
    setErrorMessage(null);
    return locData;
  }, [isInsideUttarakhand]);

  // Reset/Clear GPS position
  const clearGps = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLiveTracking(false);
    setGpsLocation(null);
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <GpsContext.Provider
      value={{
        gpsLocation,
        status,
        errorMessage,
        isLiveTracking,
        isInsideNortheast,
        isInsideUttarakhand,
        acquireGps,
        toggleLiveTracking,
        setSimulatedGps,
        clearGps,
        calculateDistanceKm
      }}
    >
      {children}
    </GpsContext.Provider>
  );
}

export function useGps() {
  const context = useContext(GpsContext);
  if (!context) {
    throw new Error('useGps must be used within a GpsProvider');
  }
  return context;
}
