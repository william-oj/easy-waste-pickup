import React, { useState, useEffect } from 'react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validatePhone = (phone: string): boolean => {
    return /^\d{10,}$/.test(phone.replace(/\D/g, ''));
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const generateEmailFromPhone = (phone: string): string => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `${cleanPhone}@phonenumber.local`;
  };

  const handleSignUp = async () => {
    setError('');

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
        await setDoc(doc(db, 'users', user.uid), {
          name: name.trim(),
          phone: phone,
          email: email || null,
          id: user.uid,
          createdAt: new Date(),
          userType: 'user'
        });
      } else {
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

  const features = [
    { icon: 'fa-truck', text: 'Fast pickup' },
    { icon: 'fa-recycle', text: 'Eco-friendly' },
    { icon: 'fa-clock', text: 'On-time service' },
  ];

  return (
    <div className="h-screen h-[100dvh] w-full max-w-full overflow-hidden bg-slate-900 flex flex-col">
      {/* Animated Background - Absolute instead of Fixed */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-slate-900 to-cyan-900"></div>

        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-emerald-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-0 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-0 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Content - Scrollable */}
      <div className={`relative z-10 flex-1 flex flex-col px-5 ${mode === 'signup' ? 'py-3' : 'py-4'} overflow-y-auto`}>
        {/* Logo Section - Minimal for Signup */}
        {mode === 'login' ? (
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-2xl mb-3 shadow-xl shadow-emerald-500/30">
              <i className="fa-solid fa-leaf text-2xl text-white"></i>
            </div>
            <h1 className="text-2xl font-black text-white mb-1 tracking-tight">
              Easy<span className="text-emerald-400">Waste</span>
            </h1>
            <p className="text-slate-400 text-xs">Smart waste management</p>
          </div>
        ) : (
          <div className="text-center mb-2">
            <h1 className="text-xl font-black text-white tracking-tight flex items-center justify-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <i className="fa-solid fa-leaf text-sm text-white"></i>
              </div>
              <span>Easy<span className="text-emerald-400">Waste</span></span>
            </h1>
          </div>
        )}

        {/* Auth Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {/* User Type Toggle */}
          <div className="p-3 border-b border-white/10">
            <div className="flex p-1 bg-slate-800/50 rounded-xl">
              <button
                onClick={() => { setUserType('user'); resetForm(); }}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  userType === 'user'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <i className="fa-solid fa-house text-xs"></i>
                <span>Resident</span>
              </button>
              <button
                onClick={() => { setUserType('collector'); resetForm(); }}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  userType === 'collector'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <i className="fa-solid fa-truck text-xs"></i>
                <span>Collector</span>
              </button>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="px-4 pt-3">
            <div className="flex space-x-4 border-b border-white/10">
              <button
                onClick={() => { setMode('login'); resetForm(); }}
                className={`pb-2.5 px-1 font-semibold text-sm transition-all relative ${
                  mode === 'login' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Sign In
                {mode === 'login' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => { setMode('signup'); resetForm(); }}
                className={`pb-2.5 px-1 font-semibold text-sm transition-all relative ${
                  mode === 'signup' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Create Account
                {mode === 'signup' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"></div>
                )}
              </button>
            </div>
          </div>

          {/* Form */}
          <div className={`p-4 ${mode === 'signup' ? 'space-y-2' : 'space-y-3'}`}>
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center space-x-3 animate-in shake duration-300">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-exclamation text-red-400"></i>
                </div>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Name Field - Signup Only */}
            {mode === 'signup' && (
              <div className="space-y-1 animate-in fade-in slide-in-from-left duration-300">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                <div className={`flex items-center bg-slate-800/50 rounded-xl border-2 transition-all ${
                  focusedField === 'name' ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-transparent'
                }`}>
                  <div className="pl-4">
                    <i className={`fa-solid fa-user text-sm ${focusedField === 'name' ? 'text-emerald-400' : 'text-slate-500'}`}></i>
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="William O'Rivers"
                    className="flex-1 bg-transparent text-white placeholder-slate-500 py-3 pr-3 focus:outline-none text-sm"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Phone Field */}
            <div className={`${mode === 'signup' ? 'space-y-1' : 'space-y-2'}`}>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone Number</label>
              <div className={`flex items-center bg-slate-800/50 rounded-xl border-2 transition-all ${
                focusedField === 'phone' ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-transparent'
              }`}>
                <div className="pl-4">
                  <i className={`fa-solid fa-phone text-sm ${focusedField === 'phone' ? 'text-emerald-400' : 'text-slate-500'}`}></i>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter phone number"
                  className="flex-1 bg-transparent text-white placeholder-slate-500 py-3 pr-3 focus:outline-none text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Field - Signup Only */}
            {mode === 'signup' && (
              <div className="space-y-1 animate-in fade-in slide-in-from-left duration-300" style={{ animationDelay: '100ms' }}>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Email <span className="text-slate-600">(Optional)</span>
                </label>
                <div className={`flex items-center bg-slate-800/50 rounded-xl border-2 transition-all ${
                  focusedField === 'email' ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-transparent'
                }`}>
                  <div className="pl-4">
                    <i className={`fa-solid fa-envelope text-sm ${focusedField === 'email' ? 'text-emerald-400' : 'text-slate-500'}`}></i>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="your@email.com"
                    className="flex-1 bg-transparent text-white placeholder-slate-500 py-3 pr-3 focus:outline-none text-sm"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div className={`${mode === 'signup' ? 'space-y-1' : 'space-y-2'}`}>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <div className={`flex items-center bg-slate-800/50 rounded-xl border-2 transition-all ${
                focusedField === 'password' ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-transparent'
              }`}>
                <div className="pl-4">
                  <i className={`fa-solid fa-lock text-sm ${focusedField === 'password' ? 'text-emerald-400' : 'text-slate-500'}`}></i>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-white placeholder-slate-500 py-3 focus:outline-none text-sm"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pr-4 text-slate-500 hover:text-emerald-400 transition-colors"
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
              </div>
            </div>

            {/* Confirm Password - Signup Only */}
            {mode === 'signup' && (
              <div className="space-y-1 animate-in fade-in slide-in-from-left duration-300" style={{ animationDelay: '200ms' }}>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirm Password</label>
                <div className={`flex items-center bg-slate-800/50 rounded-xl border-2 transition-all ${
                  focusedField === 'confirm' ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-transparent'
                }`}>
                  <div className="pl-4">
                    <i className={`fa-solid fa-shield-halved text-sm ${focusedField === 'confirm' ? 'text-emerald-400' : 'text-slate-500'}`}></i>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    className="flex-1 bg-transparent text-white placeholder-slate-500 py-3 pr-3 focus:outline-none text-sm"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={mode === 'login' ? handleLogin : handleSignUp}
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
                userType === 'user'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-blue-500/30'
              }`}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <>
                  <i className={`fa-solid ${mode === 'login' ? 'fa-arrow-right' : 'fa-user-plus'}`}></i>
                  <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                </>
              )}
            </button>

            {/* Demo Credentials */}
            {mode === 'login' && (
              <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 animate-in fade-in duration-500">
                <div className="flex items-center space-x-2 mb-1.5">
                  <i className="fa-solid fa-lightbulb text-amber-400 text-xs"></i>
                  <span className="text-xs font-semibold text-slate-400">Demo Credentials</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-700/50 rounded-lg px-2.5 py-1.5">
                    <p className="text-slate-500 text-[10px]">Phone</p>
                    <p className="text-white font-mono">1234567890</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg px-2.5 py-1.5">
                    <p className="text-slate-500 text-[10px]">Password</p>
                    <p className="text-white font-mono">123456</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Only show on login */}
        {mode === 'login' && (
          <div className="text-center mt-4 animate-in fade-in duration-700" style={{ animationDelay: '400ms' }}>
            <p className="text-slate-500 text-xs">
              &copy; {new Date().getFullYear()} EcoSmart Systems
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
