// Load environment variables from .env file
import { config } from 'dotenv'
config({ path: '.env' })

// Debug script to check environment variables and API key format
console.log('=== Environment Variables Debug ===')
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL)
console.log('VITE_SUPABASE_PUBLISHABLE_KEY exists:', !!process.env.VITE_SUPABASE_PUBLISHABLE_KEY)
console.log('VITE_SUPABASE_PUBLISHABLE_KEY length:', process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.length)
console.log('VITE_SUPABASE_PUBLISHABLE_KEY starts with eyJ:', process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.startsWith('eyJ'))

// Try to decode the JWT to see if it's valid
try {
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (key) {
    const parts = key.split('.')
    console.log('JWT parts count:', parts.length)
    if (parts.length === 3) {
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString())
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      console.log('JWT header:', header)
      console.log('JWT payload:', payload)
    }
  }
} catch (error) {
  console.error('Error decoding JWT:', error.message)
}

// Test Supabase client creation
import { createClient } from '@supabase/supabase-js'

console.log('\n=== Supabase Client Test ===')
try {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  )
  console.log('Supabase client created successfully')
  
  // Test a simple health check
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('Error getting session:', error.message)
      console.error('Error status:', error.status)
      console.error('Error code:', error.code)
    } else {
      console.log('Session check successful (no session expected)')
    }
  })
  
} catch (error) {
  console.error('Error creating Supabase client:', error.message)
}