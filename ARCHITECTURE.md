# User Profile System - Architecture

## Component Hierarchy

```
App.tsx
├── Loads userProfile on init
└── Passes to:
    ├── Home.tsx
    │   └── UserProfilePrompt.tsx (if no profile)
    │       ├── Input: name, phone
    │       └── Saves via userProfileService
    │
    ├── RegularPickupView (in App.tsx)
    │   ├── Loads userProfile
    │   ├── On submit:
    │   │   └── Attaches userName, userPhone to request
    │   └── Saves to Firebase
    │
    ├── BulkyPickup.tsx
    │   ├── Loads userProfile on mount
    │   ├── On submit:
    │   │   └── Attaches userName, userPhone to request
    │   └── Saves to Firebase
    │
    └── ReportProblem.tsx
        ├── Loads userProfile on mount
        ├── On submit:
        │   └── Attaches userName, userPhone to report
        └── Saves to Firebase
```

## Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│           userProfileService.ts                         │
│                                                         │
│  Core Functions:                                        │
│  ├── getUserProfile()        ─ Get profile             │
│  ├── saveUserProfile()       ─ Save profile            │
│  ├── hasUserProfile()        ─ Check if exists         │
│  ├── getLocalUserProfile()   ─ Get from localStorage   │
│  ├── saveLocalUserProfile()  ─ Save to localStorage    │
│  ├── getFirebaseUserProfile()─ Get from Firebase       │
│  └── saveFirebaseUserProfile()─ Save to Firebase       │
│                                                         │
│  Smart Logic:                                           │
│  • If logged in: Use Firebase (with localStorage fallback)
│  • If not logged in: Use localStorage only             │
│  • Always save to localStorage first                   │
└─────────────────────────────────────────────────────────┘
          │
          ├─────────────────────────┬─────────────────────┐
          │                         │                     │
          ▼                         ▼                     ▼
    ┌──────────────┐          ┌──────────────┐      ┌──────────────┐
    │ localStorage │          │   Firebase   │      │     Auth     │
    │              │          │   Firestore  │      │              │
    │ (Instant)    │          │ (Sync)       │      │ (State)      │
    │ (Offline)    │          │ (Persistent) │      │              │
    └──────────────┘          └──────────────┘      └──────────────┘
```

## Data Flow

### 1. Profile Creation/Update Flow

```
User Input
    │
    ▼
UserProfilePrompt.tsx
    │
    ├─→ Validate inputs (name, phone)
    │
    ▼
saveUserProfile(profile)
    │
    ├─→ saveLocalUserProfile(profile)  [IMMEDIATE]
    │   └─→ localStorage.setItem('ewp_user_profile', JSON)
    │
    └─→ If auth.currentUser:
        └─→ saveFirebaseUserProfile(profile)  [ASYNC]
            └─→ Firestore: users/{userId}/
```

### 2. Request Submission Flow

```
User Makes Request
(Regular, Bulky, Report)
    │
    ▼
Component loads:
    └─→ userProfile = await getUserProfile()
    │
    ▼
On Submit:
    ├─→ Check if userProfile exists
    │
    ▼
Create Request Document:
{
  address: string,
  wasteType: string,
  status: 'pending',
  userName: profile?.name || 'Anonymous',    ← NEW
  userPhone: profile?.phone || 'Not provided' ← NEW
}
    │
    ▼
Save to Firebase:
    └─→ firestore.collection('requests').add(request)
```

### 3. Profile Loading Flow

```
App Initializes
    │
    ▼
useEffect(() => {
    loadProfile = async () => {
        userProfile = await getUserProfile()
    }
})
    │
    ├─→ Check if auth.currentUser
    │
    ├─→ If YES: Try Firebase first
    │   ├─→ Firestore: getDoc(users/{userId})
    │   └─→ If success: Return Firebase profile
    │
    ├─→ If NO or Firebase fails:
    │   └─→ localStorage.getItem('ewp_user_profile')
    │
    ▼
Set userProfile state
    │
    ▼
Pass to components
```

## Firestore Schema

```
BEFORE (Original)
─────────────────

firestore
└── requests/
    └── {requestId}
        ├── address: string
        ├── wasteType: string
        ├── status: 'pending' | 'accepted' | 'completed'
        └── createdAt: timestamp


AFTER (Enhanced)
────────────────

firestore
├── users/
│   └── {userId}                    ← NEW COLLECTION
│       ├── name: string
│       └── phone: string
│
├── requests/
│   └── {requestId}
│       ├── address: string
│       ├── wasteType: string
│       ├── status: 'pending' | 'accepted' | 'completed'
│       ├── userName: string        ← NEW
│       ├── userPhone: string       ← NEW
│       └── createdAt: timestamp
│
└── reports/
    └── {reportId}
        ├── address: string
        ├── problemType: string
        ├── description: string
        ├── status: 'open' | 'resolved'
        ├── userName: string        ← NEW
        ├── userPhone: string       ← NEW
        └── createdAt: timestamp
