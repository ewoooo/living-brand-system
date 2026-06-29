import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { searchPlugin } from '@payloadcms/plugin-search'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { ko } from '@payloadcms/translations/languages/ko'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { ApplicationImages } from './collections/ApplicationImages'
import { BrandColors } from './collections/BrandColors'
import { BrandLogos } from './collections/BrandLogos'
import { BrandTypefaces } from './collections/BrandTypefaces'
import { Compositions } from './collections/Compositions'
import { GuidelinePages } from './collections/GuidelinePages'
import { GuidelineSections } from './collections/GuidelineSections'
import { Plugins } from './collections/Plugins'
import { Templates } from './collections/Templates'
import { Users } from './collections/Users'
import { Guideline } from './globals/Guideline'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const databaseURL = process.env.DATABASE_URL

if (!databaseURL) {
	throw new Error(
		'DATABASE_URL is required. For local development, run Postgres and set DATABASE_URL=postgresql://payload:payload@127.0.0.1:5432/hd_cms_prototype',
	)
}

export default buildConfig({
	admin: {
		user: Users.slug,
		importMap: {
			baseDir: path.resolve(dirname),
		},
	},
	collections: [
		Users,
		BrandLogos,
		BrandColors,
		BrandTypefaces,
		ApplicationImages,
		Templates,
		Plugins,
		Compositions,
		GuidelineSections,
		GuidelinePages,
	],
	editor: lexicalEditor(),
	secret: process.env.PAYLOAD_SECRET || '',
	typescript: {
		outputFile: path.resolve(dirname, 'payload-types.ts'),
	},
	db: postgresAdapter({
		pool: {
			connectionString: databaseURL,
		},
	}),
	sharp,
	plugins: [
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
	globals: [Guideline],
})
