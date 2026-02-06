import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [userType, setUserType] = useState<'user' | 'collector'>('user');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePhone = (phone: string): boolean => {
    return /^\d{10,}$/.test(phone.replace(/\D/g, ''));
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Email is optional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const generateEmailFromPhone = (phone: string): string => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `${cleanPhone}@phonenumber.local`;
  };

  const handleSignUp = async () => {
    setError('');
    
    // Validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!validatePhone(phone)) {
      setError('Please enter a valid phone number (at least 10 digits)');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address or leave it empty');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const generatedEmail = generateEmailFromPhone(phone);
      const userCredential = await createUserWithEmailAndPassword(auth, generatedEmail, password);
      const user = userCredential.user;

      if (userType === 'user') {
        // Create user profile
        await setDoc(doc(db, 'users', user.uid), {
          name: name.trim(),
          phone: phone,
          email: email || null,
          id: user.uid,
          createdAt: new Date(),
          userType: 'user'
        });
      } else {
        // Create collector profile
        await setDoc(doc(db, 'collectors', user.uid), {
          name: name.trim(),
          phone: phone,
          email: email || null,
          id: user.uid,
          createdAt: new Date(),
          userType: 'collector'
        });
      }

      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');

    if (!validatePhone(phone)) {
      setError('Please enter a valid phone number (at least 10 digits)');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    try {
      const generatedEmail = generateEmailFromPhone(phone);
      await signInWithEmailAndPassword(auth, generatedEmail, password);
      onAuthSuccess();
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('Phone number not found. Please sign up first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPhone('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setError('');
  };

  return (
    <div className="min-h-screen w-full sm:max-w-md sm:mx-auto bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-600 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full -ml-48 -mb-48"></div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <i className="fa-solid fa-truck-fast text-emerald-600 text-2xl"></i>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Easy Waste Pickup</h1>
          <p className="text-emerald-100 text-sm">Smart waste management for your home</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          {/* User Type Toggle */}
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setUserType('user');
                resetForm();
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all text-sm ${
                userType === 'user'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <i className="fa-solid fa-home mr-2"></i>
              User
            </button>
            <button
              onClick={() => {
                setUserType('collector');
                resetForm();
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all text-sm ${
                userType === 'collector'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <i className="fa-solid fa-user-tie mr-2"></i>
              Collector
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setMode('login');
                resetForm();
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all text-sm ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <i className="fa-solid fa-sign-in-alt mr-2"></i>
              Login
            </button>
            <button
              onClick={() => {
                setMode('signup');
                resetForm();
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all text-sm ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <i className="fa-solid fa-user-plus mr-2"></i>
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3 animate-in slide-in-from-top duration-200">
              <i className="fa-solid fa-circle-exclamation text-red-600 mt-0.5"></i>
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Name Field - Sign Up Only */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <i className="fa-solid fa-user text-emerald-600"></i>
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none text-sm transition-all"
                  disabled={loading}
                />
              </div>
            )}

            {/* Phone Number Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <i className="fa-solid fa-phone text-emerald-600"></i>
                <span>Phone Number</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none text-sm transition-all"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">At least 10 digits required</p>
            </div>

            {/* Email Field - Sign Up Only & Optional */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <i className="fa-solid fa-envelope text-emerald-600"></i>
                  <span>Email Address <span className="text-gray-400 font-normal">(Optional)</span></span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com (optional)"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none text-sm transition-all"
                  disabled={loading}
                />
              </div>
            )}

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <i className="fa-solid fa-lock text-emerald-600"></i>
                <span>Password</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none text-sm transition-all"
                disabled={loading}
              />
              {mode === 'signup' && (
                <p className="text-xs text-gray-500">Must be at least 6 characters</p>
              )}
            </div>

            {/* Confirm Password - Sign Up Only */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <i className="fa-solid fa-lock text-emerald-600"></i>
                  <span>Confirm Password</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none text-sm transition-all"
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={mode === 'login' ? handleLogin : handleSignUp}
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-95"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>{mode === 'login' ? 'Logging in...' : 'Creating account...'}</span>
              </>
            ) : (
              <>
                <i className={`fa-solid ${mode === 'login' ? 'fa-sign-in-alt' : 'fa-user-plus'}`}></i>
                <span>{mode === 'login' ? 'Login' : 'Create Account'}</span>
              </>
            )}
          </button>

          {/* Info Card */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs text-blue-900">
              <i className="fa-solid fa-lightbulb text-blue-600 mr-2"></i>
              <span className="font-semibold">Demo credentials:</span>
            </p>
            <p className="text-xs text-blue-700 mt-2">
              Phone: <span className="font-mono">1234567890</span>
            </p>
            <p className="text-xs text-blue-700">
              Password: <span className="font-mono">123456</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-emerald-100 text-xs mt-6">
          &copy; {new Date().getFullYear()} EcoSmart Systems. Stay Clean, Stay Green.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
