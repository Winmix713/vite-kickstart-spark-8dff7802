import { config } from 'dotenv'
config({ path: '.env' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...')
  
  try {
    // Test basic connection - try to get project info
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Database query error:', error.message)
      console.error('Error status:', error.status)
      console.error('Error code:', error.code)
      console.error('Error details:', error)
    } else {
      console.log('Database connection successful!')
      console.log('Query result:', data)
    }
    
    // Test auth endpoint specifically
    console.log('\nTesting auth endpoint...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('Auth endpoint error:', authError.message)
      console.error('Auth error status:', authError.status)
      console.error('Auth error code:', authError.code)
    } else {
      console.log('Auth endpoint working!')
      console.log('Auth data:', authData)
    }
    
    // Test sign up with a different approach
    console.log('\nTesting sign up...')
    const testEmail = `test-${Date.now()}@example.com`
    
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'test123456',
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      })
      
      if (signUpError) {
        console.error('Sign up error:', signUpError.message)
        console.error('Sign up error status:', signUpError.status)
        console.error('Sign up error code:', signUpError.code)
        console.error('Sign up error details:', signUpError)
      } else {
        console.log('Sign up successful!')
        console.log('User ID:', signUpData.user?.id)
        console.log('Session exists:', !!signUpData.session)
      }
    } catch (signUpException) {
      console.error('Sign up exception:', signUpException.message)
      console.error('Sign up exception details:', signUpException)
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message)
    console.error('Full error:', error)
  }
}

testSupabaseConnection()