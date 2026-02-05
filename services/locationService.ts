// Location persistence service - saves address to localStorage

export interface SavedLocation {
  address: string;
  lat?: number;
  lng?: number;
  savedAt: number;
}

const LOCATION_STORAGE_KEY = 'ewp_saved_location';

/**
 * Get saved location from localStorage
 */
export const getSavedLocation = (): SavedLocation | null => {
  try {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error loading saved location:', error);
    return null;
  }
};

/**
 * Save location to localStorage
 */
export const saveLocation = (address: string, lat?: number, lng?: number): void => {
  try {
    const location: SavedLocation = {
      address,
      lat,
      lng,
      savedAt: Date.now()
    };
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch (error) {
    console.error('Error saving location:', error);
  }
};

/**
 * Clear saved location from localStorage
 */
export const clearSavedLocation = (): void => {
  try {
    localStorage.removeItem(LOCATION_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing location:', error);
  }
};
