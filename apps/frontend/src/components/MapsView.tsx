/**
 * Maps View Component - Now using Leaflet.js + OpenStreetMap
 * No Google Maps API key required!
 */

import LeafletMap from './LeafletMap';

interface User {
  id: string;
  name: string;
  age: number;
  field?: string;
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

interface MapsViewProps {
  users: User[];
  center?: { lat: number; lng: number };
  onUserClick?: (user: User) => void;
  radius?: number; // in km
}

export default function MapsView({ 
  users, 
  center = { lat: -6.2088, lng: 106.8456 },
  onUserClick,
  radius = 10 
}: MapsViewProps) {
  // Use the new Leaflet-based map component
  return (
    <LeafletMap
      users={users}
      center={center}
      onUserClick={onUserClick}
      radius={radius}
      enableGeolocation={true}
      enableRealTimeUpdates={false}
    />
  );
}
