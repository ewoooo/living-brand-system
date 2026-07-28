import type { Block } from 'payload'
import { baseBlockFields } from '../shared/fields'

// 컬러 페어링 추천 — Tone in Tone 큐레이션 40종을 "배경색 + 워드마크 색" 조합 타일 그리드로 전시한다.
// Light/Dark 두 버전은 essenherb 가이드 p27/p28을 옮긴 것. 색은 brand-colors에서 런타임 해석(recommendations.ts).
export const ColorPairingRecommendationBlock: Block = {
	slug: 'colorPairingRecommendation',
	interfaceName: 'ColorPairingRecommendationBlock',
	labels: { singular: '컬러 페어링 추천', plural: '컬러 페어링 추천' },
	fields: [
		{ name: 'title', type: 'text', localized: true },
		{
			name: 'variant',
			type: 'select',
			required: true,
			defaultValue: 'light',
			enumName: 'enum_color_pairing_recommendation_variant',
			options: [
				{ label: 'Light', value: 'light' },
				{ label: 'Dark', value: 'dark' },
			],
			admin: { description: '추천 그리드 버전입니다. Light=밝은 배경, Dark=어두운 배경.' },
		},
		...baseBlockFields(),
	],
}

export default ColorPairingRecommendationBlock
