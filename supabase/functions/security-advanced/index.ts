// Advanced Security Implementation for WinMix TipsterHub
// Implements Two-Factor Authentication, SSO integration, and security best practices

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { logger } from '../_shared/logger.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// TOTP (Time-based One-Time Password) implementation
class TOTPManager {
  private readonly WINDOW_SIZE = 1 // Allow 1 window before/after for clock drift
  private readonly TIME_STEP = 30 // 30-second time steps

  // Generate secret key for TOTP
  generateSecret(): string {
    const buffer = new Uint8Array(20) // 160 bits for RFC 4226
    crypto.getRandomValues(buffer)
    return this.base32Encode(buffer)
  }

  // Generate TOTP token for current time
  generateToken(secret: string, timestamp?: number): string {
    const time = Math.floor((timestamp || Date.now()) / 1000 / this.TIME_STEP)
    return this.generateTOTP(secret, time)
  }

  // Verify TOTP token
  verifyToken(secret: string, token: string, timestamp?: number): boolean {
    const time = Math.floor((timestamp || Date.now()) / 1000 / this.TIME_STEP)
    
    // Check current time and surrounding windows for clock drift
    for (let i = -this.WINDOW_SIZE; i <= this.WINDOW_SIZE; i++) {
      const testTime = time + i
      const expectedToken = this.generateTOTP(secret, testTime)
      
      // Constant-time comparison to prevent timing attacks
      if (this.constantTimeCompare(token, expectedToken)) {
        return true
      }
    }
    
    return false
  }

