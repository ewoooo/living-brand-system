import { describe, expect, it } from 'vitest'
import { projectSection } from './projection'

const section = {
	blockType: 'section' as const,
	anchor: 'key-layout',
	title: 'Key Layout',
	blocks: [{ blockType: 'block' as const, id: 'b1', title: '판형', children: [{}, {}] }],
}

describe('projectSection', () => {
	// 🔴 섹션이 문서였을 때는 slug가 검색에 걸렸다. 블록이 된 뒤에도 앵커로 찾을 수 있어야 한다.
	it('제목·앵커·자식 블록 텍스트를 평문에 담는다', () => {
		const { text } = projectSection(section as never)

		expect(text).toContain('Key Layout')
		expect(text).toContain('key-layout')
		expect(text).toContain('판형')
	})

	it('evidence에 앵커를 남겨 근거가 섹션을 지목할 수 있게 한다', () => {
		expect(projectSection(section as never).evidence).toMatchObject({
			type: 'section',
			anchor: 'key-layout',
			title: 'Key Layout',
		})
	})
})
