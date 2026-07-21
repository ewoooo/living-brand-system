import type { Block } from 'payload'
import { baseBlockFields } from '../shared/fields'

// 콜아웃. 지켜야 할 규칙 문장을 판정별(must/recommended/dont)로 강조한다.
export const CalloutBlock: Block = {
	slug: 'callout',
	interfaceName: 'CalloutBlock',
	labels: { singular: '콜아웃', plural: '콜아웃' },
	fields: [
		{
			name: 'kind',
			type: 'select',
			required: true,
			defaultValue: 'must',
			options: [
				{ label: '반드시 (Must)', value: 'must' },
				{ label: '권장 (Recommended)', value: 'recommended' },
				{ label: '금지 (Don’t)', value: 'dont' },
			],
		},
		{
			name: 'title',
			type: 'text',
			localized: true,
			admin: { description: '생략하면 판정 기본 라벨(반드시/권장/금지)이 제목이 됩니다.' },
		},
		{
			name: 'items',
			type: 'array',
			minRows: 1,
			labels: { singular: '규칙 문장', plural: '규칙 문장' },
			fields: [{ name: 'text', type: 'text', required: true, localized: true }],
		},
		...baseBlockFields(),
	],
}
