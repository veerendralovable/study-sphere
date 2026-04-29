# StudySphere - Deployment & Operations Guide

## Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account (free or paid)
- Vercel account (optional, for hosting)
- Git repository

---

## Environment Setup

### 1. Supabase Configuration

All required environment variables are already set up in your Vercel project:

```env
# Database
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
POSTGRES_HOST=

# Supabase Authentication
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_JWT_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
```

These are configured in your Vercel project Settings > Environment Variables.

### 2. Local Development

Create a `.env.local` file in your project root:

```bash
# Copy from Vercel project settings
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## Development Setup

### Install Dependencies

```bash
# Using npm
npm install

# Or using pnpm (faster)
pnpm install

# Or using yarn
yarn install
```

### Start Development Server

```bash
npm run dev
# Server runs at http://localhost:5173
```

### Build for Production

```bash
npm run build
npm run preview  # Test production build locally
```

---

## Database Schema

### Core Tables

#### `profiles`
Stores user profile information
```sql
id (UUID, PK)
name (VARCHAR)
email (VARCHAR)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### `rooms`
Study rooms created by users
```sql
id (UUID, PK)
name (VARCHAR)
created_by (UUID, FK to auth.users)
is_private (BOOLEAN)
exam_mode (BOOLEAN)
room_code (VARCHAR, 12-char unique code)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### `room_members`
Membership tracking for rooms
```sql
id (UUID, PK)
user_id (UUID, FK to auth.users)
room_id (UUID, FK to rooms)
role (VARCHAR) - 'creator' or 'member'
status (VARCHAR) - 'active', 'left', 'removed'
joined_at (TIMESTAMP)
```

#### `study_sessions`
Records of study sessions in rooms
```sql
id (UUID, PK)
user_id (UUID, FK to auth.users)
room_id (UUID, FK to rooms)
start_time (TIMESTAMP)
end_time (TIMESTAMP, nullable)
duration (INTEGER, seconds)
created_at (TIMESTAMP)
```

#### `timers`
Shared timers per room
```sql
id (UUID, PK)
room_id (UUID, FK to rooms, unique)
start_time (TIMESTAMP, nullable)
duration (INTEGER, seconds)
is_active (BOOLEAN)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### `rooms_public` (VIEW)
Public view of rooms without room_code
Used for discovery - RLS ensures code privacy
```sql
id, name, is_private, created_by, created_at, exam_mode
```

### RLS Policies

#### Profiles Table
- Users can read their own profile
- Users can update their own profile
- Service role can read all

#### Rooms Table
- Authenticated users can read public rooms
- Members can read rooms they're in
- Only creator can update their rooms
- Service role can read all

#### Room Members Table
- Members can read members in their rooms
- Creator can manage members
- Service role can read all

#### Study Sessions Table
- Users can read their own sessions
- Service role can read all

#### Timers Table
- Members can read timers for rooms they're in
- Service role can manage all

---

## Deployment to Vercel

### 1. Connect Repository

```bash
# Push your code to GitHub
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

### 2. Create Vercel Project

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project settings:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 3. Add Environment Variables

In Vercel project settings:

1. Go to Settings > Environment Variables
2. Add all Supabase variables
3. Select environments: Production, Preview, Development

### 4. Deploy

```bash
vercel deploy --prod
```

Or just push to main branch - Vercel will auto-deploy.

---

## Health Checks & Monitoring

### 1. Test Authentication

```bash
# Try signing up
curl -X POST https://your-app.vercel.app/api/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 2. Test Database Connection

```javascript
// In browser console or test script
import { supabase } from '@/integrations/supabase/client'
const { data } = await supabase.from('profiles').select('count')
console.log(data)
```

### 3. Monitor Real-time Subscriptions

Check browser DevTools Network tab:
- WebSocket connections to Supabase should show `wss://...`
- Real-time updates should reflect instantly

### 4. Check Logs

**Vercel Logs**
```bash
vercel logs
```

**Supabase Logs**
- Go to Supabase dashboard
- Database > Logs
- Check for query errors

---

## Troubleshooting

### Issue: "401 Unauthorized" Errors

**Solution:**
1. Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is set
2. Check Supabase JWT expiry settings
3. Clear browser localStorage and try again

### Issue: Real-time Subscriptions Not Working

**Solution:**
1. Check WebSocket connection in DevTools
2. Verify RLS policies allow your user
3. Check Supabase realtime configuration is enabled
4. Restart dev server

### Issue: Database Connection Errors

**Solution:**
1. Verify POSTGRES_URL is correct in env
2. Check Supabase project is active
3. Verify IP whitelisting if applicable
4. Check database connection limits

