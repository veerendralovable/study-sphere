# StudySphere UI System — Quick Start Guide

## 🚀 Getting Started in 2 Minutes

### View the Implementation
1. Check the preview to see the UI system in action
2. All components are production-ready and fully functional
3. Design system tokens are in `/src/index.css`

### Key Files to Know

**Components**:
- `src/components/StatsCard.tsx` — Stats metric display
- `src/components/DailyGoal.tsx` — Progress tracker
- `src/components/RoomCard.tsx` — Room list item
- `src/components/RoomPageUI.tsx` — Reusable room UI
- `src/components/SessionCompletion.tsx` — Completion modal
- `src/components/AppHeader.tsx` — Main navigation

**Pages**:
- `src/pages/Dashboard.tsx` — Main dashboard
- `src/pages/Room.tsx` — Study room interface

**Design System**:
- `src/index.css` — All design tokens and utilities
- `tailwind.config.ts` — Tailwind configuration

---

## 🎨 Using Components

### StatsCard
```tsx
import { StatsCard } from "@/components/StatsCard";
import { Clock } from "lucide-react";

<StatsCard
  icon={<Clock className="h-4 w-4" />}
  label="Today"
  value="2h 30m"
  extra="🔥 3 day streak"
/>
```

### DailyGoal
```tsx
import { DailyGoal } from "@/components/DailyGoal";

<DailyGoal todaySeconds={5400} />
```

### RoomCard
```tsx
import { RoomCard } from "@/components/RoomCard";

<RoomCard
  id="room-123"
  name="Study Session"
  isPrivate={false}
  memberCount={4}
  timerActive={true}
  joinLabel="Join"
  onJoin={() => handleJoin()}
/>
```

### RoomPageUI
```tsx
import { RoomPageUI } from "@/components/RoomPageUI";

<RoomPageUI
  roomName="Advanced Calculus"
  roomCode="ABC123"
  isPrivate={false}
  examMode={false}
  isCreator={true}
  members={memberList}
  currentUserId={userId}
  onRemoveMember={(id) => removeMember(id)}
/>
```

---

## 🎯 Styling Patterns

### Interactive Button
```tsx
<Button className="transition-all active:scale-95">
  <Icon className="mr-2 h-4 w-4" />
  Click me
</Button>
```

### Hoverable Card
```tsx
<Card className="bg-gradient-card border-border/60 p-5 shadow-card transition-base hover:border-primary/30 hover:shadow-glow">
  Content
</Card>
```

### Group Hover Effect
```tsx
<Card className="group ...">
  <h3 className="group-hover:text-primary transition-colors">Title</h3>
  <p className="text-muted-foreground group-hover:text-foreground">Text</p>
</Card>
```

### Loading State
```tsx
{loading ? (
  <div className="animate-pulse">
    <Card className="h-36 bg-gradient-card" />
  </div>
) : (
  <div>Content</div>
)}
```

---

## 🎭 Animation Classes

### Entrance Animations
```tsx
// Fade in from bottom
animate-in fade-in slide-in-from-bottom-2 duration-500

// Staggered with delay
animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100

// Scale in
animate-in scale-in-95 duration-500
```

### Interactive Animations
```tsx
// Button press
active:scale-95

// Icon translation
group-hover:translate-x-1

// Logo scale
group-hover:scale-105

// Pulse effect
animate-pulse
```

### Transition Times
```tsx
// Standard
transition-base (200ms cubic-bezier)

// Custom
transition-all duration-300

// Per property
transition-colors
transition-transform
```

---

## 🎨 Color System

### Using Colors
```tsx
// Primary (teal)
text-primary
bg-primary
border-primary
hover:border-primary/30

// Success (green)
text-success
bg-success

// Destructive (red)
text-destructive
bg-destructive/10

// Muted (gray)
text-muted-foreground
bg-secondary/40
```

### Color Opacity
```tsx
primary/10    // 10% opacity
primary/20    // 20% opacity
primary/30    // 30% opacity
primary/40    // 40% opacity
primary/60    // 60% opacity
```

---

## ♿ Accessibility

### Semantic HTML
```tsx
<header>    {/* Navigation */}
<main>      {/* Main content */}
<section>   {/* Content sections */}
<nav>       {/* Navigation links */}
<button>    {/* Interactive elements */}
<a>         {/* Links */}
```

### ARIA Labels
```tsx
<button aria-label="Close menu">
  <X className="h-4 w-4" />
</button>

<div role="status" aria-live="polite">
  {message}
</div>
```

### Focus States
```tsx
<button className="focus-visible:ring-2 focus-visible:ring-primary">
  Tab to focus
</button>
```

### Screen Reader Only Text
```tsx
<span className="sr-only">Accessibility text</span>
```

---

## 📱 Responsive Design

### Breakpoints
```tsx
// Mobile (default)
<div className="...">

// Tablet (640px)
sm:grid-cols-2
sm:w-auto

// Desktop (1024px)
lg:grid-cols-4
lg:text-xl

// Large desktop (1280px)
xl:max-w-7xl
```

