# Troubleshooting Guide
# PelangiManager - Capsule Hostel Management System

**Document Version:** 1.0  
**Date:** August 9, 2025  
**Project:** Pelangi Capsule Hostel Management System  

---

## Issue Database

### 001 - Connection Problem / Server Crashes (SOLVED)

**Date Solved:** August 9, 2025  
**Symptoms:**
- "Connection Problem, please check your internet connection and try again" toast appears
- Occurs when accessing Check-in, Check-out pages, Settings > Save Settings, Report Capsule Problem
- Login shows "Login failed..." even with correct credentials
- Browser DevTools shows "Failed to fetch" network errors

**Root Cause:**
- Server error middleware was rethrowing errors after sending response (`throw err;`)
- This crashed the Node.js process, causing subsequent requests to fail
- Browser interpreted crashed server as network connectivity issues

**Solution Steps:**
1. **Stop and restart server with clean environment:**
   ```powershell
   # Stop running server (Ctrl+C)
   cd "C:\Users\Jyue\Desktop\PelangiManager"
   Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
   npm run dev
   ```

2. **Clear browser auth cache:**
   - Chrome DevTools > Application > Local Storage > http://localhost:5000
   - Remove `auth_token` key
   - Refresh page

3. **Test with correct credentials:**
   - Email: `admin@pelangi.com`, Password: `admin123`
   - OR Username: `admin`, Password: `admin123`

**Technical Fix Applied:**
- Modified `server/index.ts` error middleware to log errors without rethrowing
- Before: `res.status(status).json({ message }); throw err;` (crashed server)
- After: Logs error context and returns JSON response safely

**Files Modified:**
- `server/index.ts` - Fixed error middleware to prevent server crashes

**Prevention:**
- Always restart dev server after pulling code changes
- Use `Remove-Item Env:DATABASE_URL` to ensure in-memory storage mode
- Monitor server console for stack traces indicating crashes

---

### 002 - Active Problems Not Displaying (SOLVED)

**Date Solved:** August 9, 2025  
**Symptoms:**
- Problem reporting succeeds with "Problem Reported" message
- Active problems section remains empty even after refresh
- Problems are created but not visible in Settings > Maintenance tab

**Root Cause:**
- Settings page was calling `/api/problems` which returns `PaginatedResponse<CapsuleProblem>`
- Frontend code expected simple `CapsuleProblem[]` array
- Type mismatch caused active problems to never display

**Solution Steps:**
1. **Update the problems query in Settings page:**
   ```typescript
   // Before: Expected CapsuleProblem[]
   const { data: problems = [], isLoading: problemsLoading } = useQuery<CapsuleProblem[]>({
     queryKey: ["/api/problems"],
   });

   // After: Handle PaginatedResponse properly
   const { data: problemsResponse, isLoading: problemsLoading } = useQuery<PaginatedResponse<CapsuleProblem>>({
     queryKey: ["/api/problems"],
   });
   const problems = problemsResponse?.data || [];
   ```

2. **Add missing import:**
   ```typescript
   import { type PaginatedResponse } from "@shared/schema";
   ```

**Technical Fix Applied:**
- Modified `client/src/pages/settings.tsx` to handle paginated API response
- Added proper type annotations for PaginatedResponse
- Extract problems array from response.data property

**Files Modified:**
- `client/src/pages/settings.tsx` - Fixed problems query and data extraction

**Verification:**
- Report a capsule problem → Should show "Problem Reported" success
- Go to Settings > Maintenance tab → Problem should appear in "Active Problems"
- Refresh page → Problem should persist in the list

---

### 003 - Problem Deletion Shows Success But Doesn't Delete (SOLVED)

**Date Solved:** August 9, 2025  
**Symptoms:**
- "Problem Deleted" success message appears when deleting active problems
- Problem remains visible in active problems list even after refresh
- Delete action appears to succeed but has no effect

**Root Cause:**
- Frontend sends DELETE request to `/api/problems/${id}`
- Server route handler for DELETE `/api/problems/:id` was missing completely
- Frontend shows success message from mutation, but server returns 404 (not found)
- React Query doesn't refetch because it thinks the operation succeeded

**Solution Steps:**
1. **Add DELETE endpoint to server routes:**
   ```typescript
   // Delete problem
   app.delete("/api/problems/:id", authenticateToken, async (req: any, res) => {
     try {
       const { id } = req.params;
       const deleted = await storage.deleteProblem(id);
       if (!deleted) {
         return res.status(404).json({ message: "Problem not found" });
       }
       res.json({ message: "Problem deleted successfully" });
     } catch (error: any) {
       res.status(400).json({ message: error.message || "Failed to delete problem" });
     }
   });
   ```

2. **Add deleteProblem method to storage interface:**
   ```typescript
   deleteProblem(problemId: string): Promise<boolean>;
   ```

