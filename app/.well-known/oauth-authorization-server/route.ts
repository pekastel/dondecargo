import { oAuthDiscoveryMetadata } from "better-auth/plugins";
import { auth } from "../../../lib/auth";

/**
 * OAuth Authorization Server Metadata endpoint
 * This endpoint provides information about the OAuth authorization server
 * according to RFC 8414 (OAuth 2.0 Authorization Server Metadata)
 */
export const GET = oAuthDiscoveryMetadata(auth);

/**
 * Handle OPTIONS requests for CORS preflight
 */
export const OPTIONS = () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, mcp-protocol-version",
      "Access-Control-Max-Age": "86400",
    },
  });
};
