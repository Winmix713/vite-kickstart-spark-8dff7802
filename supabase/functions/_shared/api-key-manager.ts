import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface APIKey {
  id: string
  key_hash: string
  name: string
  tier: 'free' | 'basic' | 'premium' | 'enterprise'
  rate_limit: number
  is_active: boolean
  expires_at?: string
  created_at: string
  last_used?: string
  usage_count: number
}

interface KeyValidation {
  valid: boolean
  key?: APIKey
  error?: string
  tier?: APIKey['tier']
}

export class APIKeyManager {
  private supabase: any
  private cache: Map<string, { validation: KeyValidation; expires: number }> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor(supabase: any) {
    this.supabase = supabase
  }

  async validateKey(apiKey: string): Promise<KeyValidation> {
    // Check cache first
    const cached = this.cache.get(apiKey)
    if (cached && cached.expires > Date.now()) {
      return cached.validation
    }

    try {
      // Hash the API key for comparison
      const keyHash = await this.hashKey(apiKey)

      // Query database
      const { data: keyData, error } = await this.supabase
        .from('api_keys')
        .select('*')
        .eq('key_hash', keyHash)
        .eq('is_active', true)
        .single()

      if (error || !keyData) {
        const validation = { valid: false, error: 'Invalid API key' }
        this.cache.set(apiKey, { validation, expires: Date.now() + this.CACHE_TTL })
        return validation
      }

      // Check expiration
      if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
        const validation = { valid: false, error: 'API key expired' }
        this.cache.set(apiKey, { validation, expires: Date.now() + this.CACHE_TTL })
        return validation
      }

      // Update last used timestamp
      await this.updateLastUsed(keyData.id)

      const validation = {
        valid: true,
        key: keyData,
        tier: keyData.tier
      }

      // Cache the result
      this.cache.set(apiKey, { validation, expires: Date.now() + this.CACHE_TTL })

      return validation

    } catch (error) {
      console.error('API key validation error:', error)
      return { valid: false, error: 'Validation failed' }
    }
  }

  private async hashKey(apiKey: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(apiKey + 'winmix-salt') // Add salt
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  private async updateLastUsed(keyId: string): Promise<void> {
    try {
      await this.supabase
        .from('api_keys')
        .update({
          last_used: new Date().toISOString(),
          usage_count: this.supabase.rpc('increment', { x: 1 })
        })
        .eq('id', keyId)
    } catch (error) {
      // Don't fail the request if we can't update usage stats
      console.error('Failed to update API key usage:', error)
    }
  }

  // Generate new API key
  async generateKey(name: string, tier: APIKey['tier']): Promise<{ key: string; keyData: APIKey }> {
    const apiKey = this.generateRandomKey()
    const keyHash = await this.hashKey(apiKey)

    const { data, error } = await this.supabase
      .from('api_keys')
      .insert({
        name,
        key_hash: keyHash,
        tier,
        rate_limit: this.getTierRateLimit(tier),
        is_active: true,
        created_at: new Date().toISOString(),
        usage_count: 0
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create API key: ${error.message}`)
    }

    return { key: apiKey, keyData: data }
  }

  private generateRandomKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = 'wm_' // Prefix to identify WinMix keys
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  private getTierRateLimit(tier: APIKey['tier']): number {
    switch (tier) {
      case 'free': return 100
      case 'basic': return 1000
      case 'premium': return 10000
      case 'enterprise': return 100000
      default: return 100
    }
  }

  // Revoke API key
  async revokeKey(keyId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', keyId)

      return !error
    } catch (error) {
      console.error('Failed to revoke API key:', error)
      return false
    }
  }

  // Get API usage statistics
  async getUsageStats(keyId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('api_usage_logs')
        .select('*')
        .eq('api_key_id', keyId)
        .order('timestamp', { ascending: false })
        .limit(100)

      if (error) {
        throw error
      }

      // Calculate usage statistics
      const totalRequests = data?.length || 0
      const todayRequests = data?.filter(log => 
        new Date(log.timestamp).toDateString() === new Date().toDateString()
      ).length || 0

      const endpointUsage = data?.reduce((acc: any, log: any) => {
        acc[log.endpoint] = (acc[log.endpoint] || 0) + 1
        return acc
      }, {})

      return {
        totalRequests,
        todayRequests,
        endpointUsage,
        lastRequest: data?.[0]?.timestamp
      }

    } catch (error) {
      console.error('Failed to get usage stats:', error)
      return null
    }
  }
}