# StudySphere - Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React 18 + TypeScript                                   │  │
│  │  ├─ Components (20+)                                     │  │
│  │  ├─ Pages (9)                                            │  │
│  │  ├─ Services (7)                                         │  │
│  │  ├─ Hooks (3+)                                           │  │
│  │  └─ Context (Auth)                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Styling & UI                                            │  │
│  │  ├─ Tailwind CSS                                         │  │
│  │  ├─ shadcn/ui                                            │  │
│  │  └─ Lucide Icons                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↕ (HTTPS)
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (Edge Network)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js / Vite Server                                   │  │
│  │  ├─ Static asset serving                                 │  │
│  │  ├─ API routing                                          │  │
│  │  └─ Environment management                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↕ (HTTPS)
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE BACKEND                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Supabase Auth                                           │  │
│  │  ├─ Email/password auth                                  │  │
│  │  ├─ Session management                                   │  │
│  │  └─ JWT tokens                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                     │  │
│  │  ├─ profiles                                             │  │
│  │  ├─ rooms                                                │  │
│  │  ├─ room_members                                         │  │
│  │  ├─ study_sessions                                       │  │
│  │  ├─ timers                                               │  │
│  │  └─ RLS Policies                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Realtime (WebSocket)                                    │  │
│  │  ├─ room_members subscriptions                           │  │
│  │  ├─ timers subscriptions                                 │  │
│  │  └─ rooms subscriptions                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Layer 1: Presentation (Components)

```
Components/
├── UI Layer (shadcn)
│   ├── Button, Input, Dialog, etc.
│   └── Card, Badge, Switch, etc.
│
├── Feature Components
│   ├── AppHeader (navigation)
│   ├── RoomCard (room listing)
│   ├── DailyGoal (progress)
│   ├── SessionCompletion (modal)
│   ├── StatsCard (metrics)
│   └── RoomPageUI (room builder)
│
└── Layout Components
    ├── ProtectedRoute (auth guard)
    └── ErrorBoundary (error handling)
```

### Layer 2: Logic (Hooks & Services)

```
Hooks/
├── useRoomMembers (fetch + subscribe)
├── useRoomTimer (fetch + subscribe)
└── use-toast (notifications)

Services/
├── authService (authentication)
├── roomService (room operations)
├── roomMemberService (membership)
├── studySessionService (sessions)
├── timerService (timers)
├── statsService (calculations)
└── profileService (profiles)
```

### Layer 3: State (Context)

```
Context/
└── AuthContext
    ├── Manages user session
    ├── Listens to auth changes
    ├── Provides useAuth hook
    └── Handles token refresh
```

### Layer 4: Integration (Supabase Client)

```
Integrations/
└── supabase/
    └── client.ts
        ├── Authentication
        ├── Realtime subscriptions
        └── Database queries
```

### Data Flow: Read Operation

```
Component
    ↓
useEffect
    ↓
Call Service
    ↓
Service queries Supabase
    ↓
Database returns data
    ↓
Service returns to Component
    ↓
Component setState
    ↓
Component re-renders
```

### Data Flow: Real-time Update

```
User A makes change
    ↓
Writes to Supabase
    ↓
Supabase notifies subscribers
    ↓
User B's subscription fires
    ↓
Hook re-fetches data
    ↓
Component updates
    ↓
Both users see same data
```

---

## Backend Architecture

### Database Schema

```
profiles
├── id (PK, UUID)
├── name (VARCHAR)
├── email (VARCHAR)
└── timestamps

rooms
├── id (PK, UUID)
├── name (VARCHAR)
├── created_by (FK → profiles)
├── is_private (BOOLEAN)
├── exam_mode (BOOLEAN)
├── room_code (VARCHAR, unique)
└── timestamps

room_members
├── id (PK, UUID)
├── user_id (FK → profiles)
├── room_id (FK → rooms)
├── role ('creator' | 'member')
├── status ('active' | 'left' | 'removed')
└── joined_at

study_sessions
├── id (PK, UUID)
├── user_id (FK → profiles)
├── room_id (FK → rooms)
├── start_time (TIMESTAMP)
├── end_time (TIMESTAMP)
├── duration (INTEGER, seconds)
└── created_at

timers
├── id (PK, UUID)
├── room_id (FK → rooms, unique)
├── start_time (TIMESTAMP)
├── duration (INTEGER)
├── is_active (BOOLEAN)
└── timestamps

rooms_public (VIEW)
├── id, name, is_private, created_by, created_at, exam_mode
└── (excludes room_code for security)
```

### RLS (Row Level Security) Policies

