import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    // Database
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection string"),
    
    // Authentication
    AUTH_SECRET: z
      .string()
      .min(32, "AUTH_SECRET must be at least 32 characters long")
      .optional()
      .default("your-secret-key-at-least-32-characters-long"),
    
    // Email Service (Optional)
    LOOPS_API_KEY: z
      .string()
      .optional()
      .describe("Loops.js API key for email verification and transactional emails"),
    
    LOOPS_EMAIL_VERIFICATION_TEMPLATE_ID: z
      .string()
      .optional()
      .default("cmd7ideu22tzlzg0jlw2hb99b")
      .describe("Custom email verification template ID for Loops.js"),

    LOOPS_REPORT_PRICE_TEMPLATE_ID: z
      .string()
      .optional()
      .default("cmd7ideu22tzlzg0jlw2hb99b")
      .describe("Custom report price template ID for Loops.js"),

    LOOPS_WELCOME_TEMPLATE_ID: z
      .string()
      .optional()
      .describe("Welcome email template ID for Loops.js"),
    
    // Contact Form (Optional)
    LOOPS_CONTACT_TEMPLATE_ID: z
      .string()
      .optional()
      .describe("Transactional template ID for contact form via Loops.js"),

    CONTACT_TO_EMAIL: z
      .string()
      .email("CONTACT_TO_EMAIL must be a valid email")
      .optional()
      .describe("Destination email for contact form submissions"),

    // Email Verification Feature Toggle
    ENABLE_EMAIL_VERIFICATION: z
      .enum(["true", "false"])
      .optional()
      .default("true")
      .transform((val) => val === "true")
      .describe("Enable email verification for new user registrations"),
    
    // Redis (Optional)
    REDIS_URL: z
      .string()
      .url("REDIS_URL must be a valid Redis connection string")
      .optional()
      .describe("Redis connection string for MCP adapter session management"),
    
    // Vercel Environment Variables (automatically set by Vercel)
    VERCEL_PROJECT_PRODUCTION_URL: z
      .string()
      .optional()
      .describe("Production URL of the Vercel project"),
    
    VERCEL_BRANCH_URL: z
      .string()
      .optional()
      .describe("Branch/preview deployment URL"),
    
    VERCEL_URL: z
      .string()
      .optional()
      .describe("Default Vercel deployment URL"),
    
    // Runtime Environment
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .optional()
      .default("development"),
    
    // Base URL fallback
    BASE_URL: z
      .string()
      .url("BASE_URL must be a valid URL")
      .optional()
      .default("http://localhost:3000")
      .describe("Base URL fallback for development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // Custom domain override (client-side accessible)
    NEXT_PUBLIC_APP_URL: z
      .string()
      .url("NEXT_PUBLIC_APP_URL must be a valid URL")
      .optional()
      .describe("Custom domain URL that takes precedence over Vercel URLs"),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    // Server-side
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    LOOPS_API_KEY: process.env.LOOPS_API_KEY,
    LOOPS_EMAIL_VERIFICATION_TEMPLATE_ID: process.env.LOOPS_EMAIL_VERIFICATION_TEMPLATE_ID,
    LOOPS_REPORT_PRICE_TEMPLATE_ID: process.env.LOOPS_REPORT_PRICE_TEMPLATE_ID,
    LOOPS_WELCOME_TEMPLATE_ID: process.env.LOOPS_WELCOME_TEMPLATE_ID,
    LOOPS_CONTACT_TEMPLATE_ID: process.env.LOOPS_CONTACT_TEMPLATE_ID,
    CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
    ENABLE_EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION,
    REDIS_URL: process.env.REDIS_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    NODE_ENV: process.env.NODE_ENV,
    BASE_URL: process.env.BASE_URL,
    
    // Client-side
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=""` will throw an error.
   */
  emptyStringAsUndefined: true,
});