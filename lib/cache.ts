// Server-side cache implementation
let Redis: any
if (typeof window === 'undefined') {
  try {
    Redis = require('redis')
  } catch (e) {
    console.warn('Redis not available, using memory cache only')
  }
}

interface CacheItem<T = unknown> {
  data: T
  expires: number
}

class CacheService {
  private redis: any = null
  private memoryCache = new Map<string, CacheItem>()
  private connected = false
  private isServer = typeof window === 'undefined'

  constructor() {
    this.initializeRedis()
  }

  private async initializeRedis(): Promise<void> {
    // Only initialize Redis on the server side
    if (!this.isServer || !Redis) {
      return
    }

    try {
      const redisUrl = process.env.REDIS_URL
      if (!redisUrl) {
        console.log('Redis URL not configured, using memory cache only')
        return
      }

      this.redis = Redis.createClient({ url: redisUrl })

      this.redis.on('error', (err: Error) => {
        console.error('Redis Client Error:', err)
        this.connected = false
      })

      this.redis.on('connect', () => {
        console.log('Redis connected successfully')
        this.connected = true
      })

      await this.redis.connect()
    } catch (error) {
      console.warn('Failed to initialize Redis, falling back to memory cache:', error)
      this.redis = null
      this.connected = false
    }
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      // Try Redis first if available (server-side only)
      if (this.isServer && this.redis && this.connected) {
        const value = await this.redis.get(key)
        if (value) {
          const parsed = JSON.parse(value)
          // Check if expired
          if (parsed.expires > Date.now()) {
            return parsed.data
          } else {
            // Expired, delete from Redis
            await this.redis.del(key)
          }
        }
      }

      // Fallback to memory cache
      const memoryItem = this.memoryCache.get(key)
      if (memoryItem) {
        if (memoryItem.expires > Date.now()) {
          return memoryItem.data
        } else {
          // Expired, delete from memory
          this.memoryCache.delete(key)
        }
      }

      return null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const expires = Date.now() + (ttlSeconds * 1000)
    const cacheItem = { data: value, expires }

    try {
      // Try Redis first if available (server-side only)
      if (this.isServer && this.redis && this.connected) {
        await this.redis.setEx(key, ttlSeconds, JSON.stringify(cacheItem))
      }

      // Always store in memory as fallback
      this.memoryCache.set(key, cacheItem)

      // Clean up expired memory cache entries periodically
      this.cleanupMemoryCache()
    } catch (error) {
      console.error('Cache set error:', error)
      // Still store in memory if Redis fails
      this.memoryCache.set(key, cacheItem)
    }
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key)
    return value !== null
  }

  async delete(key: string): Promise<void> {
    try {
      if (this.isServer && this.redis && this.connected) {
        await this.redis.del(key)
      }
      this.memoryCache.delete(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  async clear(): Promise<void> {
    try {
      if (this.isServer && this.redis && this.connected) {
        await this.redis.flushAll()
      }
      this.memoryCache.clear()
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  private cleanupMemoryCache(): void {
    const now = Date.now()
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.expires <= now) {
        this.memoryCache.delete(key)
      }
    }
  }

  // Generate cache key for user reports
  getUserReportsKey(stationId: string, dias: number, horario: string): string {
    return `user_reports:${stationId}:${dias}:${horario}`
  }

  // Specific method for user reports caching
  async getUserReports<T = unknown>(stationId: string, dias: number = 5, horario: string = 'diurno'): Promise<T | null> {
    const key = this.getUserReportsKey(stationId, dias, horario)
    return await this.get(key)
  }

  async setUserReports<T>(stationId: string, data: T, dias: number = 5, horario: string = 'diurno', ttlSeconds: number = 300): Promise<void> {
    const key = this.getUserReportsKey(stationId, dias, horario)
    await this.set(key, data, ttlSeconds)
  }

  async invalidateUserReports(stationId: string): Promise<void> {
    // Clear all user reports for this station (different dias/horario combinations)
    const patterns = [
      this.getUserReportsKey(stationId, 5, 'diurno'),
      this.getUserReportsKey(stationId, 5, 'nocturno'),
      this.getUserReportsKey(stationId, 7, 'diurno'),
      this.getUserReportsKey(stationId, 7, 'nocturno'),
    ]

    for (const key of patterns) {
      await this.delete(key)
    }
  }
}

// Singleton instance
const cacheService = new CacheService()

export { cacheService }
export type { CacheService }