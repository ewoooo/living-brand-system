import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { type MCPAccessSettings, mcpPlugin } from '@payloadcms/plugin-mcp'
import { searchPlugin } from '@payloadcms/plugin-search'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { ko } from '@payloadcms/translations/languages/ko'
import { buildConfig, type CollectionConfig, type PayloadRequest } from 'payload'
import sharp from 'sharp'
import { z } from 'zod/v3'
import { migrations } from '../migrations'
import { AgentSkills } from './collections/AgentSkills'
import { ApplicationImages } from './collections/ApplicationImages'
import { BrandColors } from './collections/BrandColors'
import { BrandLogos } from './collections/BrandLogos'
import { BrandTypefaces } from './collections/BrandTypefaces'
import { GuidelinePages } from './collections/GuidelinePages'
import { GuidelineSections } from './collections/GuidelineSections'
import { Plugins } from './collections/Plugins'
import { Rules } from './collections/Rules'
import { TemplateAssets } from './collections/TemplateAssets'
import { TemplateCategories } from './collections/TemplateCategories'
import { TemplateRules } from './collections/TemplateRules'
import { Templates } from './collections/Templates'
import { Users } from './collections/Users'
import { AgentSettings } from './globals/AgentSettings'
import { Guideline } from './globals/Guideline'
import { adminOnly } from './lib/auth'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const databaseURL = process.env.DATABASE_URL
const resendAPIKey = process.env.RESEND_API_KEY
const shouldRunProdMigrations =
	process.env.PAYLOAD_RUN_MIGRATIONS_ON_STARTUP === 'true' &&
	process.env.NODE_ENV === 'production' &&
	process.env.NEXT_PHASE !== 'phase-production-build'
const mcpListParameters = {
	limit: z.number().int().min(1).max(100).optional(),
	locale: z.enum(['ko', 'en']).optional(),
	page: z.number().int().min(1).optional(),
}
const mcpLocale = (value: unknown) => (value === 'en' ? 'en' : 'ko')
const mcpNumber = (value: unknown, fallback: number) =>
	typeof value === 'number' ? value : fallback
type McpToolArgs = Record<string, unknown>
type GetDefaultMcpAccessSettings = (overrideApiKey?: null | string) => Promise<MCPAccessSettings>

if (!databaseURL) {
	throw new Error(
		'DATABASE_URL is required. For local development, run Postgres and set DATABASE_URL=postgresql://payload:payload@127.0.0.1:5432/hd_cms_prototype',
	)
}

export default buildConfig({
	admin: {
		user: Users.slug,
		meta: {
			title: 'Living Brand System',
			titleSuffix: '- Living Brand System',
		},
		importMap: {
			baseDir: path.resolve(dirname),
		},
		components: {
			beforeDashboard: ['/components/admin/DashboardSummary'],
		},
	},
	collections: [
		Users,
		Rules,
		BrandLogos,
		BrandColors,
		BrandTypefaces,
		ApplicationImages,
		TemplateCategories,
		TemplateRules,
		Templates,
		TemplateAssets,
		Plugins,
		AgentSkills,
		GuidelineSections,
		GuidelinePages,
	],
	editor: lexicalEditor(),
	email: resendAPIKey
		? resendAdapter({
				apiKey: resendAPIKey,
				defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@plus-ex.com',
				defaultFromName: process.env.EMAIL_FROM_NAME || 'PROTO',
			})
		: undefined,
	secret: process.env.PAYLOAD_SECRET || '',
	typescript: {
		outputFile: path.resolve(dirname, 'payload-types.ts'),
	},
	db: postgresAdapter({
		migrationDir: './migrations',
		pool: {
			connectionString: databaseURL,
		},
		prodMigrations: shouldRunProdMigrations ? migrations : undefined,
		push: process.env.PAYLOAD_DB_PUSH === 'true',
	}),
	sharp,
	plugins: [
		mcpPlugin({
			overrideAuth: async (
				req: PayloadRequest,
				getDefaultMcpAccessSettings: GetDefaultMcpAccessSettings,
			) => {
				const accessSettings = await getDefaultMcpAccessSettings()
				req.user = accessSettings.user
				return accessSettings
			},
			overrideApiKeyCollection: (collection: CollectionConfig) => ({
				...collection,
				access: {
					create: adminOnly,
					delete: adminOnly,
					read: adminOnly,
					update: adminOnly,
				},
			}),
			mcp: {
				tools: [
					{
						name: 'findGuidelinePages',
						description:
							'Find live guideline pages with localized copy, rich content blocks, and linked rules.',
						parameters: mcpListParameters,
						handler: async (args: McpToolArgs, req: PayloadRequest) => {
							const result = await req.payload.find({
								collection: 'guideline-pages',
								depth: 1,
								draft: false,
								fallbackLocale: 'en',
								limit: mcpNumber(args.limit, 20),
								locale: mcpLocale(args.locale),
								overrideAccess: false,
								page: mcpNumber(args.page, 1),
								req,
								sort: 'displayOrder',
								user: req.user,
								select: {
									title: true,
									slug: true,
									description: true,
									rules: true,
									section: true,
									blocks: true,
								},
							})

							return { content: [{ type: 'text', text: JSON.stringify(result) }] }
						},
					},
					{
						name: 'findSections',
						description:
							'Find live guideline navigation sections and their page ordering.',
						parameters: mcpListParameters,
						handler: async (args: McpToolArgs, req: PayloadRequest) => {
							const result = await req.payload.find({
								collection: 'sections',
								depth: 0,
								draft: false,
								fallbackLocale: 'en',
								limit: mcpNumber(args.limit, 100),
								locale: mcpLocale(args.locale),
								overrideAccess: false,
								page: mcpNumber(args.page, 1),
								req,
								sort: 'displayOrder',
								user: req.user,
								select: {
									title: true,
									slug: true,
									description: true,
									displayOrder: true,
								},
							})

							return { content: [{ type: 'text', text: JSON.stringify(result) }] }
						},
					},
					{
						name: 'findRules',
						description:
							'Find live operational brand rules used to check production work.',
						parameters: mcpListParameters,
						handler: async (args: McpToolArgs, req: PayloadRequest) => {
							const result = await req.payload.find({
								collection: 'rules',
								depth: 0,
								limit: mcpNumber(args.limit, 100),
								overrideAccess: false,
								page: mcpNumber(args.page, 1),
								req,
								sort: 'key',
								user: req.user,
								where: {
									status: {
										equals: 'live',
									},
								},
							})

							return { content: [{ type: 'text', text: JSON.stringify(result) }] }
						},
					},
					{
						name: 'findGuideline',
						description: 'Find live top-level guideline document metadata.',
						parameters: {
							locale: z.enum(['ko', 'en']).optional(),
						},
						handler: async (args: McpToolArgs, req: PayloadRequest) => {
							const guideline = await req.payload.findGlobal({
								slug: 'guideline',
								depth: 1,
								draft: false,
								fallbackLocale: 'en',
								locale: mcpLocale(args.locale),
								overrideAccess: false,
								req,
								user: req.user,
							})

							return { content: [{ type: 'text', text: JSON.stringify(guideline) }] }
						},
					},
				],
			},
		} as never),
		searchPlugin({
			collections: ['guideline-pages', 'sections'],
			defaultPriorities: {
				'guideline-pages': 20,
				sections: 10,
			},
			searchOverrides: {
				access: {
					read: ({ req }) => Boolean(req.user),
				},
			},
		}),
		s3Storage({
			collections: {
				'brand-logos': true,
				'application-images': true,
				'template-assets': true,
			},
			bucket: process.env.S3_BUCKET || '',
			config: {
				region: process.env.S3_REGION || '',
				credentials: {
					accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
					secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
				},
			},
		}),
	],
	i18n: {
		// 관리자 UI 언어는 언어 쿠키, 브라우저 언어, fallbackLanguage 순서로 결정된다.
		supportedLanguages: { ko }, // { ko, en }
		// 지원되는 쿠키나 브라우저 언어가 없을 때만 사용된다.
		fallbackLanguage: 'ko',
	},
	localization: {
		locales: ['ko', 'en'],
		defaultLocale: 'ko',
	},
	globals: [Guideline, AgentSettings],
})
