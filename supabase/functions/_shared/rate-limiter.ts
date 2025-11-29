interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  limit: number
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private readonly WINDOW_SIZE = 60 * 60 * 1000 // 1 hour in milliseconds

  async checkLimit(apiKey: string, endpoint: string): Promise<RateLimitResult> {
    const key = `${apiKey}:${endpoint}`
    const now = Date.now()

    // Get or create rate limit entry
    let entry = this.limits.get(key)
    
    if (!entry || now > entry.resetTime) {
      // Create new entry
      entry = {
        count: 0,
        resetTime: now + this.WINDOW_SIZE
      }
      this.limits.set(key, entry)
    }

    // Get rate limit for this endpoint/key
    const limit = await this.getRateLimit(apiKey, endpoint)
    
    // Check if limit exceeded
    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        limit
      }
    }

    // Increment counter
    entry.count++
    this.limits.set(key, entry)

    return {
      allowed: true,
      remaining: Math.max(0, limit - entry.count),
      resetTime: entry.resetTime,
      limit
    }
  }

  private async getRateLimit(apiKey: string, endpoint: string): Promise<number> {
    // In a real implementation, this would fetch the user's tier and apply appropriate limits
    // For now, we'll use a simple mapping based on endpoint
    
    const endpointLimits: Record<string, number> = {
      '/v1/predictions': 1000,
      '/v1/matches': 2000,
      '/v1/teams': 500,
      '/v1/leagues': 100,
      '/v1/analytics': 500,
      '/v1/market': 1500,
      '/v1/models': 200,
      '/v1/jobs': 100
    }

    // Find the most specific endpoint match
    let limit = 1000 // default
    for (const [pattern, patternLimit] of Object.entries(endpointLimits)) {
      if (endpoint.startsWith(pattern)) {
        limit = patternLimit
        break
      }
    }

    return limit
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key)
      }
    }
  }

  // Get current rate limit status without incrementing
  getStatus(apiKey: string, endpoint: string): RateLimitResult | null {
    const key = `${apiKey}:${endpoint}`
    const entry = this.limits.get(key)
    
    if (!entry) {
      return null
    }

    const limit = 1000 // Default limit (would be dynamic in real implementation)
    
    return {
      allowed: entry.count < limit,
      remaining: Math.max(0, limit - entry.count),
      resetTime: entry.resetTime,
      limit
    }
  }

  // Reset rate limit for a specific key (admin function)
  resetLimit(apiKey: string, endpoint: string): void {
    const key = `${apiKey}:${endpoint}`
    this.limits.delete(key)
  }

  // Get all current rate limits (admin function)
  getAllLimits(): Map<string, RateLimitEntry> {
    return new Map(this.limits)
  }
}