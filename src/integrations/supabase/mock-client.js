// Mock authentication for testing purposes
// This replaces Supabase auth temporarily to unblock development

const MOCK_USERS = [
  {
    id: 'test-user-1',
    email: 'takosadam@gmail.com',
    password: 'admin123',
    full_name: 'Test User',
    role: 'admin',
    avatar_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// Mock localStorage for Node.js environment
const mockLocalStorage = {
  getItem: (key) => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(key)
    }
    return null
  },
  setItem: (key, value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value)
    }
  },
  removeItem: (key) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key)
    }
  }
}

class MockSupabaseAuth {
  constructor() {
    this.currentUser = null
    this.session = null
  }

  async signInWithPassword({ email, password }) {
    const user = MOCK_USERS.find(u => u.email === email && u.password === password)
    
    if (!user) {
      throw new Error('Invalid login credentials')
    }

    this.currentUser = {
      id: user.id,
      email: user.email,
      user_metadata: { full_name: user.full_name }
    }
    
    this.session = {
      user: this.currentUser,
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Date.now() + 3600000 // 1 hour
    }

    // Store in localStorage
    mockLocalStorage.setItem('mock-auth-session', JSON.stringify(this.session))

    return { data: { user: this.currentUser, session: this.session }, error: null }
  }

  async signUp({ email, password, options = {} }) {
    // Check if user already exists
    if (MOCK_USERS.find(u => u.email === email)) {
      throw new Error('User already exists')
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email,
      password,
      full_name: options.data?.full_name || null,
      role: 'viewer',
      avatar_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    MOCK_USERS.push(newUser)

    return this.signInWithPassword({ email, password })
  }

  async signOut() {
    this.currentUser = null
    this.session = null
    mockLocalStorage.removeItem('mock-auth-session')
    return { error: null }
  }

  async getSession() {
    // Check localStorage for existing session
    const storedSession = mockLocalStorage.getItem('mock-auth-session')
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession)
        if (session.expires_at > Date.now()) {
          this.session = session
          this.currentUser = session.user
          return { data: { session }, error: null }
        } else {
          mockLocalStorage.removeItem('mock-auth-session')
        }
      } catch (error) {
        mockLocalStorage.removeItem('mock-auth-session')
      }
    }

    return { data: { session: null }, error: null }
  }

  onAuthStateChange(callback) {
    // Initial call
    this.getSession().then(({ data }) => {
      callback(data.session ? 'SIGNED_IN' : 'SIGNED_OUT', data.session)
    })

    // Return subscription object
    return {
      data: { subscription: { unsubscribe: () => {} } }
    }
  }

  // Reset password (mock)
  async resetPasswordForEmail(email) {
    console.log(`Mock: Password reset email sent to ${email}`)
    return { data: {}, error: null }
  }
}

class MockSupabaseClient {
  constructor() {
    this.auth = new MockSupabaseAuth()
  }

  from(tableName) {
    return new MockSupabaseQueryBuilder(tableName)
  }
}

class MockSupabaseQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName
    this.query = { select: [], filters: [], single: false }
  }

  select(columns = '*') {
    this.query.select = columns.split(',').map(col => col.trim())
    return this
  }

  eq(column, value) {
    this.query.filters.push({ column, value, operator: 'eq' })
    return this
  }

  single() {
    this.query.single = true
    return this
  }

  insert(data) {
    console.log(`Mock: Insert into ${this.tableName}:`, data)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: Array.isArray(data) ? data : [data], error: null })
      }, 100)
    })
  }

  async then(callback) {
    // Simulate database query
    if (this.tableName === 'user_profiles') {
      const userFilter = this.query.filters.find(f => f.column === 'id')
      if (userFilter) {
        const user = MOCK_USERS.find(u => u.id === userFilter.value)
        if (user) {
          const profileData = {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            avatar_url: user.avatar_url,
            bio: null,
            is_active: user.is_active,
            last_login_at: new Date().toISOString(),
            created_at: user.created_at,
            updated_at: user.updated_at
          }
          return callback({ data: profileData, error: null })
        }
      }
    }

    if (this.tableName === 'user_roles') {
      const userFilter = this.query.filters.find(f => f.column === 'user_id')
      if (userFilter) {
        const user = MOCK_USERS.find(u => u.id === userFilter.value)
        if (user) {
          return callback({ data: { role: user.role }, error: null })
        }
      }
    }

    return callback({ data: null, error: { code: 'PGRST116', message: 'No rows found' } })
  }
}

export const supabase = new MockSupabaseClient()