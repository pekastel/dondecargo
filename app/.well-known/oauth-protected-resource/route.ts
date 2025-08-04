import { getBaseUrl } from "../../../lib/utils/url";

/**
 * OAuth Protected Resource Discovery endpoint
 * This endpoint provides information about the OAuth protected resource
 * according to RFC 8414 (OAuth 2.0 Authorization Server Metadata)
 */
export const GET = () => {
    const baseURL = getBaseUrl();
    
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
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, mcp-protocol-version",
            "Access-Control-Max-Age": "86400",
        },
    });
}

// Handle OPTIONS requests for CORS preflight
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
}
