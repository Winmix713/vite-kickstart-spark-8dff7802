interface ValidationRule {
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  enum?: any[]
  custom?: (value: any) => boolean | string
}

interface ValidationSchema {
  [key: string]: ValidationRule
}

interface ValidationError {
  field: string
  message: string
  value: any
}

export class RequestValidator {
  // Common validation schemas
  private static readonly SCHEMAS: Record<string, ValidationSchema> = {
    predictions: {
      limit: { type: 'number', min: 1, max: 100 },
      offset: { type: 'number', min: 0 },
      match_id: { type: 'string', minLength: 1 },
      team_id: { type: 'string', minLength: 1 },
      league_id: { type: 'string', minLength: 1 },
      status: { type: 'string', enum: ['upcoming', 'completed', 'cancelled'] },
      date_from: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ },
      date_to: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ }
    },
    
    matches: {
      limit: { type: 'number', min: 1, max: 100 },
      offset: { type: 'number', min: 0 },
      league_id: { type: 'string', minLength: 1 },
      status: { type: 'string', enum: ['upcoming', 'completed', 'cancelled'] },
      date_from: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ },
      date_to: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ }
    },

    analytics: {
      model_id: { type: 'string', minLength: 1 },
      date_from: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ },
      date_to: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ },
      metric: { type: 'string', enum: ['accuracy', 'precision', 'recall', 'f1_score', 'roi'] }
    },

    market: {
      match_id: { type: 'string', minLength: 1 },
      bookmaker: { type: 'string', minLength: 1 },
      min_ev: { type: 'number', min: 0 },
      max_kelly: { type: 'number', min: 0, max: 1 }
    }
  }

  // Validate query parameters
  validateQuery(url: URL, endpoint: string): { valid: boolean; errors: ValidationError[] } {
    const schema = this.getSchemaForEndpoint(endpoint)
    if (!schema) {
      return { valid: true, errors: [] }
    }

    const errors: ValidationError[] = []
    const params = Object.fromEntries(url.searchParams)

    for (const [field, rule] of Object.entries(schema)) {
      const value = params[field]
      
      // Skip validation for optional fields that are not provided
      if (!rule.required && (value === undefined || value === '')) {
        continue
      }

      const error = this.validateField(field, value, rule)
      if (error) {
        errors.push(error)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Validate request body for POST/PUT requests
  validateBody(body: any, endpoint: string): { valid: boolean; errors: ValidationError[] } {
    const schema = this.getSchemaForEndpoint(endpoint)
    if (!schema) {
      return { valid: true, errors: [] }
    }

    const errors: ValidationError[] = []

    for (const [field, rule] of Object.entries(schema)) {
      const value = body[field]
      
      // Skip validation for optional fields that are not provided
      if (!rule.required && (value === undefined || value === '')) {
        continue
      }

      const error = this.validateField(field, value, rule)
      if (error) {
        errors.push(error)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Validate individual field
  private validateField(field: string, value: any, rule: ValidationRule): ValidationError | null {
    // Required validation
    if (rule.required && (value === undefined || value === null || value === '')) {
      return {
        field,
        message: `${field} is required`,
        value
      }
    }

    // Skip further validation if field is empty and not required
    if (value === undefined || value === null || value === '') {
      return null
    }

    // Type validation
    if (rule.type) {
      const typeError = this.validateType(value, rule.type, field)
      if (typeError) {
        return typeError
      }
    }

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        return {
          field,
          message: `${field} must be at least ${rule.minLength} characters long`,
          value
        }
      }

      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        return {
          field,
          message: `${field} must be no more than ${rule.maxLength} characters long`,
          value
        }
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        return {
          field,
          message: `${field} format is invalid`,
          value
        }
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return {
          field,
          message: `${field} must be at least ${rule.min}`,
          value
        }
      }

      if (rule.max !== undefined && value > rule.max) {
        return {
          field,
          message: `${field} must be no more than ${rule.max}`,
          value
        }
      }
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      return {
        field,
        message: `${field} must be one of: ${rule.enum.join(', ')}`,
        value
      }
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value)
      if (customResult !== true) {
        return {
          field,
          message: typeof customResult === 'string' ? customResult : `${field} is invalid`,
          value
        }
      }
    }

    return null
  }

  // Validate data type
  private validateType(value: any, expectedType: string, field: string): ValidationError | null {
    const actualType = Array.isArray(value) ? 'array' : typeof value

    if (actualType !== expectedType) {
      return {
        field,
        message: `${field} must be of type ${expectedType}, got ${actualType}`,
        value
      }
    }

    return null
  }

  // Get validation schema for endpoint
  private getSchemaForEndpoint(endpoint: string): ValidationSchema | null {
    // Map endpoints to schemas
    const endpointMapping: Record<string, string> = {
      '/v1/predictions': 'predictions',
      '/v1/predictions/match': 'predictions',
      '/v1/predictions/team': 'predictions',
      '/v1/predictions/league': 'predictions',
      
      '/v1/matches': 'matches',
      '/v1/matches/date': 'matches',
      '/v1/matches/league': 'matches',
      
      '/v1/analytics/performance': 'analytics',
      '/v1/analytics/accuracy': 'analytics',
      '/v1/analytics/trends': 'analytics',
      
      '/v1/market/odds': 'market',
      '/v1/market/value-bets': 'market',
      '/v1/market/correlations': 'market'
    }

    // Find matching schema
    for (const [pattern, schemaName] of Object.entries(endpointMapping)) {
      if (endpoint.startsWith(pattern)) {
        return RequestValidator.SCHEMAS[schemaName] || null
      }
    }

    return null
  }

  // Sanitize input to prevent injection attacks
  sanitizeInput(value: any): any {
    if (typeof value !== 'string') {
      return value
    }

    // Remove potentially dangerous characters
    return value
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove JavaScript protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
  }

  // Validate API key format
  validateAPIKey(apiKey: string): boolean {
    // WinMix API keys should start with 'wm_' and be 35 characters total
    const keyPattern = /^wm_[A-Za-z0-9]{32}$/
    return keyPattern.test(apiKey)
  }

  // Validate date format
  validateDate(dateString: string): boolean {
    const date = new Date(dateString)
    return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  }

  // Validate UUID
  validateUUID(uuid: string): boolean {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidPattern.test(uuid)
  }

  // Validate pagination parameters
  validatePagination(limit?: string, offset?: string): { limit: number; offset: number; errors: ValidationError[] } {
    const errors: ValidationError[] = []
    let parsedLimit = 50 // default
    let parsedOffset = 0 // default

    if (limit !== undefined) {
      const limitNum = parseInt(limit)
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        errors.push({
          field: 'limit',
          message: 'Limit must be a number between 1 and 100',
          value: limit
        })
      } else {
        parsedLimit = limitNum
      }
    }

    if (offset !== undefined) {
      const offsetNum = parseInt(offset)
      if (isNaN(offsetNum) || offsetNum < 0) {
        errors.push({
          field: 'offset',
          message: 'Offset must be a non-negative number',
          value: offset
        })
      } else {
        parsedOffset = offsetNum
      }
    }

    return {
      limit: parsedLimit,
      offset: parsedOffset,
      errors
    }
  }
}