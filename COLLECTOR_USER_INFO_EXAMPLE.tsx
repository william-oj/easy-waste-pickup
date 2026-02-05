/**
 * EXAMPLE: Displaying User Contact Info in Collector Dashboard
 * 
 * This file demonstrates how to use the user profile information
 * that's now attached to all requests. This is reference code
 * showing best practices for collectors to contact users.
 */

import React from 'react';

// Enhanced Request interface with user info
interface RequestWithUserInfo {
  id: string;
  address: string;
  wasteType: string;
  status: string;
  userName?: string;
  userPhone?: string;
}

// Component to display user contact card in collector dashboard
export const UserContactCard: React.FC<{ request: RequestWithUserInfo }> = ({ request }) => {
  const handleCallUser = () => {
    if (request.userPhone && request.userPhone !== 'Not provided') {
      window.location.href = `tel:${request.userPhone}`;
    } else {
      alert('Phone number not available');
    }
  };

  const handleSendSMS = () => {
    if (request.userPhone && request.userPhone !== 'Not provided') {
      window.location.href = `sms:${request.userPhone}`;
    } else {
      alert('Phone number not available');
    }
  };

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase">Customer</p>
        <p className="text-lg font-bold text-blue-900">
          {request.userName || 'Anonymous User'}
        </p>
      </div>

      {request.userPhone && request.userPhone !== 'Not provided' && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase">Contact</p>
          <p className="text-sm text-gray-700">{request.userPhone}</p>
          <div className="flex gap-2">
            <button
              onClick={handleCallUser}
              className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <i className="fa-solid fa-phone mr-1"></i>Call
            </button>
            <button
              onClick={handleSendSMS}
              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <i className="fa-solid fa-message mr-1"></i>SMS
            </button>
          </div>
        </div>
      )}

      {(!request.userPhone || request.userPhone === 'Not provided') && (
        <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-700 border border-yellow-200">
          <i className="fa-solid fa-exclamation-triangle mr-1"></i>
          Phone number not provided - contact limited
        </div>
      )}
    </div>
  );
};

// Usage in CollectorDashboard:
// 
// <div key={req.id} className="bg-emerald-50 p-4 mb-4 rounded-lg">
//   <p><strong>Address:</strong> {req.address}</p>
//   <p><strong>Waste Type:</strong> {req.wasteType}</p>
//   
//   <UserContactCard request={req} />
//   
//   <button onClick={() => acceptRequest(req.id)}>
//     Accept Job
//   </button>
// </div>

// Query example for getting all requests with user info
const fetchRequestsWithUserInfo = async (db: any) => {
  // In actual implementation:
  // const { collection, query, where, getDocs } = require('firebase/firestore');
  
  // Example query structure:
  // const q = query(
  //   collection(db, 'requests'),
  //   where('status', '==', 'pending')
  // );
  // const snapshot = await getDocs(q);
  // return snapshot.docs.map(doc => ({...}));
};

// Analytics: Count requests by user
const getUserRequestStats = async (db: any, userName: string) => {
  // Example query to find all requests from a specific user
  // Useful for identifying repeat customers or user history
  return { totalRequests: 0, requests: [] };
};

// Find repeat customers
const findRepeatCustomers = async (db: any) => {
  // Query to identify customers with 2+ requests
  // Useful for loyalty programs or targeted outreach
  return [];
};

// Export data for analytics (CSV)
const exportUserRequestsToCSV = async (db: any) => {
  // Example: Export all requests with user info to CSV
  // Useful for business analytics and reporting
};
