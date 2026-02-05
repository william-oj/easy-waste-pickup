import React, { useState } from 'react';
import { saveUserProfile, UserProfile } from '../services/userProfileService';

interface UserProfilePromptProps {
  onComplete: (profile: UserProfile) => void;
  onSkip?: () => void;
  initialProfile?: UserProfile;
}

const UserProfilePrompt: React.FC<UserProfilePromptProps> = ({ onComplete, onSkip, initialProfile }) => {
  const [name, setName] = useState(initialProfile?.name || '');
  const [phone, setPhone] = useState(initialProfile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      setError('Please enter both name and phone number.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const profile: UserProfile = { name: name.trim(), phone: phone.trim() };
      await saveUserProfile(profile);
      onComplete(profile);
    } catch (err: any) {
      setError('Failed to save profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-6 animate-in zoom-in duration-300">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <i className="fa-solid fa-user-check text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome!</h2>
          <p className="text-sm text-gray-600">
            Help collectors contact you when they accept your request.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              <i className="fa-solid fa-user text-emerald-600 mr-2"></i>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., John Smith"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              <i className="fa-solid fa-phone text-emerald-600 mr-2"></i>
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., (555) 123-4567"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
              disabled={saving}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !phone.trim()}
            className="w-full bg-emerald-600 text-white font-bold p-3 rounded-xl shadow-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fa-solid fa-check mr-2"></i>
                Save Profile
              </>
            )}
          </button>

          {onSkip && (
            <button
              onClick={onSkip}
              disabled={saving}
              className="w-full bg-gray-100 text-gray-600 font-medium p-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Skip for Now
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center">
          Your information is stored securely and only used to help collectors contact you.
        </p>
      </div>
    </div>
  );
};

export default UserProfilePrompt;
