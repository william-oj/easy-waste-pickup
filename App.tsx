import React, { useState, useEffect } from 'react';
import { AppView, LocationData } from './types';
import Home from './components/Home';
import BulkyPickup from './components/BulkyPickup';
import ReportProblem from './components/ReportProblem';
import WasteChat from './components/WasteChat';
import { format } from 'date-fns';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import CollectorLogin from './components/CollectorLogin';
import CollectorDashboard from './components/CollectorDashboard';
import MyRequests from './components/MyRequests';
import UserProfilePage from './components/UserProfilePage';
import { getUserProfile, UserProfile } from './services/userProfileService';
import AuthPage from './components/AuthPage';

const GEMINI_API_KEY =
  (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim() ?? '';

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model: GenerativeModel | null = genAI
  ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  : null;

const generateContent = async (contents: any) => {
  try {
    if (!model) {
      return { candidates: [{ content: { parts: [{ text: 'AI is disabled. Missing API key.' }] } }] };
    }
    const result = await model.generateContent({ contents });
    return result.response;
  } catch (error) {
    console.error('Gemini error:', error);
    return { candidates: [{ content: { parts: [{ text: 'Error generating response.' }] } }] };
  }
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [location, setLocation] = useState<LocationData>({ address: '' });
  const [isCollectorLoggedIn, setIsCollectorLoggedIn] = useState(false);
  const [userType, setUserType] = useState<'user' | 'collector' | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Check if user is a collector by querying Firestore
        try {
          const collectorDoc = await getDoc(doc(db, 'collectors', user.uid));
          if (collectorDoc.exists()) {
            setUserType('collector');
            setIsCollectorLoggedIn(true);
            setCurrentView(AppView.COLLECTOR);
          } else {
            setUserType('user');
            setIsCollectorLoggedIn(false);
            setCurrentView(AppView.HOME);
            // Load user profile when logged in as regular user
            const profile = await getUserProfile();
            setUserProfile(profile);
          }
        } catch (error) {
          console.error('Error checking user type:', error);
          setUserType('user');
          setIsCollectorLoggedIn(false);
        }
      } else {
        setUserType(null);
        setIsCollectorLoggedIn(false);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Try to get geolocation on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            address: "Your Current Location",
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log("Geolocation error:", error)
      );
    }
  }, []);

  const renderView = () => {
    switch (currentView) {
      case AppView.REGULAR:
        // Inlined RegularPickup with calendar + Firebase submit
        return (
          <RegularPickupView
            location={location}
            generateContent={generateContent}
            onBack={() => setCurrentView(AppView.HOME)}
            userProfile={userProfile}
            onNavigate={setCurrentView}
          />
        );
      case AppView.BULKY:
        return <BulkyPickup onBack={() => setCurrentView(AppView.HOME)} location={location} />;
      case AppView.REPORT:
        return <ReportProblem onBack={() => setCurrentView(AppView.HOME)} location={location} />;
      case AppView.CHAT:
        return <WasteChat onBack={() => setCurrentView(AppView.HOME)} location={location} />;
      case AppView.MY_REQUESTS:
        return <MyRequests onBack={() => setCurrentView(AppView.HOME)} />;
      case AppView.PROFILE:
        return (
          <UserProfilePage
            userProfile={userProfile}
            onBack={() => setCurrentView(AppView.HOME)}
            onProfileUpdate={setUserProfile}
            onLocationChange={setLocation}
          />
        );
      default:
        return null;
    }
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-600 flex items-center justify-center">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-white mb-4"></i>
          <p className="text-white text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!currentUser) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  // Render full-screen views without wrapper (they have their own headers)
  if (currentView === AppView.HOME) {
    return <Home onNavigate={setCurrentView} location={location} onLocationChange={setLocation} onProfileClick={() => setCurrentView(AppView.PROFILE)} />;
  }

  if (currentView === AppView.COLLECTOR) {
    return isCollectorLoggedIn ? <CollectorDashboard /> : <CollectorLogin />;
  }

  // Render other views with the standard wrapper
  return (
    <div className="min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white px-4 py-4 shadow-md shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentView(AppView.HOME)}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 hover:bg-white/30 transition-all active:scale-95"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <h1 className="text-lg font-bold">
              {currentView === AppView.REGULAR && 'Schedule Pickup'}
              {currentView === AppView.BULKY && 'Bulky Items'}
              {currentView === AppView.REPORT && 'Report Issue'}
              {currentView === AppView.CHAT && 'AI Assistant'}
              {currentView === AppView.MY_REQUESTS && 'My Requests'}
              {currentView === AppView.PROFILE && 'My Profile'}
            </h1>
          </div>
          <button
            onClick={() => setCurrentView(AppView.HOME)}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 hover:bg-white/30 transition-all active:scale-95"
          >
            <i className="fa-solid fa-house"></i>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 bg-slate-50">
        {renderView()}
      </main>
    </div>
  );
};

