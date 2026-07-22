import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { type MCPAccessSettings, mcpPlugin } from '@payloadcms/plugin-mcp'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { searchPlugin } from '@payloadcms/plugin-search'
import { EXPERIMENTAL_TableFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { ko } from '@payloadcms/translations/languages/ko'
import { buildConfig, type CollectionConfig, type GlobalConfig, type PayloadRequest } from 'payload'
import { betterEditorSettingsGlobal } from 'payload-better-editor'
import sharp from 'sharp'
import { z } from 'zod/v3'
import { migrations } from '../migrations'
import { LegacyGuidelineChapters } from '../migrations/legacy-guideline/chapters'
import { LegacyGuidelinePages } from '../migrations/legacy-guideline/pages'
import { LegacyGuidelineSections } from '../migrations/legacy-guideline/sections'
import { AgentChatSessions } from './collections/AgentChatSessions'
import { AgentSkills } from './collections/AgentSkills'
import { ApplicationImages } from './collections/ApplicationImages'
import { BrandColors } from './collections/BrandColors'
import { BrandIcons } from './collections/BrandIcons'
import { BrandLogos } from './collections/BrandLogos'
import { BrandTypefaces } from './collections/BrandTypefaces'
import { CheckScenarios } from './collections/CheckScenarios'
import { CheckSessions } from './collections/CheckSessions'
import { GuidelineDocuments } from './collections/GuidelineDocuments'
import { ImageProfiles } from './collections/ImageProfiles'
import { Plugins } from './collections/Plugins'
import { RuleCheckers } from './collections/RuleCheckers'
import { Rules } from './collections/Rules'
import { TemplateAssets } from './collections/TemplateAssets'
import { TemplateCategories } from './collections/TemplateCategories'
import { Templates } from './collections/Templates'
import { Users } from './collections/Users'
import { env } from './env'
import { listGuidelineSearchRules } from './features/guideline/repositories/guideline-search-rules.payload.repository'
import {
	findMcpChecks,
	findMcpGuideline,
	findMcpGuidelineDocuments,
} from './features/guideline/services/find-mcp-guideline.service'
import { buildGuidelineSearchText } from './features/guideline/utils/guideline-search-text'
import { AgentSettings } from './globals/AgentSettings'
import { Guideline } from './globals/Guideline'
import { adminOnly, authenticated, managerOrAdmin } from './lib/auth'
import type { GuidelineDocument } from './payload-types'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const shouldRunProdMigrations =
	env.PAYLOAD_RUN_MIGRATIONS_ON_STARTUP === 'true' &&
	env.NODE_ENV === 'production' &&
	env.NEXT_PHASE !== 'phase-production-build'
const isCreatingMigration = process.argv.includes('migrate:create')
const shouldLoadLegacyGuidelineCollections =
	!isCreatingMigration &&
	(shouldRunProdMigrations || process.argv.some((argument) => argument.startsWith('migrate')))
// 기존 Local API 기반 backfill을 재실행할 때만 schema를 로드한다. Admin/API에서는 항상 숨기고 쓰기를 막는다.
const legacyGuidelineCollections: CollectionConfig[] = shouldLoadLegacyGuidelineCollections
	? [LegacyGuidelineChapters, LegacyGuidelineSections, LegacyGuidelinePages].map(
			(collection) => ({
				...collection,
				access: {
					create: () => false,
					delete: () => false,
					read: () => false,
					update: () => false,
				},
				admin: { ...collection.admin, hidden: true },
			}),
		)
	: []
const mcpListParameters = {
	limit: z.number().int().min(1).max(100).optional(),
	locale: z.enum(['ko', 'en']).optional(),
	page: z.number().int().min(1).optional(),
}
const mcpLocale = (value: unknown) => (value === 'en' || value === 'ko' ? value : undefined)
const mcpNumber = (value: unknown) => (typeof value === 'number' ? value : undefined)
const mcpLevel = (value: unknown) => (value === 1 || value === 2 || value === 3 ? value : undefined)
type McpToolArgs = Record<string, unknown>
type GetDefaultMcpAccessSettings = (overrideApiKey?: null | string) => Promise<MCPAccessSettings>

const BetterEditorSettings: GlobalConfig = {
	...betterEditorSettingsGlobal,
	label: '편집기 설정',
	admin: {
		...betterEditorSettingsGlobal.admin,
		group: '시스템 관리',
	},
	access: { read: authenticated, update: managerOrAdmin },
}

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

// ponytail: custom MCP tools only wire validated input to a feature service here.
const customMcpTools: ReturnType<typeof mcpTextTool>[] = []

export default buildConfig({
	admin: {
		user: Users.slug,
		meta: {
			icons: { icon: '/favicons/favicon.png' },
			title: 'Living Brand System',
			titleSuffix: '- Living Brand System',
		},
		importMap: {
			baseDir: path.resolve(dirname),
		},
		components: {
			beforeDashboard: ['/components/admin/DashboardSummary'],
			graphics: {
				Icon: '/components/admin/AdminIcon',
				Logo: '/components/admin/AdminLogo',
			},
		},
	},
	collections: [
		...legacyGuidelineCollections,
		GuidelineDocuments,
		BrandLogos,
		BrandColors,
		BrandTypefaces,
		BrandIcons,
		ApplicationImages,
		ImageProfiles,
		Templates,
		TemplateCategories,
		TemplateAssets,
		Plugins,
		CheckScenarios,
		Rules,
		RuleCheckers,
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
		nestedDocsPlugin({
			collections: ['guideline-documents'],
			generateLabel: (_, doc) => String(doc.title),
			generateURL: (docs) => `/guideline/${docs.map((doc) => String(doc.slug)).join('/')}`,
		}),
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
				labels: { singular: 'MCP API 키', plural: 'MCP API 키' },
				admin: { ...collection.admin, group: '시스템 관리' },
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
						'findGuidelineDocuments',
						'Find published guideline documents with localized content, hierarchy, blocks, and applied rules.',
						{
							...mcpListParameters,
							level: z.number().int().min(1).max(3).optional(),
						},
						(args, req) =>
							findMcpGuidelineDocuments(req, {
								level: mcpLevel(args.level),
								limit: mcpNumber(args.limit),
								locale: mcpLocale(args.locale),
								page: mcpNumber(args.page),
							}),
					),
					mcpTextTool(
						'findChecks',
						'Find rules applied by published guideline documents and blocks.',
						mcpListParameters,
						(args, req) =>
							findMcpChecks(req, {
								limit: mcpNumber(args.limit),
								locale: mcpLocale(args.locale),
								page: mcpNumber(args.page),
							}),
					),
					mcpTextTool(
						'findGuideline',
						'Find live top-level guideline document metadata.',
						{ locale: z.enum(['ko', 'en']).optional() },
						(args, req) => findMcpGuideline(req, { locale: mcpLocale(args.locale) }),
					),
					...customMcpTools,
				],
			},
		} as never),
		searchPlugin({
			collections: ['guideline-documents'],
			beforeSync: async ({ originalDoc, payload, searchDoc }) => {
				const document = originalDoc as GuidelineDocument
				return {
					...searchDoc,
					searchText: buildGuidelineSearchText(
						document,
						await listGuidelineSearchRules(payload, document),
					),
				}
			},
			defaultPriorities: {
				'guideline-documents': 20,
			},
			searchOverrides: {
				admin: { hidden: true },
				access: {
					read: ({ req }) => Boolean(req.user),
				},
				fields: ({ defaultFields }) => [
					...defaultFields,
					{
						name: 'searchText',
						type: 'textarea',
						localized: true,
						admin: { hidden: true },
					},
				],
			},
		}),
		s3Storage({
			collections: {
				'brand-logos': true,
				'brand-typefaces': true,
				'brand-icons': true,
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
		// 기존 en revision은 보존하되 Admin 편집은 초기 릴리스 언어인 ko로 고정한다.
		filterAvailableLocales: ({ locales }) => locales.filter((locale) => locale.code === 'ko'),
	},
	globals: [Guideline, AgentSettings, BetterEditorSettings],
})
