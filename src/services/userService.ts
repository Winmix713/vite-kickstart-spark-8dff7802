import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type Profile = Database['public']['Tables']['user_profiles']['Row']

interface CreateProfileInput {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role?: 'admin' | 'user' | 'analyst'
}

export const userService = {
  async getCurrentUserProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  async getUserProfile(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  async updateUserProfile(id: string, profileData: Partial<CreateProfileInput>): Promise<Profile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getAllUsers(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async updateUserRole(id: string, role: 'admin' | 'user' | 'analyst'): Promise<Profile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteUser(id: string): Promise<void> {
    // First delete the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
    
    if (profileError) throw profileError

    // Then delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(id)
    if (authError) throw authError
  }
}