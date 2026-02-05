import React, { useEffect, useState } from 'react';
import { AppView, LocationData } from '../types';
import { hasUserProfile } from '../services/userProfileService';
import { getSavedLocation, saveLocation } from '@/services/locationService';
import UserProfilePrompt from './UserProfilePrompt';
import { UserProfile } from '../services/userProfileService';

interface HomeProps {
  onNavigate: (view: AppView) => void;
  location: LocationData;
  onLocationChange: (loc: LocationData) => void;
  onProfileClick?: () => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate, location, onLocationChange, onProfileClick }) => {
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [tempAddress, setTempAddress] = useState(location.address);
  const [savedLocation, setSavedLocation] = useState<string | null>(null);

  // Check if user has profile on mount
  useEffect(() => {
    const checkProfile = async () => {
      const hasProfile = await hasUserProfile();
      setShowProfilePrompt(!hasProfile);
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

  const handleProfileComplete = (profile: UserProfile) => {
    setShowProfilePrompt(false);
  };

  const handleSaveAddress = () => {
    if (tempAddress.trim()) {
      saveLocation(tempAddress);
      onLocationChange({ ...location, address: tempAddress });
      setSavedLocation(tempAddress);
      setIsEditingLocation(false);
    }
  };

  const handleEditAddress = () => {
    setTempAddress(location.address);
    setIsEditingLocation(true);
  };

  const displayAddress = location.address || savedLocation || 'Set your service address';
  const hasAddress = location.address && location.address.trim().length > 0;

  return (
    <>
      {showProfilePrompt && (
        <UserProfilePrompt 
          onComplete={handleProfileComplete}
          onSkip={() => setShowProfilePrompt(false)}
        />
      )}
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header Section */}
        <div className="space-y-3">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold text-gray-800">Welcome Back</h1>
            <p className="text-gray-600 text-lg">Ready to manage your waste?</p>
          </div>
        </div>

        {/* Location Card - Enhanced */}
        {!isEditingLocation ? (
          <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg border border-emerald-400/20">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm mt-1">
                    <i className="fa-solid fa-location-dot text-2xl"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-emerald-50 uppercase tracking-widest mb-1">Service Location</p>
                    <p className="text-2xl font-bold leading-tight break-words pr-2">{displayAddress}</p>
                    <p className="text-xs text-emerald-50 mt-2 opacity-90">Used for all your requests</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleEditAddress}
                className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-4 rounded-xl transition-all backdrop-blur-sm border border-white/20 flex items-center justify-center space-x-2"
              >
                <i className="fa-solid fa-pencil"></i>
                <span>Change Address</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-200 p-6 space-y-4 animate-in slide-in-from-top duration-300">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <i className="fa-solid fa-location-dot text-emerald-500"></i>
                <span>Enter your service address</span>
              </label>
              <input
                type="text"
                value={tempAddress}
                onChange={(e) => setTempAddress(e.target.value)}
                placeholder="Street address, city, zip code"
                autoFocus
                className="w-full p-4 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none text-lg transition-all"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSaveAddress}
                disabled={!tempAddress.trim()}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-95"
              >
                <i className="fa-solid fa-check"></i>
                <span>Save Address</span>
              </button>
              <button
                onClick={() => setIsEditingLocation(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Service Options Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">What can we help with?</h2>
          <div className="grid grid-cols-2 gap-4">
            <MenuButton 
              icon="fa-solid fa-calendar-check" 
              title="Schedule" 
              desc="Request pickup"
              color="emerald"
              onClick={() => onNavigate(AppView.REGULAR)}
            />
            <MenuButton 
              icon="fa-solid fa-couch" 
              title="Bulky Items" 
              desc="Large pickup"
              color="teal"
              onClick={() => onNavigate(AppView.BULKY)}
            />
            <MenuButton 
              icon="fa-solid fa-circle-exclamation" 
              title="Report" 
              desc="Issue report"
              color="orange"
              onClick={() => onNavigate(AppView.REPORT)}
            />
            <MenuButton 
              icon="fa-solid fa-robot" 
              title="AI Assistant" 
              desc="Ask questions"
              color="indigo"
              onClick={() => onNavigate(AppView.CHAT)}
            />
            <MenuButton 
              icon="fa-solid fa-list-check" 
              title="My Requests" 
              desc="Track status"
              color="blue"
              onClick={() => onNavigate(AppView.MY_REQUESTS)}
            />
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <i className="fa-solid fa-lightbulb text-white"></i>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-blue-900 text-sm mb-1">Pro Tip</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              Your service address is saved. We'll ask you to confirm or change it before each request.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

interface MenuButtonProps {
  icon: string;
  title: string;
  desc: string;
  color: 'emerald' | 'teal' | 'orange' | 'indigo' | 'blue' | 'purple';
  onClick: () => void;
}

const colorConfig = {
  emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200' },
  teal: { bg: 'bg-teal-500', light: 'bg-teal-50', border: 'border-teal-200' },
  orange: { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200' },
  indigo: { bg: 'bg-indigo-500', light: 'bg-indigo-50', border: 'border-indigo-200' },
  blue: { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200' },
  purple: { bg: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-200' }
};

const MenuButton: React.FC<MenuButtonProps> = ({ icon, title, desc, color, onClick }) => {
  const colors = colorConfig[color];
  
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center text-center p-6 ${colors.light} rounded-2xl border ${colors.border} shadow-sm hover:shadow-lg hover:scale-105 transition-all active:scale-95 group`}
    >
      <div className={`${colors.bg} text-white p-4 rounded-full mb-3 shadow-md`}>
        <i className={`${icon} text-xl`}></i>
      </div>
      <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{desc}</p>
    </button>
  );
};

export default Home;
