import { describe, expect, it } from 'vitest'
import { buildGuidelineDocumentTree } from './guideline-document-tree'

describe('buildGuidelineDocumentTree', () => {
	it('groups documents by parent and sorts siblings by display order', () => {
		const tree = buildGuidelineDocumentTree([
			{ id: 4, title: '두 번째 페이지', parent: 2, displayOrder: 2, _status: 'draft' },
			{ id: 1, title: '장', parent: null, displayOrder: 0, _status: 'published' },
			{ id: 3, title: '첫 번째 페이지', parent: 2, displayOrder: 1, _status: 'published' },
			{ id: 2, title: '섹션', parent: 1, displayOrder: 0, _status: 'published' },
		])

		expect(tree.map(({ id }) => id)).toEqual([1])
		expect(tree[0]?.children.map(({ id }) => id)).toEqual([2])
		expect(tree[0]?.children[0]?.children.map(({ id }) => id)).toEqual([3, 4])
	})

	// 초안은 required 검증을 건너뛰어 title이 비어 있을 수 있다 — 정렬이 터지면 admin 리스트가 죽는다.
	it('sorts documents whose title is empty (draft saved without one)', () => {
		const tree = buildGuidelineDocumentTree([
			{ id: 2, title: null, parent: null, displayOrder: 0, _status: 'draft' },
			{ id: 1, title: '장', parent: null, displayOrder: 0, _status: 'published' },
		])

		expect(tree.map(({ id }) => id)).toEqual([2, 1])
	})
})
