import { pgTable, text, timestamp, boolean, integer, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
// Import Better Auth schema to prevent Drizzle from dropping those tables
import * as betterAuthSchema from './better-auth-schema';

// Export Better Auth schema for Drizzle awareness
export * from './better-auth-schema';