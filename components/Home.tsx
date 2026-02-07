import React, { useEffect, useState } from 'react';
import { AppView, LocationData } from '../types';
import { hasUserProfile, getUserProfile, saveFirebaseUserProfile } from '../services/userProfileService';
import { getSavedLocation, saveLocation } from '@/services/locationService';
import UserProfilePrompt from './UserProfilePrompt';
import LocationPicker from './LocationPicker';
import { UserProfile } from '../services/userProfileService';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface HomeProps {
  onNavigate: (view: AppView) => void;
  location: LocationData;
  onLocationChange: (loc: LocationData) => void;
  onProfileClick?: () => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate, location, onLocationChange, onProfileClick }) => {
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [tempAddress, setTempAddress] = useState(location.address);
  const [savedLocation, setSavedLocation] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  // Check if user has profile and load name + location from Firebase
  useEffect(() => {
    const checkProfile = async () => {
      const hasProfile = await hasUserProfile();
      setShowProfilePrompt(!hasProfile);
      const profile = await getUserProfile();
      if (profile?.name) {
        setUserName(profile.name);
      }
      // Load location from Firebase profile if available
      if (profile?.address && profile?.lat && profile?.lng) {
        onLocationChange({
          address: profile.address,
          lat: profile.lat,
          lng: profile.lng
        });
        setSavedLocation(profile.address);
      }
    };
    checkProfile();
  }, []);

  // Load saved location on mount
  useEffect(() => {
    const saved = getSavedLocation();
    if (saved) {
      setSavedLocation(saved.address);
      if (!location.address || location.address === 'Your Current Location') {
        onLocationChange({
          address: saved.address,
          lat: saved.lat,
          lng: saved.lng
        });
      }
    }
  }, []);

  // Listen for user's request counts
  useEffect(() => {
    if (!auth.currentUser) return;

    const userProfile = getUserProfile();
    userProfile.then(profile => {
      if (!profile?.phone) return;

      const requestsRef = collection(db, 'requests');
      const unsubscribe = onSnapshot(requestsRef, (snapshot) => {
        let pending = 0;
        let active = 0;
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.userPhone === profile.phone) {
            if (data.status === 'pending') pending++;
            if (data.status === 'accepted') active++;
          }
        });
        setPendingCount(pending);
        setActiveCount(active);
      });
      return unsubscribe;
    });
  }, []);

  const handleProfileComplete = (profile: UserProfile) => {
    setShowProfilePrompt(false);
    if (profile.name) setUserName(profile.name);
  };

  const handleSaveAddress = () => {
    if (tempAddress.trim()) {
      saveLocation(tempAddress);
      onLocationChange({ ...location, address: tempAddress });
      setSavedLocation(tempAddress);
      setIsEditingLocation(false);
    }
  };

  const handleMapLocationSelect = async (newLocation: LocationData) => {
    // Save to localStorage with full location data including coordinates
    saveLocation(newLocation.address, newLocation.lat, newLocation.lng);
    onLocationChange(newLocation);
    setSavedLocation(newLocation.address);
    setShowMapPicker(false);
    setIsEditingLocation(false);

    // Also save to Firebase profile if logged in
    if (auth.currentUser) {
      try {
        await saveFirebaseUserProfile({
          address: newLocation.address,
          lat: newLocation.lat,
          lng: newLocation.lng
        } as any);
      } catch (error) {
        console.error('Error saving location to profile:', error);
      }
    }
  };

  const handleEditAddress = () => {
    setTempAddress(location.address);
    setIsEditingLocation(true);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayAddress = location.address || savedLocation || 'Set your address';

  const services = [
    {
      id: 'schedule',
      icon: 'fa-calendar-plus',
      title: 'Schedule Pickup',
      desc: 'Request waste collection',
      gradient: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-500/30',
      onClick: () => onNavigate(AppView.REGULAR)
    },
    {
      id: 'bulky',
      icon: 'fa-couch',
      title: 'Bulky Items',
      desc: 'Large item disposal',
      gradient: 'from-blue-500 to-indigo-500',
      shadow: 'shadow-blue-500/30',
      onClick: () => onNavigate(AppView.BULKY)
    },
    {
      id: 'report',
      icon: 'fa-flag',
      title: 'Report Issue',
      desc: 'Report problems',
      gradient: 'from-orange-500 to-red-500',
      shadow: 'shadow-orange-500/30',
      onClick: () => onNavigate(AppView.REPORT)
    },
    {
      id: 'chat',
      icon: 'fa-robot',
      title: 'AI Assistant',
      desc: 'Get smart help',
      gradient: 'from-purple-500 to-pink-500',
      shadow: 'shadow-purple-500/30',
      onClick: () => onNavigate(AppView.CHAT)
    }
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-slate-50 flex flex-col">
      {showProfilePrompt && (
        <UserProfilePrompt
          onComplete={handleProfileComplete}
          onSkip={() => setShowProfilePrompt(false)}
        />
      )}

      {/* Header - Glassmorphism style */}
      <header className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white px-4 pt-6 pb-24 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 right-4 w-20 h-20 bg-white/5 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>

        <div className="relative z-10">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <i className="fa-solid fa-recycle text-xl"></i>
              </div>
              <div>
                <p className="text-emerald-100 text-xs font-medium">{getGreeting()}</p>
                <h1 className="text-lg font-bold">{userName || 'Welcome'}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate(AppView.PROFILE)}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 hover:bg-white/30 transition-all active:scale-95"
              >
                <i className="fa-solid fa-user"></i>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex space-x-3">
            <button
              onClick={() => onNavigate(AppView.MY_REQUESTS)}
              className="flex-1 bg-white/20 backdrop-blur-sm rounded-2xl p-3 border border-white/30 hover:bg-white/30 transition-all active:scale-95"
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-clock text-amber-900 text-sm"></i>
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-xs text-emerald-100">Pending</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => onNavigate(AppView.MY_REQUESTS)}
              className="flex-1 bg-white/20 backdrop-blur-sm rounded-2xl p-3 border border-white/30 hover:bg-white/30 transition-all active:scale-95"
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-truck text-blue-900 text-sm"></i>
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold">{activeCount}</p>
                  <p className="text-xs text-emerald-100">Active</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Location Card - Floating */}
      <div className="px-4 -mt-12 relative z-20">
        {!isEditingLocation ? (
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-location-dot text-emerald-600"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 font-medium">Service Location</p>
                  <p className="font-semibold text-gray-800 truncate">{displayAddress}</p>
                  {location.lat && location.lng && (
                    <p className="text-xs text-emerald-600 flex items-center mt-0.5">
                      <i className="fa-solid fa-map-pin mr-1"></i>
                      Map location set
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleEditAddress}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
              >
                <i className="fa-solid fa-pencil text-gray-600"></i>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-emerald-200 animate-in slide-in-from-top duration-300">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-location-dot text-emerald-500"></i>
                <span className="text-sm font-semibold text-gray-700">Enter your address</span>
              </div>
              <input
                type="text"
                value={tempAddress}
                onChange={(e) => setTempAddress(e.target.value)}
                placeholder="Street address, city, zip code"
                autoFocus
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
              />
              {/* Map Picker Button */}
              <button
                onClick={() => setShowMapPicker(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
              >
                <i className="fa-solid fa-map-location-dot"></i>
                <span>Set on Map</span>
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveAddress}
                  disabled={!tempAddress.trim()}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center space-x-2"
                >
                  <i className="fa-solid fa-check"></i>
                  <span>Save</span>
                </button>
                <button
                  onClick={() => setIsEditingLocation(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl transition-all hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        {/* Services Section */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-500">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <span>Quick Actions</span>
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {services.map((service, index) => (
              <button
                key={service.id}
                onClick={service.onClick}
                className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 active:scale-95 animate-in fade-in slide-in-from-bottom group`}
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${service.gradient} rounded-xl flex items-center justify-center mb-3 shadow-lg ${service.shadow} group-hover:scale-110 transition-transform`}>
                  <i className={`fa-solid ${service.icon} text-white text-lg`}></i>
                </div>
                <h3 className="font-bold text-gray-800 text-sm mb-1">{service.title}</h3>
                <p className="text-xs text-gray-500">{service.desc}</p>
              </button>
            ))}
          </div>

          {/* My Requests Button */}
          <button
            onClick={() => onNavigate(AppView.MY_REQUESTS)}
            className="w-full bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-between animate-in fade-in slide-in-from-bottom duration-500"
            style={{ animationDelay: '300ms' }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-list-check text-lg"></i>
              </div>
              <div className="text-left">
                <p className="font-bold">My Requests</p>
                <p className="text-xs text-slate-300">Track your pickups</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {(pendingCount + activeCount) > 0 && (
                <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                  {pendingCount + activeCount}
                </span>
              )}
              <i className="fa-solid fa-chevron-right text-slate-400"></i>
            </div>
          </button>
        </div>

        {/* Tips Section */}
        <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 animate-in fade-in duration-500" style={{ animationDelay: '400ms' }}>
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-lightbulb text-white"></i>
            </div>
            <div>
              <p className="font-semibold text-blue-900 text-sm">Quick Tip</p>
              <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                Schedule regular pickups and never miss a collection day. Our collectors are ready to help!
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Location Picker Modal */}
      {showMapPicker && (
        <LocationPicker
          initialLocation={location}
          onLocationSelect={handleMapLocationSelect}
          onClose={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
};

export default Home;
