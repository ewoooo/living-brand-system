import type { Block } from 'payload'
import { baseBlockFields } from '../shared/fields'

// 컬러 페어링 — Tone in/on/Mono 3대 페어링 조합기. system으로 방식을 고르면 해당 규칙으로 동작한다.
// 색·매핑은 brand-colors + 페어링 규칙에서 조립(현재 rule-derived, 추후 Payload 컬렉션으로 이관).
export const ColorPairingBlock: Block = {
	slug: 'colorPairing',
	interfaceName: 'ColorPairingBlock',
	labels: { singular: '컬러 페어링', plural: '컬러 페어링' },
	fields: [
		{ name: 'title', type: 'text', localized: true },
		{
			name: 'system',
			type: 'select',
			required: true,
			defaultValue: 'tone-in-tone',
			enumName: 'enum_color_pairing_system',
			options: [
				{ label: 'Tone in Tone', value: 'tone-in-tone' },
				{ label: 'Tone on Tone', value: 'tone-on-tone' },
				{ label: 'Mono Tone', value: 'mono-tone' },
			],
			admin: { description: '페어링 방식입니다. 방식별 병용 규칙이 적용됩니다.' },
		},
		...baseBlockFields(),
	],
}

export default ColorPairingBlock
