import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { type MCPAccessSettings, mcpPlugin } from '@payloadcms/plugin-mcp'
import { searchPlugin } from '@payloadcms/plugin-search'
import { EXPERIMENTAL_TableFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { ko } from '@payloadcms/translations/languages/ko'
import { buildConfig, type CollectionConfig, type PayloadRequest } from 'payload'
import sharp from 'sharp'
import { z } from 'zod/v3'
import { migrations } from '../migrations'
import { AgentChatSessions } from './collections/AgentChatSessions'
import { AgentSkills } from './collections/AgentSkills'
import { ApplicationImages } from './collections/ApplicationImages'
import { BrandColors } from './collections/BrandColors'
import { BrandLogos } from './collections/BrandLogos'
import { BrandTypefaces } from './collections/BrandTypefaces'
import { CheckSessions } from './collections/CheckSessions'
import { GuidelineChapters } from './collections/GuidelineChapters'
import { GuidelinePages } from './collections/GuidelinePages'
import { GuidelineSections } from './collections/GuidelineSections'
import { Plugins } from './collections/Plugins'
import { RuleSpecs } from './collections/RuleSpecs'
import { Rules } from './collections/Rules'
import { TemplateAssets } from './collections/TemplateAssets'
import { TemplateCategories } from './collections/TemplateCategories'
import { Templates } from './collections/Templates'
import { Users } from './collections/Users'
import { env } from './env'
import { AgentSettings } from './globals/AgentSettings'
import { Guideline } from './globals/Guideline'
import { adminOnly } from './lib/auth'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const shouldRunProdMigrations =
	env.PAYLOAD_RUN_MIGRATIONS_ON_STARTUP === 'true' &&
	env.NODE_ENV === 'production' &&
	env.NEXT_PHASE !== 'phase-production-build'
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

/** MCP 툴 공통 골격 — 조회 결과를 text 콘텐츠(JSON 문자열)로 감싼다. */
const mcpTextTool = (
	name: string,
	description: string,
	parameters: Record<string, z.ZodTypeAny>,
	run: (args: McpToolArgs, req: PayloadRequest) => Promise<unknown>,
) => ({
	name,
	description,
	parameters,
	handler: async (args: McpToolArgs, req: PayloadRequest) => ({
		content: [{ type: 'text' as const, text: JSON.stringify(await run(args, req)) }],
	}),
})
// ponytail: custom MCP tools go here; keep each handler narrow and access-checked.
// Example:
// const customMcpTools = [
// 	mcpTextTool(
// 		'findLiveTemplates',
// 		'Find live templates available to the authenticated MCP user.',
// 		mcpListParameters,
// 		(args, req) =>
// 			req.payload.find({
// 				collection: 'templates',
// 				limit: mcpNumber(args.limit, 20),
// 				overrideAccess: false,
// 				page: mcpNumber(args.page, 1),
// 				req,
// 				user: req.user,
// 				where: { status: { equals: 'live' } },
// 			}),
// 	),
// ]
const customMcpTools: ReturnType<typeof mcpTextTool>[] = []

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
		GuidelineChapters,
		GuidelineSections,
		GuidelinePages,
		RuleSpecs,
		Rules,
		BrandLogos,
		BrandColors,
		BrandTypefaces,
		ApplicationImages,
		TemplateCategories,
		Templates,
		TemplateAssets,
		Plugins,
		CheckSessions,
		AgentChatSessions,
		AgentSkills,
		Users,
	],
	editor: lexicalEditor({
		// 가이드라인 수치 규정 표(최소 사이즈, 자간 등) 입력용. EXPERIMENTAL: 업그레이드 시 변경 가능성 있음.
		features: ({ defaultFeatures }) => [...defaultFeatures, EXPERIMENTAL_TableFeature()],
	}),
	email: env.RESEND_API_KEY
		? resendAdapter({
				apiKey: env.RESEND_API_KEY,
				defaultFromAddress: env.EMAIL_FROM_ADDRESS || 'noreply@plus-ex.com',
				defaultFromName: env.EMAIL_FROM_NAME || 'PROTO',
			})
		: undefined,
	secret: env.PAYLOAD_SECRET,
	upload: {
		limits: {
			fileSize: 20_000_000, // 20MB — 고해상 브랜드 에셋 여유 상한, 무제한 업로드 방지 (docs/07 #27)
		},
	},
	typescript: {
		outputFile: path.resolve(dirname, 'payload-types.ts'),
	},
	db: postgresAdapter({
		migrationDir: './migrations',
		pool: {
			connectionString: env.DATABASE_URL,
		},
		prodMigrations: shouldRunProdMigrations ? migrations : undefined,
		push: env.PAYLOAD_DB_PUSH === 'true',
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
					mcpTextTool(
						'findGuidelinePages',
						'Find live guideline pages with localized copy, rich content blocks, and linked rules.',
						mcpListParameters,
						(args, req) =>
							req.payload.find({
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
							}),
					),
					mcpTextTool(
						'findChapters',
						'Find live guideline top-level chapters and their ordering.',
						mcpListParameters,
						(args, req) =>
							req.payload.find({
								collection: 'guideline-chapters',
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
							}),
					),
					mcpTextTool(
						'findSections',
						'Find live guideline sections, their parent chapter, and page ordering.',
						mcpListParameters,
						(args, req) =>
							req.payload.find({
								collection: 'guideline-sections',
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
									chapter: true,
								},
							}),
					),
					mcpTextTool(
						'findRules',
						'Find live operational brand rules used to check production work.',
						mcpListParameters,
						(args, req) =>
							req.payload.find({
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
							}),
					),
					mcpTextTool(
						'findGuideline',
						'Find live top-level guideline document metadata.',
						{ locale: z.enum(['ko', 'en']).optional() },
						(args, req) =>
							req.payload.findGlobal({
								slug: 'guideline',
								depth: 1,
								draft: false,
								fallbackLocale: 'en',
								locale: mcpLocale(args.locale),
								overrideAccess: false,
								req,
								user: req.user,
							}),
					),
					...customMcpTools,
				],
			},
		} as never),
		searchPlugin({
			collections: ['guideline-pages', 'guideline-sections', 'guideline-chapters'],
			defaultPriorities: {
				'guideline-pages': 20,
				'guideline-sections': 10,
				'guideline-chapters': 5,
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
			bucket: env.S3_BUCKET || '',
			config: {
				region: env.S3_REGION || '',
				credentials: {
					accessKeyId: env.S3_ACCESS_KEY_ID || '',
					secretAccessKey: env.S3_SECRET_ACCESS_KEY || '',
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
