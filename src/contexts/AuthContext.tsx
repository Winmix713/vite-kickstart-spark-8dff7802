import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

export type UserRole = 'user' | 'analyst' | 'admin'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  error: string | null
  role: UserRole | null
  signUp: (email: string, password: string, fullName?: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)

  // Fetch user role from database
  const fetchUserRole = async (userId: string) => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single()

      if (roleError) {
        if (roleError.code === 'PGRST116') {
          // Role doesn't exist, create default user role
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert([{
              user_id: userId,
              role: 'viewer' // Default role
            }])
          
          if (insertError) {
            console.error('Error creating user role:', insertError)
          } else {
            setRole('viewer')
          }
        } else {
          console.error('Error fetching user role:', roleError)
        }
      } else {
        setRole(roleData.role as UserRole)
      }
    } catch (err) {
      console.error('Unexpected error loading user role:', err)
    }
  }

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string, userEmail?: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // Profile doesn't exist, create one
          const newProfile: UserProfile = {
            id: userId,
            email: userEmail || '',
            full_name: null,
            avatar_url: null,
            bio: null,
            is_active: true,
            last_login_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert([newProfile])

          if (insertError) {
            console.error('Error creating profile:', insertError)
            setError('Failed to create user profile')
          } else {
            setProfile(newProfile)
          }
        } else {
          console.error('Error fetching profile:', profileError)
          setError('Failed to load user profile')
        }
      } else {
        setProfile(profileData as UserProfile)
      }
    } catch (err) {
      console.error('Unexpected error loading profile:', err)
      setError('Unexpected error loading profile')
    }
  }

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserProfile(session.user.id, session.user.email)
          await fetchUserRole(session.user.id)
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Error getting session:', err)
        setError('Failed to load session')
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setError(null)

        if (session?.user) {
          await fetchUserProfile(session.user.id, session.user.email)
          await fetchUserRole(session.user.id)
        } else {
          setProfile(null)
          setRole(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })
    
    if (error) throw error
    return data
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
    return data
  }

  const value = {
    user,
    profile,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}