import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LocationData } from '../types';

// Fix for default marker icon in webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LocationPickerProps {
  initialLocation?: LocationData;
  onLocationSelect: (location: LocationData) => void;
  onClose: () => void;
}

// Component to handle map click and marker drag
const LocationMarker: React.FC<{
  position: [number, number];
  onPositionChange: (lat: number, lng: number) => void;
}> = ({ position, onPositionChange }) => {
  const markerRef = useRef<L.Marker>(null);

  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const latlng = marker.getLatLng();
        onPositionChange(latlng.lat, latlng.lng);
      }
    },
  };

  return (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={eventHandlers}
      ref={markerRef}
    />
  );
};

// Component to recenter map when position changes
const RecenterMap: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLocation,
  onLocationSelect,
  onClose,
}) => {
  const mapTilerKey = import.meta.env.VITE_MAPTILER_API_KEY as string | undefined;
  const mapTileUrl = mapTilerKey
    ? `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${mapTilerKey}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const [position, setPosition] = useState<[number, number]>([
    initialLocation?.lat || 5.6037,  // Default to Accra, Ghana
    initialLocation?.lng || -0.1870,
  ]);
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    if (!mapTilerKey) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${mapTilerKey}&limit=1`
      );
      const data = await response.json();
      const placeName = data?.features?.[0]?.place_name;
      if (placeName) setAddress(placeName);
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Forward geocode to get coordinates from address
  const searchAddress = async () => {
    if (!searchQuery.trim()) return;
    if (!mapTilerKey) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(searchQuery)}.json?key=${mapTilerKey}&limit=1`
      );
      const data = await response.json();
      const feature = data?.features?.[0];
      if (feature?.center?.length === 2) {
        const [lon, lat] = feature.center;
        setPosition([lat, lon]);
        setAddress(feature.place_name || '');
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        reverseGeocode(latitude, longitude);
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please enable location services.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Update address when position changes
  const handlePositionChange = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    reverseGeocode(lat, lng);
  };

  // Confirm location selection
  const handleConfirm = () => {
    onLocationSelect({
      address: address || `${position[0].toFixed(6)}, ${position[1].toFixed(6)}`,
      lat: position[0],
      lng: position[1],
    });
    onClose();
  };

  // Get current location on mount if no initial location
  useEffect(() => {
    if (!initialLocation?.lat || !initialLocation?.lng) {
      getCurrentLocation();
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-4 flex items-center justify-between safe-area-inset">
        <button
          onClick={onClose}
          className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"
        >
          <i className="fa-solid fa-times text-lg"></i>
        </button>
        <h1 className="font-bold text-lg">Set Location</h1>
        <div className="w-10"></div>
      </div>

      {/* Search Bar */}
      <div className="bg-white px-4 py-3 shadow-md">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchAddress()}
              placeholder="Search for address..."
              className="w-full p-3 pl-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
            />
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
          <button
            onClick={searchAddress}
            disabled={loading}
            className="bg-emerald-500 text-white px-4 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Search'}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={position}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={mapTileUrl}
          />
          <LocationMarker position={position} onPositionChange={handlePositionChange} />
          <RecenterMap position={position} />
        </MapContainer>

        {/* My Location Button */}
        <button
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className="absolute top-4 right-4 bg-white shadow-lg rounded-full w-12 h-12 flex items-center justify-center z-[1000] hover:bg-gray-50 active:scale-95 transition-all"
        >
          {gettingLocation ? (
            <i className="fa-solid fa-spinner fa-spin text-emerald-600"></i>
          ) : (
            <i className="fa-solid fa-location-crosshairs text-emerald-600 text-lg"></i>
          )}
        </button>

        {/* Zoom Controls */}
        <div className="absolute top-20 right-4 bg-white shadow-lg rounded-xl overflow-hidden z-[1000]">
          <button
            onClick={() => {
              const map = document.querySelector('.leaflet-container') as any;
              if (map?._leaflet_map) map._leaflet_map.zoomIn();
            }}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 border-b border-gray-200"
          >
            <i className="fa-solid fa-plus text-gray-700"></i>
          </button>
          <button
            onClick={() => {
              const map = document.querySelector('.leaflet-container') as any;
              if (map?._leaflet_map) map._leaflet_map.zoomOut();
            }}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100"
          >
            <i className="fa-solid fa-minus text-gray-700"></i>
          </button>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="bg-white px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] safe-area-inset">
        <div className="mb-3">
          <p className="text-xs text-gray-500 font-medium mb-1">Selected Location</p>
          <div className="flex items-start space-x-2">
            <i className="fa-solid fa-map-marker-alt text-emerald-500 mt-1"></i>
            <p className="text-sm text-gray-800 flex-1">
              {loading ? (
                <span className="text-gray-400">Getting address...</span>
              ) : (
                address || 'Drag the marker to set location'
              )}
            </p>
          </div>
        </div>
        <button
          onClick={handleConfirm}
          disabled={!address && !position}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/30 disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          <i className="fa-solid fa-check mr-2"></i>
          Confirm Location
        </button>
      </div>
    </div>
  );
};

export default LocationPicker;
