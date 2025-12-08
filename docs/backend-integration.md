# Backend Integration Documentation

## Supabase Authentication Flows

This document outlines the complete authentication flows and UX implementation for the WinMix Virtual Football League application using Supabase.

### Table of Contents

1. [Overview](#overview)
2. [Authentication Context](#authentication-context)
3. [Login Flow](#login-flow)
4. [Sign Up Flow](#sign-up-flow)
5. [Password Reset Flow](#password-reset-flow)
6. [Sign Out Flow](#sign-out-flow)
7. [Protected Routes](#protected-routes)
8. [Role-Based Access Control](#role-based-access-control)
9. [Error Handling](#error-handling)
10. [User Profile Management](#user-profile-management)

---

## Overview

The authentication system is built on Supabase Auth and integrates with the `user_profiles` table to manage user roles and profile information. All authentication state is managed through the `AuthProvider` and `useAuth` hook.

### Key Features

- **Email/Password Authentication**: Users can sign up with email and password
- **Session Persistence**: Sessions are automatically persisted in browser storage
- **Email Confirmation**: Sign-up requires email confirmation via Supabase
- **Password Reset**: Users can request password reset OTP links via email
- **Role-Based Access**: Admin, Analyst, and User roles control access to features
- **User Profiles**: Extended user information (display name, role, avatar) stored in `user_profiles` table

---

## Authentication Context

### useAuth Hook

The `useAuth` hook provides access to authentication state and methods:

```typescript
interface AuthContextType {
  user: User | null           // Supabase auth user
  profile: UserProfile | null // Extended user profile with role
  session: Session | null     // Current session
  loading: boolean            // Loading state during auth operations
  error: string | null        // Last authentication error
  signUp: (email, password, fullName?) => Promise<any>
  signIn: (email, password) => Promise<any>
  signOut: () => Promise<void>
  resetPassword: (email) => Promise<any>
}
```

### UserProfile Interface

```typescript
interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'analyst' | 'user'
  avatar_url: string | null
  created_at: string
  updated_at: string
}
```

### Initialization

The `AuthProvider` must wrap your entire application:

```jsx
import { AuthProvider } from '@contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      {/* Your routes and components */}
    </AuthProvider>
  )
}
```

---

## Login Flow

### User Experience

1. User navigates to `/login` page
2. User enters email and password
3. User clicks "Submit" button
4. Application shows loading state ("Logging in...")
5. Backend validates credentials with Supabase
6. **Success**: 
   - User profile is loaded from `user_profiles` table
   - User is redirected to dashboard (`/`)
   - Success toast appears: "Logged in successfully!"
   - Session is persisted in browser storage
7. **Error**:
   - Error toast appears with specific message (e.g., "Invalid login credentials")
   - User remains on login page
   - User can retry

### Implementation Details

**LoginForm Component**:
- Uses `react-hook-form` for validation
- Calls `useAuth().signIn()` with email and password
- Handles async error states with try/catch
- Shows inline validation errors on email format
- Disables form during submission

```jsx
const onSubmit = async (data) => {
  try {
    await signIn(data.email, data.password)
    toast.success('Logged in successfully!')
    navigate('/')
  } catch (error) {
    toast.error(error.message || 'Failed to log in')
  }
}
```

### Error Messages

- `"Invalid login credentials"` - Email not found or wrong password
- `"Invalid or expired token"` - Session token expired
- `"Failed to load user profile"` - Database error fetching profile

### Database Operations

1. Supabase Auth validates email/password combination
2. Session is created and stored
3. AuthProvider fetches user profile:
   ```sql
   SELECT * FROM user_profiles WHERE id = $1
   ```
4. If profile doesn't exist, it's created with default role "user"

---

## Sign Up Flow

### User Experience

1. User navigates to `/sign-up` page
2. User enters first name, last name, email, and password
3. User confirms password matches
4. User clicks "Create account" button
5. Application shows loading state ("Creating account...")
6. Supabase Auth creates user and sends confirmation email
7. **Success**:
   - Success toast appears: "Account created! Please check your email..."
   - User profile created in `user_profiles` table with role "user"
   - After 2 seconds, user is redirected to `/login` page
   - Email confirmation link is sent to provided email address
8. **Error**:
   - Error toast appears with specific message
   - User can retry after fixing issues

### Implementation Details

**SignUpForm Component**:
- Validates password confirmation matches
- Combines first and last name for `full_name`
- Calls `useAuth().signUp()` with email and password
- Auto-redirects to login after success

```jsx
const onSubmit = async (data) => {
  try {
    const fullName = `${data.firstName} ${data.lastName}`.trim()
    await signUp(data.email, data.password, fullName)
    toast.success(`Account created! Check your email to confirm.`)
    setTimeout(() => navigate('/login'), 2000)
  } catch (error) {
    toast.error(error.message || 'Failed to create account')
  }
}
```

### Email Confirmation

- Supabase automatically sends confirmation email to provided address
- Confirmation link is valid for 24 hours (configurable in Supabase dashboard)
- User must confirm email before they can fully use the account
- Some features may be restricted until email is confirmed

### Database Operations

1. Supabase Auth creates user record with email
2. AuthProvider listens for signup event
3. User profile is created:
   ```sql
   INSERT INTO user_profiles (id, email, full_name, role)
   VALUES ($1, $2, $3, 'user')
   ```
4. User data is stored in auth metadata

### Error Messages

- `"User already registered"` - Email already exists in system
- `"Password should be 6+ characters"` - Password too short
- `"Invalid email format"` - Email validation failed

---

## Password Reset Flow

### User Experience

1. User is on `/login` page
2. User clicks "Reset password" link
3. Modal popup appears with email input
4. User enters their email address
5. User clicks "Send" button
6. Application shows loading state ("Sending...")
7. **Success**:
   - Success toast: "Password reset link sent to {email}"
   - Modal closes automatically
   - User receives reset link in email (valid for 1 hour)
8. **Error**:
   - Error toast with specific message
   - Modal remains open for retry
   - User can close modal manually

### Implementation Details

**ResetPasswordPopup Component**:
- Popup modal triggered from login page
- Uses `react-hook-form` for email validation
- Calls `useAuth().resetPassword()` with email

```jsx
const onSubmit = async (data) => {
  try {
    await resetPassword(data.email)
    toast.success(`Password reset link sent to ${data.email}`)
    handleClose()
  } catch (error) {
    toast.error(error.message || 'Failed to send reset email')
  }
}
```

### Database Operations

1. Supabase Auth generates reset token
2. Reset link is sent via email
3. User follows link to reset password page
4. New password is validated and stored
5. Session is invalidated to force re-login with new password

### Error Messages

- `"User not found"` - Email not registered
- `"Failed to send reset email"` - SMTP error
- `"Rate limited"` - Too many reset requests (usually 5 per hour)

---

## Sign Out Flow

### User Experience

1. User is logged in and viewing dashboard
2. User clicks "Sign Out" button in sidebar
3. **Success**:
   - Session is immediately cleared
   - Success toast: "Signed out successfully"
   - User is redirected to `/login` page
   - Browser storage is cleared of session tokens

### Implementation Details

**Sign Out Button** (in Sidebar):
- Located at bottom of sidebar for easy access
- Shows current user's full name or email above button
- Calls `useAuth().signOut()`

```jsx
const handleSignOut = async () => {
  try {
    await signOut()
    toast.success('Signed out successfully')
    navigate('/login')
  } catch (error) {
    toast.error(error.message || 'Failed to sign out')
  }
}
```

### Session Cleanup

1. Supabase clears session from auth system
2. Browser storage (localStorage/sessionStorage) is cleared
3. All API tokens are invalidated
4. AuthProvider state is reset to initial state

---

## Protected Routes

### ProtectedRoute Component

Wraps components that require authentication. Unauthenticated users are redirected to `/login`.

```jsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### Behavior

- **Loading State**: Shows loading screen while checking authentication
- **Not Authenticated**: Redirects to `/login`
- **Authenticated**: Renders wrapped component

### Implementation

```tsx
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

---

## Role-Based Access Control

### RoleGate Component

Enforces role-based access to sensitive areas. Only users with specified roles can access wrapped components.

```jsx
<Route path="/admin" element={
  <ProtectedRoute>
    <RoleGate allowedRoles={['admin']}>
      <AdminDashboard />
    </RoleGate>
  </ProtectedRoute>
} />
```

### Available Roles

- **`admin`**: Full application access, can manage users and system
- **`analyst`**: Can view reports and analytics
- **`user`**: Standard user access

### Behavior

- **Loading State**: Shows loading screen while checking role
- **Insufficient Role**: Redirects to `/login`
- **Correct Role**: Renders wrapped component

### Implementation

```tsx
export function RoleGate({ children, allowedRoles }: RoleGateProps) {
  const { profile, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
```

### Usage in App.jsx

```jsx
<Route path="/winmixpro/admin/*" element={
  <ProtectedRoute>
    <RoleGate allowedRoles={['admin']}>
      <WinmixProAdmin />
    </RoleGate>
  </ProtectedRoute>
} />
```

---

## Error Handling

### Error Sources

1. **Network Errors**: Lost connection to Supabase
2. **Auth Errors**: Invalid credentials, expired tokens
3. **Database Errors**: Profile not found, update failed
4. **Validation Errors**: Invalid email format, weak password

### Error Display Strategy

- **Inline Errors**: Form validation shown below fields (e.g., invalid email)
- **Toast Notifications**: User-friendly messages appear briefly
- **Console Logging**: Full error details logged for debugging

### Toast Notifications

```jsx
// Success
toast.success('Logged in successfully!')

// Error
toast.error('Invalid login credentials')

// Info
toast.info('Sending password reset email...')
```

### Error Recovery

- User can retry failed operations
- Most errors are recoverable (just retry with correct data)
- Session errors require re-login
- Rate limits have automatic reset after timeout

---

## User Profile Management

### Profile Data Structure

User profiles are stored in the `user_profiles` table:

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR NOT NULL,
  full_name VARCHAR,
  avatar_url VARCHAR,
  role VARCHAR NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### Profile Availability

- Loaded immediately after login
- Available globally via `useAuth().profile`
- Contains role information for access control
- Displayed in sidebar (name and avatar)

### Profile Updates

Profile updates are handled in the Settings page (future implementation):

```jsx
// Example for future implementation
const updateProfile = async (updates: Partial<UserProfile>) => {
  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', user.id)
  
  if (error) throw error
}
```

### Initial Profile Creation

When a user signs up:
1. Auth user is created in Supabase Auth
2. Trigger or AuthProvider creates profile record:
   - `id`: User's UUID from Auth
   - `email`: User's registered email
   - `full_name`: From signup form (optional)
   - `role`: Default 'user'
   - `avatar_url`: None initially
   - `created_at`: Current timestamp

---

## Settings and User Info Display

### Sidebar User Info

The sidebar displays:
- User's full name (if available) or email
- Sign Out button at the bottom

```jsx
{user && (
  <div>
    <div>
      {profile?.full_name ? profile.full_name : user.email}
    </div>
    <button onClick={handleSignOut}>Sign Out</button>
  </div>
)}
```

### Future Enhancements

- Upload and display user avatar
- Edit profile information
- Change password
- Manage email preferences
- 2FA setup

---

## Testing

### Manual Testing Checklist

- [ ] Sign up with new email - email confirmation sent
- [ ] Login with valid credentials - redirects to dashboard
- [ ] Login with invalid credentials - error toast shown
- [ ] Reset password - link sent to email
- [ ] Sign out from sidebar - redirected to login
- [ ] Access protected route without login - redirected to login
- [ ] Access admin route as non-admin - redirected to login
- [ ] Session persists on page refresh

### Example Test User

```
Email: test@example.com
Password: TestPassword123!
Name: Test User
Role: user
```

---

## Troubleshooting

### Session Not Persisting

**Issue**: User is logged out after page refresh

**Solutions**:
1. Check browser storage permissions
2. Verify Supabase persistence is enabled
3. Check for cookies being blocked by browser
4. Ensure Auth provider wraps entire app

### Profile Not Loading

**Issue**: `profile` is null even after login

**Solutions**:
1. Verify `user_profiles` table exists
2. Check RLS policies allow reading own profile
3. Verify user has corresponding profile record
4. Check browser console for specific errors

### Redirect Loop

**Issue**: User is stuck in redirect loop between login and protected routes

**Solutions**:
1. Check `ProtectedRoute` implementation
2. Verify `loading` state is properly tracked
3. Ensure auth state is persisted correctly
4. Clear browser storage and retry

---

## Environment Variables

Required for authentication:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

See `.env.example` for all required variables.

---

## Security Considerations

1. **Never Store Passwords**: Supabase handles password hashing
2. **HTTPS Only**: Always use HTTPS in production
3. **JWT Validation**: Supabase validates all tokens
4. **RLS Policies**: Database RLS ensures users can only access their data
5. **Rate Limiting**: Email operations are rate-limited to prevent abuse
6. **CORS Configuration**: Configure CORS in Supabase dashboard

---

## Related Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Database Architecture](./06-database/)
- [API Reference](./05-api-reference/)
- [Security Guidelines](./07-security/)
