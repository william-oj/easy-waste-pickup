import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface Request {
  id: string;
  address: string;
  wasteType: string;
  status: 'pending' | 'accepted' | 'completed';
  createdAt: any;
  acceptedAt?: any;
  completedAt?: any;
  acceptedBy?: string;
  userName?: string;
}

interface MyRequestsProps {
  onBack?: () => void;
}

const MyRequests: React.FC<MyRequestsProps> = ({ onBack }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'completed'>('all');

  useEffect(() => {
    const q = collection(db, 'requests');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Request));
      setRequests(reqs.sort((a, b) => {
        const timeA = a.completedAt?.seconds || a.acceptedAt?.seconds || a.createdAt?.seconds || 0;
        const timeB = b.completedAt?.seconds || b.acceptedAt?.seconds || b.createdAt?.seconds || 0;
        return timeB - timeA;
      }));
    });
    return unsubscribe;
  }, []);

  const filteredRequests = requests.filter(req =>
    filter === 'all' ? true : req.status === filter
  );

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    accepted: requests.filter(r => r.status === 'accepted').length,
    completed: requests.filter(r => r.status === 'completed').length
  };

  const formatDate = (ts: any) => {
    if (!ts) return 'N/A';
    try {
      const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (ts: any) => {
    if (!ts) return '';
    try {
      const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getStatusConfig = (status: string) => {
    const config: Record<string, { color: string; bgColor: string; icon: string; label: string }> = {
      pending: { color: 'emerald', bgColor: 'bg-emerald-50', icon: 'fa-clock', label: 'Pending' },
      accepted: { color: 'blue', bgColor: 'bg-blue-50', icon: 'fa-fire', label: 'Accepted' },
      completed: { color: 'green', bgColor: 'bg-green-50', icon: 'fa-check-circle', label: 'Completed' }
    };
    return config[status] || config.pending;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center space-x-2">
        {onBack && (
          <button onClick={onBack} className="text-emerald-600 hover:text-emerald-700 transition-colors">
            <i className="fa-solid fa-arrow-left text-xl"></i>
          </button>
        )}
        <h1 className="text-3xl font-bold text-gray-800">My Requests</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Pending</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.pending}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-clock text-white text-xl"></i>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Accepted</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.accepted}</p>
          </div>
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-fire text-white text-xl"></i>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Completed</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.completed}</p>
          </div>
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-check-circle text-white text-xl"></i>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl w-full">
        {[
          { key: 'all' as const, label: 'All Requests', icon: 'fa-list' },
          { key: 'pending' as const, label: 'Pending', icon: 'fa-clock' },
          { key: 'accepted' as const, label: 'Accepted', icon: 'fa-fire' },
          { key: 'completed' as const, label: 'Completed', icon: 'fa-check' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 py-3 px-3 rounded-lg font-medium transition-all text-sm flex items-center justify-center space-x-2 ${
              filter === tab.key
                ? 'bg-white text-emerald-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <i className={`fa-solid ${tab.icon}`}></i>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Requests List or Empty State */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center space-y-4 animate-in zoom-in duration-300">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full">
            <i className="fa-solid fa-inbox text-gray-400 text-3xl"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {filter === 'all' ? 'No requests yet' : `No ${filter} requests`}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {filter === 'all'
                ? 'Create your first waste pickup request to get started.'
                : `You don't have any ${filter} requests at the moment.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const statusConfig = getStatusConfig(req.status);
            return (
              <div
                key={req.id}
                className={`rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all ${statusConfig.bgColor}`}
              >
                <div className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <i className="fa-solid fa-map-pin text-gray-400"></i>
                        <h3 className="font-bold text-gray-800 text-lg break-words">{req.address}</h3>
                      </div>
                      <div className="flex items-center space-x-3">
                        <i className="fa-solid fa-recycle text-gray-400"></i>
                        <p className="text-gray-600 text-sm">{req.wasteType}</p>
                      </div>
                    </div>
                    <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold text-white bg-${statusConfig.color}-500 whitespace-nowrap`}>
                      <i className={`fa-solid ${statusConfig.icon}`}></i>
                      <span>{statusConfig.label}</span>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="bg-white/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Requested</p>
                          <p className="text-sm font-semibold text-gray-800">{formatDate(req.createdAt)} {formatTime(req.createdAt)}</p>
                        </div>
                      </div>
                    </div>

                    {req.status !== 'pending' && req.acceptedAt && (
                      <>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full bg-blue-500`}></div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Accepted by {req.acceptedBy || 'Collector'}</p>
                              <p className="text-sm font-semibold text-gray-800">{formatDate(req.acceptedAt)} {formatTime(req.acceptedAt)}</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {req.status === 'completed' && req.completedAt && (
                      <>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Completed</p>
                              <p className="text-sm font-semibold text-gray-800">{formatDate(req.completedAt)} {formatTime(req.completedAt)}</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Status Message */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
                    <i className="fa-solid fa-lightbulb text-blue-500 mt-1 flex-shrink-0"></i>
                    <div className="text-sm">
                      {req.status === 'pending' && (
                        <p className="text-blue-700 font-medium">Waiting for a collector to accept your request...</p>
                      )}
                      {req.status === 'accepted' && (
                        <p className="text-blue-700 font-medium">{req.acceptedBy || 'A collector'} is on the way! 🚗</p>
                      )}
                      {req.status === 'completed' && (
                        <p className="text-blue-700 font-medium">Thank you! Your waste has been collected. 🎉</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyRequests;