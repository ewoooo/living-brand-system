import type { GlobalConfig } from 'payload'
import { managerOrAdmin } from '@/lib/auth'

// 아이콘 컬러웨이 — 아이콘 세트를 색칠하는 "공식 색 조합". 아이콘에 귀속되지 않는 별도 값이라 Global 1벌로 소유한다.
// 색은 raw hex가 아니라 brand-colors 참조라, 팔레트 색을 바꾸면 컬러웨이도 따라간다.
export const IconColorway: GlobalConfig = {
	slug: 'icon-colorway',
	label: '아이콘 컬러웨이',
	admin: {
		group: '브랜드 자원',
	},
	access: {
		// 가이드 화면(뷰어)이 SSR로 읽으므로 공개, 편집은 manager/admin만.
		read: () => true,
		update: managerOrAdmin,
	},
	fields: [
		{
			name: 'entries',
			type: 'array',
			admin: {
				description: '아이콘별 전경/배경 색 조합입니다. 색은 브랜드 팔레트를 참조합니다.',
			},
			fields: [
				{
					name: 'icon',
					type: 'relationship',
					relationTo: 'brand-icons',
					required: true,
				},
				{
					type: 'row',
					fields: [
						{
							name: 'fg',
							type: 'relationship',
							relationTo: 'brand-colors',
							required: true,
							admin: { width: '50%', description: '아이콘(실루엣) 색.' },
						},
						{
							name: 'bg',
							type: 'relationship',
							relationTo: 'brand-colors',
							required: true,
							admin: { width: '50%', description: '셀 배경 색.' },
						},
					],
				},
			],
		},
	],
}
