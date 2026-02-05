import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const CollectorProfile: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

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
    if (!auth.currentUser) return setStatus('Not logged in');
    setLoading(true);
    setStatus('');
    try {
      await setDoc(
        doc(db, 'collectors', auth.currentUser.uid),
        {
          name,
          phone,
          email,
          updatedAt: new Date()
        },
        { merge: true }
      );
      setStatus('Saved');
    } catch (err: any) {
      setStatus('Save failed: ' + err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm space-y-4">
      <h3 className="text-xl font-bold text-emerald-800">Profile</h3>
      <div>
        <label className="block text-sm text-gray-600">Full name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded mt-1" />
      </div>
      <div>
        <label className="block text-sm text-gray-600">Phone</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 border rounded mt-1" />
      </div>
      <div>
        <label className="block text-sm text-gray-600">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded mt-1" />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={saveProfile} disabled={loading} className="bg-emerald-600 text-white px-4 py-2 rounded">
          {loading ? 'Saving...' : 'Save'}
        </button>
        {status && <span className="text-sm text-gray-600">{status}</span>}
      </div>
    </div>
  );
};

export default CollectorProfile;