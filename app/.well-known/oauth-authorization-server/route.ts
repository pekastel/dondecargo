import { oAuthDiscoveryMetadata } from "better-auth/plugins";
import { auth } from "../../../lib/auth";
import { getCorsHeaders } from "../../../lib/utils/cors";

/**
 * OAuth Authorization Server Metadata endpoint
 * This endpoint provides information about the OAuth authorization server
 * according to RFC 8414 (OAuth 2.0 Authorization Server Metadata)
 */
export const GET = oAuthDiscoveryMetadata(auth);

/**
 * Handle OPTIONS requests for CORS preflight
 */
export const OPTIONS = (request: Request) => {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
};