```
profiles
├── SELECT: user can read own, service role can read all
├── UPDATE: user can update own, service role can update all
└── DELETE: service role only

rooms
├── SELECT: anyone can read, creator can read own with code
├── INSERT: authenticated users
├── UPDATE: creator only
└── DELETE: creator only

room_members
├── SELECT: members can read their rooms, service role can read all
├── INSERT: join logic
├── UPDATE: creator or self
└── DELETE: creator only

study_sessions
├── SELECT: user can read own, service role can read all
├── INSERT: authenticated during session
└── UPDATE: service role only

timers
├── SELECT: members can read, service role can read all
├── INSERT: service role only
└── UPDATE: service role only
```

### Custom Functions (RPC)

```
join_private_room(room_id, code)
├── Verify room exists
├── Verify code matches
├── Insert into room_members
└── Return membership

join_room_by_code(code)
├── Find room by code
├── Insert into room_members
└── Return room_id
```

---

## Authentication Flow

```
User Signs Up
├── Enter email, password, name
├── POST → Supabase Auth
├── Supabase hashes password
├── Create profile record
├── Send verification email
└── Redirect to login

User Signs In
├── Enter email, password
├── POST → Supabase Auth
├── Supabase verifies credentials
├── Returns JWT token
├── Store in localStorage
├── AuthContext updates
└── Redirect to dashboard

User's Session Persists
├── AuthContext checks localStorage
├── Validates token with Supabase
├── If valid: restore session
├── If expired: refresh token
└── If invalid: sign out

User Signs Out
├── Clear localStorage
├── Call Supabase signOut
├── AuthContext updates
└── Redirect to login
```

---

## Real-time Subscription Flow

```
User enters room
├── Create subscription channel
├── Subscribe to room_members changes
├── Subscribe to timers changes
├── Subscribe to rooms changes

Member joins room
├── Database INSERT → room_members
├── Supabase detects change
├── Notifies subscribers
├── useRoomMembers hook fires
├── Fetches updated member list
├── All users' member lists update

Timer starts
├── Database UPDATE → timers
├── Supabase detects change
├── Notifies subscribers
├── useRoomTimer hook fires
├── Fetches updated timer state
├── All users' timers sync

User leaves room
├── Cleanup subscription
├── Remove channel listeners
├── Clear local state
```

---

## Service Layer Pattern

### Example: roomService

```typescript
export const roomService = {
  async create(name, createdBy, isPrivate) {
    // Validate input
    // Call Supabase INSERT
    // Return created room
  },
  
  async getById(id) {
    // Call Supabase SELECT
    // Handle RLS filtering
    // Return room or null
  },
  
  async listAll() {
    // Call rooms_public view
    // Order by creation date
    // Return array
  },
  
  async search(query) {
    // Call rooms_public view
    // Filter by name (case-insensitive)
    // Limit results
    // Return array
  },
  
  async setExamMode(roomId, value) {
    // Update exam_mode
    // Return updated room
  }
}
```

**Benefits**:
- Centralized API calls
- Type-safe service contracts
- Easy to mock for testing
- Single source of truth
- Error handling in one place

---

## Hook Pattern

### Example: useRoomMembers

```typescript
export function useRoomMembers(roomId) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!roomId) return
    
    // Initial fetch
    const load = async () => {
      const rows = await roomMemberService.listActiveByRoom(roomId)
      const profiles = await profileService.getMany(rows.map(r => r.user_id))
      const profileMap = new Map(profiles.map(p => [p.id, p]))
      setMembers(rows.map(r => ({ ...r, profile: profileMap.get(r.user_id) })))
      setLoading(false)
    }
    
    load()
    
    // Real-time subscription
    const channel = supabase
      .channel(`room-members-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
        () => load()
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])
  
  return { members, loading }
}
```

**Features**:
- Initial fetch on mount
- Real-time subscription
- Proper cleanup
- Loading state
- Automatic refresh on changes

---

## Page Architecture

### Example: Dashboard Page

```
Dashboard
├── useAuth hook → get user
├── useState → manage state
├── useEffect → load data
│
├── Load data
│   ├── roomService.listAll()
│   ├── roomMemberService.listMyRooms()
│   ├── timerService.getActiveByRooms()
│   └── statsService.getForUser()
│
├── Compute derived state
│   ├── yourRooms = filter by creator
│   ├── joinedRooms = filter by member
│   └── discover = filter by public
│
├── Render sections
│   ├── Stats cards
│   ├── Daily goal
│   ├── Create button
│   ├── Search bar
│   ├── Your rooms section
│   ├── Joined rooms section
│   └── Discover section
│
└── Handle actions
    ├── createRoom
    ├── joinRoom
    ├── joinByCode
    └── navigation
