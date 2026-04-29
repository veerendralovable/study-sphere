# StudySphere Troubleshooting Guide

## Common Issues and Solutions

### 1. **404 Page Not Found on "/" Route**

**Problem**: App loads with "404 Not Found" message

**Causes & Solutions**:

#### A. Missing Environment Variables
If you see "Missing SUPABASE_URL environment variable" error:

1. Go to Vercel project settings
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
4. Redeploy the application

#### B. Blank/White Screen with 404
If the page is completely blank or showing 404:

1. **Check browser console** (F12 → Console)
2. Look for JavaScript errors
3. Common error messages:
   - `Uncaught TypeError: Cannot read property 'auth' of undefined` → Supabase client not initialized
   - `Missing environment variable` → See section A above
   - `Could not find a router context` → React Router not properly initialized

#### C. Loading Forever
If the page shows "Loading your study space..." indefinitely:

1. Check if Supabase is accessible
2. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
3. Check browser network tab (F12 → Network) for failed requests
4. Ensure `.edu` domain restriction is not blocking your testing email

---

### 2. **Authentication Issues**

#### Login/Signup Not Working
**Error**: "Sign in failed" or "Unable to create user"

**Solutions**:
- Check if email is valid `.edu` address
- Verify Supabase Auth is enabled in project
- Check database for `auth.users` table
- Clear browser localStorage: `localStorage.clear()` in console

#### Session Expired Message
**Error**: "Session expired — please sign in again"

**Solutions**:
- This is normal after ~1 hour of inactivity
- Simply sign in again
- For development, you can check RLS policies in Supabase dashboard

---

### 3. **Page Loading Issues**

#### Dashboard Shows Nothing
**Problem**: Dashboard page loads but is empty

**Debugging Steps**:
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for failed API calls
4. Verify user is logged in (check AuthContext)

**Common Causes**:
- User profile not created in database
- RLS policies preventing data access
- Supabase connection error

---

### 4. **Real-time Features Not Working**

#### Timer Not Syncing
**Problem**: Room timer not updating in real-time

**Solutions**:
1. Check if WebSocket connection is active (Network tab → WS)
2. Verify room member is subscribed to timer updates
3. Check browser console for connection errors
4. Refresh the page and try again

#### Member List Not Updating
**Problem**: New members don't appear in member list

**Solutions**:
1. Click "Refresh" or reload page
2. Check Supabase realtime subscriptions are enabled
3. Verify RLS policies allow reading member data
4. Check `room_members` table in Supabase

---

### 5. **Build and Deployment Issues**

#### Build Fails
**Error**: `npm run build` fails

**Solutions**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

#### TypeScript Errors
**Error**: `npx tsc --noEmit` shows errors

**Common Errors**:
- `Cannot find module '@/...'` → Check path alias in tsconfig.json
- `Property does not exist` → Check component imports
- `Type mismatch` → Check function signatures

**Solutions**:
1. Verify all imports use correct paths
2. Run `npm install` to ensure all dependencies
3. Check TypeScript version: `npm ls typescript`

---

### 6. **Performance Issues**

#### App Feels Slow
**Solutions**:
1. Check bundle size: `npm run build` output
2. Use DevTools Performance tab to profile
3. Check Network tab for slow requests
4. Verify Supabase region is close to users

#### High Memory Usage
**Causes**:
- Large number of realtime subscriptions
- Memory leaks in components

**Solutions**:
1. Check for cleanup in useEffect hooks
2. Verify subscriptions are unsubscribed on unmount
3. Use React DevTools Profiler to find bottlenecks

---

### 7. **Database Issues**

#### "Permission denied" Errors
**Problem**: Getting permission denied when accessing data

**Solutions**:
1. Check RLS policies in Supabase dashboard
2. Verify authenticated user has correct role
3. Check if user_id matches in database
4. Test queries directly in Supabase SQL editor

#### Connection Pool Exhausted
**Error**: `Too many connections` or connection timeout

**Solutions**:
1. Check number of active connections in Supabase
2. Close unused database connections
3. Use connection pooling (Supabase handles this)
4. Contact Supabase support if persistent

---

### 8. **Email Verification Issues**

#### Confirmation Email Not Arriving
**Problem**: Email verification email not received

**Solutions**:
1. Check spam folder
2. Verify email address is correct
3. Check Supabase email settings
4. Use Supabase dashboard to manually verify user

#### Link Expired
**Error**: "Token expired" or "Invalid link"

**Solutions**:
- Verification links expire after 1 hour
- Request new verification email
- Check that app URL is correct in Supabase settings

---

### 9. **Development Server Issues**

#### Port Already in Use
**Error**: `Port 5173 is already in use`

**Solutions**:
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

#### HMR Connection Failed
**Error**: "Failed to fetch hotUpdate"

**Solutions**:
1. Check firewall isn't blocking WebSocket
2. Verify `vite.config.ts` HMR settings
3. Try hard refresh (Ctrl+Shift+R)
4. Restart dev server

---

### 10. **Debugging Tips**

#### Enable Debug Logging
The app logs to console with `[v0]` prefix:

```typescript
console.log("[v0] Message here");
```

To filter in DevTools:
1. Open Console (F12)
2. Type filter: `[v0]`

#### Check Supabase Status
```javascript
// In browser console
import { supabase } from "@/integrations/supabase/client"
supabase.auth.getSession().then(s => console.log(s))
```

#### Test Database Connection
```bash
# Via psql (if you have postgres client)
psql postgresql://[user]:[password]@[host]/[database]

# Or use Supabase SQL editor in dashboard
SELECT * FROM users LIMIT 5;
```

---

## Getting Help

**Before asking for help, gather this information**:
1. Error message (full text)
2. Browser console errors (F12 → Console)
3. Network tab errors (F12 → Network)
4. Steps to reproduce
5. Environment details (OS, browser version)
6. Recent changes made

**Where to get help**:
1. Check this guide first
2. Review project documentation
3. Check Supabase docs
4. Check React Router docs
5. Contact team support

---

## Quick Debug Checklist

- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Check environment variables in Vercel
- [ ] Verify Supabase project is active
- [ ] Check browser console for errors (F12)
- [ ] Check Network tab for failed requests
- [ ] Verify internet connection
- [ ] Try in incognito/private mode
- [ ] Restart dev server
- [ ] Clear node_modules and reinstall
- [ ] Check git status for uncommitted changes

---

## Still Stuck?

1. Open issue with complete error details
2. Provide reproduction steps
3. Share browser console output
4. Mention last known working state
5. Include environment details

**Remember**: Most issues are environment configuration related. Start by verifying environment variables!

---

**Last Updated**: 4/29/2026
**Status**: Complete & Production Ready