  // Generate QR code URI for authenticator apps
  generateQRCodeURI(secret: string, accountName: string, issuer: string = 'WinMix'): string {
    const encodedAccount = encodeURIComponent(accountName)
    const encodedIssuer = encodeURIComponent(issuer)
    return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`
  }

  private generateTOTP(secret: string, time: number): string {
    const key = this.base32Decode(secret)
    const timeBuffer = new ArrayBuffer(8)
    const timeView = new DataView(timeBuffer)
    timeView.setUint32(4, time, false) // Big-endian

    // HMAC-SHA1
    const hmacKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    )

    const hmacResult = await crypto.subtle.sign('HMAC', hmacKey, timeBuffer)
    const hmac = new Uint8Array(hmacResult)

    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0x0F
    const binary = 
      ((hmac[offset] & 0x7F) << 24) |
      ((hmac[offset + 1] & 0xFF) << 16) |
      ((hmac[offset + 2] & 0xFF) << 8) |
      (hmac[offset + 3] & 0xFF)

    const token = (binary % 1000000).toString().padStart(6, '0')
    return token
  }

  private base32Encode(buffer: Uint8Array): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let result = ''
    let bits = 0
    let value = 0

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i]
      bits += 8

      while (bits >= 5) {
        result += alphabet[(value >>> (bits - 5)) & 0x1F]
        bits -= 5
      }
    }

    if (bits > 0) {
      result += alphabet[(value << (5 - bits)) & 0x1F]
    }

    // Pad with '=' characters
    while (result.length % 8 !== 0) {
      result += '='
    }

    return result
  }

  private base32Decode(encoded: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    const cleanEncoded = encoded.replace(/=/g, '')
    const buffer = new Uint8Array(Math.floor(cleanEncoded.length * 5 / 8))
    let bits = 0
    let value = 0
    let index = 0

    for (let i = 0; i < cleanEncoded.length; i++) {
      const char = cleanEncoded[i]
      const charIndex = alphabet.indexOf(char.toUpperCase())
      
      if (charIndex === -1) {
        throw new Error('Invalid base32 character')
      }

      value = (value << 5) | charIndex
      bits += 5

      if (bits >= 8) {
        buffer[index++] = (value >>> (bits - 8)) & 0xFF
        bits -= 8
      }
    }

    return buffer
  }

  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
  }
}

// SAML SSO implementation
class SAMLManager {
  private readonly samlConfig = {
    entryPoint: Deno.env.get('SAML_ENTRY_POINT') || '',
    issuer: Deno.env.get('SAML_ISSUER') || 'winmix',
    cert: Deno.env.get('SAML_CERT') || '',
    privateKey: Deno.env.get('SAML_PRIVATE_KEY') || ''
  }

  // Generate SAML authentication request
  generateAuthRequest(returnTo: string): string {
    const requestId = `_${crypto.randomUUID()}`
    const timestamp = new Date().toISOString()
    
    const authRequest = `
      <samlp:AuthRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                        ID="${requestId}"
                        Version="2.0"
                        IssueInstant="${timestamp}"
                        ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                        AssertionConsumerServiceURL="${returnTo}">
        <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${this.samlConfig.issuer}</saml:Issuer>
        <samlp:NameIDPolicy AllowCreate="true" Format="urn:oasis:names:tc:SAML:2.0:nameid-format:transient"/>
      </samlp:AuthRequest>
    `.trim()

    // In production, this would be properly encoded and signed
    return Buffer.from(authRequest).toString('base64')
  }

  // Process SAML response
  async processResponse(samlResponse: string): Promise<any> {
    try {
      const decodedResponse = Buffer.from(samlResponse, 'base64').toString()
      
      // Parse SAML response (simplified - in production use proper SAML library)
      const nameIdMatch = decodedResponse.match(/<saml:NameID>([^<]+)<\/saml:NameID>/)
      const emailMatch = decodedResponse.match(/<saml:Attribute Name="email"[^>]*><saml:AttributeValue>([^<]+)<\/saml:AttributeValue><\/saml:Attribute>/)
      
      if (!nameIdMatch) {
        throw new Error('Invalid SAML response: missing NameID')
      }

      return {
        nameId: nameIdMatch[1],
        email: emailMatch ? emailMatch[1] : null,
        attributes: this.extractSAMLAttributes(decodedResponse)
      }

    } catch (error) {
      logger.error('SAML response processing failed', error)
      throw new Error('Invalid SAML response')
    }
  }

  private extractSAMLAttributes(response: string): Record<string, string> {
    const attributes: Record<string, string> = {}
    const attributeRegex = /<saml:Attribute Name="([^"]+)"[^>]*><saml:AttributeValue>([^<]+)<\/saml:AttributeValue><\/saml:Attribute>/g
    
    let match
    while ((match = attributeRegex.exec(response)) !== null) {
      attributes[match[1]] = match[2]
    }

    return attributes
  }
}

// Session management
class SessionManager {
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours
  private readonly sessions = new Map<string, any>()

  createSession(userId: string, additionalData?: any): string {
    const sessionId = crypto.randomUUID()
    const session = {
      id: sessionId,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.SESSION_DURATION,
      ...additionalData
    }

    this.sessions.set(sessionId, session)
    
    // Store session in database for persistence
    this.storeSession(session)
    
    return sessionId
  }

  validateSession(sessionId: string): any | null {
    const session = this.sessions.get(sessionId)
    
    if (!session) {
      // Try to load from database
      return this.loadSession(sessionId)
    }

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId)
      this.deleteSession(sessionId)
      return null
    }

    return session
  }

  invalidateSession(sessionId: string): void {
    this.sessions.delete(sessionId)
    this.deleteSession(sessionId)
  }

  private async storeSession(session: any): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .insert({
          id: session.id,
          user_id: session.userId,
          created_at: new Date(session.createdAt).toISOString(),
          expires_at: new Date(session.expiresAt).toISOString(),
          session_data: session
        })
    } catch (error) {
      logger.error('Failed to store session', error)
    }
  }

  private async loadSession(sessionId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error || !data) {
        return null
      }

      if (Date.now() > new Date(data.expires_at).getTime()) {
        await this.deleteSession(sessionId)
        return null
      }

      // Cache in memory
      this.sessions.set(sessionId, data)
      return data

    } catch (error) {
      logger.error('Failed to load session', error)
      return null
    }
  }

  private async deleteSession(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId)
    } catch (error) {
      logger.error('Failed to delete session', error)
    }
  }
}

// Advanced security features
class SecurityManager {
  private readonly totpManager = new TOTPManager()
  private readonly samlManager = new SAMLManager()
  private readonly sessionManager = new SessionManager()
  private readonly failedAttempts = new Map<string, number>()
  private readonly lockoutDuration = 15 * 60 * 1000 // 15 minutes
  private readonly maxAttempts = 5

  // Setup 2FA for user
  async setup2FA(userId: string): Promise<{ secret: string; qrCode: string }> {
    const secret = this.totpManager.generateSecret()
    const user = await this.getUser(userId)
    
    if (!user) {
      throw new Error('User not found')
    }

    const qrCode = this.totpManager.generateQRCodeURI(secret, user.email, 'WinMix')

    // Store secret temporarily (not enabled yet)
    await supabase
      .from('user_2fa')
      .upsert({
        user_id: userId,
        secret: secret,
        is_enabled: false,
        backup_codes: this.generateBackupCodes(),
        created_at: new Date().toISOString()
      })

    return { secret, qrCode }
  }

  // Enable 2FA after verification
  async enable2FA(userId: string, token: string): Promise<boolean> {
    const { data: twoFaData, error } = await supabase
      .from('user_2fa')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !twoFaData) {
      throw new Error('2FA setup not found')
    }

    if (this.totpManager.verifyToken(twoFaData.secret, token)) {
      await supabase
        .from('user_2fa')
        .update({ is_enabled: true })
        .eq('user_id', userId)

      logger.info('2FA enabled', { userId })
      return true
    }

    return false
  }

  // Verify 2FA token
  async verify2FA(userId: string, token: string): Promise<boolean> {
    const { data: twoFaData, error } = await supabase
      .from('user_2fa')
      .select('*')
      .eq('user_id', userId)
      .eq('is_enabled', true)
      .single()

    if (error || !twoFaData) {
      return false
    }

    return this.totpManager.verifyToken(twoFaData.secret, token)
  }

  // Generate backup codes
  private generateBackupCodes(): string[] {
    const codes: string[] = []
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase()
      codes.push(code)
    }
    return codes
  }

  // Check rate limiting / brute force protection
  checkRateLimit(identifier: string): { allowed: boolean; remainingAttempts: number; lockoutTime?: number } {
    const attempts = this.failedAttempts.get(identifier) || 0
    
    if (attempts >= this.maxAttempts) {
      const lockoutTime = Date.now() + this.lockoutDuration
      return {
        allowed: false,
        remainingAttempts: 0,
        lockoutTime
      }
    }

    return {
      allowed: true,
      remainingAttempts: this.maxAttempts - attempts
    }
  }

  // Record failed attempt
  recordFailedAttempt(identifier: string): void {
    const attempts = (this.failedAttempts.get(identifier) || 0) + 1
    this.failedAttempts.set(identifier, attempts)

    // Clear lockout after duration
    setTimeout(() => {
      this.failedAttempts.delete(identifier)
    }, this.lockoutDuration)
  }

  // Clear failed attempts on successful login
  clearFailedAttempts(identifier: string): void {
    this.failedAttempts.delete(identifier)
  }

  // SAML SSO login
  async samlLogin(samlResponse: string): Promise<{ sessionId: string; user: any }> {
    const samlData = await this.samlManager.processResponse(samlResponse)
    
    // Find or create user
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('saml_name_id', samlData.nameId)
      .single()

    if (error && error.code === 'PGRST116') {
      // User doesn't exist, create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: samlData.email,
          saml_name_id: samlData.nameId,
          auth_method: 'saml',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`)
      }

      user = newUser
    } else if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // Create session
    const sessionId = this.sessionManager.createSession(user.id, {
      authMethod: 'saml',
      samlData
    })

    logger.info('SAML login successful', { userId: user.id, email: user.email })

    return { sessionId, user }
  }

  private async getUser(userId: string): Promise<{ email: string } | null> {
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    return data
  }
}

