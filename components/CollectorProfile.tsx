import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const CollectorProfile: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | ''>('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'collectors', auth.currentUser.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data: any = snap.data();
        setName(data.name || '');
        setPhone(data.phone || '');
        setEmail(data.email || auth.currentUser.email || '');
      } else {
        setEmail(auth.currentUser.email || '');
      }
    };
    loadProfile();
  }, []);

  const saveProfile = async () => {
    if (!auth.currentUser) {
      setStatus('error');
      setStatusMessage('Not logged in');
      return;
    }
    if (!name.trim() || !phone.trim()) {
      setStatus('error');
      setStatusMessage('Name and phone are required');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      await setDoc(
        doc(db, 'collectors', auth.currentUser.uid),
        {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          updatedAt: new Date()
        },
        { merge: true }
      );
      setStatus('success');
      setStatusMessage('Profile saved successfully!');
    } catch (err: any) {
      setStatus('error');
      setStatusMessage('Save failed: ' + err.message);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setStatus('');
        setStatusMessage('');
      }, 3000);
    }
  };

  const isComplete = name.trim() && phone.trim();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
        <div className="relative z-10 flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 text-2xl font-bold">
            {name ? name.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <h2 className="text-xl font-bold">{name || 'Set your name'}</h2>
            <p className="text-blue-100 text-sm">{phone || 'Add phone number'}</p>
          </div>
        </div>
        {!isComplete && (
          <div className="mt-4 bg-amber-400/20 border border-amber-300/30 rounded-xl p-3 flex items-center space-x-2">
            <i className="fa-solid fa-exclamation-triangle text-amber-300"></i>
            <p className="text-sm text-amber-100">Complete your profile to accept jobs</p>
          </div>
        )}
      </div>

      {/* Status Message */}
      {status && (
        <div className={`rounded-xl p-4 flex items-center space-x-3 animate-in slide-in-from-top duration-200 ${
          status === 'success'
            ? 'bg-emerald-50 border border-emerald-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <i className={`fa-solid ${status === 'success' ? 'fa-check-circle text-emerald-600' : 'fa-exclamation-circle text-red-600'}`}></i>
          <p className={`text-sm font-medium ${status === 'success' ? 'text-emerald-800' : 'text-red-800'}`}>
            {statusMessage}
          </p>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center space-x-2">
            <i className="fa-solid fa-user-gear text-blue-600"></i>
            <span>Profile Details</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">This info helps users identify you</p>
        </div>

        <div className="p-4 space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
              <i className="fa-solid fa-user text-gray-400"></i>
              <span>Full Name</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all text-gray-800"
            />
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
              <i className="fa-solid fa-phone text-gray-400"></i>
              <span>Phone Number</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              type="tel"
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all text-gray-800"
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
              <i className="fa-solid fa-envelope text-gray-400"></i>
              <span>Email</span>
              <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              type="email"
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all text-gray-800"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={saveProfile}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-check"></i>
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tips Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-lightbulb text-white"></i>
          </div>
          <div>
            <p className="font-semibold text-blue-900 text-sm">Collector Tips</p>
            <ul className="text-xs text-blue-700 mt-2 space-y-1">
              <li className="flex items-center space-x-2">
                <i className="fa-solid fa-circle text-[4px]"></i>
                <span>Users can see your name and phone when you accept jobs</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fa-solid fa-circle text-[4px]"></i>
                <span>Keep your phone number updated for job notifications</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fa-solid fa-circle text-[4px]"></i>
                <span>Complete your profile to start accepting pickups</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectorProfile;
