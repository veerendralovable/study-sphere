# StudySphere Components Reference Guide

## Quick Component Index

### Dashboard System
- **Page**: `/src/pages/Dashboard.tsx` — Main dashboard layout
- **StatsCard**: `/src/components/StatsCard.tsx` — Metric display card
- **DailyGoal**: `/src/components/DailyGoal.tsx` — Progress tracker
- **RoomCard**: `/src/components/RoomCard.tsx` — Room list item

### Room System
- **Page**: `/src/pages/Room.tsx` — Study room interface
- **RoomPageUI**: `/src/components/RoomPageUI.tsx` — Reusable room UI
- **SessionCompletion**: `/src/components/SessionCompletion.tsx` — Completion modal

### Navigation
- **AppHeader**: `/src/components/AppHeader.tsx` — Main navigation

---

## Component Details

### 1. StatsCard

**Purpose**: Display a single statistic with icon, label, and value.

**Location**: `/src/components/StatsCard.tsx`

**Usage**:
```tsx
<StatsCard
  icon={<Clock className="h-4 w-4" />}
  label="Today"
  value="2h 30m"
  extra="🔥 3 day streak"
/>
```

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `icon` | ReactNode | Yes | Icon element |
| `label` | string | Yes | Label text (uppercase) |
| `value` | ReactNode | Yes | Main value display |
| `extra` | string | No | Optional badge text |

**Styling**:
- **Default**: Dark card with gradient background
- **Hover**: Border color change, glow shadow effect
- **Icon color**: Transitions on group hover

**Where Used**:
- Dashboard stats row (4 cards)

---

### 2. DailyGoal

**Purpose**: Display daily study goal with progress bar and status.

**Location**: `/src/components/DailyGoal.tsx`

**Usage**:
```tsx
<DailyGoal todaySeconds={5400} />
```

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `todaySeconds` | number | Yes | Seconds studied today |

**Features**:
- Animated progress bar
- Status label (Not started / In progress / Completed)
- Completion badge with animation
- 2-hour goal (7200 seconds)
- Percentage display

**Styling**:
- **Card**: Gradient background, hover effects
- **Progress Bar**: Animated value changes
- **Status**: Color-coded (gray/primary/success)

**Where Used**:
- Dashboard main section

---

### 3. RoomCard

**Purpose**: Display a study room in grid/list format.

**Location**: `/src/components/RoomCard.tsx`

**Usage**:
```tsx
<RoomCard
  id="room-123"
  name="Advanced Calculus Study"
  isPrivate={false}
  memberCount={4}
  timerActive={true}
  isYours={false}
  joinLabel="Join"
  onJoin={() => navigate(`/room/${id}`)}
/>
```

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | Yes | Room unique ID |
| `name` | string | Yes | Room display name |
| `isPrivate` | boolean | Yes | Private room flag |
| `memberCount` | number | No | Active members count |
| `timerActive` | boolean | No | Timer running indicator |
| `isYours` | boolean | No | User created this room |
| `onJoin` | function | No | Join button callback |
| `joinLabel` | string | No | Button text (default: "Join") |
| `joining` | boolean | No | Loading state |

**Features**:
- Room privacy badge
- "Yours" badge for created rooms
- Member count display
- "Studying now" pulse indicator
- Join and Open buttons

**Styling**:
- **Card**: Hover border enhancement, glow shadow
- **Title**: Color transition on hover
- **Pulse**: Animated "studying now" badge
- **Arrow**: Translate animation on hover

**Where Used**:
- Dashboard room sections (Your rooms, Joined rooms, Discover)

---

### 4. SessionCompletion Modal

**Purpose**: Show session completion stats and celebration.

**Location**: `/src/components/SessionCompletion.tsx`

**Usage**:
```tsx
<SessionCompletion
  open={true}
  onClose={() => setOpen(false)}
  sessionSeconds={1800}
  todaySeconds={7200}
  sessionCount={4}
  currentStreak={7}
  badges={["🔥 Streak", "💪 Consistency"]}
/>
```

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `open` | boolean | Yes | Modal visibility |
| `onClose` | function | Yes | Close callback |
| `sessionSeconds` | number | Yes | Last session duration |
| `todaySeconds` | number | Yes | Total today |
| `sessionCount` | number | Yes | Sessions completed |
| `currentStreak` | number | Yes | Day streak count |
| `badges` | string[] | Yes | Achievement badges |

