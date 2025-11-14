import { useState, useEffect } from 'react';

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface UseGeolocationReturn {
  location: Location | null;
  error: string | null;
  loading: boolean;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
      setError(null);
      setLoading(false);
    };

    const handleError = (error: GeolocationPositionError) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setError('Location permission denied');
          break;
        case error.POSITION_UNAVAILABLE:
          setError('Location information unavailable');
          break;
        case error.TIMEOUT:
          setError('Location request timed out');
          break;
        default:
          setError('An unknown error occurred');
      }
      setLoading(false);
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    // Get current position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

    // Watch position for updates
    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, options);

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { location, error, loading };
};
