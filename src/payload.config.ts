import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { en } from '@payloadcms/translations/languages/en'
import { ko } from '@payloadcms/translations/languages/ko'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { Assets } from './collections/Assets'
import { Users } from './collections/Users'

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
		Assets,
		{
			slug: 'cars',
			admin: { useAsTitle: 'title' },
			fields: [
				{ name: 'title', type: 'text' },
				{ name: 'featuredImage', type: 'upload', relationTo: 'assets' },
			],
		},
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
		s3Storage({
			collections: {
				assets: true,
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
})
