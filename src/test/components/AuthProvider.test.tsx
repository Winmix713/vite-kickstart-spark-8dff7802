import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
  },
}

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}))

// Test component that uses the auth context
const TestComponent = () => {
  const { user, session, loading, signIn, signOut, signUp, resetPassword } = useAuth()

  const handleSignIn = async () => {
    try {
      await signIn('test@example.com', 'password')
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }

  const handleSignUp = async () => {
    try {
      await signUp('new@example.com', 'password', 'New User')
    } catch (error) {
      console.error('Sign up error:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleResetPassword = async () => {
    try {
      await resetPassword('test@example.com')
    } catch (error) {
      console.error('Reset password error:', error)
    }
  }

  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="user">{user ? user.id : 'no-user'}</div>
      <div data-testid="session">{session ? 'has-session' : 'no-session'}</div>
      
      <button onClick={handleSignIn} data-testid="signin-btn">
        Sign In
      </button>
      <button onClick={handleSignUp} data-testid="signup-btn">
        Sign Up
      </button>
      <button onClick={handleSignOut} data-testid="signout-btn">
        Sign Out
      </button>
      <button onClick={handleResetPassword} data-testid="reset-btn">
        Reset Password
      </button>
    </div>
  )
}

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}

describe('AuthProvider Integration Tests', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { full_name: 'Test User' },
  }

  const mockSession = {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh-token',
    user: mockUser,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication Flow', () => {
    it('should provide initial loading state', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const unsubscribe = vi.fn()
      mockSupabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } })

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      expect(screen.getByTestId('loading')).toHaveTextContent('true')
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })
    })

    it('should handle successful sign in', async () => {
      const user = userEvent.setup()
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const unsubscribe = vi.fn()
      mockSupabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } })

      // Mock successful sign in
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      })

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      await user.click(screen.getByTestId('signin-btn'))

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password',
        })
      })
    })

    it('should handle sign in errors', async () => {
      const user = userEvent.setup()
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const unsubscribe = vi.fn()
      mockSupabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } })

      // Mock failed sign in
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid credentials' },
      })

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      await user.click(screen.getByTestId('signin-btn'))

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled()
      })
    })

    it('should handle sign up', async () => {
      const user = userEvent.setup()
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const unsubscribe = vi.fn()
      mockSupabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } })

      // Mock successful sign up
      const mockSignUpData = {
        data: { session: mockSession, user: mockUser },
        error: null,
      }
      mockSupabase.auth.signUp.mockResolvedValue(mockSignUpData)

      // Mock profile creation
      const mockProfile = {
        id: 'test-user-id',
        email: 'new@example.com',
        role: 'user',
      }

      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockResolvedValue({
          data: [mockProfile],
          error: null,
        }),
      })

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      await user.click(screen.getByTestId('signup-btn'))

      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'new@example.com',
          password: 'password',
          options: {
            data: { full_name: 'New User' },
          },
        })
      })
    })

    it('should handle sign out', async () => {
      const user = userEvent.setup()
      
      // Mock initial session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const unsubscribe = vi.fn()
      mockSupabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } })

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      await user.click(screen.getByTestId('signout-btn'))

      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      })
    })

    it('should handle password reset', async () => {
      const user = userEvent.setup()
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const unsubscribe = vi.fn()
      mockSupabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } })

      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      })

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      await user.click(screen.getByTestId('reset-btn'))

      await waitFor(() => {
        expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com')
      })
    })
  })

  describe('Role-based Access Control', () => {
    const AdminComponent = () => {
      const { user } = useAuth()
      
      if (user?.user_metadata?.role === 'admin') {
        return <div data-testid="admin-content">Admin Content</div>
      }
      
      return <div data-testid="user-content">User Content</div>
    }

    it('should show admin content for admin users', () => {
      const adminUser = {
        ...mockUser,
        user_metadata: { ...mockUser.user_metadata, role: 'admin' },
      }
      
      const adminSession = {
        ...mockSession,
        user: adminUser,
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: adminSession },
        error: null,
      })

      const unsubscribe = vi.fn()
      mockSupabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } })

      render(
        <TestWrapper>
          <AdminComponent />
        </TestWrapper>
      )

      expect(screen.getByTestId('admin-content')).toBeInTheDocument()
      expect(screen.queryByTestId('user-content')).not.toBeInTheDocument()
    })

    it('should show user content for regular users', () => {
      const regularUser = {
        ...mockUser,
        user_metadata: { ...mockUser.user_metadata, role: 'user' },
      }
      
      const regularSession = {
        ...mockSession,
        user: regularUser,
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: regularSession },
        error: null,
      })

      const unsubscribe = vi.fn()
      mockSupabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } })

      render(
        <TestWrapper>
          <AdminComponent />
        </TestWrapper>
      )

      expect(screen.getByTestId('user-content')).toBeInTheDocument()
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
    })
  })

  describe('Auth State Management', () => {
    it('should handle auth state changes', async () => {
      let authStateCallback: (event: string, session: any) => void
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      // Simulate successful authentication
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      // Trigger auth state change
      authStateCallback!('SIGNED_IN', mockSession)

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.id)
        expect(screen.getByTestId('session')).toHaveTextContent('has-session')
      })
    })

    it('should handle sign out events', async () => {
      let authStateCallback: (event: string, session: any) => void
      
      // Start with a session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.id)
      })

      // Trigger sign out
      authStateCallback!('SIGNED_OUT', null)

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user')
        expect(screen.getByTestId('session')).toHaveTextContent('no-session')
      })
    })

    it('should create profile on sign up', async () => {
      let authStateCallback: (event: string, session: any) => void
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      // Mock profile creation
      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockResolvedValue({
          data: [{ id: 'test-user-id', email: 'test@example.com', role: 'user' }],
          error: null,
        }),
      })

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      // Trigger sign up event
      authStateCallback!('SIGNED_IN', mockSession)

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
        expect(mockSupabase.from().upsert).toHaveBeenCalledWith({
          id: 'test-user-id',
          email: 'test@example.com',
          role: 'user',
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle profile creation errors gracefully', async () => {
      let authStateCallback: (event: string, session: any) => void
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      // Mock profile creation error
      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Profile creation failed' },
        }),
      })

      // Mock console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      // Trigger sign up event - should not throw
      authStateCallback!('SIGNED_IN', mockSession)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error creating profile:', { message: 'Profile creation failed' })
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Context Usage Validation', () => {
    it('should throw error when useAuth is used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })
  })
})