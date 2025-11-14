import { UserLocation } from '../types/profile';

/**
 * Haversine formula to calculate distance between two points on Earth
 * Returns distance in kilometers
 */
export function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Request user's geolocation
 */
export async function requestGeolocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

/**
 * Reverse geocode coordinates to address (mocked for now)
 * In production, use Google Maps Geocoding API or similar
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<{ city: string; country: string }> {
  // Mock implementation - replace with actual API call
  // Example: https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=YOUR_API_KEY
  
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

  // Mock data based on rough coordinates
  const mockCities = [
    { lat: 37.7749, lon: -122.4194, city: 'San Francisco', country: 'United States' },
    { lat: 51.5074, lon: -0.1278, city: 'London', country: 'United Kingdom' },
    { lat: 48.8566, lon: 2.3522, city: 'Paris', country: 'France' },
    { lat: 35.6762, lon: 139.6503, city: 'Tokyo', country: 'Japan' },
    { lat: -33.8688, lon: 151.2093, city: 'Sydney', country: 'Australia' },
    { lat: 40.7128, lon: -74.0060, city: 'New York', country: 'United States' },
    { lat: -6.2088, lon: 106.8456, city: 'Jakarta', country: 'Indonesia' },
    { lat: 52.5200, lon: 13.4050, city: 'Berlin', country: 'Germany' },
  ];

  // Find closest city
  let closest = mockCities[0];
  let minDist = haversine(lat, lon, closest.lat, closest.lon);

  for (const city of mockCities) {
    const dist = haversine(lat, lon, city.lat, city.lon);
    if (dist < minDist) {
      minDist = dist;
      closest = city;
    }
  }

  return { city: closest.city, country: closest.country };
}

/**
 * Get user location with permission handling
 */
export async function getUserLocation(): Promise<UserLocation> {
  try {
    const position = await requestGeolocation();
    const { latitude: lat, longitude: lon } = position.coords;
    const { city, country } = await reverseGeocode(lat, lon);

    return {
      city,
      country,
      lat,
      lon,
      hideExact: false,
    };
  } catch (error) {
    console.error('Failed to get location:', error);
    throw error;
  }
}

/**
 * Calculate distance between user locations
 */
export function calculateDistance(
  location1: UserLocation,
  location2: UserLocation
): number | null {
  if (location1.hideExact || location2.hideExact) {
    return null; // Privacy: don't calculate if either hides exact location
  }

  return haversine(location1.lat, location1.lon, location2.lat, location2.lon);
}

/**
 * Format distance for display
 */
export function formatDistance(km: number | null): string {
  if (km === null) return 'Location hidden';
  if (km < 1) return 'Less than 1 km away';
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

/**
 * Check if user is within radius
 */
export function isWithinRadius(
  userLocation: UserLocation,
  targetLocation: UserLocation,
  radiusKm: number
): boolean {
  const distance = calculateDistance(userLocation, targetLocation);
  if (distance === null) return false;
  return distance <= radiusKm;
}
