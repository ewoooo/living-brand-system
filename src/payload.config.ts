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
import {
	type Access,
	buildConfig,
	type CollectionConfig,
	type GlobalConfig,
	type PayloadRequest,
} from 'payload'
import { betterEditorSettingsGlobal } from 'payload-better-editor'
import sharp from 'sharp'
import { migrations } from '../migrations'
import { AgentChatSessions } from './collections/AgentChatSessions'
import { AgentSkills } from './collections/AgentSkills'
import { ApplicationImages } from './collections/ApplicationImages'
import { BrandColorGroups } from './collections/BrandColorGroups'
import { BrandColors } from './collections/BrandColors'
import { BrandIcons } from './collections/BrandIcons'
import { BrandLogos } from './collections/BrandLogos'
import { BrandTypefaces } from './collections/BrandTypefaces'
import { CheckScenarios } from './collections/CheckScenarios'
import { CheckSessions } from './collections/CheckSessions'
import { GeneratedImages } from './collections/GeneratedImages'
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
import { buildGuidelineSearchText } from './features/guideline/utils/guideline-search-text'
import { customMcpTools } from './features/mcp-access/mcp-tools'
import { AgentSettings } from './globals/AgentSettings'
import { Guideline } from './globals/Guideline'
import { adminOnly, authenticated, isAdmin, managerOrAdmin } from './lib/auth'
import type { GuidelineDocument } from './payload-types'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const shouldRunProdMigrations =
	env.PAYLOAD_RUN_MIGRATIONS_ON_STARTUP === 'true' &&
	env.NODE_ENV === 'production' &&
	env.NEXT_PHASE !== 'phase-production-build'
type GetDefaultMcpAccessSettings = (overrideApiKey?: null | string) => Promise<MCPAccessSettings>
const createOwnMcpApiKey: Access = ({ data, req }) =>
	isAdmin(req.user) ||
	Boolean(req.user?.id != null && data?.user != null && String(req.user.id) === String(data.user))

const BetterEditorSettings: GlobalConfig = {
	...betterEditorSettingsGlobal,
	label: '편집기 설정',
	admin: {
		...betterEditorSettingsGlobal.admin,
		group: '시스템 관리',
	},
	access: { read: authenticated, update: managerOrAdmin },
}

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
			providers: ['/components/admin/admin-dialkit-provider'],
		},
	},
	collections: [
		GuidelineDocuments,
		BrandLogos,
		BrandColors,
		BrandColorGroups,
		BrandTypefaces,
		BrandIcons,
		ApplicationImages,
		ImageProfiles,
		GeneratedImages,
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
			// max가 너무 작으면 트랜잭션 안에서 추가 커넥션을 얻지 못해 자기를 기다리는 데드락이 난다.
			// admin의 2초 autosave(guidelineDraftVersions)로 저장이 겹치면 max:2에선 풀이 즉시 고갈돼
			// 무한로딩 + 앱 전체 라우트 정지로 번졌다.
			max: 10,
			// 데드락 대신 빠르게 실패시켜 커넥션을 반납한다(무한 대기 방지).
			connectionTimeoutMillis: 10_000,
			idleTimeoutMillis: 30_000,
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
				fields: [
					...(collection.fields ?? []),
					{
						name: 'apiKey',
						type: 'text',
						access: { read: () => false },
					},
				],
				access: {
					create: createOwnMcpApiKey,
					delete: adminOnly,
					read: adminOnly,
					update: adminOnly,
				},
			}),
			mcp: {
				tools: customMcpTools,
			},
		} as never),
		searchPlugin({
			collections: ['guideline-documents'],
			// beforeSync는 문서 저장 트랜잭션 안에서 돈다 — req를 넘겨 같은 트랜잭션으로 조회해야 한다.
			// 넘기지 않으면 풀에서 커넥션을 하나 더 요구해 저장이 자기를 기다리는 교착이 생긴다.
			beforeSync: async ({ originalDoc, payload, req, searchDoc }) => {
				const document = originalDoc as GuidelineDocument
				return {
					...searchDoc,
					searchText: buildGuidelineSearchText(
						document,
						await listGuidelineSearchRules(payload, document, req),
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
				'generated-images': true,
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
