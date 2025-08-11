import { getBaseUrl } from "../../../lib/utils/url";
import { getCorsHeaders } from "../../../lib/utils/cors";

/**
 * OAuth Protected Resource Discovery endpoint
 * This endpoint provides information about the OAuth protected resource
 * according to RFC 8414 (OAuth 2.0 Authorization Server Metadata)
 */
export const GET = (request: Request) => {
    const baseURL = getBaseUrl();
    const origin = request.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);
    
    return new Response(JSON.stringify({
        resource: baseURL,
        authorization_servers: [baseURL],
        bearer_methods_supported: ['header'],
        resource_documentation: `${baseURL}/docs`,
        scopes_supported: [
            'openid',
            'profile',
            'email',
            'offline_access'
        ]
    }),
    {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
            "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
    });
}

// Handle OPTIONS requests for CORS preflight
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
}
