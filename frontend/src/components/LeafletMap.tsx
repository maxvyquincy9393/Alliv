/**
 * Leaflet Map Component - Nearby Creators
 * Uses OpenStreetMap instead of Google Maps
 * Features: Geolocation, markers, popups, dark mode, real-time updates
 */

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface User {
  id: string;
  name: string;
  age: number;
  field?: string;
  skill?: string;
  photos?: string[];
  location?: {
    lat: number;
    lon: number;
    city?: string;
  };
  lat?: number;
  lng?: number;
  distance?: number;
  compatibility?: number;
}

interface LeafletMapProps {
  users?: User[];
  center?: { lat: number; lng: number };
  onUserClick?: (user: User) => void;
  radius?: number; // in km
  enableGeolocation?: boolean;
  enableRealTimeUpdates?: boolean;
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Create custom marker icon with user avatar
function createCustomIcon(photoUrl?: string, isCurrentUser = false): L.DivIcon {
  const iconHtml = `
    <div class="custom-marker ${isCurrentUser ? 'current-user-marker' : ''}">
      <div class="marker-avatar">
        ${photoUrl 
          ? `<img src="${photoUrl}" alt="avatar" />`
          : `<div class="marker-placeholder">👤</div>`
        }
      </div>
      ${isCurrentUser ? '<div class="pulse-ring"></div>' : ''}
    </div>
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker-container',
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50],
  });
}

// Component to recenter map when location changes
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
}

export default function LeafletMap({
  users = [],
  center = { lat: -6.2088, lng: 106.8456 }, // Default Jakarta
  onUserClick,
  radius = 10,
  enableGeolocation = true,
  enableRealTimeUpdates = false,
}: LeafletMapProps) {
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([center.lat, center.lng]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<User[]>(users);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const geolocationIntervalRef = useRef<number | null>(null);

  // Mock data for nearby creators (replace with API call)
  const mockNearbyUsers: User[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      age: 24,
      skill: 'UI/UX Designer',
      field: 'Design',
      photos: ['https://i.pravatar.cc/150?img=1'],
      lat: -6.2088 + 0.01,
      lng: 106.8456 + 0.01,
      compatibility: 92,
    },
    {
      id: '2',
      name: 'Marcus Lee',
      age: 28,
      skill: 'Full Stack Developer',
      field: 'Engineering',
      photos: ['https://i.pravatar.cc/150?img=12'],
      lat: -6.2088 - 0.015,
      lng: 106.8456 + 0.02,
      compatibility: 88,
    },
    {
      id: '3',
      name: 'Amelia Rodriguez',
      age: 26,
      skill: 'Product Manager',
      field: 'Product',
      photos: ['https://i.pravatar.cc/150?img=5'],
      lat: -6.2088 + 0.02,
      lng: 106.8456 - 0.01,
      compatibility: 85,
    },
    {
      id: '4',
      name: 'David Kim',
      age: 30,
      skill: 'Data Scientist',
      field: 'AI/ML',
      photos: ['https://i.pravatar.cc/150?img=14'],
      lat: -6.2088 - 0.01,
      lng: 106.8456 - 0.015,
      compatibility: 90,
    },
    {
      id: '5',
      name: 'Elena Popov',
      age: 25,
      skill: 'Growth Marketer',
      field: 'Marketing',
      photos: ['https://i.pravatar.cc/150?img=9'],
      lat: -6.2088 + 0.015,
      lng: 106.8456 + 0.015,
      compatibility: 87,
    },
  ];

  // Get user's current location
  useEffect(() => {
    if (!enableGeolocation) {
      setLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    const successHandler = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      setCurrentLocation([latitude, longitude]);
      setLoading(false);
      setError(null);
    };

    const errorHandler = (error: GeolocationPositionError) => {
      console.error('Geolocation error:', error);
      setError('Unable to get your location. Using default location.');
      setLoading(false);
    };

    // Get initial location
    navigator.geolocation.getCurrentPosition(successHandler, errorHandler, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    // Update location every 10 seconds if real-time updates enabled
    if (enableRealTimeUpdates) {
      geolocationIntervalRef.current = window.setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            setCurrentLocation([latitude, longitude]);
            
            // TODO: Sync to database (Firebase/Supabase)
            // syncLocationToDatabase({ lat: latitude, lng: longitude });
          },
          (error) => console.error('Location update error:', error),
          { enableHighAccuracy: true }
        );
      }, 10000);
    }

    return () => {
      if (geolocationIntervalRef.current) {
        window.clearInterval(geolocationIntervalRef.current);
      }
    };
  }, [enableGeolocation, enableRealTimeUpdates]);

  // Calculate distances and update nearby users
  useEffect(() => {
    const currentLat = userLocation?.lat || center.lat;
    const currentLng = userLocation?.lng || center.lng;

    const usersWithDistance = (users.length > 0 ? users : mockNearbyUsers).map((user) => {
      const userLat = user.lat || user.location?.lat || 0;
      const userLng = user.lng || user.location?.lon || 0;
      
      const distance = calculateDistance(currentLat, currentLng, userLat, userLng);
      
      return {
        ...user,
        distance: parseFloat(distance.toFixed(1)),
      };
    }).filter(user => user.distance! <= radius);

    setNearbyUsers(usersWithDistance);
  }, [users, userLocation, center, radius]);

  if (loading) {
    return (
      <div className="map-loading">
        <div className="loading-spinner"></div>
        <p>Detecting your location...</p>
      </div>
    );
  }

  return (
    <div className="leaflet-map-container">
      {error && (
        <div className="map-error-banner">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <MapContainer
        center={currentLocation}
        zoom={13}
        className="leaflet-map"
        zoomControl={false}
        attributionControl={false}
      >
        {/* Dark mode tile layer from Carto */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Map controller for recentering */}
        <MapController center={currentLocation} />

        {/* Radius circle around current user */}
        <Circle
          center={currentLocation}
          radius={radius * 1000} // Convert km to meters
          pathOptions={{
            color: '#8b5cf6',
            fillColor: '#8b5cf6',
            fillOpacity: 0.1,
            weight: 2,
          }}
        />

        {/* Current user marker */}
        <Marker
          position={currentLocation}
          icon={createCustomIcon(undefined, true)}
        >
          <Popup className="custom-popup">
            <div className="popup-content current-user-popup">
              <div className="popup-badge">You</div>
              <h3>Your Location</h3>
              <p className="popup-coordinates">
                {currentLocation[0].toFixed(4)}°, {currentLocation[1].toFixed(4)}°
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Nearby users markers */}
        {nearbyUsers.map((user) => {
          const userLat = user.lat || user.location?.lat || 0;
          const userLng = user.lng || user.location?.lon || 0;
          
          return (
            <Marker
              key={user.id}
              position={[userLat, userLng]}
              icon={createCustomIcon(user.photos?.[0])}
              eventHandlers={{
                click: () => onUserClick?.(user),
              }}
            >
              <Popup className="custom-popup">
                <div className="popup-content">
                  {/* Avatar */}
                  <div className="popup-avatar">
                    {user.photos?.[0] ? (
                      <img src={user.photos[0]} alt={user.name} />
                    ) : (
                      <div className="popup-avatar-placeholder">
                        {user.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="popup-info">
                    <h3 className="popup-name">
                      {user.name}, {user.age}
                    </h3>
                    {user.skill && (
                      <p className="popup-skill">{user.skill}</p>
                    )}
                    {user.field && (
                      <p className="popup-field">
                        <span className="popup-icon">💼</span>
                        {user.field}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="popup-stats">
                    <div className="popup-stat">
                      <span className="popup-icon">📍</span>
                      <span className="popup-stat-value">{user.distance} km</span>
                    </div>
                    {user.compatibility && (
                      <div className="popup-stat">
                        <span className="popup-icon">⚡</span>
                        <span className="popup-stat-value">{user.compatibility}% match</span>
                      </div>
                    )}
                  </div>

                  {/* View Profile Button */}
                  <button
                    className="popup-button"
                    onClick={() => onUserClick?.(user)}
                  >
                    View Profile
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating stats card */}
      <div className="map-stats-card">
        <div className="map-stat">
          <span className="map-stat-value">{nearbyUsers.length}</span>
          <span className="map-stat-label">Nearby</span>
        </div>
        <div className="map-stat-divider" />
        <div className="map-stat">
          <span className="map-stat-value">{radius}</span>
          <span className="map-stat-label">km radius</span>
        </div>
      </div>

      {/* Legend */}
      <div className="map-legend">
        <div className="map-legend-item">
          <div className="map-legend-icon current-user"></div>
          <span>You</span>
        </div>
        <div className="map-legend-item">
          <div className="map-legend-icon nearby-user"></div>
          <span>Creators</span>
        </div>
      </div>

      <style>{`
        .leaflet-map-container {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 500px;
          background: #0a0a0a;
          border-radius: 16px;
          overflow: hidden;
        }

        .leaflet-map {
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        /* Loading State */
        .map-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 500px;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          border-radius: 16px;
          color: #fff;
          gap: 16px;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(139, 92, 246, 0.2);
          border-top-color: #8b5cf6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Error Banner */
        .map-error-banner {
          position: absolute;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          background: rgba(239, 68, 68, 0.95);
          backdrop-filter: blur(12px);
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        /* Custom Marker Styles */
        .custom-marker-container {
          background: transparent !important;
          border: none !important;
        }

        .custom-marker {
          position: relative;
          width: 50px;
          height: 50px;
        }

        .marker-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid #8b5cf6;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
          position: relative;
          z-index: 2;
        }

        .marker-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .marker-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
        }

        .current-user-marker .marker-avatar {
          border-color: #3b82f6;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.6);
        }

        .pulse-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
          border: 3px solid #3b82f6;
          border-radius: 50%;
          animation: pulse 2s ease-out infinite;
        }

        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }

        /* Custom Popup Styles */
        .leaflet-popup-content-wrapper {
          background: rgba(10, 10, 10, 0.95) !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(139, 92, 246, 0.3) !important;
          border-radius: 16px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6) !important;
          padding: 0 !important;
          color: white !important;
        }

        .leaflet-popup-content {
          margin: 0 !important;
          width: 280px !important;
        }

        .leaflet-popup-tip {
          background: rgba(10, 10, 10, 0.95) !important;
          border: 1px solid rgba(139, 92, 246, 0.3) !important;
          border-top: none !important;
          border-right: none !important;
        }

        .popup-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .popup-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .popup-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid #8b5cf6;
          margin: 0 auto;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
        }

        .popup-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .popup-avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: 700;
          color: white;
        }

        .popup-info {
          text-align: center;
        }

        .popup-name {
          font-size: 18px;
          font-weight: 700;
          color: white;
          margin: 0 0 4px 0;
        }

        .popup-skill {
          font-size: 14px;
          color: #a855f7;
          margin: 0 0 8px 0;
          font-weight: 500;
        }

        .popup-field {
          font-size: 13px;
          color: #9ca3af;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .popup-icon {
          font-size: 14px;
        }

        .popup-stats {
          display: flex;
          gap: 12px;
          justify-content: center;
          padding: 12px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 12px;
        }

        .popup-stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #d1d5db;
        }

        .popup-stat-value {
          font-weight: 600;
          color: white;
        }

        .popup-coordinates {
          font-size: 12px;
          color: #6b7280;
          margin: 8px 0 0 0;
        }

        .popup-button {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
        }

        .popup-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
        }

        .popup-button:active {
          transform: translateY(0);
        }

        /* Floating Stats Card */
        .map-stats-card {
          position: absolute;
          top: 16px;
          left: 16px;
          z-index: 1000;
          background: rgba(10, 10, 10, 0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .map-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .map-stat-value {
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .map-stat-label {
          font-size: 11px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .map-stat-divider {
          width: 1px;
          height: 40px;
          background: rgba(139, 92, 246, 0.3);
        }

        /* Legend */
        .map-legend {
          position: absolute;
          bottom: 16px;
          right: 16px;
          z-index: 1000;
          background: rgba(10, 10, 10, 0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .map-legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #d1d5db;
          font-weight: 500;
        }

        .map-legend-icon {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid;
        }

        .map-legend-icon.current-user {
          border-color: #3b82f6;
          background: #3b82f6;
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
        }

        .map-legend-icon.nearby-user {
          border-color: #8b5cf6;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          box-shadow: 0 0 8px rgba(139, 92, 246, 0.4);
        }

        /* Mobile Responsive - 390x844 */
        @media (max-width: 480px) {
          .leaflet-map-container {
            min-height: 400px;
            border-radius: 12px;
          }

          .map-stats-card {
            top: 12px;
            left: 12px;
            padding: 12px 16px;
            gap: 12px;
          }

          .map-stat-value {
            font-size: 20px;
          }

          .map-stat-label {
            font-size: 10px;
          }

          .map-legend {
            bottom: 12px;
            right: 12px;
            padding: 10px 12px;
            gap: 6px;
          }

          .map-legend-item {
            font-size: 11px;
          }

          .map-legend-icon {
            width: 14px;
            height: 14px;
          }

          .popup-content {
            padding: 16px;
            gap: 12px;
          }

          .popup-avatar {
            width: 60px;
            height: 60px;
          }

          .popup-name {
            font-size: 16px;
          }

          .popup-skill {
            font-size: 13px;
          }

          .popup-button {
            padding: 10px;
            font-size: 13px;
          }

          .map-error-banner {
            top: 12px;
            left: 12px;
            right: 12px;
            transform: none;
            font-size: 13px;
            padding: 10px 16px;
          }
        }

        /* Smooth transitions */
        .custom-marker,
        .popup-button,
        .map-stats-card,
        .map-legend {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Glassmorphism effect */
        .map-stats-card,
        .map-legend,
        .map-error-banner {
          background: rgba(10, 10, 10, 0.8);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }

        /* Dark mode optimizations */
        .leaflet-container {
          background: #0a0a0a;
        }

        .leaflet-control-attribution {
          background: rgba(10, 10, 10, 0.8) !important;
          color: #6b7280 !important;
          font-size: 10px !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
        }

        .leaflet-control-attribution a {
          color: #8b5cf6 !important;
        }
      `}</style>
    </div>
  );
}
