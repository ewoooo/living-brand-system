import type { CollectionConfig } from 'payload'
import { managerManagedAccess } from '@/lib/auth'
import { draftVersions } from './shared'

export const BrandTypefaces: CollectionConfig = {
	slug: 'brand-typefaces',
	access: managerManagedAccess,
	labels: {
		singular: '서체',
		plural: '서체',
	},
	admin: {
		group: '브랜드 자원',
		useAsTitle: 'name',
		defaultColumns: ['name', 'familyName', 'updatedAt'],
	},
	versions: draftVersions,
	fields: [
		{
			name: 'name',
			type: 'text',
			required: true,
			localized: true,
		},
		{
			name: 'familyName',
			type: 'text',
			required: true,
			admin: {
				description: 'CSS font-family로 쓰는 서체 가족 이름입니다. 예: Pretendard.',
			},
		},
		{
			name: 'weightRange',
			type: 'text',
			admin: {
				description:
					"@font-face font-weight 서술자입니다. 가변 폰트는 범위로 적습니다. 예: '400', '45 920'.",
			},
		},
	],
	// 서체는 실제 폰트 파일(woff2 등)을 소유한다. 블록 렌더러가 이 파일로 @font-face를 구성한다.
	upload: {
		mimeTypes: ['font/woff2', 'font/woff', 'font/otf', 'font/ttf', 'application/octet-stream'],
	},
}
