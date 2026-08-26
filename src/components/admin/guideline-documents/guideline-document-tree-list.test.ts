import { describe, expect, it } from 'vitest'
import { groupGuidelineTopicsByChapter } from './guideline-document-tree'

const chapters = [
	{ id: 1, title: 'Brand Strategy' },
	{ id: 2, title: 'Brand Elements' },
]

describe('groupGuidelineTopicsByChapter', () => {
	it('groups topics by chapter and sorts them by display order', () => {
		const groups = groupGuidelineTopicsByChapter(
			[
				{ id: 12, title: 'Color', chapter: 2, displayOrder: 2, _status: 'draft' },
				{ id: 10, title: 'Purpose', chapter: 1, displayOrder: 0, _status: 'published' },
				{ id: 11, title: 'CI', chapter: { id: 2 }, displayOrder: 1, _status: 'published' },
			],
			chapters,
		)

		expect(groups.map(({ title }) => title)).toEqual(['Brand Strategy', 'Brand Elements'])
		expect(groups[0]?.topics.map(({ id }) => id)).toEqual([10])
		expect(groups[1]?.topics.map(({ id }) => id)).toEqual([11, 12])
	})

	// 초안은 required 검증을 건너뛰어 chapter·title이 비어 있을 수 있다 —
	// 목록에서 사라지면 고칠 방법이 없어진다.
	it('keeps topics whose chapter is missing in a trailing group', () => {
		const groups = groupGuidelineTopicsByChapter(
			[{ id: 20, title: null, chapter: null, displayOrder: 0, _status: 'draft' }],
			chapters,
		)

		expect(groups.at(-1)).toMatchObject({ id: null, title: '챕터 없음' })
		expect(groups.at(-1)?.topics.map(({ id }) => id)).toEqual([20])
	})
})
