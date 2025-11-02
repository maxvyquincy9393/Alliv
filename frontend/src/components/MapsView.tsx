import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface User {
  id: string;
  name: string;
  age: number;
  field: string;
  photos: string[];
  location: {
    lat: number;
    lon: number;
    city: string;
  };
  distance?: number;
  compatibility?: number;
}

interface MapsViewProps {
  users: User[];
  center: { lat: number; lng: number };
  onUserClick: (user: User) => void;
  radius: number; // in km
}

export default function MapsView({ users, center, onUserClick, radius }: MapsViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const apiKey = import.meta.env.VITE_MAPS_API_KEY;

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || map) return;

    const loader = new Loader({
      apiKey: apiKey || '',
      version: 'weekly',
    });

    loader.load().then(() => {
      const newMap = new google.maps.Map(mapRef.current!, {
        center,
        zoom: 12,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [{ color: '#0a0a0a' }],
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#1a1a1a' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#2a2a2a' }],
          },
          {
            featureType: 'poi',
            stylers: [{ visibility: 'off' }],
          },
        ],
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM,
        },
      });

      // Add center marker (current user)
      new google.maps.Marker({
        position: center,
        map: newMap,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 3,
        },
        title: 'Your Location',
      });

      // Add radius circle
      new google.maps.Circle({
        strokeColor: '#3b82f6',
        strokeOpacity: 0.3,
        strokeWeight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        map: newMap,
        center,
        radius: radius * 1000, // Convert km to meters
      });

      setMap(newMap);
    });
  }, [mapRef, center, radius, apiKey]);

  // Update markers when users change
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));

    // Create new markers
    const newMarkers = users.map((user) => {
      const marker = new google.maps.Marker({
        position: { lat: user.location.lat, lng: user.location.lon },
        map,
        icon: {
          url: user.photos[0] || '/default-avatar.png',
          scaledSize: new google.maps.Size(50, 50),
          anchor: new google.maps.Point(25, 25),
        },
        title: `${user.name}, ${user.age}`,
      });

      // Info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="background: #1a1a1a; color: white; padding: 12px; border-radius: 8px; min-width: 200px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${user.photos[0]}" alt="${user.name}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;" />
              <div>
                <h3 style="margin: 0; font-size: 16px; font-weight: 600;">${user.name}, ${user.age}</h3>
                <p style="margin: 4px 0 0; font-size: 13px; color: #a0a0a0;">${user.field}</p>
                ${user.distance ? `<p style="margin: 4px 0 0; font-size: 12px; color: #3b82f6;">📍 ${user.distance.toFixed(1)} km away</p>` : ''}
                ${user.compatibility ? `<p style="margin: 4px 0 0; font-size: 12px; color: #10b981;">⚡ ${user.compatibility}% match</p>` : ''}
              </div>
            </div>
            <button onclick="window.viewProfile('${user.id}')" style="margin-top: 8px; width: 100%; padding: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
              View Profile
            </button>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      // Global callback for View Profile button
      (window as any).viewProfile = (userId: string) => {
        const clickedUser = users.find((u) => u.id === userId);
        if (clickedUser) onUserClick(clickedUser);
      };

      return marker;
    });

    setMarkers(newMarkers);

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(center);
      newMarkers.forEach((marker) => {
        const pos = marker.getPosition();
        if (pos) bounds.extend(pos);
      });
      map.fitBounds(bounds);
    }
  }, [map, users, onUserClick, center]);

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full rounded-xl overflow-hidden" />

      {/* Floating Stats */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-lg px-4 py-3 rounded-xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{users.length}</p>
            <p className="text-xs text-gray-400">Nearby</p>
          </div>
          <div className="h-10 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{radius}</p>
            <p className="text-xs text-gray-400">km radius</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-lg px-4 py-3 rounded-xl border border-white/10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-300">You</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-purple-500" />
            <span className="text-xs text-gray-300">Users</span>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {!map && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center rounded-xl">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">Loading Maps...</p>
          </div>
        </div>
      )}
    </div>
  );
}