**Features**:
- Centered overlay with backdrop blur
- Trophy icon and celebration messaging
- Four stat rows with icons
- Badge display with staggered animation
- "Back to Dashboard" primary action
- Click-outside to dismiss

**Animations**:
- Modal: Fade/scale on open
- Stats: Slide-in from bottom (delay-100)
- Badges: Staggered scale-in (75ms intervals)

**Styling**:
- **Background**: Semi-transparent dark with blur
- **Card**: Gradient with soft shadow
- **Stats**: Secondary background with rounded corners
- **Badges**: Primary color with semi-transparent background

**Where Used**:
- Room page on session completion

---

### 5. RoomPageUI

**Purpose**: Reusable room interface components.

**Location**: `/src/components/RoomPageUI.tsx`

**Usage**:
```tsx
<RoomPageUI
  roomName="Advanced Calculus Study"
  roomCode="ABC123"
  isPrivate={false}
  examMode={false}
  isCreator={true}
  members={memberList}
  currentUserId={userId}
  onCopyCode={() => navigator.clipboard.writeText(code)}
  onRemoveMember={(userId) => removeMember(userId)}
/>
```

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `roomName` | string | Yes | Room title |
| `roomCode` | string | No | Join code |
| `isPrivate` | boolean | Yes | Private flag |
| `examMode` | boolean | Yes | Exam mode flag |
| `isCreator` | boolean | Yes | User is creator |
| `members` | RoomMember[] | Yes | Member list |
| `currentUserId` | string | No | Current user ID |
| `onCopyCode` | function | No | Code copy callback |
| `onRemoveMember` | function | No | Member removal callback |

**Features**:
- Header with room name and badges
- Room code display and copy button
- Exam mode warning banner
- Member list with roles
- Creator indicator (crown icon)
- Current user highlight
- Remove member functionality (creator only)

**Member Item Styling**:
- **Current User**: Primary background with border
- **Other Members**: Secondary background
- **Hover**: Enhanced background, glow shadow
- **Avatar**: Letter initial in colored circle

**Where Used**:
- Can be extracted for Room page or other contexts

---

### 6. AppHeader

**Purpose**: Main navigation header with logo and user menu.

**Location**: `/src/components/AppHeader.tsx`

**Usage**:
```tsx
<AppHeader onProfile={() => setProfileOpen(true)} />
```

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onProfile` | function | No | Profile button callback |

**Features**:
- StudySphere logo with gradient background
- Profile button
- Sign out button
- Sticky positioning
- Backdrop blur effect

**Styling**:
- **Background**: Dark with slight transparency and blur
- **Logo**: Gradient primary background with glow shadow
- **Logo Hover**: Scale up animation
- **Text**: Smooth color transition on hover
- **Buttons**: Ghost variant with smooth transitions

**Where Used**:
- Every page (sticky header)

---

## Design Tokens & Styling

### Color System
```
Primary:     hsl(168 76% 48%)  — Teal/Cyan
Accent:      hsl(252 80% 65%)  — Purple
Success:     hsl(142 65% 48%)  — Green
Warning:     hsl(38 95% 58%)   — Yellow
Destructive: hsl(0 72% 58%)    — Red
```

### Shadow System
```
shadow-card:  0 8px 30px -12px rgba(0, 0, 0, 0.5)
shadow-glow:  0 10px 40px -12px hsl(var(--primary) / 0.35)
```

### Transitions
```
transition-base: 200ms cubic-bezier(0.2, 0.8, 0.2, 1)
```

### Typography Scale
```
text-xs    — 12px (labels, badges)
text-sm    — 14px (secondary text)
text-base  — 16px (body text)
text-lg    — 18px (room names in card)
text-2xl   — 24px (stat values)
text-3xl   — 30px (page titles)
```

### Spacing Scale
```
p-3  — 12px (compact)
p-4  — 16px (default)
p-5  — 20px (card)
p-6  — 24px (card large)
p-8  — 32px (section)

gap-2 — 8px
gap-3 — 12px
gap-4 — 16px
gap-6 — 24px
```

---

## Micro-Interactions Reference

### Button States
```tsx
// Default
<Button>Text</Button>

// Hover + Active
className="transition-all active:scale-95 hover:opacity-90"

// Loading
disabled={loading}
{loading ? "Loading..." : "Text"}