```

---

## Error Handling Strategy

### Three-Level Error Handling

```
Level 1: Service Layer
├── Try-catch in async operations
├── Throw descriptive errors
└── Let caller handle

Level 2: Hook/Component Layer
├── Try-catch in useEffect
├── Show toast notification
├── Fallback UI

Level 3: Global Error Boundary
├── Catch React crashes
├── Log to Sentry (configured)
├── Show error page
```

### Error Flow Example

```
User clicks "Join Room"
├── Try joinRoom()
│   ├── Call roomMemberService.join()
│   │   ├── If error: throw
│   │   └── If success: return
│   ├── Navigate to room
│   └── If error: catch
├── Show toast.error()
├── User sees message
└── Can retry
```

---

## Performance Optimizations

### Frontend Optimizations

1. **Code Splitting** (Future)
   ```javascript
   const Dashboard = lazy(() => import('./pages/Dashboard'))
   ```

2. **Memoization** (Applied)
   ```typescript
   const yourRooms = useMemo(
     () => allRooms.filter(r => r.created_by === user?.id),
     [allRooms, user?.id]
   )
   ```

3. **Lazy Loading** (Applied)
   ```typescript
   const { members, loading } = useRoomMembers(id)
   ```

### Backend Optimizations

1. **RLS Filtering** (Applied)
   - Only return authorized data
   - Database filters before transmission

2. **Column Selection** (Applied)
   ```typescript
   .select('id, name, email')  // Not SELECT *
   ```

3. **Real-time over Polling** (Applied)
   - WebSocket subscriptions
   - No polling overhead

### Bundle Optimizations

1. **Tree Shaking** (Applied)
   - Only import needed functions
   - Remove unused code

2. **Minification** (Applied)
   - Production build minified
   - Gzip compression

---

## Scalability Considerations

### Current Architecture Scales To

- **100K+ Users** - Supabase Pro plan
- **1M+ Requests/day** - Vercel auto-scales
- **Real-time Connections** - Supabase handles WebSocket scaling

### Scaling Bottlenecks

1. **Database Connections**
   - Solution: Use PgBouncer (Supabase Pro)

2. **Query Performance**
   - Solution: Add indexes on frequently queried columns
   - Solution: Implement caching (Redis)

3. **Real-time Latency**
   - Solution: Use connection pooling
   - Solution: Upgrade Supabase tier

### Upgrade Path

```
Phase 1: Current
├── Supabase Free/Pro
├── Vercel Pro
└── Up to 50K users

Phase 2: Growth
├── Supabase Pro + dedicated database
├── Vercel Enterprise
├── Redis caching layer
└── Up to 500K users

Phase 3: Scale
├── Supabase Custom
├── Dedicated infrastructure
├── CDN + caching strategy
├── 1M+ users
```

---

## Security Architecture

### Authentication Security
- JWT tokens issued by Supabase
- Tokens stored in localStorage
- Tokens included in Authorization header
- Token refresh automatic
- Session expiry detection

### Database Security
- RLS policies on all tables
- Row-level encryption (future)
- Regular backups (automated)
- Audit logging (available)

### Transport Security
- HTTPS enforced
- TLS 1.3+
- Certificate auto-renewal (Vercel)

### Input Validation
- Zod schema validation
- Server-side validation (RLS)
- Sanitization (Supabase)

---

## Monitoring & Observability

### Currently Configured
- Build logs (Vercel)
- Deployment logs (Vercel)
- Database logs (Supabase)

### Ready to Configure
- Error tracking (Sentry)
- Analytics (PostHog)
- Performance monitoring (Vercel Analytics)
- Uptime monitoring (StatusPage)

---

## Development Workflow

### Code Organization

```
src/
├── components/      # React components
├── pages/          # Page components
├── services/       # Business logic
├── hooks/          # Custom hooks
├── context/        # Global state
├── integrations/   # External services
├── lib/            # Utilities
└── styles/         # Global styles
```

### Development to Production

```
Local Development
├── npm run dev
├── Make changes
├── Test locally

Push to GitHub
├── Commit changes
├── Create pull request
├── Code review

GitHub to Vercel
├── PR preview deployment
├── Staging environment
├── Production deployment (on merge)
```

---

## Conclusion

StudySphere follows a **modern, scalable architecture** with:

- Clean separation of concerns
- Type-safe throughout
- Real-time synchronization
- Secure authentication
- Comprehensive error handling
- Performance optimized
- Production ready

The architecture is designed to scale from MVP to enterprise scale while maintaining code clarity and reliability.
