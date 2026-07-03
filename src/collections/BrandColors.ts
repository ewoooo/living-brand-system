import type { CollectionConfig } from 'payload'
import { managerManagedAccess } from '@/lib/auth'
import { draftVersions } from './shared'

export const BrandColors: CollectionConfig = {
	slug: 'brand-colors',
	access: managerManagedAccess,
	labels: {
		singular: 'Color',
		plural: 'Colors',
	},
	admin: {
		group: 'Brand Resources',
		useAsTitle: 'name',
		defaultColumns: ['name', 'hex', 'colorGroup', 'tone', 'updatedAt'],
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
			name: 'hex',
			type: 'text',
			required: true,
		},
		{
			name: 'pantone',
			type: 'text',
			admin: {
				description: 'PMS 표기입니다. 예: 705C, Warm Red C',
			},
		},
		{
			name: 'colorGroup',
			type: 'select',
			options: ['red', 'yellow', 'green', 'blue', 'purple', 'gray', 'neutral'],
			admin: {
				description: '팔레트 색상군입니다. White/Black은 neutral을 사용합니다.',
			},
		},
		{
			name: 'tone',
			type: 'number',
			min: 1,
			max: 5,
			admin: {
				description:
					'Light(1)~Dark(5) 명도 단계입니다. 톤 스펙트럼이 없는 컬러는 비워둡니다.',
			},
		},
		{
			name: 'isMain',
			type: 'checkbox',
			defaultValue: false,
			admin: {
				description: 'Main Color 팔레트에 포함되는 컬러인지 여부입니다.',
			},
		},
	],
}
