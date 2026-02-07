
import React, { useState, useEffect } from 'react';
import { LocationData } from '../types';
import { analyzeWasteImage, getGeminiResponse } from '../services/geminiService';
import { getUserProfile, UserProfile } from '../services/userProfileService';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ScrollingBackButton from './ScrollingBackButton';

interface BulkyPickupProps {
  onBack: () => void;
  location: LocationData;
}

const BulkyPickup: React.FC<BulkyPickupProps> = ({ onBack, location }) => {
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [aiAdvice, setAiAdvice] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      const profile = await getUserProfile();
      setUserProfile(profile);
    };
    loadProfile();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!description && !image) return;
    setLoading(true);
    
    let analysisText = "";
    if (image) {
      analysisText = await analyzeWasteImage(
        "Look at this image. Identify what item this is and if it qualifies as bulky waste (like furniture, large electronics, or mattress). Provide a short sentence of advice on how it should be prepared for pickup.",
        image
      );
      setAiAdvice(analysisText);
    }

    const prompt = `A user at "${location.address}" wants to schedule a bulky pickup for: "${description || 'an item shown in a photo'}". They prefer "${preferredDate || 'the soonest available'}" date. Analysis of photo says: "${analysisText}". Generate a friendly confirmation message stating that the request is logged, mentioning a simulated reference number #123-WP, and confirming the date.`;
    
    const conf = await getGeminiResponse(prompt);
    setConfirmation(conf);

    // Save to Firebase with user profile
    try {
      await addDoc(collection(db, 'requests'), {
        address: location.address || 'Unknown',
        latitude: location.lat,
        longitude: location.lng,
        wasteType: 'Bulky Pickup',
        description,
        preferredDate,
        hasImage: !!image,
        status: 'pending',
        createdAt: new Date(),
        view: 'bulky',
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
        <button onClick={onBack} className="text-teal-600"><i className="fa-solid fa-arrow-left text-xl"></i></button>
        <h2 className="text-2xl font-bold text-gray-800">Bulky Waste Pickup</h2>
      </div>

      {!confirmation ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">What are we picking up?</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Old sofa, washing machine, mattress..."
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Snap a Photo (Optional but Recommended)</label>
            <div className="relative border-2 border-dashed border-teal-200 rounded-xl p-6 text-center bg-teal-50/30 hover:bg-teal-50 transition-colors cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-1">
                <i className={`fa-solid ${image ? 'fa-check-circle text-teal-600' : 'fa-camera text-teal-400'} text-3xl`}></i>
                <p className="text-xs text-teal-600 font-medium">{image ? 'Image Attached' : 'Tap to Take or Upload Photo'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Preferred Date</label>
            <input 
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <button 
            onClick={handleSubmit}
            disabled={loading || (!description && !image)}
            className="w-full bg-teal-600 text-white font-bold p-4 rounded-xl shadow-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {loading ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-paper-plane mr-2"></i>}
            Request Pickup
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in zoom-in duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-teal-100 text-center space-y-4">
            <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <i className="fa-solid fa-check text-2xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-teal-800">Request Sent!</h3>
            <div className="text-gray-700 leading-relaxed text-sm bg-teal-50/50 p-4 rounded-xl italic">
              "{confirmation}"
            </div>
            {aiAdvice && (
              <div className="text-left text-xs bg-gray-50 p-3 rounded-lg border-l-2 border-teal-400">
                <span className="font-bold text-teal-700 uppercase">AI Expert Tip:</span> {aiAdvice}
              </div>
            )}
            <button 
              onClick={onBack}
              className="w-full bg-teal-600 text-white font-bold p-3 rounded-xl hover:bg-teal-700"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
      
      <ScrollingBackButton onBack={onBack} showHomeButton={true} />
    </div>
  );
};

export default BulkyPickup;
