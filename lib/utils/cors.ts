/**
 * CORS utilities for secure cross-origin request handling
 */

// Eliminado import de getBaseUrl para evitar dependencias y errores de resolución de módulos

/**
 * Get allowed origins for CORS based on environment
 */
export const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];
  
  // Development origins
  if (process.env.NODE_ENV === 'development') {
    const portEnv = process.env.PORT && Number.isFinite(Number(process.env.PORT))
      ? Number(process.env.PORT)
      : undefined;

    // Conjunto de puertos de respaldo comunes usados por Next.js cuando 3000 está ocupado
    const fallbackPorts = new Set<number>([3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010]);
    if (portEnv) fallbackPorts.add(portEnv);

    // Mapear a origins http/https para localhost
    for (const p of fallbackPorts) {
      origins.push(`http://localhost:${p}`);
      origins.push(`https://localhost:${p}`);
    }

    // Mantener entradas explícitas existentes por compatibilidad
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
  
  // Netlify deploy URL (preview/branch/prod)
  if (process.env.DEPLOY_URL) {
    const url = process.env.DEPLOY_URL;
    origins.push(url.startsWith('http') ? url : `https://${url}`);
  }
  
  // Netlify site primary URL (usually production)
  if (process.env.URL) {
    const url = process.env.URL;
    origins.push(url.startsWith('http') ? url : `https://${url}`);
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
    const portEnv = process.env.PORT && Number.isFinite(Number(process.env.PORT))
      ? Number(process.env.PORT)
      : 3000;
    return `http://localhost:${portEnv}`;
  }
  
  // Netlify deploy URL (preview/branch/prod)
  if (process.env.DEPLOY_URL) {
    const url = process.env.DEPLOY_URL;
    return url.startsWith('http') ? url : `https://${url}`;
  }

  // Netlify site primary URL (usually production)
  if (process.env.URL) {
    const url = process.env.URL;
    return url.startsWith('http') ? url : `https://${url}`;
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
  return `https://${process.env.VERCEL_URL}`;
};

/**
 * Check if an origin is allowed
 */
export const isOriginAllowed = (origin: string | null): boolean => {
  if (!origin) return false;
  
  // Permitir cualquier localhost:{puerto} sólo en development
  if (process.env.NODE_ENV === 'development') {
    const localhostRegex = /^https?:\/\/localhost(:\d+)?$/;
    if (localhostRegex.test(origin)) {
      return true;
    }
  }
  
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