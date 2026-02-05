# User Profile Integration - Quick Start Guide

## What Was Added

Your app now has a complete **User Profile** system that:
- ✅ Prompts users to enter their name and phone on first use
- ✅ Saves the info to localStorage (offline persistence)
- ✅ Syncs to Firebase if user is logged in (cross-device sync)
- ✅ Auto-attaches user info to all requests (Bulky, Regular, Reports)
- ✅ Allows collectors to easily contact users

## Files Created

### 1. **services/userProfileService.ts**
Core service for managing user profiles with localStorage + Firebase integration.

**Key Functions:**
- `getUserProfile()` - Get user profile
- `saveUserProfile(profile)` - Save profile to localStorage + Firebase
- `hasUserProfile()` - Check if profile is complete

### 2. **components/UserProfilePrompt.tsx**
Beautiful modal component that shows when user first opens the app.

**Features:**
- Name and phone input fields
- Error handling
- Loading states
- "Skip for Now" option

### 3. **COLLECTOR_USER_INFO_EXAMPLE.tsx**
Reference code showing how collectors can display and use user contact info.

## Modified Files

### **components/Home.tsx**
- Added profile prompt detection on mount
- Shows modal if user doesn't have a profile

### **components/BulkyPickup.tsx**
- Loads user profile
- Attaches `userName` and `userPhone` to Firebase requests

### **components/ReportProblem.tsx**
- Loads user profile
- Attaches `userName` and `userPhone` to Firebase reports

### **App.tsx**
- Loads user profile on app init
- Passes to RegularPickupView
- Updated RegularPickupView to attach user info to requests

## How It Works

### User Flow
```
1. User opens app → Home.tsx checks hasUserProfile()
2. If no profile → UserProfilePrompt shows
3. User enters name + phone → Saved to localStorage + Firebase (if logged in)
4. User makes request → User info auto-attached
5. Collectors see user contact info in dashboard
```

### Data Flow
```
User enters data
    ↓
SaveUserProfile()
    ├→ localStorage (immediate, always)
    └→ Firebase (if logged in, async)
    ↓
Request submitted
    ├→ Includes userName + userPhone
    ↓
Collector sees request with contact info
```

## Using the Service in Components

### Getting Profile
```typescript
import { getUserProfile } from '../services/userProfileService';

const profile = await getUserProfile();
console.log(profile.name, profile.phone);
```

### Saving Profile
```typescript
import { saveUserProfile } from '../services/userProfileService';

await saveUserProfile({
  name: 'John Smith',
  phone: '(555) 123-4567'
});
```

### Checking if Profile Exists
```typescript
import { hasUserProfile } from '../services/userProfileService';

const hasProfile = await hasUserProfile();
if (!hasProfile) {
  // Show prompt or redirect to profile setup
}
```

## Firebase Schema (Auto-created)

### Users Collection
When a logged-in user saves their profile, it's stored in:
```
firestore
└── users/
    └── {userId}/ (auto-generated from auth)
        ├── name: "John Smith"
        └── phone: "(555) 123-4567"
```

### Requests Collection (Enhanced)
All requests now include user contact info:
```
firestore
└── requests/
    └── {requestId}/
        ├── address: "123 Main St"
        ├── wasteType: "Bulky Pickup"
        ├── userName: "John Smith"          ← NEW
        ├── userPhone: "(555) 123-4567"     ← NEW
        └── ...
```

## Testing the Feature

### Test 1: First-Time User
1. Open app in incognito/private window
2. Should see profile prompt on Home
3. Enter name and phone
4. Try making a request
5. Check Firebase console → requests collection
6. Verify userName and userPhone are saved

### Test 2: Returning User
1. Refresh the app
2. Profile prompt should NOT show
3. Make a request
4. User info should auto-attach

### Test 3: Offline Persistence
1. Open app, enter profile
2. Turn off internet
3. Make a request (will fail to save to Firebase, but localStorage has profile)
4. Turn internet back on
5. New requests include user info

### Test 4: Cross-Device Sync (Logged In)
1. Log in as collector on device A
2. Set profile
3. Log in on device B
4. Profile should load from Firebase automatically

## Enabling Collectors to Contact Users

### Option 1: Display Contact Card (Simple)
In CollectorDashboard.tsx, add this where requests are shown:

```typescript
<div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
  <p><strong>Customer:</strong> {request.userName || 'Anonymous'}</p>
  {request.userPhone && (
    <>
      <p><strong>Phone:</strong> {request.userPhone}</p>
      <a href={`tel:${request.userPhone}`} className="text-blue-600 hover:underline">
        Call Customer
      </a>
    </>
  )}
</div>
```

### Option 2: Full Implementation
See [COLLECTOR_USER_INFO_EXAMPLE.tsx](./COLLECTOR_USER_INFO_EXAMPLE.tsx) for:
- UserContactCard component
- Call/SMS buttons
- Analytics queries
- CSV export

## Troubleshooting

### Issue: Profile prompt shows every time
**Solution:** Check localStorage for `ewp_user_profile` key
```javascript
// In browser console:
localStorage.getItem('ewp_user_profile')
// Should return: {"name":"John Smith","phone":"(555) 123-4567"}
```

### Issue: User info not attached to requests
**Solution:** Check that getUserProfile() is being awaited properly
```typescript
const userProfile = await getUserProfile(); // Must use await
// Wait for profile to load before submitting
```

### Issue: Firebase sync not working
**Solution:** Check:
1. User is logged in (`auth.currentUser` exists)
2. Browser console for Firebase errors
3. Firebase permissions allow user to write to `users/` collection

### Issue: Profile not loading on second device
**Solution:** 
1. Make sure same user is logged in (Firebase)
2. Check Firestore console for users collection
3. Verify profile has both name and phone fields

## Next Steps / Enhancement Ideas

1. **Profile Editing**
   - Add edit button in Home to update profile
   - Add profile settings screen

2. **Email Field**
   - Add email to UserProfile interface
   - Update all components to handle email

3. **Multiple Addresses**
   - Store address array instead of single address
   - Let users switch between addresses

4. **Privacy Options**
   - Let users hide phone number
   - Anonymous mode option

5. **Verification**
   - Phone SMS verification
   - Email confirmation

6. **Avatar/Photo**
   - Let users upload profile photo
   - Show in collector dashboard

## Architecture Notes

### Why Dual Storage?
- **localStorage**: Instant, offline, no backend needed
- **Firebase**: Sync across devices, permanent backup, analytics

### Why Auto-Attachment?
- Better UX: User doesn't need to enter info multiple times
- Higher contact rate: Collectors always have contact info
- Cross-feature consistency: Same info in all request types

### Why Optional Skip?
- Users might not be ready to provide info
- Can still use app, just limited functionality
- Profile prompt re-appears until they set it up

## API Reference Quick Link

See [USER_PROFILE_FEATURE.md](./USER_PROFILE_FEATURE.md) for detailed API documentation.

## Files Location Summary

```
easy-waste-pickup/
├── services/
│   └── userProfileService.ts          ← Core service
├── components/
│   ├── Home.tsx                        ← Modified
│   ├── UserProfilePrompt.tsx           ← New
│   ├── BulkyPickup.tsx                 ← Modified
│   └── ReportProblem.tsx               ← Modified
├── App.tsx                             ← Modified
├── USER_PROFILE_FEATURE.md             ← Full documentation
├── QUICK_START.md                      ← This file
└── COLLECTOR_USER_INFO_EXAMPLE.tsx     ← Reference code
```

---

**Questions?** Check the full documentation in [USER_PROFILE_FEATURE.md](./USER_PROFILE_FEATURE.md)
