
import React, { useState } from 'react';
import { LocationData } from '../types';
import { getGeminiResponse } from '../services/geminiService';

interface RegularPickupProps {
  onBack: () => void;
  location: LocationData;
}

const RegularPickup: React.FC<RegularPickupProps> = ({ onBack, location }) => {
  const [wasteType, setWasteType] = useState('General Trash');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');

  const handleCheck = async () => {
    setLoading(true);
    const prompt = `Act as a waste collection assistant. A user at "${location.address}" is asking about their next "${wasteType}" collection. Generate a friendly, helpful, and plausible response about when the pickup might be (e.g., "every Friday morning") and what they should do (e.g., "put bins out by 7 AM"). Address them directly.`;
    const text = await getGeminiResponse(prompt);
    setResponse(text);
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="flex items-center space-x-2">
        <button onClick={onBack} className="text-emerald-600"><i className="fa-solid fa-arrow-left text-xl"></i></button>
        <h2 className="text-2xl font-bold text-gray-800">Regular Pickup</h2>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <p className="text-gray-600 text-sm">Select the type of waste to check your schedule for <b>{location.address || 'your home'}</b>.</p>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Waste Category</label>
          <select 
            value={wasteType}
            onChange={(e) => setWasteType(e.target.value)}
            className="w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option>General Trash</option>
            <option>Recycling</option>
            <option>Yard Waste</option>
            <option>Glass Only</option>
          </select>
        </div>

        <button 
          onClick={handleCheck}
          disabled={loading}
          className="w-full bg-emerald-600 text-white font-bold p-4 rounded-xl shadow-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {loading ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-magnifying-glass mr-2"></i>}
          Check Schedule
        </button>
      </div>

      {response && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-2xl shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-start">
            <i className="fa-solid fa-calendar-day text-emerald-600 mt-1 mr-3"></i>
            <div className="space-y-2">
              <h4 className="font-bold text-emerald-800">Your Schedule</h4>
              <p className="text-emerald-900 leading-relaxed">{response}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegularPickup;
