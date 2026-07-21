import type { Block } from 'payload'
import { baseBlockFields, typefaceField } from '../shared/fields'

// 글리프 인스펙터. 위젯형 블록 — 제목과 서체 선택만 저장한다.
export const GlyphGridBlock: Block = {
	slug: 'glyphGrid',
	interfaceName: 'GlyphGridBlock',
	labels: { singular: '글리프 그리드', plural: '글리프 그리드' },
	fields: [
		{ name: 'title', type: 'text', localized: true },
		typefaceField(),
		...baseBlockFields(),
	],
}

export default GlyphGridBlock
