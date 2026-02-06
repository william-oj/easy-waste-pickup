import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import CollectorProfile from './CollectorProfile.tsx';

interface Request {
  id: string;
  address: string;
  wasteType: string;
  status: 'pending' | 'accepted' | 'completed';
  acceptedBy?: string;
  collectorPhone?: string;
  collectorId?: string;
  acceptedAt?: any;
  completedAt?: any;
  createdAt?: any;
  userName?: string;
  userPhone?: string;
}

const CollectorDashboard: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [collectorName, setCollectorName] = useState('');
  const [collectorPhone, setCollectorPhone] = useState('');
  const [activeTab, setActiveTab] = useState<'jobs' | 'history' | 'profile'>('jobs');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch collector profile on mount
  useEffect(() => {
    const fetchCollectorProfile = async () => {
      if (auth.currentUser) {
        const collectorDoc = await getDoc(doc(db, 'collectors', auth.currentUser.uid));
        if (collectorDoc.exists()) {
          const data: any = collectorDoc.data();
          setCollectorName(data.name || '');
          setCollectorPhone(data.phone || '');
        }
      }
    };
    fetchCollectorProfile();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'requests'), (snapshot) => {
      const reqs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Request));
      setRequests(reqs);
    });
    return unsubscribe;
  }, []);

  const acceptRequest = async (id: string) => {
    if (!collectorName || !collectorPhone || !auth.currentUser) {
      alert('Please complete your profile first.');
      setActiveTab('profile');
      return;
    }
    setActionLoading(id);
    try {
      await updateDoc(doc(db, 'requests', id), {
        status: 'accepted',
        acceptedBy: collectorName,
        collectorPhone: collectorPhone,
        collectorId: auth.currentUser.uid,
        acceptedAt: new Date()
      });
    } catch (error) {
      alert('Failed to accept job. Try again.');
    }
    setActionLoading(null);
  };

  const markComplete = async (id: string) => {
    if (!auth.currentUser) return;
    setActionLoading(id);
    try {
      await updateDoc(doc(db, 'requests', id), {
        status: 'completed',
        completedAt: new Date()
      });
    } catch (error) {
      alert('Failed to complete job. Try again.');
    }
    setActionLoading(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      alert('Logout failed: ' + err.message);
    }
  };

  const uid = auth.currentUser?.uid;
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const activeRequests = requests.filter(r => r.status === 'accepted' && r.collectorId === uid);
  const completedRequests = requests.filter(r => r.status === 'completed' && r.collectorId === uid);

  const formatTime = (ts: any) => {
    if (!ts) return 'Just now';
    try {
      const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      const now = new Date();
      const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen w-full sm:max-w-md sm:mx-auto bg-slate-50 flex flex-col">
      {/* Header - Glassmorphism style */}
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-4 pt-6 pb-20 relative overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 animate-pulse" style={{animationDelay: '1s'}}></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <i className="fa-solid fa-truck text-xl"></i>
              </div>
              <div>
                <p className="text-blue-100 text-xs font-medium">{getGreeting()}</p>
                <h1 className="text-lg font-bold">{collectorName || 'Collector'}</h1>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 hover:bg-white/30 transition-all active:scale-95"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex space-x-3 mt-6">
            <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-2xl p-3 border border-white/30">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-bell text-amber-900 text-sm"></i>
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingRequests.length}</p>
                  <p className="text-xs text-blue-100">Available</p>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-2xl p-3 border border-white/30">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-motorcycle text-blue-900 text-sm"></i>
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeRequests.length}</p>
                  <p className="text-xs text-blue-100">Active</p>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-2xl p-3 border border-white/30">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-check text-emerald-900 text-sm"></i>
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedRequests.length}</p>
                  <p className="text-xs text-blue-100">Done</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation - Floating Card */}
      <div className="px-4 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl shadow-lg p-1.5 flex">
          {[
            { id: 'jobs', label: 'Jobs', icon: 'fa-briefcase' },
            { id: 'history', label: 'History', icon: 'fa-clock-rotate-left' },
            { id: 'profile', label: 'Profile', icon: 'fa-user' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        {activeTab === 'profile' ? (
          <div className="animate-in fade-in slide-in-from-right duration-300">
            <CollectorProfile />
          </div>
        ) : activeTab === 'history' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
            <h2 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
              <i className="fa-solid fa-trophy text-amber-500"></i>
              <span>Completed Jobs</span>
            </h2>
            {completedRequests.length === 0 ? (
              <EmptyState
                icon="fa-medal"
                title="No completed jobs yet"
                subtitle="Complete your first pickup to see it here"
              />
            ) : (
              <div className="space-y-3">
                {completedRequests.map((req, index) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <i className="fa-solid fa-check text-emerald-600"></i>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{req.address}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{req.wasteType}</p>
                          <p className="text-xs text-emerald-600 mt-1 font-medium">
                            <i className="fa-solid fa-clock mr-1"></i>
                            {formatTime(req.completedAt)}
                          </p>
                        </div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-lg">
                        Done
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            {/* Active Jobs Section */}
            {activeRequests.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  <span>In Progress</span>
                </h2>
                <div className="space-y-3">
                  {activeRequests.map((req, index) => (
                    <JobCard
                      key={req.id}
                      request={req}
                      type="active"
                      onAction={() => markComplete(req.id)}
                      isLoading={actionLoading === req.id}
                      isExpanded={expandedCard === req.id}
                      onToggle={() => setExpandedCard(expandedCard === req.id ? null : req.id)}
                      formatTime={formatTime}
                      animationDelay={index * 50}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Available Jobs Section */}
            <section>
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                <span>Available Pickups ({pendingRequests.length})</span>
              </h2>
              {pendingRequests.length === 0 ? (
                <EmptyState
                  icon="fa-inbox"
                  title="All caught up!"
                  subtitle="No pickup requests at the moment"
                />
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req, index) => (
                    <JobCard
                      key={req.id}
                      request={req}
                      type="pending"
                      onAction={() => acceptRequest(req.id)}
                      isLoading={actionLoading === req.id}
                      isExpanded={expandedCard === req.id}
                      onToggle={() => setExpandedCard(expandedCard === req.id ? null : req.id)}
                      formatTime={formatTime}
                      animationDelay={index * 50}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

// Job Card Component
interface JobCardProps {
  request: Request;
  type: 'pending' | 'active';
  onAction: () => void;
  isLoading: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  formatTime: (ts: any) => string;
  animationDelay: number;
}

const JobCard: React.FC<JobCardProps> = ({
  request,
  type,
  onAction,
  isLoading,
  isExpanded,
  onToggle,
  formatTime,
  animationDelay
}) => {
  const isPending = type === 'pending';

  const getWasteIcon = (wasteType: string) => {
    const lower = wasteType.toLowerCase();
    if (lower.includes('recycl')) return 'fa-recycle';
    if (lower.includes('yard') || lower.includes('garden')) return 'fa-leaf';
    if (lower.includes('bulk') || lower.includes('furniture')) return 'fa-couch';
    return 'fa-trash';
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom ${
        isPending ? 'border-amber-200' : 'border-blue-200'
      }`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Card Header - Clickable */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-start space-x-3 text-left"
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isPending ? 'bg-amber-100' : 'bg-blue-100'
        }`}>
          <i className={`fa-solid ${getWasteIcon(request.wasteType)} text-lg ${
            isPending ? 'text-amber-600' : 'text-blue-600'
          }`}></i>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-bold text-gray-800 truncate pr-2">{request.address}</p>
            <span className={`text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap ${
              isPending
                ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {isPending ? 'New' : 'Active'}
            </span>
          </div>
          <p className="text-sm text-gray-500">{request.wasteType}</p>
          <p className="text-xs text-gray-400 mt-1 flex items-center">
            <i className="fa-solid fa-clock mr-1"></i>
            {formatTime(request.createdAt || request.acceptedAt)}
          </p>
        </div>
        <i className={`fa-solid fa-chevron-down text-gray-400 transition-transform duration-300 ${
          isExpanded ? 'rotate-180' : ''
        }`}></i>
      </button>

      {/* Expandable Content */}
      <div className={`overflow-hidden transition-all duration-300 ${
        isExpanded ? 'max-h-96' : 'max-h-0'
      }`}>
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          {/* Customer Info */}
          {request.userName && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Customer</p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {request.userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{request.userName}</p>
                  {request.userPhone && request.userPhone !== 'Not provided' && (
                    <a
                      href={`tel:${request.userPhone}`}
                      className="text-sm text-blue-600 flex items-center space-x-1"
                    >
                      <i className="fa-solid fa-phone text-xs"></i>
                      <span>{request.userPhone}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {isPending ? (
              <button
                onClick={(e) => { e.stopPropagation(); onAction(); }}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/30"
              >
                {isLoading ? (
                  <i className="fa-solid fa-spinner fa-spin"></i>
                ) : (
                  <>
                    <i className="fa-solid fa-hand"></i>
                    <span>Accept Job</span>
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onAction(); }}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/30"
                >
                  {isLoading ? (
                    <i className="fa-solid fa-spinner fa-spin"></i>
                  ) : (
                    <>
                      <i className="fa-solid fa-flag-checkered"></i>
                      <span>Complete</span>
                    </>
                  )}
                </button>
                {request.userPhone && request.userPhone !== 'Not provided' && (
                  <a
                    href={`sms:${request.userPhone}?body=Hi! I'm on my way for your waste pickup.`}
                    className="w-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all active:scale-95"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <i className="fa-solid fa-message text-gray-600"></i>
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState: React.FC<{ icon: string; title: string; subtitle: string }> = ({
  icon,
  title,
  subtitle
}) => (
  <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center animate-in fade-in duration-500">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <i className={`fa-solid ${icon} text-2xl text-gray-400`}></i>
    </div>
    <p className="font-semibold text-gray-700">{title}</p>
    <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
  </div>
);

export default CollectorDashboard;
