import { describe, expect, it } from 'vitest'
import { projectSection } from './projection'

const lexical = (text: string) =>
	({ root: { children: [{ type: 'paragraph', children: [{ text }] }] } }) as never

const section = {
	blockType: 'section' as const,
	anchor: 'key-layout',
	title: 'Key Layout',
	description: lexical('판형 규정'),
	children: [{ blockType: 'layoutGridWidget' }, { blockType: 'layoutGridControlsWidget' }],
}

describe('projectSection', () => {
	// 🔴 섹션이 문서였을 때는 slug가 검색에 걸렸다. 블록이 된 뒤에도 앵커로 찾을 수 있어야 한다.
	it('제목·앵커·설명을 평문에 담고 leaf는 개수만 남긴다', () => {
		const { text } = projectSection(section as never)

		expect(text).toContain('Key Layout')
		expect(text).toContain('key-layout')
		expect(text).toContain('판형 규정')
		expect(text).toContain('leaf 2개')
	})

	it('evidence에 앵커를 남겨 근거가 섹션을 지목할 수 있게 한다', () => {
		expect(projectSection(section as never).evidence).toEqual({
			type: 'section',
			anchor: 'key-layout',
			title: 'Key Layout',
			description: '판형 규정',
		})
	})
})
