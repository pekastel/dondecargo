import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock SWR
jest.mock('swr', () => ({
  __esModule: true,
  default: (key, fetcher) => ({
    data: undefined,
    error: undefined,
    isLoading: false,
    mutate: jest.fn(),
  }),
  mutate: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

// Mock window.dispatchEvent
Object.defineProperty(window, 'dispatchEvent', {
  writable: true,
  value: jest.fn(),
})

// Mock window.addEventListener
Object.defineProperty(window, 'addEventListener', {
  writable: true,
  value: jest.fn(),
})

// Mock window.removeEventListener
Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  value: jest.fn(),
})

// Mock process.env for tests
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.AUTH_SECRET = 'test-secret-key-for-testing-only'

// Mock Next.js Request and Response
global.Request = class MockRequest {
  constructor(input, init) {
    // Ensure URL is absolute for the URL constructor
    this.url = input.startsWith('http') ? input : `https://example.com${input}`
    this.method = init?.method || 'GET'
    this.headers = new Headers(init?.headers || {})
    this.body = init?.body
  }
  
  async json() {
    return JSON.parse(this.body || '{}')
  }
}

global.Response = class MockResponse {
  constructor(body, init) {
    this.body = body
    this.status = init?.status || 200
    this.headers = new Headers(init?.headers || {})
  }
  
  static json(data, init) {
    return new MockResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers
      }
    })
  }
  
  async json() {
    return JSON.parse(this.body || '{}')
  }
  
  async text() {
    return this.body || ''
  }
}

global.Headers = class MockHeaders {
  constructor(init) {
    this.headers = new Map()
    if (init) {
      if (init instanceof Headers) {
        init.forEach((value, key) => this.headers.set(key, value))
      } else {
        Object.entries(init).forEach(([key, value]) => this.headers.set(key, value))
      }
    }
  }
  
  get(key) {
    return this.headers.get(key)
  }
  
  set(key, value) {
    this.headers.set(key, value)
  }
  
  has(key) {
    return this.headers.has(key)
  }
  
  forEach(callback) {
    this.headers.forEach(callback)
  }
}