// Extracted RegularPickupView component (with Firebase submit and calendar)
const RegularPickupView: React.FC<{ 
  location: LocationData; 
  generateContent: any; 
  onBack: () => void;
  userProfile: UserProfile | null;
  onNavigate: (view: AppView) => void;
}> = ({ location, generateContent, onBack, userProfile, onNavigate }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduleResponse, setScheduleResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [wasteTypes, setWasteTypes] = useState<string[]>(['General Trash']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<'one-time' | 'recurring'>('one-time');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  const checkSchedule = async () => {
    setLoading(true);
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');

    try {
      const response = await generateContent([
        {
          parts: [
            {
              text: `Simulate a waste pickup schedule for ${formattedDate} at address "${location.address || 'default location'}". Is it available? Generate a friendly reminder message including the day of the week and tips.`
            }
          ]
        }
      ]);

      const aiReply = response.candidates[0].content.parts[0].text;
      setScheduleResponse(aiReply);
    } catch (error) {
      setScheduleResponse('Error checking schedule. Try again!');
    } finally {
      setLoading(false);
    }
  };

  // Load recurring schedules
  useEffect(() => {
    const loadSchedules = async () => {
      if (!userProfile?.id) return;
      const schedulesRef = collection(db, 'users', userProfile.id, 'schedules');
      const unsubscribe = onSnapshot(schedulesRef, (snapshot) => {
        const schedulesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setSchedules(schedulesData);
        checkAndSendReminders(schedulesData);
      });
      return unsubscribe;
    };
    loadSchedules();
  }, [userProfile?.id]);

  // Check for upcoming pickups and send reminders
  const checkAndSendReminders = (schedulesData: any[]) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayDay = today.getDay();
    const tomorrowDay = tomorrow.getDay();

    schedulesData.forEach(schedule => {
      if (!schedule.enabled) return;
      const lastReminder = schedule.lastReminderDate ? new Date(schedule.lastReminderDate) : null;
      const today_str = format(today, 'yyyy-MM-dd');
      
      // Check if already reminded today
      if (lastReminder && format(lastReminder, 'yyyy-MM-dd') === today_str) return;

      // Reminder 1 day before
      if (schedule.daysOfWeek.includes(tomorrowDay)) {
        showReminder(
          `Reminder: Pickup Tomorrow!`,
          `Don't forget! Your ${schedule.wasteTypes.join(', ')} pickup is scheduled for tomorrow.`,
          schedule.id,
          'tomorrow'
        );
      }

      // Reminder on the day
      if (schedule.daysOfWeek.includes(todayDay)) {
        showReminder(
          `Pickup Day Today!`,
          `Today is your ${schedule.wasteTypes.join(', ')} pickup day. Make sure bins are ready!`,
          schedule.id,
          'today'
        );
      }
    });
  };

  const showReminder = async (title: string, message: string, scheduleId: string, type: 'today' | 'tomorrow') => {
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/favicon.ico' });
    }

    // Update last reminder sent date
    if (userProfile?.id) {
      const scheduleRef = doc(db, 'users', userProfile.id, 'schedules', scheduleId);
      await updateDoc(scheduleRef, { lastReminderDate: new Date() });
    }
  };

  const toggleWasteType = (type: string) => {
    if (allowMultiple) {
      setWasteTypes(prev =>
        prev.includes(type)
          ? prev.filter(t => t !== type)
          : [...prev, type]
      );
    } else {
      setWasteTypes([type]);
    }
  };

  const submitRequest = async () => {
    if (wasteTypes.length === 0) {
      alert('Please select at least one waste type.');
      return;
    }
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'requests'), {
        address: location.address || 'Unknown',
        latitude: location.lat,
        longitude: location.lng,
        wasteType: allowMultiple ? wasteTypes.join(', ') : wasteTypes[0],
        wasteTypes: wasteTypes,
        status: 'pending',
        createdAt: new Date(),
        view: 'regular',
        userName: userProfile?.name || 'Anonymous',
        userPhone: userProfile?.phone || 'Not provided'
      });
      // Navigate to My Requests instead of alert
      onNavigate(AppView.MY_REQUESTS);
    } catch (error) {
      console.error('Firebase error:', error);
      alert('Failed to send request. Check console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  const saveRecurringSchedule = async () => {
    if (wasteTypes.length === 0) {
      alert('Please select at least one waste type.');
      return;
    }
    if (selectedDays.length === 0) {
      alert('Please select at least one day of the week.');
      return;
    }
    if (!userProfile?.id) {
      alert('Please update your profile first.');
      return;
    }

    setSubmitting(true);
    try {
      const schedulesRef = collection(db, 'users', userProfile.id, 'schedules');
      await addDoc(schedulesRef, {
        address: location.address || 'Unknown',
        latitude: location.lat,
        longitude: location.lng,
        wasteTypes: wasteTypes,
        daysOfWeek: selectedDays,
        enabled: true,
        createdAt: new Date(),
        lastReminderDate: null,
        userId: userProfile.id,
        userName: userProfile.name || 'Anonymous'
      });
      alert('Recurring schedule created! You will receive reminders on those days.');
      setSelectedDays([]);
      setWasteTypes(['General Trash']);
      setScheduleTab('one-time');
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule. Check console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!userProfile?.id) return;
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      const scheduleRef = doc(db, 'users', userProfile.id, 'schedules', scheduleId);
      await updateDoc(scheduleRef, { enabled: false });
      alert('Schedule disabled.');
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule.');
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <button onClick={onBack} className="text-emerald-600 hover:text-emerald-700 transition-colors">
          <i className="fa-solid fa-arrow-left text-xl"></i>
        </button>
        <h2 className="text-2xl font-bold text-gray-800">My Collection Schedule</h2>
      </div>

      {/* Location Card */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <i className="fa-solid fa-location-dot text-2xl"></i>
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-emerald-50 uppercase tracking-wide mb-1">Service Location</p>
            <p className="text-lg font-bold">{location.address || 'Set your address in settings'}</p>
          </div>
        </div>
      </div>
      
      {/* Check Schedule Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-emerald-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-calendar-days text-white"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-800">Check Schedule</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Find out when your next pickup is scheduled</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
              <i className="fa-solid fa-calendar text-emerald-500"></i>
              <span>Select Date</span>
            </label>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="w-full p-4 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none text-lg font-medium transition-all"
            />
          </div>

          <button
            onClick={checkSchedule}
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-95"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Checking Schedule...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-search"></i>
                <span>Check This Date</span>
              </>
            )}
          </button>

          {scheduleResponse && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-l-4 border-emerald-500 p-5 rounded-xl animate-in slide-in-from-top duration-300">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-circle-info text-white"></i>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-emerald-900 mb-1">Schedule Information</p>
                  <p className="text-gray-700 text-sm leading-relaxed">{scheduleResponse}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Request Pickup Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-emerald-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-truck text-white"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Request Pickup</h3>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2 mb-4">Select the types of waste you need collected</p>
          
          {/* Tabs */}
          <div className="flex space-x-2">
            <button
              onClick={() => setScheduleTab('one-time')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                scheduleTab === 'one-time'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <i className="fa-solid fa-calendar-check"></i>
              <span>One-Time Request</span>
            </button>
            <button
              onClick={() => setScheduleTab('recurring')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                scheduleTab === 'recurring'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <i className="fa-solid fa-repeat"></i>
              <span>Recurring Schedule</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {scheduleTab === 'one-time' ? (
            <>
              {/* One-Time Request Content */}
              {/* Multiple Services Checkbox */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="multipleServices"
                  checked={allowMultiple}
                  onChange={(e) => {
                    setAllowMultiple(e.target.checked);
                    if (!e.target.checked && wasteTypes.length > 1) {
                      setWasteTypes([wasteTypes[0]]);
                    }
                  }}
                  className="w-5 h-5 mt-0.5 cursor-pointer accent-blue-500"
                />
                <label htmlFor="multipleServices" className="flex-1 cursor-pointer">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Need more than one service?</p>
                  <p className="text-xs text-blue-700">Check this if you need multiple waste types collected in one pickup</p>
                </label>
              </div>

              {/* Waste Type Selector */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <i className="fa-solid fa-recycle text-emerald-500"></i>
                  <span>What needs to be collected?</span>
                  {allowMultiple && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">Multi-select enabled</span>}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: 'General Trash', icon: 'fa-trash', color: 'emerald' },
                    { type: 'Recycling', icon: 'fa-recycle', color: 'blue' },
                    { type: 'Yard Waste', icon: 'fa-leaf', color: 'green' },
                    { type: 'Other', icon: 'fa-box', color: 'gray' }
                  ].map((item) => {
                    const isSelected = wasteTypes.includes(item.type);
                    return (
                      <button
                        key={item.type}
                        onClick={() => toggleWasteType(item.type)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? `border-${item.color}-500 bg-${item.color}-50 shadow-md`
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? `bg-${item.color}-500 text-white`
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            <i className={`fa-solid ${item.icon}`}></i>
                          </div>
                          <div className="flex-1">
                            <p className={`font-semibold text-sm ${
                              isSelected ? 'text-gray-800' : 'text-gray-600'
                            }`}>
                              {item.type}
                            </p>
                          </div>
                          {isSelected && (
                            <i className="fa-solid fa-circle-check text-emerald-500"></i>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {!allowMultiple && wasteTypes.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                    <i className="fa-solid fa-lightbulb"></i>
                    <span>Enable "Multiple services" to select more than one option</span>
                  </p>
                )}
              </div>

              {/* Info Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
                <i className="fa-solid fa-circle-info text-blue-500 mt-1"></i>
                <div className="flex-1">
                  <p className="text-sm text-blue-900 font-medium mb-1">How it works</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Your request will be sent to nearby collectors. You'll be notified when someone accepts your pickup request.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                onClick={submitRequest}
                disabled={submitting || wasteTypes.length === 0}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-95"
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Sending Request...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane"></i>
                    <span>Request Pickup Now</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Recurring Schedule Content */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 flex items-start space-x-3">
                <i className="fa-solid fa-bell text-purple-500 mt-1"></i>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-purple-900 mb-1">Automatic Reminders</p>
                  <p className="text-xs text-purple-700">Get reminders 1 day before and on the day of your scheduled pickups</p>
                </div>
              </div>

              {/* Waste Type Selector */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <i className="fa-solid fa-recycle text-blue-500"></i>
                  <span>Waste Types</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: 'General Trash', icon: 'fa-trash', color: 'emerald' },
                    { type: 'Recycling', icon: 'fa-recycle', color: 'blue' },
                    { type: 'Yard Waste', icon: 'fa-leaf', color: 'green' },
                    { type: 'Other', icon: 'fa-box', color: 'gray' }
                  ].map((item) => {
                    const isSelected = wasteTypes.includes(item.type);
                    return (
                      <button
                        key={item.type}
                        onClick={() => {
                          setWasteTypes(prev =>
                            prev.includes(item.type)
                              ? prev.filter(t => t !== item.type)
                              : [...prev, item.type]
                          );
                        }}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? `border-${item.color}-500 bg-${item.color}-50 shadow-md`
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? `bg-${item.color}-500 text-white`
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            <i className={`fa-solid ${item.icon}`}></i>
                          </div>
                          <div className="flex-1">
                            <p className={`font-semibold text-sm ${
                              isSelected ? 'text-gray-800' : 'text-gray-600'
                            }`}>
                              {item.type}
                            </p>
                          </div>
                          {isSelected && (
                            <i className="fa-solid fa-circle-check text-emerald-500"></i>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Days of Week Selector */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <i className="fa-solid fa-calendar-days text-blue-500"></i>
                  <span>Schedule Pickups On</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(idx)}
                      className={`p-3 rounded-lg font-bold text-sm transition-all ${
                        selectedDays.includes(idx)
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDays.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-emerald-900 mb-2">Schedule Summary</p>
                  <p className="text-xs text-emerald-700">
                    <i className="fa-solid fa-check text-emerald-600 mr-2"></i>
                    {wasteTypes.join(', ')} on {selectedDays.map(idx => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][idx]).join(', ')}
                  </p>
                </div>
              )}

              {/* Save Button */}
              <button 
                onClick={saveRecurringSchedule}
                disabled={submitting || wasteTypes.length === 0 || selectedDays.length === 0}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-95"
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Creating Schedule...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-calendar-plus"></i>
                    <span>Create Recurring Schedule</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Active Schedules List */}
        {scheduleTab === 'recurring' && schedules.length > 0 && (
          <div className="border-t border-gray-100 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <i className="fa-solid fa-list text-blue-600"></i>
              <h4 className="text-lg font-bold text-gray-800">Your Schedules</h4>
            </div>
            <div className="space-y-3">
              {schedules.filter(s => s.enabled).map(schedule => (
                <div key={schedule.id} className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <i className="fa-solid fa-recycle text-blue-600"></i>
                        <p className="font-semibold text-gray-800">{schedule.wasteTypes.join(', ')}</p>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <i className="fa-solid fa-calendar-days text-gray-400 mr-2"></i>
                        Every {schedule.daysOfWeek.map(idx => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx]).join(', ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        <i className="fa-solid fa-map-pin text-gray-400 mr-2"></i>
                        {schedule.address}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteSchedule(schedule.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
