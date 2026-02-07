import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom pickup location marker icon
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Current location marker icon
const currentLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Request {
  id: string;
  address: string;
  latitude?: number;
  longitude?: number;
  wasteType: string;
  status: string;
  userName?: string;
  userPhone?: string;
}

interface CollectorMapProps {
  request: Request;
  onBack: () => void;
}

// Component to fit bounds when we have both locations
const FitBounds: React.FC<{
  pickup: [number, number];
  current: [number, number] | null;
}> = ({ pickup, current }) => {
  const map = useMap();

  useEffect(() => {
    if (current) {
      const bounds = L.latLngBounds([pickup, current]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView(pickup, 15);
    }
  }, [pickup, current, map]);

  return null;
};

const CollectorMap: React.FC<CollectorMapProps> = ({ request, onBack }) => {
  const mapTilerKey = import.meta.env.VITE_MAPTILER_API_KEY as string | undefined;
  const mapTileUrl = mapTilerKey
    ? `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${mapTilerKey}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [pickupLocation, setPickupLocation] = useState<[number, number] | null>(
    request.latitude && request.longitude ? [request.latitude, request.longitude] : null
  );
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  const fallbackCenter: [number, number] = currentLocation || [5.6037, -0.1870];
  const mapCenter = pickupLocation || fallbackCenter;

  const geocodeAddress = async (address: string) => {
    setGeocoding(true);
    setGeocodeError(null);
    try {
      if (!mapTilerKey) {
        setGeocodeError('Map service not configured.');
        return;
      }
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(address)}.json?key=${mapTilerKey}&limit=1`
      );
      const data = await response.json();
      const feature = data?.features?.[0];
      if (feature?.center?.length === 2) {
        const [lon, lat] = feature.center;
        setPickupLocation([lat, lon]);
      } else {
        setGeocodeError('Unable to find this address on the map.');
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
      setGeocodeError('Unable to load map location.');
    } finally {
      setGeocoding(false);
    }
  };

  // Get collector's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentLocation([latitude, longitude]);
        if (pickupLocation) {
          calculateDistance(latitude, longitude, pickupLocation[0], pickupLocation[1]);
        }
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    if (d < 1) {
      setDistance(`${Math.round(d * 1000)} m`);
    } else {
      setDistance(`${d.toFixed(1)} km`);
    }
  };

  // Open native maps app with directions
  const openDirections = () => {
    const destination = pickupLocation
      ? `${pickupLocation[0]},${pickupLocation[1]}`
      : encodeURIComponent(request.address);
    // This URL format works on both iOS (opens Apple Maps) and Android (opens Google Maps)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(url, '_blank');
  };

  // Get location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Geocode when coordinates are missing
  useEffect(() => {
    if (!pickupLocation && request.address) {
      geocodeAddress(request.address);
    }
  }, [pickupLocation, request.address]);

  useEffect(() => {
    if (pickupLocation && currentLocation) {
      calculateDistance(
        currentLocation[0],
        currentLocation[1],
        pickupLocation[0],
        pickupLocation[1]
      );
    }
  }, [pickupLocation, currentLocation]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-4 flex items-center justify-between safe-area-inset">
        <button
          onClick={onBack}
          className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"
        >
          <i className="fa-solid fa-arrow-left text-lg"></i>
        </button>
        <h1 className="font-bold text-lg">Pickup Location</h1>
        <div className="w-10"></div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={mapTileUrl}
          />

          {/* Pickup Location Marker */}
          {pickupLocation && (
            <Marker position={pickupLocation} icon={pickupIcon}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-emerald-700">Pickup Location</p>
                  <p className="text-sm text-gray-600">{request.address}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Collector's Current Location Marker */}
          {currentLocation && (
            <Marker position={currentLocation} icon={currentLocationIcon}>
              <Popup>
                <p className="font-bold text-blue-700">Your Location</p>
              </Popup>
            </Marker>
          )}

          {pickupLocation && (
            <FitBounds pickup={pickupLocation} current={currentLocation} />
          )}
        </MapContainer>

        {/* My Location Button */}
        <button
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className="absolute top-4 right-4 bg-white shadow-lg rounded-full w-12 h-12 flex items-center justify-center z-[1000] hover:bg-gray-50 active:scale-95 transition-all"
        >
          {gettingLocation ? (
            <i className="fa-solid fa-spinner fa-spin text-blue-600"></i>
          ) : (
            <i className="fa-solid fa-location-crosshairs text-blue-600 text-lg"></i>
          )}
        </button>
      </div>

      {/* Bottom Panel */}
      <div className="bg-white px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] safe-area-inset">
        {/* Request Details */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-map-marker-alt text-emerald-500"></i>
              <span className="font-semibold text-gray-800">Pickup Address</span>
            </div>
            {distance && (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                {distance} away
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 ml-6">{request.address}</p>
          {geocoding && (
            <p className="text-xs text-blue-600 ml-6">Finding map location...</p>
          )}
          {geocodeError && (
            <p className="text-xs text-red-600 ml-6">{geocodeError}</p>
          )}

          <div className="flex items-center space-x-4 ml-6 text-sm">
            <span className="text-gray-500">
              <i className="fa-solid fa-trash mr-1"></i>
              {request.wasteType}
            </span>
            {request.userName && (
              <span className="text-gray-500">
                <i className="fa-solid fa-user mr-1"></i>
                {request.userName}
              </span>
            )}
          </div>
        </div>

        {/* Navigate Button */}
        <button
          onClick={openDirections}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
        >
          <i className="fa-solid fa-diamond-turn-right text-lg"></i>
          <span>Get Directions</span>
        </button>

        {/* Contact User Button */}
        {request.userPhone && (
          <a
            href={`tel:${request.userPhone}`}
            className="mt-3 w-full bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
          >
            <i className="fa-solid fa-phone"></i>
            <span>Call {request.userName || 'Customer'}</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default CollectorMap;