// Disabled
disabled={true}
className="opacity-50 cursor-not-allowed"
```

### Card Hover Effects
```tsx
className="transition-base hover:border-primary/30 hover:shadow-glow"
```

### Text Color Transitions
```tsx
className="text-muted-foreground transition-colors group-hover:text-primary"
```

### Icon Animations
```tsx
className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
```

### Entrance Animations
```tsx
// Fade in from bottom
className="animate-in fade-in slide-in-from-bottom-2 duration-500"

// Staggered badges
style={{ animationDelay: `${50 + i * 75}ms` }}
```

---

## Common Patterns

### Loading State
```tsx
{loading ? (
  <div className="animate-pulse">
    <Card className="h-36 bg-gradient-card" />
  </div>
) : (
  // Content
)}
```

### Empty State
```tsx
<Card className="border-dashed bg-transparent p-10 text-center">
  <div className="mb-3 flex justify-center">
    <Icon className="h-5 w-5 text-muted-foreground" />
  </div>
  <p className="text-muted-foreground">{message}</p>
  {cta && <Button className="mt-4">{ctaText}</Button>}
</Card>
```

### Form Input
```tsx
<div className="flex items-center gap-2 rounded-md border border-input bg-background px-3">
  <Icon className="h-4 w-4 text-muted-foreground" />
  <Input 
    className="border-0 px-0 focus-visible:ring-0"
    placeholder="Search..."
  />
</div>
```

### Badge System
```tsx
// Secondary (default)
<Badge variant="secondary">Label</Badge>

// Outline
<Badge variant="outline">Label</Badge>

// Destructive
<Badge variant="destructive">Alert</Badge>
```

---

## Accessibility Features

✅ **Semantic HTML**: Proper heading levels, `<main>`, `<header>`
✅ **ARIA Labels**: Screen reader text where needed
✅ **Focus States**: Clear visual indicators for keyboard navigation
✅ **Color Contrast**: WCAG AA compliant
✅ **Touch Targets**: 44px minimum for mobile buttons
✅ **Keyboard Navigation**: Full support for all interactive elements
✅ **Disabled States**: Clear visual feedback

---

## Performance Optimizations

✅ **CSS-only animations**: No JavaScript animation overhead
✅ **Hardware acceleration**: `transform` and `opacity` changes
✅ **Smooth 60fps**: Cubic-bezier timing functions
✅ **No layout shifts**: Transitions on safe properties only
✅ **Minimal reflows**: Flexbox/Grid for layout
✅ **Mobile-optimized**: Touch-friendly spacing and sizing

---

## Quick Copy-Paste Examples

### Dashboard Card
```tsx
<Card className="bg-gradient-card border-border/60 p-5 shadow-card transition-base hover:border-primary/30 hover:shadow-glow">
  {/* Content */}
</Card>
```

### Interactive Button
```tsx
<Button className="transition-all active:scale-95">
  <Icon className="mr-2 h-4 w-4" />
  Text
</Button>
```

### Member Item
```tsx
<li className="flex items-center justify-between rounded-lg p-3 transition-all hover:shadow-glow bg-secondary/40 hover:bg-secondary/60">
  {/* Content */}
</li>
```

---

## File Structure

```
src/
├── components/
│   ├── AppHeader.tsx
│   ├── DailyGoal.tsx
│   ├── RoomCard.tsx
│   ├── RoomPageUI.tsx ← NEW
│   ├── SessionCompletion.tsx
│   ├── StatsCard.tsx ← NEW
│   └── ui/
│       └── [shadcn components]
├── pages/
│   ├── Dashboard.tsx
│   └── Room.tsx
├── App.tsx
└── index.css [Design tokens]
```

---

## Troubleshooting

### Hover effects not showing
- Check if parent has `group` class
- Use `group-hover:` prefix for child elements

### Animation not smooth
- Verify `transition-base` or custom transition is applied
- Check for conflicting animation properties
- Use `transform` or `opacity` for smooth animations

### Badge spacing issue
- Use `flex flex-wrap justify-center gap-2` for badge groups
- Add proper padding to container

### Color contrast issue
- Check against WCAG AA standards
- Use `text-balance` for readability
- Test with color contrast tools

---

## Version & Updates

**Current Version**: 1.0.0
**Last Updated**: April 29, 2026
**Framework**: React 19+ with Tailwind CSS
**Component Library**: shadcn/ui
**Status**: Production Ready ✅
