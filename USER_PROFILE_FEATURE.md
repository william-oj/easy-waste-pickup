# User Profile Feature Documentation

## Overview

The User Profile feature enables automatic capture and persistence of user contact information (name and phone) for waste pickup requests. This information is used to help collectors contact users when accepting requests.

## Features

### 1. **First-Use Profile Prompt**
- Displays automatically on the Home screen if the user hasn't set up a profile
- Modal dialog with name and phone input fields
- Optional "Skip for Now" button for users who prefer to set up later

### 2. **Dual Storage Strategy**
- **Local Storage**: All profiles are saved locally for offline access and persistence
- **Firebase**: If user is logged in (collector account), profile is also synced to Firebase for cross-device access
- Graceful fallback if Firebase is unavailable

### 3. **Auto-Attachment to Requests**
- User profile info is automatically attached to all requests:
  - Regular Pickup
  - Bulky Pickup
  - Problem Reports
- Collectors can use this information to contact users

## File Structure

### New Files Created

```
services/
  └── userProfileService.ts          # Service for profile management

components/
  └── UserProfilePrompt.tsx          # Modal component for profile setup
```

### Modified Files

```
components/
  ├── Home.tsx                        # Shows profile prompt on mount
  ├── BulkyPickup.tsx                 # Attaches user profile to requests
  ├── ReportProblem.tsx               # Attaches user profile to reports

App.tsx                              # Loads user profile, passes to components
```

## API Reference

### userProfileService.ts

#### Interfaces
```typescript
export interface UserProfile {
  name: string;
  phone: string;
}
```

#### Functions

**`getLocalUserProfile(): UserProfile | null`**
- Retrieves user profile from browser's localStorage
- Returns `null` if no profile exists or JSON parse fails

**`saveLocalUserProfile(profile: UserProfile): void`**
- Saves user profile to localStorage
- Persists across browser sessions

**`clearLocalUserProfile(): void`**
- Removes profile from localStorage
- Useful for logout or reset functionality

**`getFirebaseUserProfile(): Promise<UserProfile | null>`**
- Retrieves profile from Firebase (requires user to be logged in)
- Returns `null` if user not logged in or profile doesn't exist

**`saveFirebaseUserProfile(profile: UserProfile): Promise<void>`**
- Saves profile to Firebase under `users/{userId}` collection
- Throws error if save fails

**`getUserProfile(): Promise<UserProfile | null>`**
- Smart retrieval function:
  - If logged in: tries Firebase first, falls back to localStorage
  - If not logged in: returns localStorage profile
- Always returns the most up-to-date profile

**`saveUserProfile(profile: UserProfile): Promise<void>`**
- Smart save function:
  - Always saves to localStorage
  - If logged in: also saves to Firebase
  - Handles Firebase errors gracefully

**`hasUserProfile(): Promise<boolean>`**
- Checks if user has a complete profile
- Returns `true` if both name and phone are non-empty

## Usage Example

### In a Component
```typescript
import { getUserProfile, saveUserProfile, UserProfile } from '../services/userProfileService';

// Get profile
const profile = await getUserProfile();
if (profile) {
  console.log(`User: ${profile.name}, Phone: ${profile.phone}`);
}

// Save profile
await saveUserProfile({ 
  name: 'John Smith', 
  phone: '(555) 123-4567' 
});

// Check if has profile
const hasProfile = await hasUserProfile();
```

### In Requests
```typescript
// When submitting a request
const userProfile = await getUserProfile();

await addDoc(collection(db, 'requests'), {
  address: location.address,
  wasteType: 'Bulky Pickup',
  status: 'pending',
  userName: userProfile?.name || 'Anonymous',
  userPhone: userProfile?.phone || 'Not provided'
});
```

## Firebase Schema

### Users Collection
```
users/
  └── {userId}/
      ├── name: string
      └── phone: string
```

### Requests Collection (Updated)
```
requests/
  └── {requestId}/
      ├── address: string
      ├── wasteType: string
      ├── status: string
      ├── createdAt: timestamp
      ├── userName: string        // NEW
      └── userPhone: string       // NEW
```

### Reports Collection (Updated)
```
reports/
  └── {reportId}/
      ├── address: string
      ├── problemType: string
      ├── description: string
      ├── status: string
      ├── createdAt: timestamp
      ├── userName: string        // NEW
      └── userPhone: string       // NEW
```

## User Flow

1. **First Time User Opens App**
   - Home component checks `hasUserProfile()`
   - If no profile exists, shows `UserProfilePrompt`
   - User enters name and phone
   - Profile saved to localStorage (and Firebase if logged in)

2. **User Makes a Request**
   - Component loads user profile via `getUserProfile()`
   - Request submitted with attached `userName` and `userPhone`
   - Collectors see contact info and can reach out

3. **Returning User**
   - Profile prompt doesn't show (already has profile)
   - Profile automatically attached to new requests

4. **Cross-Device Sync (If Logged In)**
   - Profile saved to Firebase
   - User logs in on another device
   - Profile automatically synced from Firebase

## Edge Cases Handled

- ✅ No localStorage available (graceful fallback)
- ✅ Firebase save fails (still uses localStorage)
- ✅ User not logged in (uses localStorage only)
- ✅ Invalid JSON in localStorage (returns null)
- ✅ User clears browser data (prompts to enter profile again)
- ✅ Collector account switching (uses Firebase to keep in sync)

## Future Enhancements

1. **Profile Editing**: Allow users to edit their profile after setup
2. **Verification**: Phone number verification via SMS
3. **Email Support**: Add email field to profile
4. **Address Book**: Store multiple addresses per user
5. **Privacy**: Users can choose to remain anonymous
6. **Notifications**: Send push notifications when request accepted

## Security Considerations

- Profiles stored in localStorage are accessible only to same-origin scripts
- Firebase rules should restrict users to viewing/editing their own profile
- Consider adding authentication before allowing profile edits
- User phone numbers should be used only for service-related contact

## Troubleshooting

### Profile not persisting
- Check if localStorage is enabled in browser
- Check browser's Application > Local Storage for `ewp_user_profile` key
- Try clearing cache and re-entering profile

### Profile not syncing to Firebase
- Check if user is logged in to collector account
- Check Firebase console for `users` collection
- Review browser console for Firebase errors

### Profile not attached to requests
- Verify `getUserProfile()` is being called in request component
- Check Firebase request document for `userName` and `userPhone` fields
- Review console for any async/await timing issues
