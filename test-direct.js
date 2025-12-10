import { config } from 'dotenv'
config({ path: '.env' })

// Test direct HTTP request to Supabase endpoints
async function testDirectConnection() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const apiKey = process.env.VITE_SUPABASE_ANON_KEY
  
  console.log('Testing direct HTTP requests...')
  console.log('URL:', supabaseUrl)
  console.log('API Key length:', apiKey?.length)
  
  // Test auth endpoint directly
  try {
    const authUrl = `${supabaseUrl}/auth/v1/user`
    console.log('\nTesting auth endpoint:', authUrl)
    
    const response = await fetch(authUrl, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    })
    
    console.log('Auth response status:', response.status)
    console.log('Auth response headers:', Object.fromEntries(response.headers.entries()))
    
    const text = await response.text()
    console.log('Auth response body:', text)
    
  } catch (error) {
    console.error('Auth endpoint error:', error.message)
  }
  
  // Test REST endpoint directly
  try {
    const restUrl = `${supabaseUrl}/rest/v1/user_profiles?select=count`
    console.log('\nTesting REST endpoint:', restUrl)
    
    const response = await fetch(restUrl, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('REST response status:', response.status)
    console.log('REST response headers:', Object.fromEntries(response.headers.entries()))
    
    const text = await response.text()
    console.log('REST response body:', text)
    
  } catch (error) {
    console.error('REST endpoint error:', error.message)
  }
  
  // Test sign up endpoint directly
  try {
    const signUpUrl = `${supabaseUrl}/auth/v1/signup`
    console.log('\nTesting sign up endpoint:', signUpUrl)
    
    const testEmail = `test-${Date.now()}@example.com`
    const payload = {
      email: testEmail,
      password: 'test123456',
      data: {
        full_name: 'Test User'
      }
    }
    
    const response = await fetch(signUpUrl, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    console.log('Sign up response status:', response.status)
    console.log('Sign up response headers:', Object.fromEntries(response.headers.entries()))
    
    const text = await response.text()
    console.log('Sign up response body:', text)
    
  } catch (error) {
    console.error('Sign up endpoint error:', error.message)
  }
}

testDirectConnection()