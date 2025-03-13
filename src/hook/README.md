# Authentication Hooks

This directory contains custom React hooks for authentication and other functionality.

## useAuthCheck

The `useAuthCheck` hook provides client-side authentication verification by checking if the auth-token cookie exists and redirecting to the login page if it doesn't.

### Usage

```tsx
import { useAuthCheck } from '@/hook/use-auth-check'

function MyComponent() {
  // Basic usage - checks auth on mount
  useAuthCheck()
  
  // With options
  useAuthCheck({
    redirectTo: '/custom-login', // Custom redirect path (default: '/login')
    refreshInterval: 120000 // Check every 2 minutes (default: null - no periodic checks)
  })
  
  return <div>Protected content</div>
}
```

### Features

- Checks if the auth-token cookie exists
- Verifies the token with Firebase authentication
- Redirects to login page if authentication fails
- Optional periodic verification to handle token expiration during active sessions
- Customizable redirect path

### Implementation Details

The hook performs two levels of verification:

1. **Cookie Existence Check**: Verifies that the auth-token cookie exists in the browser
2. **Firebase Verification**: Uses Firebase's `getCurrentAuthState()` to verify that the user is still authenticated

If either check fails, the user is redirected to the login page.

### When to Use

Add this hook to any client-side component that requires authentication, especially:

- Dashboard pages
- Profile pages
- Pages with sensitive data
- Long-lived pages where a session might expire

## Integration with Server-Side Authentication

This hook complements the server-side authentication checks in:

- `middleware.ts` - Handles authentication for all server-side requests
- Page-level server components - Provide additional authentication checks

The combination of server-side and client-side checks ensures robust authentication throughout the application.
