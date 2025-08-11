/**
 * CORS utilities for secure cross-origin request handling
 */

/**
 * Get allowed origins for CORS based on environment
 */
export const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];
  
  // Development origins
  if (process.env.NODE_ENV === 'development') {
    origins.push(
      'http://localhost:3000',
      'https://localhost:3000',
      'https://localhost:6274' // MCP Inspector
    );
  }
  
  // Claude.ai origins for MCP integration (always allowed)
  origins.push(
    'https://claude.ai',
    'https://www.claude.ai',
    'https://app.claude.ai',
    'https://api.claude.ai'
  );
  
  // Production origins
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL);
  }
  
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    origins.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }
  
  // Remove duplicates
  return [...new Set(origins)];
};

/**
 * Get primary allowed origin for simple CORS headers
 */
export const getPrimaryAllowedOrigin = (): string => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Fallback
  return 'https://dondecargo.vercel.app';
};

/**
 * Check if an origin is allowed
 */
export const isOriginAllowed = (origin: string | null): boolean => {
  if (!origin) return false;
  
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
};

/**
 * Get CORS headers for API responses
 */
export const getCorsHeaders = (origin?: string | null) => {
  const allowedOrigin = origin && isOriginAllowed(origin) 
    ? origin 
    : getPrimaryAllowedOrigin();
    
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, mcp-protocol-version',
    'Access-Control-Max-Age': '86400',
  };
};