```

## State Management

```
App.tsx (Global State)
├── currentView: AppView
├── location: LocationData
├── isCollectorLoggedIn: boolean
└── userProfile: UserProfile | null
    │
    ├─→ Passed to Home
    ├─→ Passed to RegularPickupView
    └─→ Used by Home to show/hide prompt

Home.tsx (Local State)
├── showProfilePrompt: boolean
└── On mount: Check hasUserProfile()

BulkyPickup.tsx (Local State)
├── userProfile: UserProfile | null
└── On mount: Load via getUserProfile()

ReportProblem.tsx (Local State)
├── userProfile: UserProfile | null
└── On mount: Load via getUserProfile()
```

## Error Handling

```
getUserProfile()
│
├─→ Try Firebase (if logged in)
│   ├─→ Success: Return profile
│   └─→ Error: Fall back to localStorage
│
├─→ Try localStorage
│   ├─→ Success: Return profile
│   ├─→ Parse error: Return null
│   └─→ Not found: Return null
│
└─→ Return null (no profile found)


saveUserProfile(profile)
│
├─→ localStorage.setItem() [Required]
│   └─→ If fails: throw error
│
└─→ Firebase.setDoc() [Optional if logged in]
    ├─→ Success: Silent success
    └─→ Error: Log warning, but don't break app
```

## TypeScript Types

```typescript
interface UserProfile {
  name: string;
  phone: string;
}

interface RequestWithUserInfo extends Request {
  userName?: string;      // From UserProfile
  userPhone?: string;     // From UserProfile
}

interface ReportWithUserInfo extends Report {
  userName?: string;      // From UserProfile
  userPhone?: string;     // From UserProfile
}
```

## Browser & Firebase Integration

```
┌─────────────────────────────────────────────────────────┐
│                    Browser                              │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Storage API                              │  │
│  │                                                  │  │
│  │  localStorage                                    │  │
│  │  ├── ewp_user_profile (User Profile Service)   │  │
│  │  └── Other keys...                              │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Firebase SDK                             │  │
│  │                                                  │  │
│  │  ├── Authentication                             │  │
│  │  │   └── auth.currentUser                       │  │
│  │  │                                              │  │
│  │  └── Firestore                                  │  │
│  │      ├── users/{userId}                         │  │
│  │      ├── requests/{requestId}                   │  │
│  │      └── reports/{reportId}                     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Sequence Diagram: First Time User

```
User              Home.tsx       UserProfilePrompt    Service        localStorage    Firebase
 │                  │                   │                 │               │             │
 │─ Open App ──────>│                   │                 │               │             │
 │                  │─ Check Profile ──>│                 │               │             │
 │                  │  hasUserProfile() │                 │               │             │
 │                  │                   ├─ Get Local ────>│               │             │
 │                  │                   │<─ null ─────────┤               │             │
 │                  │                   ├─ Get Firebase ──────────────────────────────>│
 │                  │                   │<─ null ─────────────────────────────────────┤
 │                  │<─ false ──────────┤                 │               │             │
 │<─ Show Prompt ───┤                   │                 │               │             │
 │                  │                   │                 │               │             │
 │─ Enter Info ────>│                   │<─ Submit ──────>│               │             │
 │  (name, phone)   │                   │                 │               │             │
 │                  │                   ├─ Save Local ───────────────────>│             │
 │                  │                   │<─ Saved ────────┤               │             │
 │                  │                   │                 │               │             │
 │                  │                   ├─ Save Firebase ─────────────────────────────>│
 │                  │                   │<─ Saved ────────────────────────────────────┤
 │                  │                   │                 │               │             │
 │<─ Profile Set ───┤                   │                 │               │             │
 │                  │                   │                 │               │             │
```

## Sequence Diagram: Making a Request

```
User           Component         Service            Firebase        Collector
 │                │                  │                  │               │
 │─ Bulky Pickup ─>│                  │                  │               │
 │  Form           │                  │                  │               │
 │                 │─ Load Profile ──>│                  │               │
 │                 │                  ├─ Get Local/Firebase              │
 │                 │<─ Profile ───────┤                  │               │
 │                 │                  │                  │               │
 │─ Submit ───────>│                  │                  │               │
 │  Request        │                  │                  │               │
 │                 ├─ Attach userInfo │                  │               │
 │                 │ (name, phone)    │                  │               │
 │                 │                  │                  │               │
 │                 │─ Save Request ──>│                  │               │
 │                 │  with userName & userPhone          │               │
 │                 │                  ├─ Save to DB ────>│               │
 │                 │                  │<─ Saved ────────┤               │
 │<─ Confirmation ─┤                  │                  │               │
 │                 │                  │                  │               │
 │                 │                  │                  │<─ Listen ────┤
 │                 │                  │                  │ for new reqs │
 │                 │                  │                  │               │
 │                 │                  │                  │<─ Get Request┤
 │                 │                  │                  │  with user   │
 │                 │                  │                  │  contact     │
 │                 │                  │                  │─ Contact ───>│
 │                 │                  │                  │  User        │
```

---

This architecture provides a clean separation of concerns while enabling seamless user profile management across both local and cloud storage.
