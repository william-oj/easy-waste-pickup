import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const CollectorLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        if (!name || !phone) {
          setError('Name and phone are required for signup');
          setLoading(false);
          return;
        }
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        // Store collector profile
        await setDoc(doc(db, 'collectors', userCred.user.uid), {
          name,
          phone,
          email,
          createdAt: new Date(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-emerald-800">Collector Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg"
      />
      {isSignUp && (
        <>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
          <input
            type="tel"
            placeholder="Phone Number (024xxxxxxx)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        onClick={handleAuth}
        disabled={loading}
        className="w-full bg-emerald-600 text-white p-3 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
      </button>
      <button
        onClick={() => setIsSignUp(!isSignUp)}
        className="w-full bg-gray-100 text-gray-700 p-3 rounded-lg font-medium hover:bg-gray-200"
      >
        {isSignUp ? 'Have an account? Login' : 'No account? Sign Up'}
      </button>
    </div>
  );
};

export default CollectorLogin;