### Mobile-First Pattern
```tsx
// Base: mobile layout
<div className="grid grid-cols-1 gap-4
  // Tablet: 2 columns
  sm:grid-cols-2
  // Desktop: 4 columns
  lg:grid-cols-4">
</div>
```

---

## 🔧 Customization

### Change Primary Color
Edit `/src/index.css`:
```css
--primary: 168 76% 48%;  /* Change this HSL value */
```

### Add Custom Animation
Edit `tailwind.config.ts`:
```ts
keyframes: {
  "custom": {
    "0%": { opacity: "0" },
    "100%": { opacity: "1" }
  }
},
animation: {
  "custom": "custom 200ms ease-out"
}
```

### Adjust Spacing
Use Tailwind scale:
```tsx
gap-2  /* 8px */
gap-4  /* 16px */
gap-6  /* 24px */
p-4    /* 16px padding */
p-6    /* 24px padding */
```

---

## 🐛 Common Issues & Fixes

### Hover effects not showing
**Problem**: Group hover not working
**Solution**: Add `group` class to parent, use `group-hover:` prefix

### Animation jank
**Problem**: Animation not smooth
**Solution**: Use `transform` or `opacity` properties only

### Button disabled state
**Problem**: Disabled button not showing properly
**Solution**: Use `disabled:opacity-50 disabled:cursor-not-allowed`

### Color not visible
**Problem**: Color contrast too low
**Solution**: Use higher opacity or darker color variant

### Text wrapping issues
**Problem**: Text breaking unexpectedly
**Solution**: Use `text-balance` or `truncate` classes

---

## 📚 Documentation Files

**Complete References**:
- `IMPLEMENTATION_SUMMARY.md` — Full implementation details
- `COMPONENTS_REFERENCE.md` — Detailed component docs
- `CHANGELOG.md` — All changes made

**This File**: Quick reference and common patterns

---

## ✅ Quality Checklist

Before shipping new features:
- [ ] Component works in all browsers
- [ ] Mobile responsive (test on phone)
- [ ] Keyboard navigation works (Tab key)
- [ ] Colors have sufficient contrast
- [ ] Animations perform smoothly (60fps)
- [ ] Touch targets are 44px minimum
- [ ] No console errors
- [ ] TypeScript strict mode passes

---

## 🚀 Performance Tips

### Do's ✅
- Use Tailwind utility classes
- Animate with `transform` and `opacity`
- Use `transition-base` for consistency
- Add `will-change: transform` if needed
- Test animations on real devices

### Don'ts ❌
- Don't animate `width`, `height`, `position`
- Don't use JavaScript animations for simple effects
- Don't change too many properties at once
- Don't use `animation` when `transition` works
- Don't forget `transition` on interactive elements

---

## 📞 Need Help?

1. **Component usage**: See `COMPONENTS_REFERENCE.md`
2. **Design system**: See `IMPLEMENTATION_SUMMARY.md`
3. **Recent changes**: See `CHANGELOG.md`
4. **Code examples**: Look at existing page/component usage
5. **TypeScript errors**: Check component prop interfaces

---

## 🎓 Learning Resources

### Tailwind CSS
- Classes: Use IntelliSense autocomplete in editor
- Colors: See `/src/index.css` for all available colors
- Responsive: Prefix with `sm:`, `md:`, `lg:`, `xl:`
- Docs: tailwindcss.com

### React
- Hooks: useEffect, useState already in components
- Context: AuthContext for user state
- Router: React Router for navigation
- Docs: react.dev

### shadcn/ui
- Button, Card, Badge, Input, etc.
- Pre-built components with Tailwind styling
- Located in: `/src/components/ui/`
- Docs: ui.shadcn.com

---

## 🎯 Common Tasks

### Add a new stat card to dashboard
```tsx
import { StatsCard } from "@/components/StatsCard";

// In your JSX:
<StatsCard
  icon={<IconComponent className="h-4 w-4" />}
  label="Your Label"
  value="Your Value"
  extra="Optional badge"
/>
```

### Create a new hoverable card
```tsx
<Card className="bg-gradient-card border-border/60 p-5 shadow-card transition-base hover:border-primary/30 hover:shadow-glow">
  Your content
</Card>
```

### Add button interaction
```tsx
<Button 
  onClick={handleClick}
  disabled={isLoading}
  className="transition-all active:scale-95"
>
  {isLoading ? "Loading..." : "Click me"}
</Button>
```

### Add entrance animation
```tsx
<div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
  Animated content
</div>
```

---

## 💡 Pro Tips

1. **Use `group` + `group-hover:`** for complex hover effects
2. **Always add `transition-` class** to interactive elements
3. **Use `text-balance`** for better typography
4. **Add `sr-only`** class for accessibility text
5. **Test animations on low-end devices** for performance
6. **Use CSS variables** from `index.css` for consistency
7. **Keep animations under 300ms** for snappy feel
8. **Always provide focus states** for keyboard users

---

## 🎉 You're All Set!

The StudySphere UI system is complete and ready to use. Start building beautiful, accessible interfaces with confidence!

**Happy coding! 🚀**