### Issue: Session Expires Immediately

**Solution:**
1. Check SUPABASE_JWT_SECRET is set correctly
2. Verify browser supports cookies/storage
3. Check browser's Privacy settings
4. Clear browser cache

### Issue: Room Code Not Working

**Solution:**
1. Verify room_code column exists in rooms table
2. Check RLS policies for joinByCode RPC
3. Test RPC directly in Supabase SQL editor
4. Verify code format is 12 characters

---

## Performance Optimization

### Frontend Optimization

1. **Code Splitting**
   ```javascript
   // Use React.lazy for route splitting
   const Dashboard = lazy(() => import('./pages/Dashboard'))
   ```

2. **Image Optimization**
   - Compress images to <100KB
   - Use WebP format
   - Lazy load images

3. **Bundle Size**
   ```bash
   npm run build
   # Check dist folder size
   ```

### Backend Optimization

1. **Database Indexing**
   ```sql
   CREATE INDEX idx_room_members_user_id ON room_members(user_id);
   CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
   CREATE INDEX idx_rooms_created_by ON rooms(created_by);
   ```

2. **Connection Pooling**
   - Enable PgBouncer in Supabase
   - Use POSTGRES_PRISMA_URL for app connections

3. **Query Optimization**
   - Use SELECT with specific columns
   - Add WHERE clauses to limit results
   - Use LIMIT for pagination

---

## Security Hardening

### 1. API Security

```javascript
// Add rate limiting
import rateLimit from 'express-rate-limit'
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})
```

### 2. Data Validation

```javascript
// Always validate user input
import { z } from 'zod'
const emailSchema = z.string().email()
const validated = emailSchema.parse(userEmail)
```

### 3. CORS Configuration

```javascript
// Whitelist allowed origins
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}
```

### 4. Environment Variables

- Never commit `.env` files
- Use Vercel secrets for sensitive data
- Rotate keys regularly
- Monitor key usage

### 5. Two-Factor Authentication

```javascript
// Future enhancement: Add 2FA support
// Use TOTP or SMS verification
```

---

## Backup & Recovery

### Database Backups

**Supabase Automated Backups**
- Free plan: 7-day retention
- Pro plan: 30-day retention
- Custom plan: 90+ day retention

**Manual Backup**
```bash
# Export database
pg_dump postgresql://user:password@host/db > backup.sql

# Restore
psql postgresql://user:password@host/db < backup.sql
```

### Code Backups

```bash
# Enable GitHub backups automatically
git push origin main

# Create release tags
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

---

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: vercel deploy --prod \
          --token ${{ secrets.VERCEL_TOKEN }}
```

---

## Monitoring & Alerts

### Sentry Integration

```javascript
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

### PostHog Analytics

```javascript
import posthog from 'posthog-js'

posthog.init(process.env.POSTHOG_KEY, {
  api_host: process.env.POSTHOG_HOST
})
```

### Custom Monitoring

```javascript
// Track key metrics
metrics.track('user_signup', { method: 'email' })
metrics.track('room_created', { isPrivate: true })
metrics.track('session_ended', { duration: 1200 })
```

---

## Support & Resources

### Supabase Documentation
- https://supabase.com/docs

### Vercel Documentation
- https://vercel.com/docs

### React Documentation
- https://react.dev

### TypeScript Documentation
- https://www.typescriptlang.org/docs

---

## Rollback Procedure

### If Deployment Breaks

1. **Revert Vercel Deployment**
   - Go to Vercel dashboard
   - Click previous successful deployment
   - Click "Promote to Production"

2. **Revert Git Changes**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Check Database State**
   - Verify data integrity in Supabase
   - Review failed migrations
   - Restore from backup if needed

4. **Notify Users**
   - Post status update
   - Provide ETA for fix

---

## Ongoing Maintenance

### Weekly
- Monitor error logs in Sentry
- Check database performance in Supabase
- Review user feedback

### Monthly
- Update dependencies: `npm update`
- Audit security vulnerabilities: `npm audit`
- Review analytics in PostHog
- Backup critical data

### Quarterly
- Load test the application
- Security audit
- Code review and refactoring
- Plan next features

---

## Success Metrics

Track these to measure health:

- **Availability**: Target 99.9% uptime
- **Performance**: <2s first contentful paint
- **Error Rate**: <0.1% failed requests
- **User Growth**: Month-over-month increase
- **Engagement**: Daily active users
- **Session Duration**: Average study time
- **Retention**: Weekly/monthly return rate

---

## Contact & Support

For issues or questions:
1. Check troubleshooting guide above
2. Review Supabase documentation
3. Check GitHub issues
4. Open a support ticket
5. Contact development team