3. **Implement deleteProblem in both storage classes:**
   - MemStorage: Remove from Map and update capsule availability if needed
   - DatabaseStorage: Delete from database using Drizzle ORM

**Technical Fix Applied:**
- Added `/api/problems/:id` DELETE endpoint in `server/routes.ts`
- Added `deleteProblem` method to IStorage interface
- Implemented `deleteProblem` in both MemStorage and DatabaseStorage classes
- Fixed logic to mark capsule as available when last active problem is deleted

**Files Modified:**
- `server/routes.ts` - Added DELETE endpoint for problems
- `server/storage.ts` - Added deleteProblem interface and implementations

**Verification:**
- Delete an active problem → Should show "Problem Deleted" success
- Refresh Settings > Maintenance tab → Problem should be removed from list
- Check capsule availability → Should be marked as available if it was the last active problem

---

### 004 - Settings page runtime error: CapsulesTab is not defined (SOLVED)

**Date Solved:** August 9, 2025  
**Symptoms:**
- Visiting `http://localhost:5000/settings` shows Vite overlay: `CapsulesTab is not defined`
- Stack points to `client/src/pages/settings.tsx:163`

**Root Cause:**
- New Capsules tab added to Settings referenced `<CapsulesTab ... />` but component was not implemented

**Solution Steps:**
1. Implement a minimal `CapsulesTab` component inside `client/src/pages/settings.tsx`
2. Import `Building` icon and render basic capsule list
3. Ensure capsules query is enabled for `activeTab === "capsules"`

**Technical Fix Applied:**
- Added `CapsulesTab` component (minimal, lists capsules with availability badges)
- Updated tabs to include Capsules tab and icon
- Enabled `/api/capsules` query for Capsules tab

**Files Modified:**
- `client/src/pages/settings.tsx`

**Verification:**
- Navigate to `http://localhost:5000/settings` → Page loads without runtime error
- Capsules tab renders with list of capsules

---

## Common Issues Reference

### Network/Connection Errors
- **"Connection Problem" toast** → Server likely crashed, restart with clean env
- **"Failed to fetch" in DevTools** → Server process terminated, check error middleware
- **Login works but other pages fail** → Partial server crash, restart required

### Authentication Issues
- **"Login failed" with correct credentials** → Server crash during auth, restart server
- **Redirected to login on protected pages** → Clear `auth_token` from localStorage
- **API returns 401 on valid requests** → Token expired or corrupted, re-login

### Development Setup
- **Server won't start** → Check Node.js version (requires 18+), run `npm install`
- **Port 5000 busy** → Set `PORT=5001` in `.env` file
- **Database connection errors** → Remove `DATABASE_URL` env var for in-memory mode

---

## Diagnostic Commands

### Check Server Health
```powershell
# Test public endpoints
Invoke-WebRequest http://localhost:5000/api/capsules/available
Invoke-WebRequest http://localhost:5000/api/guests/checked-in

# Test authentication
$body = @{ email = 'admin@pelangi.com'; password = 'admin123' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/login -Body $body -ContentType 'application/json'
```

### Environment Reset
```powershell
# Force in-memory storage mode
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue

# Clean restart
npm run dev
```

### Browser Debug
```javascript
// Check stored auth token
localStorage.getItem('auth_token')

// Clear auth token
localStorage.removeItem('auth_token')
```

---

## Success Patterns

### Working Development Flow
1. Start server: `npm run dev`
2. Wait for "serving on port 5000" message
3. Visit http://localhost:5000
4. Login with admin@pelangi.com / admin123
5. All features should work without connection errors

### When to Restart Server
- After pulling code changes
- When seeing "Connection Problem" toasts
- After modifying server-side files
- When switching between database/in-memory modes

---

## Emergency Recovery

### Complete Reset Procedure
```powershell
# 1. Stop everything
# Ctrl+C to stop server

# 2. Clean environment
cd "C:\Users\Jyue\Desktop\PelangiManager"
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue

# 3. Fresh start
npm install
npm run dev

# 4. Clear browser data
# DevTools > Application > Storage > Clear
```

### Verification Checklist
- [ ] Server shows "serving on port 5000"
- [ ] http://localhost:5000 loads login page
- [ ] Login with admin@pelangi.com / admin123 succeeds
- [ ] Dashboard loads without errors
- [ ] Check-in page loads available capsules
- [ ] Check-out page shows current guests
- [ ] Settings > Save Settings works
- [ ] Maintenance > Report Problem works

---

**Document Control:**
- **Maintained By:** Development Team
- **Last Updated:** August 9, 2025
- **Next Review:** When new issues arise

*This guide captures proven solutions for recurring issues in PelangiManager development and deployment.*

 