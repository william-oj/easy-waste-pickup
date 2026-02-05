import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { UserProfile } from '../services/userProfileService';

interface UserProfilePageProps {
  userProfile: UserProfile | null;
  onBack: () => void;
  onProfileUpdate: (profile: UserProfile) => void;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({
  userProfile,
  onBack,
  onProfileUpdate
}) => {
  const [name, setName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [address, setAddress] = useState(userProfile?.address || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const validateInputs = (): boolean => {
    if (!name.trim()) {
      showMessage('Name is required', 'error');
      return false;
    }
    if (!phone.trim()) {
      showMessage('Phone number is required', 'error');
      return false;
    }
    if (phone.length < 10) {
      showMessage('Phone number must be at least 10 digits', 'error');
      return false;
    }
    if (email && !email.includes('@')) {
      showMessage('Please enter a valid email address', 'error');
      return false;
    }
    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateInputs()) return;

    setIsSaving(true);
    try {
      if (auth.currentUser) {
        const updatedProfile: UserProfile = {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          id: auth.currentUser.uid
        };

        // Save to Firebase
        await setDoc(
          doc(db, 'users', auth.currentUser.uid),
          updatedProfile,
          { merge: true }
        );

        // Save to localStorage
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));

        onProfileUpdate(updatedProfile);
        
        // Show success feedback
        setSaveSuccess(true);
        
        // Delay showing modal to allow animation
        setTimeout(() => {
          setShowSuccessModal(true);
        }, 800);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showMessage('Failed to save profile. Please try again.', 'error');
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDone = () => {
    setShowSuccessModal(false);
    setSaveSuccess(false);
    setIsEditing(false);
    onBack();
  };

  const handleContinueEditing = () => {
    setShowSuccessModal(false);
    setSaveSuccess(false);
    setIsEditing(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userProfile');
      showMessage('Logged out successfully!', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Logout error:', error);
      showMessage('Failed to logout. Please try again.', 'error');
    }
  };

  const handleCancel = () => {
    setName(userProfile?.name || '');
    setPhone(userProfile?.phone || '');
    setEmail(userProfile?.email || '');
    setAddress(userProfile?.address || '');
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <button onClick={onBack} className="text-emerald-600 hover:text-emerald-700 transition-colors">
          <i className="fa-solid fa-arrow-left text-xl"></i>
        </button>
        <h2 className="text-3xl font-bold text-gray-800">My Profile</h2>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`rounded-xl p-4 flex items-center space-x-3 animate-in slide-in-from-top duration-300 ${
          messageType === 'success'
            ? 'bg-emerald-50 border border-emerald-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <i className={`fa-solid ${messageType === 'success' ? 'fa-circle-check text-emerald-600' : 'fa-circle-exclamation text-red-600'}`}></i>
          <p className={`font-medium ${messageType === 'success' ? 'text-emerald-900' : 'text-red-900'}`}>
            {message}
          </p>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <i className="fa-solid fa-user text-4xl"></i>
            </div>
            <div>
              <p className="text-emerald-50 text-sm font-medium uppercase tracking-wide">Welcome,</p>
              <h3 className="text-3xl font-bold mt-1">{name || 'User'}</h3>
              {email && <p className="text-emerald-100 text-sm mt-1">{email}</p>}
            </div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 space-y-2">
          <div className="flex items-center space-x-3">
            <i className="fa-solid fa-phone text-emerald-100 w-5"></i>
            <span className="text-sm text-emerald-50">{phone || 'No phone number'}</span>
          </div>
          <div className="flex items-center space-x-3">
            <i className="fa-solid fa-map-pin text-emerald-100 w-5"></i>
            <span className="text-sm text-emerald-50">{address || 'No address set'}</span>
          </div>
        </div>
      </div>

      {/* Edit Button */}
      {!isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <i className="fa-solid fa-pen"></i>
          <span>Edit Profile</span>
        </button>
      )}

      {/* Edit Form */}
      {isEditing && !saveSuccess && (
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 space-y-5 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-1 h-6 bg-blue-600 rounded"></div>
            <h3 className="text-lg font-bold text-gray-800">Edit Your Information</h3>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
              <i className="fa-solid fa-user text-blue-500"></i>
              <span>Full Name</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full p-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-base font-medium transition-all"
            />
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
              <i className="fa-solid fa-phone text-blue-500"></i>
              <span>Phone Number</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="w-full p-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-base font-medium transition-all"
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
              <i className="fa-solid fa-envelope text-blue-500"></i>
              <span>Email Address (Optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full p-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-base font-medium transition-all"
            />
          </div>

          {/* Address Field */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
              <i className="fa-solid fa-map-pin text-blue-500"></i>
              <span>Service Address</span>
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your service address"
              rows={3}
              className="w-full p-4 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-base font-medium transition-all resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50"
            >
              <i className="fa-solid fa-times"></i>
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 active:scale-95"
            >
              {isSaving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Save Success State */}
      {isEditing && saveSuccess && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-sm border border-emerald-200 p-8 animate-in slide-in-from-bottom duration-300">
          <div className="text-center space-y-6">
            {/* Success Checkmark */}
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                <i className="fa-solid fa-check text-white text-4xl"></i>
              </div>
            </div>
            
            {/* Success Message */}
            <div>
              <h3 className="text-2xl font-bold text-emerald-900 mb-2">Changes Saved!</h3>
              <p className="text-emerald-700">Your profile has been updated successfully</p>
            </div>

            {/* Done Button */}
            <button
              onClick={() => setShowSuccessModal(true)}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-4 px-6 rounded-xl transition-all active:scale-95 shadow-md"
            >
              <i className="fa-solid fa-chevron-right"></i>
              <span>View Details</span>
            </button>
          </div>
        </div>
      )}

      {/* Account Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-1 h-6 bg-red-600 rounded"></div>
          <h3 className="text-lg font-bold text-gray-800">Account</h3>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <i className="fa-solid fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>

        {/* User ID */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">User ID</p>
          <p className="font-mono text-xs text-gray-600 break-all">{auth.currentUser?.uid || 'Not available'}</p>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-sign-out-alt text-red-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Logout Confirmation</h3>
              <p className="text-gray-600 text-sm">Are you sure you want to logout? You'll need to login again to access your profile and requests.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-all"
              >
                <i className="fa-solid fa-times"></i>
                <span>Cancel</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-95"
              >
                <i className="fa-solid fa-sign-out-alt"></i>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal - Profile Updated */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-200">
            {/* Success Icon */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                <i className="fa-solid fa-check text-white text-3xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Profile Updated!</h3>
              <p className="text-gray-600 text-sm">Your changes have been saved successfully</p>
            </div>

            {/* Updated Profile Summary */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 mb-6 space-y-3">
              <div className="flex items-start space-x-3">
                <i className="fa-solid fa-user text-emerald-600 w-5 mt-0.5"></i>
                <div className="flex-1">
                  <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide mb-1">Name</p>
                  <p className="text-gray-800 font-semibold">{name}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <i className="fa-solid fa-phone text-emerald-600 w-5 mt-0.5"></i>
                <div className="flex-1">
                  <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide mb-1">Phone</p>
                  <p className="text-gray-800 font-semibold">{phone}</p>
                </div>
              </div>
              {email && (
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-envelope text-emerald-600 w-5 mt-0.5"></i>
                  <div className="flex-1">
                    <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide mb-1">Email</p>
                    <p className="text-gray-800 font-semibold">{email}</p>
                  </div>
                </div>
              )}
              {address && (
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-map-pin text-emerald-600 w-5 mt-0.5"></i>
                  <div className="flex-1">
                    <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide mb-1">Address</p>
                    <p className="text-gray-800 font-semibold">{address}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleDone}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-4 px-6 rounded-xl transition-all active:scale-95 shadow-md"
              >
                <i className="fa-solid fa-home"></i>
                <span>Done - Back to Home</span>
              </button>
              <button
                onClick={handleContinueEditing}
                className="w-full flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl transition-all"
              >
                <i className="fa-solid fa-pen"></i>
                <span>Continue Editing</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
