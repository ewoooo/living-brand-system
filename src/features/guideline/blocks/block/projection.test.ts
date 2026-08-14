import { describe, expect, it } from 'vitest'
import { projectBlock } from './projection'

const lexical = (text: string) =>
	({ root: { children: [{ type: 'paragraph', children: [{ text }] }] } }) as never

// 사람이 admin에 쓴 title·description이 기계용 평문에 실제로 실리는지 지킨다.
// 이 단언이 없던 동안 투영기가 두 필드를 통째로 버려 AI 챗·검색이 근거 없이 돌았다.
describe('projectBlock', () => {
	it('title과 description을 평문에 담는다', () => {
		const text = projectBlock({
			blockType: 'block',
			title: '클리어스페이스',
			description: lexical('심볼 높이 H의 1/2을 최소 여백으로 둔다.'),
			children: [{ blockType: 'clearspaceViewer' }],
		} as never).text

		expect(text).toContain('클리어스페이스')
		expect(text).toContain('심볼 높이 H의 1/2을 최소 여백으로 둔다.')
	})

	it('둘 다 비면 leaf 수만 남는다', () => {
		expect(projectBlock({ blockType: 'block', children: [] } as never).text).toBe(
			'leaf 0개를 담은 블록',
		)
	})
})