// HTTP handlers
const securityManager = new SecurityManager()

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname

  try {
    if (path === '/security/2fa/setup') {
      return handle2FASetup(req)
    }

    if (path === '/security/2fa/enable') {
      return handle2FAEnable(req)
    }

    if (path === '/security/2fa/verify') {
      return handle2FAVerify(req)
    }

    if (path === '/security/saml/login') {
      return handleSAMLLogin(req)
    }

    if (path === '/security/saml/auth-request') {
      return handleSAMLAuthRequest(req)
    }

    return new Response(
      JSON.stringify({ error: 'Security endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    logger.error('Security endpoint error', error, { path })
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handle2FASetup(req: Request): Promise<Response> {
  const { userId } = await req.json()
  
  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'User ID required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const result = await securityManager.setup2FA(userId)
  
  return new Response(
    JSON.stringify(result),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handle2FAEnable(req: Request): Promise<Response> {
  const { userId, token } = await req.json()
  
  if (!userId || !token) {
    return new Response(
      JSON.stringify({ error: 'User ID and token required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const success = await securityManager.enable2FA(userId, token)
  
  return new Response(
    JSON.stringify({ success }),
    { status: success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handle2FAVerify(req: Request): Promise<Response> {
  const { userId, token } = await req.json()
  
  if (!userId || !token) {
    return new Response(
      JSON.stringify({ error: 'User ID and token required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const valid = await securityManager.verify2FA(userId, token)
  
  return new Response(
    JSON.stringify({ valid }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleSAMLLogin(req: Request): Promise<Response> {
  const { samlResponse } = await req.json()
  
  if (!samlResponse) {
    return new Response(
      JSON.stringify({ error: 'SAML response required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const result = await securityManager.samlLogin(samlResponse)
  
  return new Response(
    JSON.stringify(result),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleSAMLAuthRequest(req: Request): Promise<Response> {
  const returnTo = req.headers.get('referer') || 'https://app.winmix.com/auth/callback'
  const authRequest = securityManager.samlManager.generateAuthRequest(returnTo)
  
  return new Response(
    JSON.stringify({ authRequest }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}