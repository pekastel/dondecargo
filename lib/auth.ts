import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/drizzle/connection";
import { mcp } from "better-auth/plugins";
// import { Pool } from "pg";
import { getBaseUrl } from "./utils/url";
import { admin } from "better-auth/plugins";
import { sendVerificationEmail } from "./email";
import { env } from "@/lib/env";
import { getCurrentTermsHash } from "./terms-hash";

const baseURL = getBaseUrl();

const enableEmailVerification = env.ENABLE_EMAIL_VERIFICATION;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
  }),
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Validate that user has accepted terms and populate metadata
          return {
            data: {
              ...user,
              // Keep the acceptedTerms value from the frontend
              acceptedTermsAt: new Date().toISOString(),
              termsHash: getCurrentTermsHash(),
              role: "user",
            },
          };
        },
      },
    },
  },
  // database: new Pool({
  // 	connectionString: process.env.DATABASE_URL,
  // }),
  plugins: [
    mcp({
      loginPage: "/login",
      oidcConfig: {
        loginPage: "/login",
        scopes: [
          "openid",
          "profile",
          "email",
          "offline_access"
        ],
        accessTokenExpiresIn: 3600,
        refreshTokenExpiresIn: 604800,
        codeExpiresIn: 600,
        requirePKCE: true, // Important for public clients
        allowDynamicClientRegistration: true,
        // defaultScope: "openid"
      }
    }),
    admin()
  ],
  baseURL,
  trustedOrigins: [
    "https://localhost:3000", // Another possible localhost URL for desktop clients [2]
    "https://localhost:6274",  // Inspector
    "https://claude.ai", // The base domain of Claude.ai
    "https://www.claude.ai", // www variant
    "https://app.claude.ai", // app subdomain
    "https://api.claude.ai", // API subdomain
    // If you are deploying on Vercel and using preview deployments:
    baseURL,
  ],
  secret: env.AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    disableSignUp: false, // If true, disables sign-up for new users entirely. Only existing users can sign in.
    // Email verification is optional and controlled by ENABLE_EMAIL_VERIFICATION
    // To enable email verification, set ENABLE_EMAIL_VERIFICATION=true
    // To disable email verification, set ENABLE_EMAIL_VERIFICATION=false or leave unset
    requireEmailVerification: enableEmailVerification
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, 
      },
      acceptedTerms: {
        type: "boolean",
        required: true,
        defaultValue: false,
      },
      acceptedTermsAt: {
        type: "string",
        required: false,
        input: false
      },
      termsHash: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  ...(enableEmailVerification && {
    emailVerification: {
      sendVerificationEmail: async (data) => {
        await sendVerificationEmail(data);
      },
    },
  }),
});
