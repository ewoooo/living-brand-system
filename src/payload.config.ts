import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'

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
		Media,
		{ slug: 'cars', admin: { useAsTitle: 'title' }, fields: [{ name: 'title', type: "text" }, { name: 'featuredImage', type: 'upload', relationTo: 'media' }] }
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
	plugins: [],
})
