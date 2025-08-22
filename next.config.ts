import type { NextConfig } from "next";
import { getPrimaryAllowedOrigin } from "./lib/utils/cors";

const nextConfig: NextConfig = {
	/* config options here */
	async redirects() {
		return [
			{
				source: '/combustible/:path*',
				destination: '/buscar',
				permanent: true,
			},
		];
	},
	async headers() {
		const allowedOrigin = getPrimaryAllowedOrigin();
		
		return [
			{
				source: '/api/auth/:path*',
				headers: [
					{ key: 'Access-Control-Allow-Credentials', value: 'true' },
					{ key: 'Access-Control-Allow-Origin', value: allowedOrigin },
					{ key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
					{
						key: 'Access-Control-Allow-Headers',
						value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Authorization, mcp-protocol-version'
					}
				]
			},
			{
				source: '/api/:path*',
				headers: [
					{ key: 'Access-Control-Allow-Credentials', value: 'true' },
					{ key: 'Access-Control-Allow-Origin', value: allowedOrigin },
					{ key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
					{
						key: 'Access-Control-Allow-Headers',
						value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Authorization'
					}
				]
			}
		];
	}
};

export default nextConfig;
