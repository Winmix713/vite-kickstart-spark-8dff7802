import { config } from 'dotenv'
config({ path: '.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL

async function testProjectExists() {
  console.log('Testing if Supabase project exists...')
  console.log('Project URL:', supabaseUrl)
  
  try {
    // Test basic connectivity to the project
    const response = await fetch(supabaseUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TestScript/1.0)'
      }
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    const text = await response.text()
    console.log('Response body:', text)
    
  } catch (error) {
    console.error('Error testing project:', error.message)
  }
  
  // Try to access the health endpoint
  try {
    const healthUrl = `${supabaseUrl}/rest/v1/`
    console.log('\nTesting health endpoint:', healthUrl)
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TestScript/1.0)'
      }
    })
    
    console.log('Health response status:', response.status)
    console.log('Health response headers:', Object.fromEntries(response.headers.entries()))
    
    const text = await response.text()
    console.log('Health response body:', text)
    
  } catch (error) {
    console.error('Error testing health endpoint:', error.message)
  }
}

testProjectExists()