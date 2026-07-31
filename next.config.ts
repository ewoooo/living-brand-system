import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import { legacyPageRedirects } from './src/lib/routes'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
	output: 'standalone',
	outputFileTracingIncludes: {
		'/*': ['node_modules/sharp/**/*', 'node_modules/@img/**/*'],
	},
	async redirects() {
		return legacyPageRedirects.map((redirect) => ({ ...redirect }))
	},
	// 응답 보안 헤더 (docs/07 #31). CSP는 Payload admin 인라인 스크립트 영향 검증 후 별도 도입한다.
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					// Payload admin live preview가 same-origin iframe을 쓰므로 DENY가 아닌 SAMEORIGIN.
					{ key: 'X-Frame-Options', value: 'SAMEORIGIN' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
					// HTTPS 배포에서만 브라우저가 적용한다. 로컬 http에는 영향 없다.
					{
						key: 'Strict-Transport-Security',
						value: 'max-age=31536000; includeSubDomains',
					},
				],
			},
		]
	},
	images: {
		localPatterns: [
			{
				pathname: '/api/media/file/**',
			},
		],
	},
	webpack: (webpackConfig) => {
		webpackConfig.resolve.extensionAlias = {
			'.cjs': ['.cts', '.cjs'],
			'.js': ['.ts', '.tsx', '.js', '.jsx'],
			'.mjs': ['.mts', '.mjs'],
		}

		return webpackConfig
	},
	turbopack: {
		root: path.resolve(dirname),
	},
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
