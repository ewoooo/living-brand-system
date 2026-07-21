import type { Block } from 'payload'
import { baseBlockFields } from '../shared/fields'

// 공식 시그니처·태그라인 전시. 문구 자체가 메시징 검수의 근거가 된다.
export const SignatureShowcaseBlock: Block = {
	slug: 'signatureShowcase',
	interfaceName: 'SignatureShowcaseBlock',
	labels: { singular: '시그니처 쇼케이스', plural: '시그니처 쇼케이스' },
	fields: [
		{
			name: 'signatures',
			type: 'array',
			minRows: 1,
			labels: { singular: '시그니처', plural: '시그니처' },
			fields: [
				{ name: 'label', type: 'text', localized: true },
				{ name: 'phrase', type: 'text', required: true },
				{ name: 'note', type: 'textarea', localized: true },
			],
		},
		...baseBlockFields(),
	],
}

export default SignatureShowcaseBlock
