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
  userName?: string;
  userPhone?: string;
}

const CollectorDashboard: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [collectorName, setCollectorName] = useState('');
  const [collectorPhone, setCollectorPhone] = useState('');
  const [tab, setTab] = useState<'requests' | 'profile'>('requests');

  // Fetch collector profile on mount
  useEffect(() => {
    const fetchCollectorProfile = async () => {
      if (auth.currentUser) {
        const collectorDoc = await getDoc(doc(db, 'collectors', auth.currentUser.uid));
        if (collectorDoc.exists()) {
          const data: any = collectorDoc.data();
          setCollectorName(data.name || '');
          setCollectorPhone(data.phone || '');
        } else {
          setCollectorName('');
          setCollectorPhone('');
        }
      }
    };
    fetchCollectorProfile();
  }, []);

  useEffect(() => {
    // Listen for real-time requests (all statuses)
    const unsubscribe = onSnapshot(collection(db, 'requests'), (snapshot) => {
      const reqs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Request));
      setRequests(reqs);
    });
    return unsubscribe;
  }, []);

  const acceptRequest = async (id: string) => {
    if (!collectorName || !collectorPhone || !auth.currentUser) {
      alert('Collector profile incomplete or not logged in. Please update your profile.');
      return;
    }
    await updateDoc(doc(db, 'requests', id), {
      status: 'accepted',
      acceptedBy: collectorName,
      collectorPhone: collectorPhone,
      collectorId: auth.currentUser.uid,
      acceptedAt: new Date()
    });
    alert('Job accepted! Contact user if needed.');
  };

  const markComplete = async (id: string) => {
    if (!auth.currentUser) {
      alert('Not logged in.');
      return;
    }
    const req = requests.find(r => r.id === id);
    if (!req) {
      alert('Request not found.');
      return;
    }
    if (req.collectorId !== auth.currentUser.uid) {
      alert('You are not authorized to mark this job complete.');
      return;
    }
    await updateDoc(doc(db, 'requests', id), {
      status: 'completed',
      completedAt: new Date()
    });
    alert('Marked as completed.');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert('Logged out successfully!');
    } catch (err: any) {
      alert('Logout failed: ' + err.message);
    }
  };

  // Derived lists (use collectorId)
  const uid = auth.currentUser?.uid;
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const activeRequests = requests.filter(r => r.status === 'accepted' && r.collectorId === uid);
  const completedRequests = requests.filter(r => r.status === 'completed' && r.collectorId === uid);

  const formatTs = (ts: any) => {
    if (!ts) return '—';
    try {
      if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
      return new Date(ts).toLocaleString();
    } catch {
      return String(ts);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white border-b border-emerald-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Title */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-user-tie text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Collector Mode</h1>
                {collectorName && (
                  <p className="text-xs text-gray-500">Welcome, {collectorName}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-all active:scale-95"
              >
                <i className="fa-solid fa-sign-out-alt"></i>
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => setTab('requests')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                tab === 'requests'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <i className="fa-solid fa-list-check"></i>
              <span>My Jobs</span>
            </button>
            <button
              onClick={() => setTab('profile')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                tab === 'profile'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <i className="fa-solid fa-user"></i>
              <span>Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {tab === 'profile' ? (
          <CollectorProfile />
        ) : (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Pending Requests</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">{pendingRequests.length}</p>
                  </div>
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-clock text-emerald-600 text-2xl"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Active Jobs</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{activeRequests.length}</p>
                  </div>
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-fire text-blue-600 text-2xl"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Completed</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{completedRequests.length}</p>
                  </div>
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-check-circle text-green-600 text-2xl"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Jobs */}
            {activeRequests.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-1 h-6 bg-blue-600 rounded"></div>
                  <h2 className="text-xl font-bold text-gray-800">Active Jobs</h2>
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                    {activeRequests.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {activeRequests.map(req => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      onMarkComplete={markComplete}
                      status="active"
                      formatTs={formatTs}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pending Requests */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-1 h-6 bg-emerald-600 rounded"></div>
                <h2 className="text-xl font-bold text-gray-800">Available Requests</h2>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                  {pendingRequests.length}
                </span>
              </div>
              {pendingRequests.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <i className="fa-solid fa-inbox text-gray-400 text-2xl"></i>
                  </div>
                  <p className="text-gray-600 font-medium">No pending requests</p>
                  <p className="text-gray-500 text-sm mt-1">Check back soon for new pickup requests!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {pendingRequests.map(req => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      onAccept={acceptRequest}
                      status="pending"
                      formatTs={formatTs}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Completed Jobs */}
            {completedRequests.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-1 h-6 bg-green-600 rounded"></div>
                  <h2 className="text-xl font-bold text-gray-800">Completed Jobs</h2>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                    {completedRequests.length}
                  </span>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {completedRequests.map(req => (
                    <div
                      key={req.id}
                      className="bg-white p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <i className="fa-solid fa-map-pin text-gray-400 text-sm"></i>
                            <p className="font-semibold text-gray-800">{req.address}</p>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <i className="fa-solid fa-trash text-gray-400"></i>
                            <p className="text-gray-600">{req.wasteType}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Completed: {formatTs(req.completedAt)}
                          </p>
                        </div>
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                          ✓ Done
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectorDashboard;

/**
 * RequestCard - Beautiful, interactive card for displaying request details
 * Includes user contact info and one-click actions
 */
interface RequestCardProps {
  request: Request;
  onAccept?: (id: string) => void;
  onMarkComplete?: (id: string) => void;
  status: 'pending' | 'active';
  formatTs: (ts: any) => string;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onAccept,
  onMarkComplete,
  status,
  formatTs
}) => {
  const isPending = status === 'pending';

  return (
    <div className={`rounded-xl overflow-hidden shadow-sm border transition-all hover:shadow-lg ${
      isPending
        ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200'
        : 'bg-gradient-to-br from-blue-50 to-white border-blue-200'
    }`}>
      {/* Header with status badge */}
      <div className="p-5 pb-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <i className="fa-solid fa-map-pin text-gray-400"></i>
              <p className="font-bold text-gray-800 text-lg">{request.address}</p>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-trash text-gray-400"></i>
              <p className="text-gray-600 text-sm">{request.wasteType}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
            isPending
              ? 'bg-emerald-200 text-emerald-700'
              : 'bg-blue-200 text-blue-700'
          }`}>
            {isPending ? '🔔 New' : '🚀 In Progress'}
          </div>
        </div>
      </div>

      {/* User Contact Info - Beautiful card */}
      {request.userName && (
        <div className="p-5 border-b border-gray-100 bg-white/50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Customer Details
          </p>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                {request.userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{request.userName}</p>
                <p className="text-xs text-gray-500">Customer</p>
              </div>
            </div>

            {request.userPhone && request.userPhone !== 'Not provided' && (
              <div className="flex items-center space-x-3 pl-13">
                <a
                  href={`tel:${request.userPhone}`}
                  className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                >
                  <i className="fa-solid fa-phone"></i>
                  <span>{request.userPhone}</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center space-x-2">
        <i className="fa-solid fa-calendar text-gray-400 text-sm"></i>
        <p className="text-xs text-gray-500">
          {isPending ? 'Posted' : 'Started'}: {formatTs(request.acceptedAt || request.completedAt)}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="p-5 space-y-2">
        {isPending && onAccept && (
          <button
            onClick={() => onAccept(request.id)}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3 rounded-lg transition-all active:scale-95 shadow-md"
          >
            <i className="fa-solid fa-check"></i>
            <span>Accept This Job</span>
          </button>
        )}

        {!isPending && onMarkComplete && (
          <>
            <button
              onClick={() => onMarkComplete(request.id)}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 rounded-lg transition-all active:scale-95 shadow-md"
            >
              <i className="fa-solid fa-flag-checkered"></i>
              <span>Mark Complete</span>
            </button>

            {request.userPhone && request.userPhone !== 'Not provided' && (
              <button
                onClick={() => window.location.href = `sms:${request.userPhone}?body=I'm on my way to collect your waste.`}
                className="w-full flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-all"
              >
                <i className="fa-solid fa-message"></i>
                <span>Send Update</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};