import type { CollectionConfig } from 'payload'
import { isManager, managerOrAdmin } from '@/lib/auth'
import { draftVersions } from './shared'

// 브랜드 아이콘(일러스트) 라이브러리. 아이콘 = svg 형태 + 이름 + 그룹(태그 필터용)이 한 단위다.
// 순번은 아이콘 고유 값이 아니라 등록 순서(createdAt)를 따르므로 order 필드를 두지 않는다.
// 색 조합도 아이콘에 귀속되지 않는 별도 개념이라 여기 두지 않는다(colorway가 따로 소유).
export const BrandIcons: CollectionConfig = {
	slug: 'brand-icons',
	labels: {
		singular: '아이콘',
		plural: '아이콘',
	},
	access: {
		// 공개 화면은 발행본만, manager/admin은 Admin에서 draft까지 관리한다.
		read: ({ req }) =>
			isManager(req.user) || {
				_status: { equals: 'published' },
			},
		create: managerOrAdmin,
		update: managerOrAdmin,
		delete: managerOrAdmin,
	},
	admin: {
		group: '브랜드 자원',
		useAsTitle: 'name',
		defaultColumns: ['filename', 'name', 'group', 'updatedAt'],
	},
	versions: draftVersions,
	fields: [
		{
			name: 'name',
			type: 'text',
			required: true,
			localized: true,
			admin: { description: '아이콘 이름입니다. 스크린리더 라벨로도 쓰입니다.' },
		},
		{
			name: 'group',
			type: 'text',
			admin: { description: '태그 필터에 쓰는 아이콘 그룹입니다(예: 자연 원료).' },
		},
	],
	upload: {
		// 벡터 아이콘이라 리사이즈 없이 원본 svg만 보관한다.
		mimeTypes: ['image/svg+xml'],
	},
}
