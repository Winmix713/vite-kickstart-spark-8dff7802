// Test the mock authentication
import { supabase } from './src/integrations/supabase/mock-client.js'

async function testMockAuth() {
  console.log('Testing mock authentication...')
  
  try {
    // Test sign in
    console.log('\n1. Testing sign in...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'takosadam@gmail.com',
      password: 'admin123'
    })
    
    if (error) {
      console.error('Sign in error:', error)
    } else {
      console.log('✅ Sign in successful!')
      console.log('User:', data.user)
      console.log('Session:', data.session)
    }
    
    // Test get session
    console.log('\n2. Testing get session...')
    const sessionResult = await supabase.auth.getSession()
    console.log('Session result:', sessionResult.data)
    
    // Test wrong credentials
    console.log('\n3. Testing wrong credentials...')
    const wrongResult = await supabase.auth.signInWithPassword({
      email: 'wrong@email.com',
      password: 'wrong'
    })
    
    if (wrongResult.error) {
      console.log('✅ Wrong credentials properly rejected:', wrongResult.error.message)
    } else {
      console.log('❌ Wrong credentials should have failed')
    }
    
    console.log('\n✅ Mock authentication test completed!')
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testMockAuth()