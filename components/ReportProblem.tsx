
import React, { useState, useEffect } from 'react';
import { LocationData } from '../types';
import { getGeminiResponse } from '../services/geminiService';
import { getUserProfile, UserProfile } from '../services/userProfileService';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ScrollingBackButton from './ScrollingBackButton';

interface ReportProblemProps {
  onBack: () => void;
  location: LocationData;
}

const ReportProblem: React.FC<ReportProblemProps> = ({ onBack, location }) => {
  const [problemType, setProblemType] = useState('Missed Pickup');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      const profile = await getUserProfile();
      setUserProfile(profile);
    };
    loadProfile();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    const prompt = `A user at "${location.address}" is reporting a "${problemType}" issue. Description provided: "${description}". Generate a short, helpful, and professional confirmation acknowledging the issue and promising a resolution within 24-48 hours. Reference case #REP-${Math.floor(Math.random() * 10000)}.`;
    const text = await getGeminiResponse(prompt);
    setResponse(text);

    // Save to Firebase with user profile
    try {
      await addDoc(collection(db, 'reports'), {
        address: location.address || 'Unknown',
        latitude: location.lat,
        longitude: location.lng,
        problemType,
        description,
        status: 'open',
        createdAt: new Date(),
        // Attach user info
        userName: userProfile?.name || 'Anonymous',
        userPhone: userProfile?.phone || 'Not provided'
      });
    } catch (error) {
      console.error('Firebase error:', error);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="flex items-center space-x-2">
        <button onClick={onBack} className="text-orange-600"><i className="fa-solid fa-arrow-left text-xl"></i></button>
        <h2 className="text-2xl font-bold text-gray-800">Report a Problem</h2>
      </div>

      {!response ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Problem Type</label>
            <select 
              value={problemType}
              onChange={(e) => setProblemType(e.target.value)}
              className="w-full p-3 bg-orange-50 border border-orange-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option>Missed Pickup</option>
              <option>Overflowing Bin</option>
              <option>Damaged Bin</option>
              <option>Illegal Dumping</option>
              <option>Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Additional Details</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us what happened..."
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none min-h-[100px]"
            />
          </div>

          <button 
            onClick={handleSubmit}
            disabled={loading || !description}
            className="w-full bg-orange-600 text-white font-bold p-4 rounded-xl shadow-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {loading ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-circle-exclamation mr-2"></i>}
            Submit Report
          </button>
        </div>
      ) : (
        <div className="bg-orange-50 border-t-8 border-orange-500 p-8 rounded-2xl shadow-lg animate-in zoom-in duration-300 text-center space-y-4">
          <i className="fa-solid fa-circle-check text-5xl text-orange-500"></i>
          <h3 className="text-xl font-bold text-orange-800">Report Received</h3>
          <p className="text-orange-900 leading-relaxed italic">"{response}"</p>
          <button 
            onClick={onBack}
            className="w-full bg-orange-600 text-white font-bold p-3 rounded-xl hover:bg-orange-700"
          >
            Done
          </button>
        </div>
      )}
      
      <ScrollingBackButton onBack={onBack} showHomeButton={true} />
    </div>
  );
};

export default ReportProblem;
