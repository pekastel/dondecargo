/**
 * Secure error handling utilities to prevent information disclosure
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Generic error interface for consistent error responses
 */
interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Safe error logger that filters sensitive information
 */
export const logError = (context: string, error: unknown, sensitiveData?: Record<string, unknown>) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Always log basic error info
  console.error(`❌ [${context}] Error:`, error instanceof Error ? error.message : 'Unknown error');
  
  // In development, log full details including stack traces
  if (isDevelopment) {
    if (error instanceof Error && error.stack) {
      console.error(`📍 Stack trace:`, error.stack);
    }
    
    if (sensitiveData) {
      // Filter out truly sensitive data even in development
      const filteredData = Object.entries(sensitiveData).reduce((acc, [key, value]) => {
        if (key.toLowerCase().includes('password') || 
            key.toLowerCase().includes('secret') ||
            key.toLowerCase().includes('token')) {
          acc[key] = '[REDACTED]';
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, unknown>);
      
      console.error(`📊 Context data:`, filteredData);
    }
  }
};

/**
 * Create safe API error response that doesn't leak sensitive information
 */
export const createErrorResponse = (
  context: string, 
  error: unknown, 
  statusCode: number = 500,
  publicMessage?: string,
  sensitiveData?: Record<string, unknown>
): NextResponse => {
  // Log the error securely
  logError(context, error, sensitiveData);
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Handle Zod validation errors specifically
  if (error instanceof ZodError) {
    return NextResponse.json(
      { 
        error: publicMessage || 'Datos inválidos',
        code: 'VALIDATION_ERROR',
        ...(isDevelopment && { details: error.errors })
      },
      { status: 400 }
    );
  }
  
  // Handle known error types
  if (error instanceof Error) {
    // Only expose error message in development or for certain "safe" errors
    const isSafeError = error.message.includes('no encontrad') || 
                       error.message.includes('no autorizado') ||
                       error.message.includes('inválid');
    
    const errorMessage = (isDevelopment || isSafeError) 
      ? error.message 
      : publicMessage || 'Error interno del servidor';
    
    return NextResponse.json(
      {
        error: errorMessage,
        ...(isDevelopment && { details: error.message })
      },
      { status: statusCode }
    );
  }
  
  // Generic error response
  return NextResponse.json(
    {
      error: publicMessage || 'Error interno del servidor',
      ...(isDevelopment && { details: String(error) })
    },
    { status: statusCode }
  );
};

/**
 * Database connection error handler
 */
export const handleDatabaseError = (context: string, error: unknown): NextResponse => {
  return createErrorResponse(
    context,
    error,
    500,
    'Error de conexión a la base de datos',
    { 
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    }
  );
};

/**
 * Authentication error handler
 */
export const handleAuthError = (context: string, error: unknown): NextResponse => {
  return createErrorResponse(
    context,
    error,
    401,
    'No autorizado'
  );
};

/**
 * Not found error handler
 */
export const handleNotFoundError = (context: string, resource: string): NextResponse => {
  return NextResponse.json(
    { error: `${resource} no encontrado` },
    { status: 404 }
  );
};

/**
 * Safe console log that filters sensitive information
 */
export const safeLog = (message: string, data?: Record<string, unknown>) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!isDevelopment) {
    // In production, only log basic messages without data
    console.log(message);
    return;
  }
  
  if (data) {
    // Filter sensitive data even in development logs
    const filteredData = Object.entries(data).reduce((acc, [key, value]) => {
      const lowerKey = key.toLowerCase();
      
      if (lowerKey.includes('password') || 
          lowerKey.includes('secret') ||
          lowerKey.includes('token') ||
          lowerKey.includes('key')) {
        acc[key] = '[REDACTED]';
      } else if (lowerKey.includes('email') && typeof value === 'string') {
        // Partially redact emails
        acc[key] = value.replace(/(.{2}).*@/, '$1***@');
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);
    
    console.log(message, filteredData);
  } else {
    console.log(message);
  }
};