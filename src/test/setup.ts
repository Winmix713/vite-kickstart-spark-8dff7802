import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Setup MSW server
import { server } from './msw/server'

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers()
})

// Clean up server after all tests
afterAll(() => {
  server.close()
})

// Mock environment variables for testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1920,
})

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 1080,
})

// Mock console.error to reduce noise in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Suppress fetch warnings in tests
const originalFetch = global.fetch
global.fetch = vi.fn((...args) => originalFetch(...args))

// Mock react-ga4
vi.mock('react-ga4', () => ({
  default: {
    initialize: vi.fn(),
    pageview: vi.fn(),
    event: vi.fn(),
  },
}))

// Mock react-grid-layout
vi.mock('react-grid-layout', () => ({
  Responsive: ({ children }: { children: React.ReactNode }) => children,
  WidthProvider: (Comp: any) => Comp,
  GridLayout: ({ children }: { children: React.ReactNode }) => children,
  Layout: [],
}))

// Mock react-big-calendar
vi.mock('react-big-calendar', () => ({
  Calendar: ({ children }: { children: React.ReactNode }) => children,
  momentLocalizer: vi.fn(),
  eventPropGetter: vi.fn(),
}))

// Mock lottie-react
vi.mock('lottie-react', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock react-helmet
vi.mock('react-helmet', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => children,
}))

export {}