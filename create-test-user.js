import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your environment variables.')
  process.exit(1)
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUser() {
  try {
    console.log('Creating test user...')
    
    // Create user with auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'takosadam@gmail.com',
      password: 'admin123',
      email_confirm: true
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return
    }

    console.log('Auth user created successfully:', authData.user.id)

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([{
        id: authData.user.id,
        email: 'takosadam@gmail.com',
        full_name: 'Test User',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])

    if (profileError) {
      console.error('Error creating user profile:', profileError)
    } else {
      console.log('User profile created successfully')
    }

    // Create user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert([{
        user_id: authData.user.id,
        role: 'admin' // Give admin role for testing
      }])

    if (roleError) {
      console.error('Error creating user role:', roleError)
    } else {
      console.log('User role created successfully')
    }

    console.log('✅ Test user created successfully!')
    console.log('Email: takosadam@gmail.com')
    console.log('Password: admin123')
    console.log('Role: admin')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createTestUser()