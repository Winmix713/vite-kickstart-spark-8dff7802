import { config } from 'dotenv'
config({ path: '.env' })

const apiKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

console.log('=== JWT Analysis ===')
console.log('API Key:', apiKey)

try {
  const parts = apiKey.split('.')
  if (parts.length === 3) {
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString())
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    
    console.log('Header:', header)
    console.log('Payload:', payload)
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    console.log('Current time:', now)
    console.log('Issued at (iat):', payload.iat)
    console.log('Expires at (exp):', payload.exp)
    console.log('Is expired:', now > payload.exp)
    
    // Check project reference
    console.log('Project ref:', payload.ref)
    
  } else {
    console.log('Invalid JWT format')
  }
} catch (error) {
  console.error('Error parsing JWT:', error.message)
}

// Test with a different approach - maybe the key needs to be URL encoded
console.log('\n=== Testing URL encoding ===')
const encodedKey = encodeURIComponent(apiKey)
console.log('Encoded key length:', encodedKey.length)
console.log('Original and encoded same:', apiKey === encodedKey)