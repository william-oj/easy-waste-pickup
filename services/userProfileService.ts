import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface UserProfile {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  id?: string;
}

const STORAGE_KEY = 'ewp_user_profile';

/**
 * Get user profile from localStorage
 */
export const getLocalUserProfile = (): UserProfile | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Save user profile to localStorage
 */
export const saveLocalUserProfile = (profile: UserProfile): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
};

/**
 * Clear user profile from localStorage
 */
export const clearLocalUserProfile = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Get user profile from Firebase (if logged in)
 */
export const getFirebaseUserProfile = async (): Promise<UserProfile | null> => {
  if (!auth.currentUser) return null;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return { name: data.name, phone: data.phone };
    }
  } catch (error) {
    console.error('Error fetching user profile from Firebase:', error);
  }
  return null;
};

/**
 * Save user profile to Firebase (if logged in)
 */
export const saveFirebaseUserProfile = async (profile: UserProfile): Promise<void> => {
  if (!auth.currentUser) return;
  
  try {
    await setDoc(doc(db, 'users', auth.currentUser.uid), profile, { merge: true });
  } catch (error) {
    console.error('Error saving user profile to Firebase:', error);
    throw error;
  }
};

/**
 * Get user profile from either source (Firebase if logged in, else localStorage)
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
  // If logged in, try Firebase first
  if (auth.currentUser) {
    const firebaseProfile = await getFirebaseUserProfile();
    if (firebaseProfile) return firebaseProfile;
  }
  
  // Fall back to localStorage
  return getLocalUserProfile();
};

/**
 * Save user profile to appropriate source (Firebase if logged in, else localStorage)
 */
export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  // Always save to localStorage for offline access
  saveLocalUserProfile(profile);
  
  // If logged in, also save to Firebase
  if (auth.currentUser) {
    try {
      await saveFirebaseUserProfile(profile);
    } catch (error) {
      console.warn('Could not save to Firebase, using localStorage only:', error);
    }
  }
};

/**
 * Check if user has a profile (true = needs to set up)
 */
export const hasUserProfile = async (): Promise<boolean> => {
  const profile = await getUserProfile();
  return profile !== null && profile.name?.trim() !== '' && profile.phone?.trim() !== '';
};
