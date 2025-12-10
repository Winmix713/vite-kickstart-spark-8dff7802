import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ejffxwbkusmxrjuvbsow.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqZmZ4d2JrdXNteHJqdXZic293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI1NjU2NzYsImV4cCI6MjAzODE0MTY3Nn0.Qs5a7V3kC6VJ4bJ8xF5gE4jZ4h7nJ1mK9wQ8sA2bY6'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTestUser() {
  try {
    console.log('Creating test user...')
    
    // Sign up user
    const { data, error } = await supabase.auth.signUp({
      email: 'takosadam@gmail.com',
      password: 'admin123',
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    })

    if (error) {
      console.error('Error signing up:', error)
      return
    }

    console.log('User signed up successfully:', data.user?.id)
    
    if (data.user && !data.session) {
      console.log('User created but email confirmation required. Please check email.')
    } else if (data.session) {
      console.log('User created and signed in successfully!')
      
      // Now create the profile and role
      const profileData = {
        id: data.user.id,
        email: 'takosadam@gmail.com',
        full_name: 'Test User',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([profileData])

      if (profileError) {
        console.error('Error creating profile:', profileError)
      } else {
        console.log('Profile created successfully')
      }

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: data.user.id,
          role: 'admin'
        }])

      if (roleError) {
        console.error('Error creating role:', roleError)
      } else {
        console.log('Role created successfully')
      }
    }

    console.log('✅ Test user setup complete!')
    console.log('Email: takosadam@gmail.com')
    console.log('Password: admin123')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createTestUser()